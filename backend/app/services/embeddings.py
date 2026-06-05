"""
Groupify — Gemini Text Embedding Service.

Generates embeddings from user profile text using Google's
gemini-embedding-001 model.
"""

from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", ""))

_EMBEDDING_MODEL = "gemini-embedding-001"


def _build_profile_text(user: dict, projects: list[dict] | None = None) -> str:
    """
    Compose a single text block from user profile fields
    for embedding generation. The structure is designed to
    capture the most semantically meaningful attributes.
    """
    skills = user.get("skills", {})
    prefs = user.get("preferences", {})
    profile = user.get("profile", {})

    parts = []

    role = prefs.get("role_preference", "")
    if role:
        parts.append(f"Role: {role}")

    technical = skills.get("technical", [])
    if technical:
        parts.append(f"Skills: {', '.join(technical)}")

    interests = prefs.get("hackathon_interests", [])
    if interests:
        parts.append(f"Interests: {', '.join(interests)}")

    # Include project data if available
    if projects:
        project_texts = []
        for p in projects:
            project_texts.append(f"{p.get('title', '')} — {p.get('description', '')}")
        if project_texts:
            parts.append(f"Projects: {'; '.join(project_texts)}")
    elif prefs.get('project_idea'):
        # Backward compat with legacy data
        parts.append(f"Project Idea: {prefs['project_idea']}")

    bio = profile.get("bio", "")
    if bio:
        parts.append(f"Bio: {bio}")

    return "\n".join(parts) if parts else "Hackathon participant"


async def generate_embedding(user: dict, projects: list[dict] | None = None) -> list[float]:
    """
    Generate an embedding vector from user profile text.
    """
    profile_text = _build_profile_text(user, projects)

    result = _client.models.embed_content(
        model=_EMBEDDING_MODEL,
        contents=profile_text,
    )

    return result.embeddings[0].values


async def generate_query_embedding(query_text: str) -> list[float]:
    """
    Generate an embedding for a search query string.
    """
    result = _client.models.embed_content(
        model=_EMBEDDING_MODEL,
        contents=query_text,
    )

    return result.embeddings[0].values
