"""Workspace-wide lookups: participants, topics, stats and global transcript search."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(tags=["workspace"])


@router.get("/participants", response_model=list[schemas.ParticipantOut])
def list_participants(db: Session = Depends(get_db)):
    """Participants who attended at least one meeting."""
    query = (
        select(models.Participant)
        .where(models.Participant.meetings.any())
        .order_by(models.Participant.name)
    )
    return db.scalars(query).all()


@router.get("/topics", response_model=list[schemas.TopicOut])
def list_topics(db: Session = Depends(get_db)):
    query = select(models.Topic).where(models.Topic.meetings.any()).order_by(models.Topic.name)
    return db.scalars(query).all()


@router.get("/stats", response_model=schemas.WorkspaceStats)
def workspace_stats(db: Session = Depends(get_db)):
    meetings, total_duration = db.execute(
        select(func.count(models.Meeting.id), func.coalesce(func.sum(models.Meeting.duration_seconds), 0))
    ).one()
    open_items = db.scalar(select(func.count()).where(models.ActionItem.completed.is_(False)))
    done_items = db.scalar(select(func.count()).where(models.ActionItem.completed.is_(True)))
    participants = db.scalar(select(func.count()).select_from(models.Participant).where(models.Participant.meetings.any()))
    return schemas.WorkspaceStats(
        meetings=meetings,
        total_duration_seconds=int(total_duration),
        action_items_open=open_items or 0,
        action_items_completed=done_items or 0,
        participants=participants or 0,
    )


@router.get("/search", response_model=schemas.SearchResponse)
def search_transcripts(
    q: str = Query(min_length=1, description="Text to find in any meeting transcript"),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Global search across all transcripts (matches segment text or speaker name)."""
    pattern = f"%{q.strip()}%"
    condition = or_(
        models.TranscriptSegment.text.ilike(pattern),
        models.Participant.name.ilike(pattern),
    )
    base = (
        select(models.TranscriptSegment, models.Meeting, models.Participant)
        .join(models.Meeting, models.TranscriptSegment.meeting_id == models.Meeting.id)
        .join(models.Participant, models.TranscriptSegment.speaker_id == models.Participant.id)
        .where(condition)
    )
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    rows = db.execute(
        base.order_by(models.Meeting.started_at.desc(), models.TranscriptSegment.position).limit(limit)
    ).all()
    hits = [
        schemas.SearchHit(
            meeting_id=meeting.id,
            meeting_title=meeting.title,
            started_at=meeting.started_at,
            segment_id=segment.id,
            start_seconds=segment.start_seconds,
            speaker=speaker.name,
            text=segment.text,
        )
        for segment, meeting, speaker in rows
    ]
    return schemas.SearchResponse(query=q, total=total or 0, hits=hits)
