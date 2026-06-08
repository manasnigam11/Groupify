"""
Groupify — Pydantic Models & Schemas.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# --- NEW AI HEALTH SCHEMA ---
class TeamHealthAnalysis(BaseModel):
    score: int = 0
    probability: int = 0
    missing_roles: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    last_updated: datetime = Field(default_factory=datetime.utcnow)

# ---------------------------------------------------------------------------
# Sub-document Schemas
# ---------------------------------------------------------------------------
class UserProfile(BaseModel):
    name: str = ""
    avatar_url: str = ""
    university: str = ""
    year: str = ""
    bio: str = ""
    github_url: str = ""
    linkedin_url: str = ""

class UserSkills(BaseModel):
    technical: list[str] = Field(default_factory=list)
    proficiency: dict[str, str] = Field(default_factory=dict)

class UserPreferences(BaseModel):
    hackathon_interests: list[str] = Field(default_factory=list)
    project_idea: str = ""
    role_preference: str = ""
    looking_for_roles: list[str] = Field(default_factory=list)
    availability: str = "full-time"
    timezone: str = ""

class UserInDB(BaseModel):
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

class GoogleAuthRequest(BaseModel):
    credential: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=100)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: str
    email: str
    profile: UserProfile
    skills: UserSkills
    preferences: UserPreferences
    is_looking: bool
    created_at: datetime
    updated_at: datetime

class ProfileUpdateRequest(BaseModel):
    profile: Optional[UserProfile] = None
    skills: Optional[UserSkills] = None
    preferences: Optional[UserPreferences] = None
    is_looking: Optional[bool] = None

class RequiredRole(BaseModel):
    role: str
    count: int = 1

class ProjectMember(BaseModel):
    user_id: Optional[str] = None
    name: str
    role: str = ""

class ProjectCreate(BaseModel):
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
    team_health: Optional[TeamHealthAnalysis] = None # <-- NAYA FIELD ADDED

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
    status: str = "pending"
    created_at: datetime

class InviteRespondRequest(BaseModel):
    action: str 

class MatchFindRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    mode: str = Field(default="standard") 

class MatchResultItem(BaseModel):
    user_id: str
    compatibility_score: int = Field(ge=0, le=100)
    reasoning: str = ""
    skill_overlap: list[str] = Field(default_factory=list)
    skill_complement: list[str] = Field(default_factory=list)
    matched_for_role: str = ""

class MatchResponse(BaseModel):
    match_id: str
    query: str
    mode: str
    results: list[MatchResultItem] = Field(default_factory=list)
    fallback_triggered: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class OTPSendRequest(BaseModel):
    email: EmailStr
    name: str = Field(default="", min_length=0, max_length=100)
    password: str = Field(default="", min_length=0, max_length=128)
    purpose: str = Field(default="signup")

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)
    purpose: str = Field(default="signup")

class OTPResponse(BaseModel):
    message: str
    email: str
    expires_in_minutes: int = 5