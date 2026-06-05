"""
Groupify — Matching Routes.

POST /api/match/find     — Run the AI matching pipeline.
GET  /api/match/history  — Retrieve past match requests.
GET  /api/match/:id      — Retrieve a specific match result.
"""

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.database import get_database
from app.services.matching_engine import run_standard_match, run_complete_my_team, run_find_a_person
from app.utils import get_current_user_id

router = APIRouter(prefix="/api/match", tags=["matching"])


class FindRequest(BaseModel):
    query: str = ""
    mode: str = "standard"  # "standard", "complete_my_team", or "find_a_person"


# ---------------------------------------------------------------------------
# POST /api/match/find
# ---------------------------------------------------------------------------

@router.post(
    "/find",
    summary="Run AI-powered teammate matching",
)
async def find_teammates(
    body: FindRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Execute the full matching pipeline.

    Modes:
      - "standard": Provide a natural language query like
        "Find me a frontend developer who knows React and Figma"
      - "complete_my_team": AI analyzes your profile and finds
        teammates that fill the gaps in your team
      - "find_a_person": Look up a specific user directly by their email address
    """
    db = get_database()

    # Fetch full user document
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if user_doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # Check if profile is complete enough for matching
    skills = user_doc.get("skills", {}).get("technical", [])
    if not skills:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your profile before searching for teammates.",
        )

    if body.mode == "complete_my_team":
        result = await run_complete_my_team(user_id, user_doc)
    elif body.mode == "find_a_person":
        if not body.query.strip() or "@" not in body.query:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide a valid email address to search for a specific person.",
            )
        result = await run_find_a_person(body.query, user_id, user_doc)
    else:
        if not body.query.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide a search query.",
            )
        result = await run_standard_match(body.query, user_id, user_doc)

    return result


# ---------------------------------------------------------------------------
# GET /api/match/history
# ---------------------------------------------------------------------------

@router.get(
    "/history",
    summary="Get past match requests",
)
async def get_match_history(
    user_id: str = Depends(get_current_user_id),
):
    """Return the user's last 20 match requests, newest first."""
    db = get_database()

    cursor = db.match_requests.find(
        {"user_id": ObjectId(user_id)},
    ).sort("created_at", -1).limit(20)

    results = await cursor.to_list(20)

    return [
        {
            "match_id": str(r["_id"]),
            "query": r.get("query", ""),
            "mode": r.get("mode", "standard"),
            "result_count": len(r.get("results", [])),
            "fallback_triggered": r.get("fallback_triggered", False),
            "created_at": r.get("created_at"),
        }
        for r in results
    ]


# ---------------------------------------------------------------------------
# GET /api/match/:id
# ---------------------------------------------------------------------------

@router.get(
    "/{match_id}",
    summary="Get a specific match result",
)
async def get_match_result(
    match_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Return full details of a specific match request."""
    db = get_database()

    try:
        oid = ObjectId(match_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid match ID.",
        )

    result = await db.match_requests.find_one({
        "_id": oid,
        "user_id": ObjectId(user_id),
    })

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match result not found.",
        )

    return {
        "match_id": str(result["_id"]),
        "query": result.get("query", ""),
        "mode": result.get("mode", "standard"),
        "analysis": result.get("analysis", {}),
        "results": result.get("results", []),
        "fallback_triggered": result.get("fallback_triggered", False),
        "created_at": result.get("created_at"),
    }