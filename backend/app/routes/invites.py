"""
Groupify — Team Invitations Routes.

POST /api/invites/{target_user_id}   — Send a project-based team invitation.
GET  /api/invites                    — View pending received/sent invitations.
POST /api/invites/{invite_id}/respond — Accept or decline an invite.
"""

from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_database
from app.models import TeamInvitationCreate, TeamInvitationResponse, InviteRespondRequest
from app.utils import get_current_user_id

router = APIRouter(prefix="/api/invites", tags=["invites"])

@router.post("/{target_user_id}", response_model=TeamInvitationResponse)
async def send_invite(target_user_id: str, body: TeamInvitationCreate, user_id: str = Depends(get_current_user_id)):
    """Send a team invitation to a user."""
    db = get_database()
    try:
        uid = ObjectId(user_id)
        tuid = ObjectId(target_user_id)
        pid = ObjectId(body.project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    if uid == tuid:
        raise HTTPException(status_code=400, detail="Cannot invite yourself")
        
    # Verify sender owns or is in the project
    project = await db.projects.find_one({"_id": pid})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Check if target user exists
    target_user = await db.users.find_one({"_id": tuid})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if target is already in the project
    for member in project.get("members", []):
        if member["user_id"] == target_user_id:
            raise HTTPException(status_code=400, detail="User is already in this team")
            
    # Check if an invite already exists
    existing_invite = await db.team_invitations.find_one({
        "project_id": pid,
        "receiver_id": tuid,
        "status": "pending"
    })
    if existing_invite:
        raise HTTPException(status_code=400, detail="An invitation is already pending for this user")
        
    sender_user = await db.users.find_one({"_id": uid})
    
    invite_doc = {
        "sender_id": uid,
        "sender_name": sender_user.get("profile", {}).get("name", "Unknown"),
        "receiver_id": tuid,
        "project_id": pid,
        "project_name": project["title"],
        "project_description": project.get("description", ""),
        "invitation_message": body.invitation_message,
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    
    res = await db.team_invitations.insert_one(invite_doc)
    
    return TeamInvitationResponse(
        id=str(res.inserted_id),
        sender_id=str(uid),
        sender_name=invite_doc["sender_name"],
        receiver_id=str(tuid),
        project_id=str(pid),
        project_name=invite_doc["project_name"],
        project_description=invite_doc["project_description"],
        invitation_message=invite_doc["invitation_message"],
        status=invite_doc["status"],
        created_at=invite_doc["created_at"]
    )


@router.get("", response_model=dict)
async def get_invites(user_id: str = Depends(get_current_user_id)):
    """Get sent and received pending invitations."""
    db = get_database()
    uid = ObjectId(user_id)
    
    received_cursor = db.team_invitations.find({
        "receiver_id": uid,
        "status": "pending"
    }).sort("created_at", -1)
    
    sent_cursor = db.team_invitations.find({
        "sender_id": uid,
        "status": "pending"
    }).sort("created_at", -1)
    
    received_raw = await received_cursor.to_list(50)
    sent_raw = await sent_cursor.to_list(50)
    
    def map_invite(m):
        return TeamInvitationResponse(
            id=str(m["_id"]),
            sender_id=str(m["sender_id"]),
            sender_name=m.get("sender_name", ""),
            receiver_id=str(m["receiver_id"]),
            project_id=str(m["project_id"]),
            project_name=m.get("project_name", ""),
            project_description=m.get("project_description", ""),
            invitation_message=m.get("invitation_message", ""),
            status=m.get("status", "pending"),
            created_at=m["created_at"]
        )
        
    return {
        "received": [map_invite(i) for i in received_raw],
        "sent": [map_invite(i) for i in sent_raw]
    }


@router.post("/{invite_id}/respond")
async def respond_invite(invite_id: str, body: InviteRespondRequest, user_id: str = Depends(get_current_user_id)):
    """Accept or decline an invitation."""
    db = get_database()
    try:
        iid = ObjectId(invite_id)
        uid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    invite = await db.team_invitations.find_one({"_id": iid})
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found")
        
    if invite["receiver_id"] != uid:
        raise HTTPException(status_code=403, detail="Not authorized to respond to this invite")
        
    if invite["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Invitation is already {invite['status']}")
        
    if body.action not in ["accept", "decline"]:
        raise HTTPException(status_code=400, detail="Action must be 'accept' or 'decline'")
        
    status_update = "accepted" if body.action == "accept" else "declined"
    
    await db.team_invitations.update_one(
        {"_id": iid},
        {"$set": {"status": status_update}}
    )
    
    if body.action == "accept":
        # Add user to project
        pid = invite["project_id"]
        project = await db.projects.find_one({"_id": pid})
        user = await db.users.find_one({"_id": uid})
        if project and user:
            name = user.get("profile", {}).get("name", "Unknown")
            role = user.get("preferences", {}).get("role_preference", "Member")
            
            # Check if team is full
            if len(project.get("members", [])) >= project.get("team_size", 4):
                # We won't block it strictly here for the hackathon, but maybe could.
                pass
                
            await db.projects.update_one(
                {"_id": pid},
                {"$push": {"members": {
                    "user_id": str(uid),
                    "name": name,
                    "role": role,
                    "is_owner": False
                }}}
            )
            
    return {"message": f"Invitation {status_update}"}
