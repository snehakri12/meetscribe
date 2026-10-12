import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db_init import init_db
from routers import action_items, meetings, transcript, workspace

DEFAULT_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000,https://meetscribe-black.vercel.app"

# Runs at import time so it also happens on serverless cold starts (Vercel),
# where FastAPI lifespan events are not guaranteed to fire.
init_db()

app = FastAPI(
    title="MeetScribe API",
    description="Meetings, transcripts, AI notes and action items for the MeetScribe (Fireflies.ai clone) app.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.getenv("CORS_ORIGINS", DEFAULT_ORIGINS).split(",") if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meetings.router)
app.include_router(action_items.router)
app.include_router(transcript.router)
app.include_router(workspace.router)


@app.get("/", tags=["health"])
def root():
    return {"message": "MeetScribe API is running", "docs": "/docs"}


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy"}
