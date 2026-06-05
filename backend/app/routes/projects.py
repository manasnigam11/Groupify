"""
Groupify — Project/Team Routes.

GET  /api/projects/my       — Get the current user's project (Team).
POST /api/projects          — Create a project.
PUT  /api/projects/{id}     — Update a project.
POST /api/projects/{id}/remove-member — Remove a member from the team.
POST /api/projects/{id}/leave         — Leave the team.
"""

from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_database
from app.models import ProjectCreate, ProjectUpdate, ProjectResponse
from app.utils import get_current_user_id

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("/my", response_model=ProjectResponse | None)
async def get_my_project(user_id: str = Depends(get_current_user_id)):
    """
    Get the project the current user owns or is a member of.
    """
    db = get_database()
    uid = ObjectId(user_id)
    
    # Check if user is owner or member
    project = await db.projects.find_one({
        "$or": [
            {"owner_id": uid},
            {"members.user_id": str(uid)}
        ]
    })
    
    if not project:
        return None
        
    return ProjectResponse(
        id=str(project["_id"]),
        owner_id=str(project["owner_id"]),
        title=project["title"],
        description=project.get("description", ""),
        problem_statement=project.get("problem_statement", ""),
        required_skills=project.get("required_skills", []),
        required_roles=project.get("required_roles", []),
        team_size=project.get("team_size", 4),
        github_url=project.get("github_url", ""),
        communication_link=project.get("communication_link", ""),
        hackathon_name=project.get("hackathon_name", ""),
        hackathon_category=project.get("hackathon_category", ""),
        status=project.get("status", "looking_for_team"),
        created_at=project["created_at"],
        updated_at=project["updated_at"],
        members=project.get("members", [])
    )


@router.post("", response_model=ProjectResponse)
async def create_project(body: ProjectCreate, user_id: str = Depends(get_current_user_id)):
    """Create a new project."""
    db = get_database()
    uid = ObjectId(user_id)
    
    # Check if already in a project
    existing = await db.projects.find_one({
        "$or": [{"owner_id": uid}, {"members.user_id": str(uid)}]
    })
    if existing:
        raise HTTPException(status_code=400, detail="You are already in a project team.")
        
    # Get user profile to add as first member
    user = await db.users.find_one({"_id": uid})
    name = user.get("profile", {}).get("name", "Unknown")
    role = user.get("preferences", {}).get("role_preference", "Member")
    
    now = datetime.now(timezone.utc)
    
    project_doc = body.model_dump()
    project_doc["owner_id"] = uid
    project_doc["status"] = "looking_for_team"
    project_doc["created_at"] = now
    project_doc["updated_at"] = now
    
    # Ensure creator is the first member if no members provided, or inject the creator
    if not project_doc.get("members"):
        project_doc["members"] = [
            {
                "user_id": str(uid),
                "name": name,
                "role": role
            }
        ]
    else:
        # Check if owner is already in the list
        if not any(m.get("user_id") == str(uid) for m in project_doc["members"]):
            project_doc["members"].insert(0, {
                "user_id": str(uid),
                "name": name,
                "role": role
            })
    
    res = await db.projects.insert_one(project_doc)
    
    return ProjectResponse(
        id=str(res.inserted_id),
        **{k: v for k, v in project_doc.items() if k not in ["_id", "owner_id"]},
        owner_id=str(uid)
    )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, body: ProjectUpdate, user_id: str = Depends(get_current_user_id)):
    """Update project details (must be owner)."""
    db = get_database()
    try:
        pid = ObjectId(project_id)
        uid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    project = await db.projects.find_one({"_id": pid})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if project["owner_id"] != uid:
        raise HTTPException(status_code=403, detail="Only the project owner can update it")
        
    updates = body.model_dump(exclude_unset=True)
    updates["updated_at"] = datetime.now(timezone.utc)
    
    await db.projects.update_one({"_id": pid}, {"$set": updates})
    
    updated_project = await db.projects.find_one({"_id": pid})
    return ProjectResponse(
        id=str(updated_project["_id"]),
        **{k: v for k, v in updated_project.items() if k not in ["_id", "owner_id"]},
        owner_id=str(updated_project["owner_id"])
    )


@router.post("/{project_id}/remove-member")
async def remove_member(project_id: str, payload: dict, user_id: str = Depends(get_current_user_id)):
    """Remove a member from the team (must be owner)."""
    db = get_database()
    try:
        pid = ObjectId(project_id)
        uid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    target_user_id = payload.get("user_id")
    if not target_user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
        
    project = await db.projects.find_one({"_id": pid})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if project["owner_id"] != uid:
        raise HTTPException(status_code=403, detail="Only the project owner can remove members")
        
    if str(uid) == target_user_id:
        raise HTTPException(status_code=400, detail="Owner cannot remove themselves, use leave instead or delete project")
        
    await db.projects.update_one(
        {"_id": pid},
        {"$pull": {"members": {"user_id": target_user_id}}}
    )
    return {"message": "Member removed"}


@router.post("/{project_id}/leave")
async def leave_team(project_id: str, user_id: str = Depends(get_current_user_id)):
    """Leave the current team."""
    db = get_database()
    try:
        pid = ObjectId(project_id)
        uid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    project = await db.projects.find_one({"_id": pid})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if project["owner_id"] == uid:
        # If owner leaves, maybe pass ownership or delete project. For MVP, just delete project if empty or error
        if len(project.get("members", [])) > 1:
            raise HTTPException(status_code=400, detail="Owner cannot leave team while others are in it. Remove them first.")
        else:
            await db.projects.delete_one({"_id": pid})
            return {"message": "Project deleted"}
            
    await db.projects.update_one(
        {"_id": pid},
        {"$pull": {"members": {"user_id": str(uid)}}}
    )
    return {"message": "Left team"}
