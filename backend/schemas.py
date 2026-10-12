
from pydantic import BaseModel, ConfigDict
from typing import Optional


class TaskCreate(BaseModel):
    title: str
    meeting_id: int


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    completed: bool
    meeting_id: int

    model_config = ConfigDict(from_attributes=True)


class MeetingCreate(BaseModel):
    title: str
    date: str
    duration: str = "00:00"
    participants: str = "[]"
    summary: str = ""
    transcript: str = "[]"
    topics: str = "[]"


class MeetingResponse(BaseModel):
    id: int
    title: str
    date: str
    duration: str
    participants: str
    summary: str
    transcript: str
    topics: str

    model_config = ConfigDict(from_attributes=True)


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    duration: Optional[str] = None
    participants: Optional[str] = None
    summary: Optional[str] = None
    transcript: Optional[str] = None
    topics: Optional[str] = None
