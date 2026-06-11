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
from app.services.gemini import score_and_explain
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
# GET /api/profile/{user_id}
# ---------------------------------------------------------------------------

@router.get(
    "/{target_user_id}",
    response_model=UserResponse,
    summary="Get another user's public profile",
)
async def get_public_profile(target_user_id: str, user_id: str = Depends(get_current_user_id)):
    """Return another user's public profile."""
    db = get_database()
    
    try:
        tuid = ObjectId(target_user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = await db.users.find_one({"_id": tuid})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return UserResponse(
        id=str(user["_id"]),
        email=user["email"], # Maybe hide email in a real app, but ok for MVP
        profile=UserProfile(**user.get("profile", {})),
        skills=UserSkills(**user.get("skills", {})),
        preferences=UserPreferences(**user.get("preferences", {})),
        is_looking=user.get("is_looking", True),
        created_at=user.get("created_at", datetime.now(timezone.utc)),
        updated_at=user.get("updated_at", datetime.now(timezone.utc)),
    )


# ---------------------------------------------------------------------------
# GET /api/profile/{user_id}/compatibility
# ---------------------------------------------------------------------------

@router.get(
    "/{target_user_id}/compatibility",
    summary="Get dynamic compatibility explanation",
)
async def get_compatibility(target_user_id: str, user_id: str = Depends(get_current_user_id)):
    """Dynamically compute why we matched."""
    db = get_database()
    
    try:
        uid = ObjectId(user_id)
        tuid = ObjectId(target_user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")
        
    if uid == tuid:
        return {"compatibility_score": 100, "reasoning": "This is your own profile.", "skill_overlap": [], "skill_complement": []}
        
    me = await db.users.find_one({"_id": uid})
    target = await db.users.find_one({"_id": tuid})
    
    if not me or not target:
        raise HTTPException(status_code=404, detail="User not found")
        
    # We can use the existing Gemini score_and_explain function
    # It takes (user_doc, list_of_candidates)
    # We must pass target as a dictionary with _id as string
    target_copy = dict(target)
    target_copy["_id"] = str(target_copy["_id"])
    
    results = await score_and_explain(me, [target_copy])
    if results and len(results) > 0:
        return results[0]
        
    return {"compatibility_score": 50, "reasoning": "Unable to compute compatibility at this time.", "skill_overlap": [], "skill_complement": []}


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
            projects = await db.projects.find({"user_id": ObjectId(user_id)}).to_list(10)
            embedding = await generate_embedding(updated_doc, projects)
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

# ---------------------------------------------------------------------------
# DELETE /api/profile/delete-account
# ---------------------------------------------------------------------------

@router.delete(
    "/delete-account",
    summary="Permanently delete user account and clean up database documents",
)
async def delete_account(
    email_confirmation: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Permanently purges a user's account from the database if the provided 
    confirmation email matches their registration email. Cleans up project members.
    """
    db = get_database()
    
    # 1. Fetch user to verify email identity
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )
        
    if user["email"].lower() != email_confirmation.strip().lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email mismatch! Please enter your correct registered Gmail address.",
        )

    # 2. Project membership cleanups (Pull user out of all active teams)
    await db.projects.update_many(
        {"members.user_id": user_id},
        {"$pull": {"members": {"user_id": user_id}}}
    )
    
    # 3. Clean up invitations linked with this user
    await db.invites.delete_many(
        {"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]}
    )
    
    # 4. Final step: Purge the user from the collection
    await db.users.delete_one({"_id": ObjectId(user_id)})
    
    return {"message": "Account has been permanently deleted from Groupify."}