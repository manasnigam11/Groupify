"""
Groupify — Pydantic Models & Schemas.

Defines all request/response models for the API.
Schema mirrors the MongoDB document structure defined in the implementation plan.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# Sub-document Schemas
# ---------------------------------------------------------------------------

class UserProfile(BaseModel):
    """Nested profile information stored inside the user document."""
    name: str = ""
    avatar_url: str = ""
    university: str = ""       # Optional during onboarding
    year: str = ""             # Optional during onboarding
    bio: str = ""              # Optional during onboarding
    github_url: str = ""       # Optional during onboarding
    linkedin_url: str = ""     # Optional during onboarding


class UserSkills(BaseModel):
    """Technical skills and proficiency levels."""
    technical: list[str] = Field(default_factory=list)
    proficiency: dict[str, str] = Field(default_factory=dict)


class UserPreferences(BaseModel):
    """Hackathon goals and teammate search preferences."""
    hackathon_interests: list[str] = Field(default_factory=list)
    project_idea: str = ""
    role_preference: str = ""
    looking_for_roles: list[str] = Field(default_factory=list)
    availability: str = "full-time"
    timezone: str = ""


# ---------------------------------------------------------------------------
# Full User Document (what is stored in MongoDB)
# ---------------------------------------------------------------------------

class UserInDB(BaseModel):
    """Complete user document shape matching the MongoDB `users` collection."""
    id: str = Field(default="", alias="_id")
    email: str = ""
    password_hash: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    profile: UserProfile = Field(default_factory=UserProfile)
    skills: UserSkills = Field(default_factory=UserSkills)
    preferences: UserPreferences = Field(default_factory=UserPreferences)

    embedding: list[float] = Field(default_factory=list)
    is_looking: bool = True

    class Config:
        populate_by_name = True


# ---------------------------------------------------------------------------
# Auth Request Schemas
# ---------------------------------------------------------------------------

class SignupRequest(BaseModel):
    """Body for POST /api/auth/signup."""
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=100)


class LoginRequest(BaseModel):
    """Body for POST /api/auth/login."""
    email: EmailStr
    password: str


# ---------------------------------------------------------------------------
# Auth Response Schemas
# ---------------------------------------------------------------------------

class TokenResponse(BaseModel):
    """Returned after successful login or signup."""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Public-safe user data returned by GET /me and other profile endpoints."""
    id: str
    email: str
    profile: UserProfile
    skills: UserSkills
    preferences: UserPreferences
    is_looking: bool
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Profile Update Schemas
# ---------------------------------------------------------------------------

class ProfileUpdateRequest(BaseModel):
    """Body for PUT /api/profile — partial updates allowed."""
    profile: Optional[UserProfile] = None
    skills: Optional[UserSkills] = None
    preferences: Optional[UserPreferences] = None
    is_looking: Optional[bool] = None


# ---------------------------------------------------------------------------
# Match Request Schemas (stubs — fully built in Priority 5)
# ---------------------------------------------------------------------------

class MatchFindRequest(BaseModel):
    """Body for POST /api/match/find."""
    query: str = Field(min_length=1, max_length=1000)
    mode: str = Field(default="standard")  # "standard" or "complete_my_team"


class MatchResultItem(BaseModel):
    """A single match candidate in the results array."""
    user_id: str
    compatibility_score: int = Field(ge=0, le=100)
    reasoning: str = ""
    skill_overlap: list[str] = Field(default_factory=list)
    skill_complement: list[str] = Field(default_factory=list)
    matched_for_role: str = ""  # Used in complete_my_team mode


class MatchResponse(BaseModel):
    """Response from POST /api/match/find."""
    match_id: str
    query: str
    mode: str
    results: list[MatchResultItem] = Field(default_factory=list)
    fallback_triggered: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
