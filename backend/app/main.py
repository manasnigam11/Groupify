"""
Groupify — FastAPI Application Entry Point.

Configures CORS, registers route modules, and manages the
MongoDB connection lifecycle via the lifespan context manager.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import close_mongodb_connection, connect_to_mongodb
from app.routes.auth import router as auth_router
from app.routes.match import router as match_router
from app.routes.profile import router as profile_router


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
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Route Registration
# ---------------------------------------------------------------------------

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(match_router)


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@app.get("/", tags=["health"])
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "app": "Groupify API", "version": "0.1.0"}
