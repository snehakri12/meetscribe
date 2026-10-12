"""Request / response schemas (Pydantic v2)."""

from datetime import datetime, timezone
from typing import Annotated, Literal, Optional

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, field_validator


def _as_utc(value: datetime) -> datetime:
    # SQLite drops tzinfo on read; audit timestamps are always stored in UTC.
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


UtcDatetime = Annotated[datetime, AfterValidator(_as_utc)]
TranscriptFormat = Literal["auto", "txt", "vtt", "json"]
NonEmptyStr = Annotated[str, Field(min_length=1)]


def _clean_names(values: Optional[list[str]]) -> Optional[list[str]]:
    """Trim names, drop blanks and remove case-insensitive duplicates."""
    if values is None:
        return None
    seen: set[str] = set()
    cleaned: list[str] = []
    for value in values:
        name = " ".join(value.split())
        if name and name.lower() not in seen:
            seen.add(name.lower())
            cleaned.append(name)
    return cleaned


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Shared ----------------------------------------------------------------


class ParticipantOut(ORMModel):
    id: int
    name: str
    email: Optional[str] = None


class TopicOut(ORMModel):
    id: int
    name: str


# --- Action items ------------------------------------------------------------


class ActionItemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    assignee_name: Optional[str] = Field(default=None, max_length=120)
    source_start_seconds: Optional[float] = Field(default=None, ge=0)

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Title cannot be blank")
        return value


class ActionItemUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=500)
    completed: Optional[bool] = None
    # An empty string clears the assignee.
    assignee_name: Optional[str] = Field(default=None, max_length=120)


class ActionItemOut(ORMModel):
    id: int
    meeting_id: int
    title: str
    completed: bool
    assignee: Optional[ParticipantOut] = None
    source_start_seconds: Optional[float] = None
    created_at: UtcDatetime
    completed_at: Optional[UtcDatetime] = None


class ActionItemWithMeeting(ActionItemOut):
    meeting_title: str


# --- Transcript ----------------------------------------------------------------


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class CommentOut(ORMModel):
    id: int
    segment_id: int
    author: str
    body: str
    created_at: UtcDatetime


class SegmentUpdate(BaseModel):
    is_highlighted: bool


class SegmentOut(ORMModel):
    id: int
    position: int
    start_seconds: float
    end_seconds: float
    speaker: ParticipantOut
    text: str
    is_highlighted: bool
    comments: list[CommentOut] = []


class ChapterOut(ORMModel):
    id: int
    position: int
    title: str
    start_seconds: float
    summary: str


class TranscriptReplace(BaseModel):
    transcript_text: str = Field(min_length=1)
    transcript_format: TranscriptFormat = "auto"
    regenerate_notes: bool = False


# --- Meetings ------------------------------------------------------------------


class MeetingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    started_at: Optional[datetime] = None
    duration_seconds: Optional[int] = Field(default=None, ge=0)
    participants: list[str] = []
    topics: Optional[list[str]] = None
    summary: Optional[str] = None
    transcript_text: str = ""
    transcript_format: TranscriptFormat = "auto"
    source: Literal["upload", "paste", "form"] = "form"
    # When true, summary/topics/chapters/action items are generated from the transcript
    # for any of those fields not supplied explicitly.
    generate_notes: bool = True

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Title cannot be blank")
        return value

    @field_validator("participants", "topics")
    @classmethod
    def clean_lists(cls, value):
        return _clean_names(value)


class MeetingUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    started_at: Optional[datetime] = None
    participants: Optional[list[str]] = None
    topics: Optional[list[str]] = None
    summary: Optional[str] = None

    @field_validator("participants", "topics")
    @classmethod
    def clean_lists(cls, value):
        return _clean_names(value)


class MeetingListItem(ORMModel):
    id: int
    title: str
    started_at: datetime
    duration_seconds: int
    source: str
    summary: str
    participants: list[ParticipantOut]
    topics: list[TopicOut]
    action_items_total: int
    action_items_open: int


class MeetingDetail(ORMModel):
    id: int
    title: str
    started_at: datetime
    duration_seconds: int
    source: str
    summary: str
    created_at: UtcDatetime
    updated_at: UtcDatetime
    participants: list[ParticipantOut]
    topics: list[TopicOut]
    chapters: list[ChapterOut]
    segments: list[SegmentOut]
    action_items: list[ActionItemOut]


# --- Search / stats -------------------------------------------------------------


class SearchHit(BaseModel):
    meeting_id: int
    meeting_title: str
    started_at: datetime
    segment_id: int
    start_seconds: float
    speaker: str
    text: str


class SearchResponse(BaseModel):
    query: str
    total: int
    hits: list[SearchHit]


class WorkspaceStats(BaseModel):
    meetings: int
    total_duration_seconds: int
    action_items_open: int
    action_items_completed: int
    participants: int
