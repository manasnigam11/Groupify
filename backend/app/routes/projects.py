"""
Groupify — Project/Team Routes.
"""
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_database
from app.models import ProjectCreate, ProjectUpdate, ProjectResponse
from app.utils import get_current_user_id

# Naya Import AI Service ke liye (Is file ko create kar lena if not done)
from app.services.ai_health import generate_team_health_report

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("/my", response_model=ProjectResponse | None)
async def get_my_project(user_id: str = Depends(get_current_user_id)):
    db = get_database()
    uid = ObjectId(user_id)
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
        members=project.get("members", []),
        team_health=project.get("team_health", None) # NAYA: Health fetch karna
    )

@router.post("", response_model=ProjectResponse)
async def create_project(body: ProjectCreate, user_id: str = Depends(get_current_user_id)):
    db = get_database()
    uid = ObjectId(user_id)
    existing = await db.projects.find_one({
        "$or": [{"owner_id": uid}, {"members.user_id": str(uid)}]
    })
    if existing:
        raise HTTPException(status_code=400, detail="You are already in a project team.")
        
    user = await db.users.find_one({"_id": uid})
    name = user.get("profile", {}).get("name", "Unknown")
    role = user.get("preferences", {}).get("role_preference", "Member")
    now = datetime.now(timezone.utc)
    
    project_doc = body.model_dump()
    project_doc["owner_id"] = uid
    project_doc["status"] = "looking_for_team"
    project_doc["created_at"] = now
    project_doc["updated_at"] = now
    
    if not project_doc.get("members"):
        project_doc["members"] = [
            {"user_id": str(uid), "name": name, "role": role}
        ]
    else:
        if not any(m.get("user_id") == str(uid) for m in project_doc["members"]):
            project_doc["members"].insert(0, {"user_id": str(uid), "name": name, "role": role})
    
    res = await db.projects.insert_one(project_doc)
    return ProjectResponse(
        id=str(res.inserted_id),
        **{k: v for k, v in project_doc.items() if k not in ["_id", "owner_id"]},
        owner_id=str(uid)
    )

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, body: ProjectUpdate, user_id: str = Depends(get_current_user_id)):
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
    # Reset team health on update taaki log naya check karein
    updates["team_health"] = None 
    
    await db.projects.update_one({"_id": pid}, {"$set": updates})
    updated_project = await db.projects.find_one({"_id": pid})
    return ProjectResponse(
        id=str(updated_project["_id"]),
        **{k: v for k, v in updated_project.items() if k not in ["_id", "owner_id"]},
        owner_id=str(updated_project["owner_id"])
    )

@router.post("/{project_id}/remove-member")
async def remove_member(project_id: str, payload: dict, user_id: str = Depends(get_current_user_id)):
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
        {
            "$pull": {"members": {"user_id": target_user_id}},
            "$set": {"team_health": None} # Invalidate health
        }
    )
    return {"message": "Member removed"}

@router.post("/{project_id}/leave")
async def leave_team(project_id: str, user_id: str = Depends(get_current_user_id)):
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
        if len(project.get("members", [])) > 1:
            raise HTTPException(status_code=400, detail="Owner cannot leave team while others are in it. Remove them first.")
        else:
            await db.projects.delete_one({"_id": pid})
            return {"message": "Project deleted"}
            
    await db.projects.update_one(
        {"_id": pid},
        {
            "$pull": {"members": {"user_id": str(uid)}},
            "$set": {"team_health": None} # Invalidate health
        }
    )
    return {"message": "Left team"}

# --- NAYA: AI TEAM HEALTH ANALYZER ROUTE ---
@router.post("/{project_id}/health/analyze", summary="Trigger AI Team Health Analysis")
async def analyze_team_health(project_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_database()
    try:
        pid = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Project ID")
        
    project = await db.projects.find_one({"_id": pid})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    member_ids = project.get("members", [])
    if not member_ids:
        member_ids = [{"user_id": project.get("owner_id")}]
        
    # Fetch full details of all members
    user_object_ids = [ObjectId(m["user_id"]) for m in member_ids if "user_id" in m and ObjectId.is_valid(m["user_id"])]
    members_cursor = db.users.find({"_id": {"$in": user_object_ids}})
    team_members = await members_cursor.to_list(length=100)

    # Call Gemini service
    ai_result = await generate_team_health_report(project, team_members)
    ai_result["last_updated"] = datetime.now(timezone.utc)

    # Update DB
    await db.projects.update_one(
        {"_id": pid},
        {"$set": {"team_health": ai_result}}
    )

    return {"message": "Analysis complete", "team_health": ai_result}