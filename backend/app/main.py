"""
Groupify — FastAPI Application Entry Point.

Configures CORS, registers route modules, and manages the
MongoDB connection lifecycle via the lifespan context manager.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import close_mongodb_connection, connect_to_mongodb
from app.routes import auth, profile, match, chats, projects, invites


# ---------------------------------------------------------------------------
# Lifespan — startup / shutdown hooks
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Open MongoDB on startup, close on shutdown."""
    await connect_to_mongodb()
    yield
    await close_mongodb_connection()


# ---------------------------------------------------------------------------
# Application Instance
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Groupify API",
    description="AI-powered teammate matching agent for hackathons.",
    version="0.1.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# CORS — allow the Vite dev server and deployed frontend
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Route Registration
# ---------------------------------------------------------------------------

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(match.router)
app.include_router(chats.router)
app.include_router(projects.router)
app.include_router(invites.router)


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@app.get("/", tags=["health"])
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "app": "Groupify API", "version": "0.1.0"}
