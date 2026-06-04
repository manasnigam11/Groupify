"""
Groupify — Profile Routes.

GET  /api/profile       — Get the current user's profile.
PUT  /api/profile       — Update profile, skills, preferences + regenerate embedding.
"""

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_database
from app.models import (
    ProfileUpdateRequest,
    UserPreferences,
    UserProfile,
    UserResponse,
    UserSkills,
)
from app.services.embeddings import generate_embedding
from app.utils import get_current_user_id

router = APIRouter(prefix="/api/profile", tags=["profile"])


# ---------------------------------------------------------------------------
# GET /api/profile
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=UserResponse,
    summary="Get the current user's profile",
)
async def get_profile(user_id: str = Depends(get_current_user_id)):
    """Return the authenticated user's full profile."""
    db = get_database()

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        profile=UserProfile(**user.get("profile", {})),
        skills=UserSkills(**user.get("skills", {})),
        preferences=UserPreferences(**user.get("preferences", {})),
        is_looking=user.get("is_looking", True),
        created_at=user.get("created_at", datetime.now(timezone.utc)),
        updated_at=user.get("updated_at", datetime.now(timezone.utc)),
    )


# ---------------------------------------------------------------------------
# PUT /api/profile
# ---------------------------------------------------------------------------

@router.put(
    "",
    response_model=UserResponse,
    summary="Update profile, skills, and preferences",
)
async def update_profile(
    body: ProfileUpdateRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Partially update the user's profile, skills, and/or preferences.
    Only fields provided in the body will be overwritten.
    Triggers embedding regeneration when skills/preferences change
    (embedding service will be wired in Priority 3).
    """
    db = get_database()

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    update_fields = {"updated_at": datetime.now(timezone.utc)}

    if body.profile is not None:
        update_fields["profile"] = body.profile.model_dump()

    if body.skills is not None:
        update_fields["skills"] = body.skills.model_dump()

    if body.preferences is not None:
        update_fields["preferences"] = body.preferences.model_dump()

    if body.is_looking is not None:
        update_fields["is_looking"] = body.is_looking

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_fields},
    )

    # Regenerate embedding when skills or preferences change
    if body.skills is not None or body.preferences is not None:
        try:
            updated_doc = await db.users.find_one({"_id": ObjectId(user_id)})
            embedding = await generate_embedding(updated_doc)
            await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"embedding": embedding}},
            )
            print(f"[OK] Embedding generated for user {user_id} ({len(embedding)} dims)")
        except Exception as e:
            print(f"[WARN] Embedding generation failed for user {user_id}: {e}")

    # Fetch updated document
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})

    return UserResponse(
        id=str(updated_user["_id"]),
        email=updated_user["email"],
        profile=UserProfile(**updated_user.get("profile", {})),
        skills=UserSkills(**updated_user.get("skills", {})),
        preferences=UserPreferences(**updated_user.get("preferences", {})),
        is_looking=updated_user.get("is_looking", True),
        created_at=updated_user.get("created_at", datetime.now(timezone.utc)),
        updated_at=updated_user.get("updated_at", datetime.now(timezone.utc)),
    )
