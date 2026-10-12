
import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import Base, engine, SessionLocal
import models
import schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MeetScribe API",
    description="Backend API for meeting notes and transcripts",
    version="1.0.0",
)



app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin
        for origin in [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            os.getenv("FRONTEND_URL"),
        ]
        if origin
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {
        "message": "Fireflies Clone API is running",
        "status": "success",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/meetings", response_model=list[schemas.MeetingResponse])
def get_meetings(db: Session = Depends(get_db)):
    return db.query(models.Meeting).order_by(models.Meeting.id.desc()).all()


@app.post("/meetings", response_model=schemas.MeetingResponse, status_code=201)
def create_meeting(
    meeting: schemas.MeetingCreate,
    db: Session = Depends(get_db),
):
    new_meeting = models.Meeting(**meeting.model_dump())
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    return new_meeting


@app.get("/meetings/{meeting_id}", response_model=schemas.MeetingResponse)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(
        models.Meeting.id == meeting_id
    ).first()

    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")

    return meeting


@app.patch("/meetings/{meeting_id}", response_model=schemas.MeetingResponse)
def update_meeting(
    meeting_id: int,
    meeting_data: schemas.MeetingUpdate,
    db: Session = Depends(get_db),
):
    meeting = db.query(models.Meeting).filter(
        models.Meeting.id == meeting_id
    ).first()

    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")

    update_data = meeting_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(meeting, key, value)

    db.commit()
    db.refresh(meeting)

    return meeting


@app.delete("/meetings/{meeting_id}")
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(
        models.Meeting.id == meeting_id
    ).first()

    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")

    db.delete(meeting)
    db.commit()

    return {
        "message": "Meeting deleted successfully",
        "id": meeting_id,
    }


@app.get("/tasks", response_model=list[schemas.TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(models.Task).order_by(models.Task.id.desc()).all()


@app.post("/tasks", response_model=schemas.TaskResponse, status_code=201)
def create_task(
    task_data: schemas.TaskCreate,
    db: Session = Depends(get_db),
):
    meeting = db.query(models.Meeting).filter(
        models.Meeting.id == task_data.meeting_id
    ).first()

    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")

    new_task = models.Task(**task_data.model_dump())
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@app.patch("/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int,
    task_data: schemas.TaskUpdate,
    db: Session = Depends(get_db),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id
    ).first()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)

    return task


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(
        models.Task.id == task_id
    ).first()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully",
        "id": task_id,
    }
