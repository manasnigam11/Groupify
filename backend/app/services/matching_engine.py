"""
Groupify — Matching Engine.

Core teammate matching pipeline that combines:
  1. Gemini query analysis
  2. MongoDB Atlas Vector Search (primary)
  3. Standard MongoDB query matching (fallback)
  4. Gemini compatibility scoring & explanations

Supports two modes:
  - "standard": User provides a natural language query
  - "complete_my_team": AI analyzes gaps and searches for each missing role
"""

from datetime import datetime, timezone

from bson import ObjectId

from app.database import get_database
from app.services.embeddings import generate_query_embedding
from app.services.gemini import analyze_query, analyze_team_gaps, score_and_explain


# ---------------------------------------------------------------------------
# Vector Search (Primary)
# ---------------------------------------------------------------------------

async def _vector_search(
    query_embedding: list[float],
    exclude_user_id: str,
    limit: int = 15,
) -> list[dict]:
    """
    Run MongoDB Atlas Vector Search using $vectorSearch aggregation.
    Pre-filters to only include users who are actively looking.
    """
    db = get_database()

    pipeline = [
        {
            "$vectorSearch": {
                "index": "user_embedding_index",
                "path": "embedding",
                "queryVector": query_embedding,
                "numCandidates": 100,
                "limit": limit,
                "filter": {
                    "is_looking": True,
                },
            }
        },
        {
            "$match": {
                "_id": {"$ne": ObjectId(exclude_user_id)},
            }
        },
        {
            "$project": {
                "password_hash": 0,
            }
        },
        {
            "$addFields": {
                "vector_score": {"$meta": "vectorSearchScore"},
            }
        },
    ]

    try:
        results = await db.users.aggregate(pipeline).to_list(limit)
        print(f"[VECTOR SEARCH] ✅ Atlas Vector Search returned {len(results)} candidates using index 'user_embedding_index'")
        for r in results:
            vs = r.get('vector_score', 'N/A')
            name = r.get('profile', {}).get('name', 'Unknown')
            print(f"  → {name} (vector_score={vs})")
        return results
    except Exception as e:
        print(f"[VECTOR SEARCH] ❌ Atlas Vector Search FAILED: {e}")
        return []


# ---------------------------------------------------------------------------
# Fallback: Standard MongoDB Query
# ---------------------------------------------------------------------------

async def _fallback_search(
    required_skills: list[str],
    preferred_roles: list[str],
    interests: list[str],
    exclude_user_id: str,
    limit: int = 15,
) -> list[dict]:
    """
    Fallback when Vector Search is unavailable or returns too few results.
    Uses standard MongoDB queries on skills, roles, and interests.
    """
    db = get_database()

    # Build an $or query across multiple fields
    or_conditions = []

    if required_skills:
        or_conditions.append(
            {"skills.technical": {"$in": required_skills}}
        )

    if preferred_roles:
        or_conditions.append(
            {"preferences.role_preference": {"$in": preferred_roles}}
        )

    if interests:
        or_conditions.append(
            {"preferences.hackathon_interests": {"$in": interests}}
        )

    if not or_conditions:
        # If no filters at all, just get active users
        or_conditions.append({"is_looking": True})

    query = {
        "$and": [
            {"_id": {"$ne": ObjectId(exclude_user_id)}},
            {"is_looking": True},
            {"$or": or_conditions},
        ]
    }

    cursor = db.users.find(
        query,
        {"password_hash": 0},
    ).limit(limit)

    return await cursor.to_list(limit)


# ---------------------------------------------------------------------------
# Core Matching Pipeline — Standard Mode
# ---------------------------------------------------------------------------

async def run_standard_match(
    query: str,
    user_id: str,
    user_doc: dict,
) -> dict:
    """
    Full matching pipeline for a natural language teammate search.

    Steps:
      1. Gemini analyzes the query → structured filters
      2. Generate embedding from the optimized search text
      3. Try Atlas Vector Search (primary)
      4. Fall back to standard MongoDB query if needed
      5. Gemini scores and explains top candidates
      6. Save match request to history
    """
    db = get_database()
    fallback_triggered = False

    # Step 1: Analyze query with Gemini
    try:
        analysis = await analyze_query(query, user_doc)
    except Exception as e:
        print(f"[WARN] Gemini query analysis failed: {e}")
        analysis = {
            "required_skills": [],
            "preferred_roles": [],
            "search_query_text": query,
            "team_gap_analysis": "",
        }

    # Step 2: Generate query embedding
    search_text = analysis.get("search_query_text", query)
    try:
        query_embedding = await generate_query_embedding(search_text)
    except Exception as e:
        print(f"[WARN] Query embedding failed: {e}")
        query_embedding = None

    # Step 3: Try Vector Search
    candidates = []
    if query_embedding:
        print(f"[PIPELINE] Step 3: Running Atlas Vector Search with {len(query_embedding)}-dim embedding...")
        candidates = await _vector_search(query_embedding, user_id)
    else:
        print(f"[PIPELINE] Step 3: SKIPPED — No query embedding available")

    # Step 4: Fallback if Vector Search returns < 3 results
    if len(candidates) < 3:
        fallback_triggered = True
        print(f"[PIPELINE] Step 4: FALLBACK TRIGGERED — Vector Search returned {len(candidates)} (< 3 threshold)")
        fallback_results = await _fallback_search(
            required_skills=analysis.get("required_skills", []),
            preferred_roles=analysis.get("preferred_roles", []),
            interests=user_doc.get("preferences", {}).get("hackathon_interests", []),
            exclude_user_id=user_id,
        )
        print(f"[FALLBACK] Returned {len(fallback_results)} results")
        # Merge without duplicates
        existing_ids = {str(c["_id"]) for c in candidates}
        for r in fallback_results:
            if str(r["_id"]) not in existing_ids:
                candidates.append(r)
                existing_ids.add(str(r["_id"]))
    else:
        print(f"[PIPELINE] Step 4: Fallback NOT triggered — Vector Search returned {len(candidates)} candidates (≥ 3)")

    # Limit to top 8 for Gemini scoring
    candidates = candidates[:8]

    # Step 5: Gemini scores and explains
    scored_results = []
    if candidates:
        try:
            # Convert ObjectId to string for Gemini
            for c in candidates:
                c["_id"] = str(c["_id"])
            scored_results = await score_and_explain(user_doc, candidates)
        except Exception as e:
            print(f"[WARN] Gemini scoring failed: {e}")
            scored_results = [
                {
                    "user_id": str(c["_id"]),
                    "compatibility_score": 50,
                    "reasoning": "AI scoring unavailable.",
                    "skill_overlap": [],
                    "skill_complement": c.get("skills", {}).get("technical", [])[:3],
                }
                for c in candidates
            ]

    # Take top 5
    scored_results = scored_results[:5]

    # Step 6: Save to match_requests
    match_doc = {
        "user_id": ObjectId(user_id),
        "created_at": datetime.now(timezone.utc),
        "query": query,
        "mode": "standard",
        "analysis": analysis,
        "results": scored_results,
        "fallback_triggered": fallback_triggered,
    }
    result = await db.match_requests.insert_one(match_doc)

    return {
        "match_id": str(result.inserted_id),
        "query": query,
        "mode": "standard",
        "results": scored_results,
        "fallback_triggered": fallback_triggered,
        "created_at": match_doc["created_at"],
    }


# ---------------------------------------------------------------------------
# Core Matching Pipeline — Complete My Team Mode
# ---------------------------------------------------------------------------

async def run_complete_my_team(
    user_id: str,
    user_doc: dict,
) -> dict:
    """
    AI-driven team completion pipeline.

    Steps:
      1. Gemini analyzes the user's profile to identify missing roles/skills
      2. For each missing role, search for matching candidates
      3. Score and explain each candidate
      4. Group results by the role they fill
    """
    db = get_database()
    fallback_triggered = False

    # Step 1: Analyze team gaps
    try:
        gaps = await analyze_team_gaps(user_doc)
    except Exception as e:
        print(f"[WARN] Team gap analysis failed: {e}")
        gaps = {
            "missing_roles": ["Frontend Developer", "UI/UX Designer"],
            "missing_skills": ["React", "Figma"],
            "reasoning": "Default gap analysis.",
        }

    missing_roles = gaps.get("missing_roles", [])
    missing_skills = gaps.get("missing_skills", [])
    all_results = []

    # Step 2: Search for each missing role
    for role in missing_roles:
        search_text = f"{role} with skills in {', '.join(missing_skills)}"

        # Try vector search first
        candidates = []
        try:
            embedding = await generate_query_embedding(search_text)
            candidates = await _vector_search(embedding, user_id, limit=5)
        except Exception:
            pass

        # Fallback
        if len(candidates) < 2:
            fallback_triggered = True
            fb = await _fallback_search(
                required_skills=missing_skills,
                preferred_roles=[role],
                interests=user_doc.get("preferences", {}).get("hackathon_interests", []),
                exclude_user_id=user_id,
                limit=5,
            )
            existing_ids = {str(c["_id"]) for c in candidates}
            for r in fb:
                if str(r["_id"]) not in existing_ids:
                    candidates.append(r)

        candidates = candidates[:4]

        # Score candidates
        if candidates:
            try:
                for c in candidates:
                    c["_id"] = str(c["_id"])
                scored = await score_and_explain(user_doc, candidates)
                # Tag each result with the role it fills
                for s in scored:
                    s["matched_for_role"] = role
                all_results.extend(scored[:2])  # Top 2 per role
            except Exception:
                pass

    # Sort all results by score
    all_results.sort(key=lambda x: x.get("compatibility_score", 0), reverse=True)

    # Save to match_requests
    match_doc = {
        "user_id": ObjectId(user_id),
        "created_at": datetime.now(timezone.utc),
        "query": "Complete My Team",
        "mode": "complete_my_team",
        "analysis": {
            "missing_roles": missing_roles,
            "missing_skills": missing_skills,
            "reasoning": gaps.get("reasoning", ""),
        },
        "results": all_results,
        "fallback_triggered": fallback_triggered,
    }
    result = await db.match_requests.insert_one(match_doc)

    return {
        "match_id": str(result.inserted_id),
        "query": "Complete My Team",
        "mode": "complete_my_team",
        "results": all_results,
        "fallback_triggered": fallback_triggered,
        "created_at": match_doc["created_at"],
    }
