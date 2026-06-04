"""
Groupify — Authentication Routes.

POST /api/auth/signup   — Register a new user.
POST /api/auth/login    — Authenticate and return a JWT.
GET  /api/auth/me       — Return the current authenticated user's profile.
"""

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_database
from app.models import (
    LoginRequest,
    SignupRequest,
    TokenResponse,
    UserProfile,
    UserPreferences,
    UserResponse,
    UserSkills,
)
from app.utils import (
    create_access_token,
    get_current_user_id,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# POST /api/auth/signup
# ---------------------------------------------------------------------------

@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Groupify account",
)
async def signup(body: SignupRequest):
    """
    Register a new user with email, password, and name.
    Returns a signed JWT on success.
    """
    db = get_database()

    # Check for existing email
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    now = datetime.now(timezone.utc)

    # Build the full user document matching the MongoDB schema
    user_doc = {
        "email": body.email.lower(),
        "password_hash": hash_password(body.password),
        "created_at": now,
        "updated_at": now,
        "profile": {
            "name": body.name,
            "avatar_url": f"https://api.dicebear.com/7.x/bottts/svg?seed={body.name.replace(' ', '')}",
            "university": "",
            "year": "",
            "bio": "",
            "github_url": "",
            "linkedin_url": "",
        },
        "skills": {
            "technical": [],
            "proficiency": {},
        },
        "preferences": {
            "hackathon_interests": [],
            "project_idea": "",
            "role_preference": "",
            "looking_for_roles": [],
            "availability": "full-time",
            "timezone": "",
        },
        "embedding": [],
        "is_looking": True,
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    token = create_access_token(user_id=user_id, email=user_doc["email"])

    return TokenResponse(access_token=token)


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in with email and password",
)
async def login(body: LoginRequest):
    """
    Authenticate credentials and return a JWT.
    """
    db = get_database()

    user = await db.users.find_one({"email": body.email.lower()})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    user_id = str(user["_id"])
    token = create_access_token(user_id=user_id, email=user["email"])

    return TokenResponse(access_token=token)


# ---------------------------------------------------------------------------
# GET /api/auth/me
# ---------------------------------------------------------------------------

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the current authenticated user",
)
async def get_me(user_id: str = Depends(get_current_user_id)):
    """
    Validate the JWT and return the authenticated user's full profile.
    """
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
