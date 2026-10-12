
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    date = Column(String(50), nullable=False)
    duration = Column(String(50), default="00:00")
    participants = Column(Text, default="[]")
    summary = Column(Text, default="")
    transcript = Column(Text, default="[]")
    topics = Column(Text, default="[]")

    tasks = relationship(
        "Task",
        back_populates="meeting",
        cascade="all, delete-orphan",
    )


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    completed = Column(Boolean, default=False)
    meeting_id = Column(
        Integer,
        ForeignKey("meetings.id"),
        nullable=False,
    )

    meeting = relationship("Meeting", back_populates="tasks")
