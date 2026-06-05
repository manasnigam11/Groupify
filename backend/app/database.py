"""
Groupify — MongoDB Atlas Connection Manager.

Uses Motor (async driver) for non-blocking database access.
Connection is established once during FastAPI lifespan and reused.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URI: str = os.getenv("MONGODB_URI", "")
MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "groupify")

# Module-level references — initialized during app lifespan
_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_to_mongodb() -> None:
    """
    Open the Motor client connection and pin the database reference.
    Called once from the FastAPI lifespan startup hook.
    """
    global _client, _db

    if not MONGODB_URI:
        raise RuntimeError(
            "MONGODB_URI is not set. Add it to backend/.env"
        )

    _client = AsyncIOMotorClient(MONGODB_URI)
    _db = _client[MONGODB_DB_NAME]

    # Verify connectivity with a quick server ping
    await _client.admin.command("ping")
    
    # Create indexes for projects collection
    await _db.projects.create_index("user_id")
    await _db.projects.create_index("required_skills")
    await _db.projects.create_index("status")
    
    print(f"[OK] Connected to MongoDB Atlas - database: {MONGODB_DB_NAME}")


async def close_mongodb_connection() -> None:
    """
    Gracefully close the Motor client.
    Called once from the FastAPI lifespan shutdown hook.
    """
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None
        print("[OK] MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """
    Return the active database handle.
    Raises if called before the lifespan startup has run.
    """
    if _db is None:
        raise RuntimeError(
            "Database is not initialized. Ensure connect_to_mongodb() "
            "has been called during application startup."
        )
    return _db
