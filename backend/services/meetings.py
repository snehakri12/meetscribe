"""Business logic for meetings, kept separate from the HTTP layer."""

from datetime import datetime
from typing import Iterable, Optional, Sequence

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

import models
import schemas
from services.notes_generator import generate_notes
from services.transcript_parser import ParsedSegment, TranscriptParseError, parse_transcript

# Default logged-in user (authentication is out of scope).
CURRENT_USER_NAME = "Sneha"


def get_or_create_participants(db: Session, names: Iterable[str]) -> list[models.Participant]:
    participants: list[models.Participant] = []
    for name in names:
        name = " ".join(name.split())
        if not name:
            continue
        participant = db.scalar(select(models.Participant).where(func.lower(models.Participant.name) == name.lower()))
        if participant is None:
            participant = models.Participant(name=name)
            db.add(participant)
            db.flush()
        if participant not in participants:
            participants.append(participant)
    return participants


def get_participant(db: Session, name: Optional[str]) -> Optional[models.Participant]:
    if not name or not name.strip():
        return None
    return get_or_create_participants(db, [name])[0]


def get_or_create_topics(db: Session, names: Iterable[str]) -> list[models.Topic]:
    topics: list[models.Topic] = []
    for name in names:
        name = " ".join(name.split())
        if not name:
            continue
        topic = db.scalar(select(models.Topic).where(func.lower(models.Topic.name) == name.lower()))
        if topic is None:
            topic = models.Topic(name=name)
            db.add(topic)
            db.flush()
        if topic not in topics:
            topics.append(topic)
    return topics


def parse_or_422(text: str, fmt: str) -> list[ParsedSegment]:
    try:
        return parse_transcript(text, fmt)
    except TranscriptParseError as exc:
        raise HTTPException(status_code=422, detail=f"Could not read transcript: {exc}") from exc


def replace_segments(db: Session, meeting: models.Meeting, parsed: Sequence[ParsedSegment]) -> None:
    """Replace a meeting's transcript; every speaker becomes a meeting participant."""
    meeting.segments.clear()
    db.flush()
    speakers = {p.name.lower(): p for p in get_or_create_participants(db, [s.speaker for s in parsed])}
    for position, segment in enumerate(parsed):
        meeting.segments.append(
            models.TranscriptSegment(
                position=position,
                start_seconds=round(segment.start_seconds, 2),
                end_seconds=round(segment.end_seconds, 2),
                speaker=speakers[" ".join(segment.speaker.split()).lower()],
                text=segment.text,
            )
        )
    for participant in speakers.values():
        if participant not in meeting.participants:
            meeting.participants.append(participant)
    if parsed:
        meeting.duration_seconds = max(meeting.duration_seconds or 0, int(round(parsed[-1].end_seconds)))


def apply_generated_notes(
    db: Session,
    meeting: models.Meeting,
    parsed: Sequence[ParsedSegment],
    *,
    summary: bool = True,
    topics: bool = True,
    chapters: bool = True,
    action_items: bool = True,
) -> None:
    notes = generate_notes(parsed)
    if summary:
        meeting.summary = notes.summary
    if topics:
        meeting.topics = get_or_create_topics(db, notes.topics)
    if chapters:
        meeting.chapters.clear()
        db.flush()
        for position, chapter in enumerate(notes.chapters):
            meeting.chapters.append(
                models.Chapter(
                    position=position,
                    title=chapter.title,
                    start_seconds=chapter.start_seconds,
                    summary=chapter.summary,
                )
            )
    if action_items:
        for item in notes.action_items:
            meeting.action_items.append(
                models.ActionItem(
                    title=item.title,
                    assignee=get_participant(db, item.assignee),
                    source_start_seconds=item.source_start_seconds,
                )
            )


def segments_from_meeting(meeting: models.Meeting) -> list[ParsedSegment]:
    return [
        ParsedSegment(
            speaker=s.speaker.name,
            text=s.text,
            start_seconds=s.start_seconds,
            end_seconds=s.end_seconds,
        )
        for s in meeting.segments
    ]


def create_meeting(db: Session, payload: schemas.MeetingCreate) -> models.Meeting:
    parsed = parse_or_422(payload.transcript_text, payload.transcript_format) if payload.transcript_text.strip() else []

    meeting = models.Meeting(
        title=payload.title,
        started_at=(payload.started_at or datetime.now()).replace(tzinfo=None, microsecond=0),
        duration_seconds=payload.duration_seconds or 0,
        summary=(payload.summary or "").strip(),
        source=payload.source,
    )
    db.add(meeting)
    meeting.participants = get_or_create_participants(db, payload.participants)
    if payload.topics is not None:
        meeting.topics = get_or_create_topics(db, payload.topics)

    if parsed:
        replace_segments(db, meeting, parsed)
        if payload.generate_notes:
            apply_generated_notes(
                db,
                meeting,
                parsed,
                summary=not meeting.summary,
                topics=payload.topics is None,
            )

    db.commit()
    return load_meeting(db, meeting.id)


def load_meeting(db: Session, meeting_id: int) -> models.Meeting:
    meeting = db.scalar(
        select(models.Meeting)
        .where(models.Meeting.id == meeting_id)
        .options(
            selectinload(models.Meeting.participants),
            selectinload(models.Meeting.topics),
            selectinload(models.Meeting.chapters),
            selectinload(models.Meeting.segments).selectinload(models.TranscriptSegment.speaker),
            selectinload(models.Meeting.segments).selectinload(models.TranscriptSegment.comments),
            selectinload(models.Meeting.action_items).selectinload(models.ActionItem.assignee),
        )
    )
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


def to_list_item(meeting: models.Meeting) -> schemas.MeetingListItem:
    open_items = sum(1 for item in meeting.action_items if not item.completed)
    return schemas.MeetingListItem(
        id=meeting.id,
        title=meeting.title,
        started_at=meeting.started_at,
        duration_seconds=meeting.duration_seconds,
        source=meeting.source,
        summary=meeting.summary,
        participants=[schemas.ParticipantOut.model_validate(p) for p in meeting.participants],
        topics=[schemas.TopicOut.model_validate(t) for t in meeting.topics],
        action_items_total=len(meeting.action_items),
        action_items_open=open_items,
    )
