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

    google_id: str = ""
    embedding: list[float] = Field(default_factory=list)
    is_looking: bool = True

    class Config:
        populate_by_name = True


# ---------------------------------------------------------------------------
# Google Auth
# ---------------------------------------------------------------------------

class GoogleAuthRequest(BaseModel):
    """Body for POST /api/auth/google."""
    credential: str


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

# ---------------------------------------------------------------------------
# Project & Team Schemas
# ---------------------------------------------------------------------------

class RequiredRole(BaseModel):
    role: str
    count: int = 1

class ProjectMember(BaseModel):
    user_id: Optional[str] = None
    name: str
    role: str = ""

class ProjectCreate(BaseModel):
    """Body for POST /api/projects."""
    title: str = Field(min_length=1, max_length=200)
    hackathon_name: str = Field(default="")
    hackathon_category: str = Field(default="")
    problem_statement: str = Field(default="", max_length=1000)
    description: str = Field(default="", max_length=2000)
    members: list[ProjectMember] = Field(default_factory=list)
    required_roles: list[RequiredRole] = Field(default_factory=list)
    required_skills: list[str] = Field(default_factory=list)
    team_size: int = 4
    github_url: str = Field(default="")
    communication_link: str = Field(default="")


class ProjectUpdate(BaseModel):
    """Body for PUT /api/projects/:id."""
    title: Optional[str] = None
    hackathon_name: Optional[str] = None
    hackathon_category: Optional[str] = None
    problem_statement: Optional[str] = None
    description: Optional[str] = None
    members: Optional[list[ProjectMember]] = None
    required_roles: Optional[list[RequiredRole]] = None
    required_skills: Optional[list[str]] = None
    team_size: Optional[int] = None
    github_url: Optional[str] = None
    communication_link: Optional[str] = None


class ProjectResponse(BaseModel):
    """Response for project endpoints."""
    id: str
    owner_id: str
    title: str
    hackathon_name: str = ""
    hackathon_category: str = ""
    problem_statement: str = ""
    description: str = ""
    members: list[ProjectMember] = Field(default_factory=list)
    required_roles: list[RequiredRole] = Field(default_factory=list)
    required_skills: list[str] = Field(default_factory=list)
    team_size: int = 4
    github_url: str = ""
    communication_link: str = ""
    status: str = "looking_for_team"
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Chat & Messaging Schemas
# ---------------------------------------------------------------------------

class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)

class ChatMessageResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    content: str
    created_at: datetime

class ChatConversation(BaseModel):
    other_user_id: str
    other_user_name: str
    other_user_avatar: str
    last_message: str
    last_message_time: datetime


# ---------------------------------------------------------------------------
# Team Invitation Schemas
# ---------------------------------------------------------------------------

class TeamInvitationCreate(BaseModel):
    project_id: str
    invitation_message: str = Field(default="", max_length=1000)

class TeamInvitationResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    receiver_id: str
    project_id: str
    project_name: str
    project_description: str
    invitation_message: str
    status: str = "pending" # pending, accepted, declined
    created_at: datetime

class InviteRespondRequest(BaseModel):
    action: str # "accept" or "decline"


# ---------------------------------------------------------------------------
# Match Request Schemas
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


# ---------------------------------------------------------------------------
# OTP (Email Verification) Schemas
# ---------------------------------------------------------------------------

class OTPSendRequest(BaseModel):
    """Body for POST /api/auth/send-otp."""
    email: EmailStr
    name: str = Field(default="", min_length=0, max_length=100)
    password: str = Field(default="", min_length=0, max_length=128)
    purpose: str = Field(default="signup")  # "signup" or "login"

class OTPVerifyRequest(BaseModel):
    """Body for POST /api/auth/verify-otp."""
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)
    purpose: str = Field(default="signup")

class OTPResponse(BaseModel):
    """Response for OTP send."""
    message: str
    email: str
    expires_in_minutes: int = 5

