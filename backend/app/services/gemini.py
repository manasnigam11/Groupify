"""
Groupify — Gemini AI Service.

Handles two key Gemini interactions:
  1. Query Analysis: Parse natural language search into structured filters.
  2. Compatibility Scoring: Score candidates and generate explanations.
"""

import json
from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", ""))
_MODEL = "gemini-2.5-flash"


async def analyze_query(query: str, user_profile: dict) -> dict:
    """
    Touchpoint 2: Convert a natural language teammate search query
    into structured search parameters using Gemini.

    Returns:
        {
            "required_skills": ["React", "Figma"],
            "preferred_roles": ["Frontend Developer"],
            "search_query_text": "optimized text for embedding search",
            "team_gap_analysis": "what the user's team is missing"
        }
    """
    skills = user_profile.get("skills", {}).get("technical", [])
    prefs = user_profile.get("preferences", {})

    prompt = f"""You are a hackathon team formation agent.

Current user profile:
- Skills: {skills}
- Role: {prefs.get('role_preference', 'Not specified')}
- Interests: {prefs.get('hackathon_interests', [])}
- Project idea: {prefs.get('project_idea', 'Not specified')}

User's teammate search query: "{query}"

Analyze this query and return a JSON object with:
{{
  "required_skills": ["skill1", "skill2"],
  "preferred_roles": ["role1"],
  "search_query_text": "a short optimized text describing the ideal teammate for vector search",
  "team_gap_analysis": "brief description of what the user's team is missing"
}}

Return ONLY valid JSON, no markdown fences or explanations."""

    response = _client.models.generate_content(
        model=_MODEL,
        contents=prompt,
    )

    text = response.text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "required_skills": [],
            "preferred_roles": [],
            "search_query_text": query,
            "team_gap_analysis": "Unable to parse query analysis.",
        }


async def analyze_team_gaps(user_profile: dict) -> dict:
    """
    Complete My Team mode: Analyze user's profile and identify
    missing roles and skills needed for a complete hackathon team.

    Returns:
        {
            "missing_roles": ["Frontend Developer", "UI/UX Designer"],
            "missing_skills": ["React", "Figma"],
            "reasoning": "why these roles are needed"
        }
    """
    skills = user_profile.get("skills", {}).get("technical", [])
    prefs = user_profile.get("preferences", {})

    prompt = f"""You are a hackathon team formation agent.

Current user profile:
- Skills: {skills}
- Role: {prefs.get('role_preference', 'Not specified')}
- Interests: {prefs.get('hackathon_interests', [])}
- Project idea: {prefs.get('project_idea', 'Not specified')}

Analyze what roles and skills are MISSING to form a complete 3-4 person hackathon team.

Return a JSON object:
{{
  "missing_roles": ["role1", "role2"],
  "missing_skills": ["skill1", "skill2", "skill3"],
  "reasoning": "brief explanation of why these gaps exist"
}}

Return ONLY valid JSON, no markdown fences or explanations."""

    response = _client.models.generate_content(
        model=_MODEL,
        contents=prompt,
    )

    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "missing_roles": ["Frontend Developer", "UI/UX Designer"],
            "missing_skills": ["React", "Figma"],
            "reasoning": "Default analysis — could not parse Gemini response.",
        }


async def score_and_explain(requester: dict, candidates: list[dict]) -> list[dict]:
    """
    Touchpoint 3: Score each candidate for compatibility with the
    requester and generate human-readable explanations.

    Returns a list of scored candidates sorted by compatibility.
    """
    req_skills = requester.get("skills", {}).get("technical", [])
    req_prefs = requester.get("preferences", {})

    # Format candidate summaries
    candidate_summaries = []
    for i, c in enumerate(candidates):
        c_skills = c.get("skills", {}).get("technical", [])
        c_prefs = c.get("preferences", {})
        c_profile = c.get("profile", {})
        candidate_summaries.append(
            f"Candidate {i+1} (ID: {c.get('_id', 'unknown')}):\n"
            f"  Name: {c_profile.get('name', 'Unknown')}\n"
            f"  Role: {c_prefs.get('role_preference', 'Not specified')}\n"
            f"  Skills: {c_skills}\n"
            f"  Interests: {c_prefs.get('hackathon_interests', [])}\n"
            f"  Project Idea: {c_prefs.get('project_idea', 'Not specified')}"
        )

    candidates_text = "\n\n".join(candidate_summaries)

    prompt = f"""You are a hackathon team matching AI.

REQUESTER:
- Skills: {req_skills}
- Role: {req_prefs.get('role_preference', 'Not specified')}
- Interests: {req_prefs.get('hackathon_interests', [])}
- Project idea: {req_prefs.get('project_idea', 'Not specified')}

CANDIDATES:
{candidates_text}

For each candidate, provide a JSON array of objects with:
{{
  "user_id": "the candidate ID",
  "compatibility_score": 0-100,
  "reasoning": "2-3 sentence explanation of why they are a good or bad match",
  "skill_overlap": ["skills shared with requester"],
  "skill_complement": ["unique skills the candidate brings"]
}}

Scoring criteria:
- Skill complementarity (40%): Do they fill gaps the requester lacks?
- Role fit (25%): Do they match a needed team role?
- Interest alignment (20%): Shared hackathon interests?
- Practical factors (15%): Project idea compatibility

Sort by compatibility_score descending.
Return ONLY a valid JSON array, no markdown fences or explanations."""

    response = _client.models.generate_content(
        model=_MODEL,
        contents=prompt,
    )

    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    try:
        results = json.loads(text)
        # Ensure results are sorted by score
        results.sort(key=lambda x: x.get("compatibility_score", 0), reverse=True)
        return results
    except json.JSONDecodeError:
        # Return basic scores if Gemini response fails to parse
        return [
            {
                "user_id": str(c.get("_id", "")),
                "compatibility_score": 50,
                "reasoning": "Unable to generate AI explanation.",
                "skill_overlap": [],
                "skill_complement": c.get("skills", {}).get("technical", [])[:3],
            }
            for c in candidates
        ]
