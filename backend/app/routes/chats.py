"""
Groupify — Chats Routes.

GET  /api/chats            — Get list of conversations for current user.
GET  /api/chats/{user_id}   — Get message history with a specific user.
POST /api/chats/{user_id}   — Send a direct message to a user.
"""

from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_database
from app.models import ChatMessageCreate, ChatMessageResponse, ChatConversation
from app.utils import get_current_user_id

router = APIRouter(prefix="/api/chats", tags=["chats"])

@router.get("", response_model=list[ChatConversation])
async def get_conversations(user_id: str = Depends(get_current_user_id)):
    """Return a list of conversations for the current user."""
    db = get_database()
    uid = ObjectId(user_id)
    
    pipeline = [
        {
            "$match": {
                "is_team_chat": {"$ne": True}, # Filter out team chats from direct DMs
                "$or": [{"sender_id": uid}, {"receiver_id": uid}]
            }
        },
        {
            "$sort": {"created_at": -1}
        },
        {
            "$group": {
                "_id": {
                    "$cond": [
                        {"$eq": ["$sender_id", uid]},
                        "$receiver_id",
                        "$sender_id"
                    ]
                },
                "last_message": {"$first": "$content"},
                "last_message_time": {"$first": "$created_at"}
            }
        }
    ]
    
    conversations_raw = await db.chat_messages.aggregate(pipeline).to_list(100)
    
    result = []
    for conv in conversations_raw:
        other_id = conv["_id"]
        other_user = await db.users.find_one({"_id": other_id}, {"profile.name": 1, "profile.avatar_url": 1})
        if other_user:
            profile = other_user.get("profile", {})
            result.append(ChatConversation(
                other_user_id=str(other_id),
                other_user_name=profile.get("name", "Unknown"),
                other_user_avatar=profile.get("avatar_url", ""),
                last_message=conv["last_message"],
                last_message_time=conv["last_message_time"]
            ))
            
    result.sort(key=lambda x: x.last_message_time, reverse=True)
    return result


@router.get("/team/{project_id}")
async def get_team_messages(project_id: str, user_id: str = Depends(get_current_user_id)):
    """Return message history for a specific team/project."""
    db = get_database()
    try:
        pid = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID")
        
    messages = await db.chat_messages.find({
        "receiver_id": pid, 
        "is_team_chat": True
    }).sort("created_at", 1).to_list(500)
    
    result = []
    for m in messages:
        sender = await db.users.find_one({"_id": m["sender_id"]})
        sender_name = sender["profile"]["name"] if sender else "Unknown"
        result.append({
            "id": str(m["_id"]),
            "sender_id": str(m["sender_id"]),
            "sender_name": sender_name,
            "content": m["content"],
            "created_at": m["created_at"]
        })
    return result


@router.post("/team/{project_id}")
async def send_team_message(project_id: str, body: ChatMessageCreate, user_id: str = Depends(get_current_user_id)):
    """Send a message to a team/project chat."""
    db = get_database()
    try:
        uid = ObjectId(user_id)
        pid = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    msg_doc = {
        "sender_id": uid,
        "receiver_id": pid,
        "is_team_chat": True,
        "content": body.content,
        "created_at": datetime.now(timezone.utc)
    }
    
    res = await db.chat_messages.insert_one(msg_doc)
    
    sender = await db.users.find_one({"_id": uid})
    sender_name = sender["profile"]["name"] if sender else "Unknown"
    
    return {
        "id": str(res.inserted_id),
        "sender_id": str(uid),
        "sender_name": sender_name,
        "content": msg_doc["content"],
        "created_at": msg_doc["created_at"]
    }


@router.get("/{other_user_id}", response_model=list[ChatMessageResponse])
async def get_messages(other_user_id: str, user_id: str = Depends(get_current_user_id)):
    """Return message history with a specific user."""
    db = get_database()
    try:
        uid = ObjectId(user_id)
        ouid = ObjectId(other_user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")
        
    messages = await db.chat_messages.find({
        "is_team_chat": {"$ne": True},
        "$or": [
            {"sender_id": uid, "receiver_id": ouid},
            {"sender_id": ouid, "receiver_id": uid}
        ]
    }).sort("created_at", 1).to_list(500)
    
    return [
        ChatMessageResponse(
            id=str(m["_id"]),
            sender_id=str(m["sender_id"]),
            receiver_id=str(m["receiver_id"]),
            content=m["content"],
            created_at=m["created_at"]
        ) for m in messages
    ]


@router.post("/{other_user_id}", response_model=ChatMessageResponse)
async def send_message(other_user_id: str, body: ChatMessageCreate, user_id: str = Depends(get_current_user_id)):
    """Send a direct message to a user."""
    db = get_database()
    try:
        uid = ObjectId(user_id)
        ouid = ObjectId(other_user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")
        
    recipient = await db.users.find_one({"_id": ouid})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
        
    msg_doc = {
        "sender_id": uid,
        "receiver_id": ouid,
        "is_team_chat": False,
        "content": body.content,
        "created_at": datetime.now(timezone.utc)
    }
    
    res = await db.chat_messages.insert_one(msg_doc)
    
    return ChatMessageResponse(
        id=str(res.inserted_id),
        sender_id=str(uid),
        receiver_id=str(ouid),
        content=msg_doc["content"],
        created_at=msg_doc["created_at"]
    )