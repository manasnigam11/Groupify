"""
Groupify — Authentication Routes.

POST /api/auth/signup      — Register a new user and send OTP.
POST /api/auth/verify-otp  — Verify OTP and return a JWT.
POST /api/auth/login       — Authenticate and return a JWT (only if verified).
GET  /api/auth/me          — Return the current authenticated user's profile.
POST /api/auth/google      — Authenticate with Google Sign-In (auto-verified).
"""

from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
import os

from app.database import get_database
from app.models import (
    GoogleAuthRequest,
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

# OTP Service Imports
from app.services.otp import generate_otp, send_otp_email, get_otp_expiry

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Local Model for OTP Verification (Isko chaho toh models.py me move kar lena)
class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

# ---------------------------------------------------------------------------
# POST /api/auth/signup
# ---------------------------------------------------------------------------

@router.post(
    "/signup",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Groupify account and send OTP",
)
async def signup(body: SignupRequest):
    """
    Register a new user with email, password, and name.
    Sends an OTP to the user's email. Does NOT return a JWT yet.
    """
    db = get_database()
    email_lower = body.email.lower()

    # Check for existing email
    existing = await db.users.find_one({"email": email_lower})
    if existing:
        if existing.get("is_verified"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
        else:
            # Agar unverified account already hai, toh we can just resend OTP and update DB
            await db.users.delete_one({"_id": existing["_id"]}) # Purana kachra delete krdo

    now = datetime.now(timezone.utc)
    otp_code = generate_otp()
    otp_expiry = get_otp_expiry()

    # Build the full user document
    user_doc = {
        "email": email_lower,
        "password_hash": hash_password(body.password),
        "created_at": now,
        "updated_at": now,
        # Naye OTP fields
        "is_verified": False,
        "otp_code": otp_code,
        "otp_expiry": otp_expiry,
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

    await db.users.insert_one(user_doc)

    # Send the OTP Email
    send_otp_email(to_email=email_lower, otp_code=otp_code, purpose="verify your email")

    return {
        "message": "User created successfully. Please check your email for the OTP.",
        "email": email_lower
    }


# ---------------------------------------------------------------------------
# POST /api/auth/verify-otp
# ---------------------------------------------------------------------------

@router.post(
    "/verify-otp",
    response_model=TokenResponse,
    summary="Verify Email OTP and Login",
)
async def verify_otp(body: VerifyOTPRequest):
    """
    Verify the OTP sent to the user's email.
    On success, marks user as verified and returns a JWT.
    """
    db = get_database()
    email_lower = body.email.lower()

    user = await db.users.find_one({"email": email_lower})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if user.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified. Please login.",
        )

    # Check if OTP matches
    if user.get("otp_code") != body.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP.",
        )

    # Check if OTP is expired (ensure timezone-aware comparison)
    now = datetime.now(timezone.utc)
    otp_expiry = user.get("otp_expiry")
    if not otp_expiry or otp_expiry.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one.",
        )

    # Update user as verified and clear OTP fields
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"is_verified": True},
            "$unset": {"otp_code": "", "otp_expiry": ""}
        }
    )

    # Generate JWT Token
    user_id = str(user["_id"])
    token = create_access_token(user_id=user_id, email=user["email"])

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
        
    # Check Verification Status
    if not user.get("is_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in.",
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


# ---------------------------------------------------------------------------
# POST /api/auth/google
# ---------------------------------------------------------------------------

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

@router.post(
    "/google",
    response_model=TokenResponse,
    summary="Authenticate with Google Sign-In",
)
async def google_auth(body: GoogleAuthRequest):
    """
    Verify a Google ID token and return a JWT.
    If the email already exists, link the account.
    If not, create a new user.
    """
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests

        idinfo = google_id_token.verify_oauth2_token(
            body.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError as e: # Catch ValueError specifically for token validation issues
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token. Check if GOOGLE_CLIENT_ID matches frontend: {e}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {e}",
        )

    email = idinfo.get("email", "").lower()
    name = idinfo.get("name", "Google User")
    picture = idinfo.get("picture", "")
    google_id = idinfo.get("sub", "")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token missing email.",
        )

    db = get_database()

    # Check if user already exists
    existing = await db.users.find_one({"email": email})

    if existing:
        # Account linking — update google_id if not set
        update_fields = {}
        if not existing.get("google_id"):
            update_fields["google_id"] = google_id
        # Google se login karne par automatic verify ho jayega
        if not existing.get("is_verified"):
            update_fields["is_verified"] = True
            
        if update_fields:
            await db.users.update_one(
                {"_id": existing["_id"]},
                {"$set": update_fields}
            )
            
        user_id = str(existing["_id"])
        token = create_access_token(user_id=user_id, email=email)
        return TokenResponse(access_token=token)

    # New user (Auto-verified because email is confirmed by Google)
    now = datetime.now(timezone.utc)
    user_doc = {
        "email": email,
        "password_hash": "GOOGLE_AUTH",
        "google_id": google_id,
        "created_at": now,
        "updated_at": now,
        "is_verified": True,  # Google sign-ins are pre-verified
        "profile": {
            "name": name,
            "avatar_url": picture or f"https://api.dicebear.com/7.x/bottts/svg?seed={name.replace(' ', '')}",
            "university": "",
            "year": "",
            "bio": "",
            "github_url": "",
            "linkedin_url": "",
        },
        "skills": {"technical": [], "proficiency": {}},
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
    token = create_access_token(user_id=user_id, email=email)

    return TokenResponse(access_token=token)