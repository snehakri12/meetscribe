"""SQLAlchemy ORM models.

Entity overview:

    Meeting 1──* TranscriptSegment *──1 Participant   (segment.speaker)
    Meeting 1──* Chapter
    Meeting 1──* ActionItem *──0..1 Participant      (action_item.assignee)
    Meeting *──* Participant  (meeting_participants)
    Meeting *──* Topic        (meeting_topics)
    TranscriptSegment 1──* SegmentComment
"""

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


meeting_participants = Table(
    "meeting_participants",
    Base.metadata,
    Column("meeting_id", ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True),
    Column("participant_id", ForeignKey("participants.id", ondelete="CASCADE"), primary_key=True),
)

meeting_topics = Table(
    "meeting_topics",
    Base.metadata,
    Column("meeting_id", ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True),
    Column("topic_id", ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True),
)


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False, unique=True)
    email = Column(String(255), nullable=True)

    meetings = relationship("Meeting", secondary=meeting_participants, back_populates="participants")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True)
    name = Column(String(80), nullable=False, unique=True)

    meetings = relationship("Meeting", secondary=meeting_topics, back_populates="topics")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    # Wall-clock start time of the meeting (stored without timezone).
    started_at = Column(DateTime, nullable=False, index=True)
    duration_seconds = Column(Integer, nullable=False, default=0)
    summary = Column(Text, nullable=False, default="")
    # How the meeting was created: seed | upload | paste | form
    source = Column(String(20), nullable=False, default="form")
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)

    participants = relationship(
        "Participant",
        secondary=meeting_participants,
        back_populates="meetings",
        order_by="Participant.name",
    )
    topics = relationship(
        "Topic",
        secondary=meeting_topics,
        back_populates="meetings",
        order_by="Topic.name",
    )
    segments = relationship(
        "TranscriptSegment",
        back_populates="meeting",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="TranscriptSegment.position",
    )
    chapters = relationship(
        "Chapter",
        back_populates="meeting",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Chapter.position",
    )
    action_items = relationship(
        "ActionItem",
        back_populates="meeting",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ActionItem.id",
    )


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"
    __table_args__ = (
        UniqueConstraint("meeting_id", "position", name="uq_segment_meeting_position"),
    )

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    position = Column(Integer, nullable=False)
    start_seconds = Column(Float, nullable=False)
    end_seconds = Column(Float, nullable=False)
    speaker_id = Column(Integer, ForeignKey("participants.id"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    is_highlighted = Column(Boolean, nullable=False, default=False)

    meeting = relationship("Meeting", back_populates="segments")
    speaker = relationship("Participant")
    comments = relationship(
        "SegmentComment",
        back_populates="segment",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="SegmentComment.created_at",
    )


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    position = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    start_seconds = Column(Float, nullable=False)
    summary = Column(Text, nullable=False, default="")

    meeting = relationship("Meeting", back_populates="chapters")


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    completed = Column(Boolean, nullable=False, default=False)
    assignee_id = Column(Integer, ForeignKey("participants.id", ondelete="SET NULL"), nullable=True, index=True)
    # Point in the recording the item was mentioned (links back to the transcript).
    source_start_seconds = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    meeting = relationship("Meeting", back_populates="action_items")
    assignee = relationship("Participant")


class SegmentComment(Base):
    __tablename__ = "segment_comments"

    id = Column(Integer, primary_key=True)
    segment_id = Column(
        Integer,
        ForeignKey("transcript_segments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author = Column(String(120), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    segment = relationship("TranscriptSegment", back_populates="comments")


Index("ix_action_items_meeting_completed", ActionItem.meeting_id, ActionItem.completed)
