"""
Groupify — Project Routes.

POST   /api/projects           — Create a new project.
GET    /api/projects           — List current user's projects.
GET    /api/projects/:id       — Get a specific project.
PUT    /api/projects/:id       — Update a project.
DELETE /api/projects/:id       — Delete a project.
"""

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_database
from app.models import ProjectCreate, ProjectResponse, ProjectUpdate
from app.utils import get_current_user_id

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _project_response(doc: dict) -> ProjectResponse:
    """Convert a MongoDB project document to a ProjectResponse."""
    return ProjectResponse(
        id=str(doc["_id"]),
        user_id=str(doc["user_id"]),
        title=doc.get("title", ""),
        description=doc.get("description", ""),
        problem_statement=doc.get("problem_statement", ""),
        required_skills=doc.get("required_skills", []),
        required_roles=doc.get("required_roles", []),
        hackathon_category=doc.get("hackathon_category", ""),
        status=doc.get("status", "looking_for_team"),
        created_at=doc.get("created_at", datetime.now(timezone.utc)),
        updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
    )


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project",
)
async def create_project(
    body: ProjectCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Create a new hackathon project."""
    db = get_database()
    now = datetime.now(timezone.utc)

    project_doc = {
        "user_id": ObjectId(user_id),
        "title": body.title,
        "description": body.description,
        "problem_statement": body.problem_statement,
        "required_skills": body.required_skills,
        "required_roles": body.required_roles,
        "hackathon_category": body.hackathon_category,
        "status": "looking_for_team",
        "created_at": now,
        "updated_at": now,
    }

    result = await db.projects.insert_one(project_doc)
    project_doc["_id"] = result.inserted_id

    return _project_response(project_doc)


@router.get(
    "",
    response_model=list[ProjectResponse],
    summary="List current user's projects",
)
async def list_projects(user_id: str = Depends(get_current_user_id)):
    """Return all projects owned by the authenticated user."""
    db = get_database()

    cursor = db.projects.find(
        {"user_id": ObjectId(user_id)}
    ).sort("created_at", -1)

    projects = await cursor.to_list(50)
    return [_project_response(p) for p in projects]


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get a specific project",
)
async def get_project(
    project_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Return a single project by ID. Must be owned by the requesting user."""
    db = get_database()

    try:
        oid = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID.")

    project = await db.projects.find_one({"_id": oid})
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")

    if str(project["user_id"]) != user_id:
        raise HTTPException(status_code=403, detail="Not your project.")

    return _project_response(project)


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update a project",
)
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    user_id: str = Depends(get_current_user_id),
):
    """Partially update a project. Only provided fields are overwritten."""
    db = get_database()

    try:
        oid = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID.")

    project = await db.projects.find_one({"_id": oid})
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")

    if str(project["user_id"]) != user_id:
        raise HTTPException(status_code=403, detail="Not your project.")

    update_fields = {"updated_at": datetime.now(timezone.utc)}
    update_data = body.model_dump(exclude_unset=True)
    update_fields.update(update_data)

    await db.projects.update_one({"_id": oid}, {"$set": update_fields})

    updated = await db.projects.find_one({"_id": oid})
    return _project_response(updated)


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a project",
)
async def delete_project(
    project_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Delete a project. Must be owned by the requesting user."""
    db = get_database()

    try:
        oid = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID.")

    project = await db.projects.find_one({"_id": oid})
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")

    if str(project["user_id"]) != user_id:
        raise HTTPException(status_code=403, detail="Not your project.")

    await db.projects.delete_one({"_id": oid})
