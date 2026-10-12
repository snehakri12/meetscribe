from datetime import date, datetime, time, timedelta
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

import models
import schemas
from database import get_db
from services import meetings as service
from services.notes_generator import extract_action_items

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("", response_model=list[schemas.MeetingListItem])
def list_meetings(
    q: Optional[str] = Query(default=None, description="Matches title, participant, topic or transcript text"),
    participant: Optional[str] = Query(default=None, description="Exact participant name"),
    topic: Optional[str] = Query(default=None, description="Exact topic name"),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    mine: bool = Query(default=False, description="Only meetings the current user attended"),
    sort: Literal["newest", "oldest"] = "newest",
    db: Session = Depends(get_db),
):
    query = select(models.Meeting).options(
        selectinload(models.Meeting.participants),
        selectinload(models.Meeting.topics),
        selectinload(models.Meeting.action_items),
    )

    if q and q.strip():
        pattern = f"%{q.strip()}%"
        query = query.where(
            or_(
                models.Meeting.title.ilike(pattern),
                models.Meeting.summary.ilike(pattern),
                models.Meeting.participants.any(models.Participant.name.ilike(pattern)),
                models.Meeting.topics.any(models.Topic.name.ilike(pattern)),
                models.Meeting.segments.any(models.TranscriptSegment.text.ilike(pattern)),
            )
        )
    if participant:
        query = query.where(models.Meeting.participants.any(models.Participant.name == participant))
    if mine:
        query = query.where(models.Meeting.participants.any(models.Participant.name == service.CURRENT_USER_NAME))
    if topic:
        query = query.where(models.Meeting.topics.any(models.Topic.name == topic))
    if date_from:
        query = query.where(models.Meeting.started_at >= datetime.combine(date_from, time.min))
    if date_to:
        query = query.where(models.Meeting.started_at < datetime.combine(date_to + timedelta(days=1), time.min))

    order = models.Meeting.started_at.desc() if sort == "newest" else models.Meeting.started_at.asc()
    meetings = db.scalars(query.order_by(order, models.Meeting.id.desc())).all()
    return [service.to_list_item(meeting) for meeting in meetings]


@router.post("", response_model=schemas.MeetingDetail, status_code=201)
def create_meeting(payload: schemas.MeetingCreate, db: Session = Depends(get_db)):
    return service.create_meeting(db, payload)


@router.get("/{meeting_id}", response_model=schemas.MeetingDetail)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    return service.load_meeting(db, meeting_id)


@router.patch("/{meeting_id}", response_model=schemas.MeetingDetail)
def update_meeting(meeting_id: int, payload: schemas.MeetingUpdate, db: Session = Depends(get_db)):
    meeting = service.load_meeting(db, meeting_id)
    data = payload.model_dump(exclude_unset=True)

    if data.get("title") is not None:
        meeting.title = data["title"].strip() or meeting.title
    if data.get("started_at") is not None:
        meeting.started_at = data["started_at"].replace(tzinfo=None)
    if "summary" in data and data["summary"] is not None:
        meeting.summary = data["summary"].strip()
    if data.get("participants") is not None:
        meeting.participants = service.get_or_create_participants(db, data["participants"])
    if data.get("topics") is not None:
        meeting.topics = service.get_or_create_topics(db, data["topics"])

    db.commit()
    return service.load_meeting(db, meeting_id)


@router.delete("/{meeting_id}", status_code=204)
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = service.load_meeting(db, meeting_id)
    db.delete(meeting)
    db.commit()
    return Response(status_code=204)


@router.put("/{meeting_id}/transcript", response_model=schemas.MeetingDetail)
def replace_transcript(meeting_id: int, payload: schemas.TranscriptReplace, db: Session = Depends(get_db)):
    """Replace the transcript (comments/highlights on old segments are removed)."""
    meeting = service.load_meeting(db, meeting_id)
    parsed = service.parse_or_422(payload.transcript_text, payload.transcript_format)
    service.replace_segments(db, meeting, parsed)
    if payload.regenerate_notes:
        service.apply_generated_notes(db, meeting, parsed, action_items=False)
    db.commit()
    return service.load_meeting(db, meeting_id)


@router.post("/{meeting_id}/generate-notes", response_model=schemas.MeetingDetail)
def regenerate_notes(meeting_id: int, db: Session = Depends(get_db)):
    """Re-run the notes generator: replaces summary, topics and chapters, and adds
    any newly detected action items (existing items are kept)."""
    meeting = service.load_meeting(db, meeting_id)
    parsed = service.segments_from_meeting(meeting)
    if not parsed:
        return meeting
    existing = {item.title.lower() for item in meeting.action_items}
    service.apply_generated_notes(db, meeting, parsed, action_items=False)
    for item in extract_action_items(parsed):
        if item.title.lower() not in existing:
            meeting.action_items.append(
                models.ActionItem(
                    title=item.title,
                    assignee=service.get_participant(db, item.assignee),
                    source_start_seconds=item.source_start_seconds,
                )
            )
    db.commit()
    return service.load_meeting(db, meeting_id)
