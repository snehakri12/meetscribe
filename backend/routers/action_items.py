from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

import models
import schemas
from database import get_db
from services import meetings as service

router = APIRouter(tags=["action items"])


def _get_item(db: Session, item_id: int) -> models.ActionItem:
    item = db.get(models.ActionItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Action item not found")
    return item


@router.get("/action-items", response_model=list[schemas.ActionItemWithMeeting])
def list_action_items(
    status: Literal["all", "open", "completed"] = "all",
    db: Session = Depends(get_db),
):
    """Action items across every meeting (used by the Tasks page)."""
    query = (
        select(models.ActionItem)
        .options(selectinload(models.ActionItem.assignee), selectinload(models.ActionItem.meeting))
        .join(models.Meeting)
        .order_by(models.ActionItem.completed, models.Meeting.started_at.desc(), models.ActionItem.id)
    )
    if status != "all":
        query = query.where(models.ActionItem.completed.is_(status == "completed"))
    return [
        schemas.ActionItemWithMeeting(
            **schemas.ActionItemOut.model_validate(item).model_dump(),
            meeting_title=item.meeting.title,
        )
        for item in db.scalars(query).all()
    ]


@router.get("/meetings/{meeting_id}/action-items", response_model=list[schemas.ActionItemOut])
def list_meeting_action_items(meeting_id: int, db: Session = Depends(get_db)):
    return service.load_meeting(db, meeting_id).action_items


@router.post("/meetings/{meeting_id}/action-items", response_model=schemas.ActionItemOut, status_code=201)
def create_action_item(meeting_id: int, payload: schemas.ActionItemCreate, db: Session = Depends(get_db)):
    meeting = service.load_meeting(db, meeting_id)
    item = models.ActionItem(
        title=payload.title,
        assignee=service.get_participant(db, payload.assignee_name),
        source_start_seconds=payload.source_start_seconds,
    )
    meeting.action_items.append(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/action-items/{item_id}", response_model=schemas.ActionItemOut)
def update_action_item(item_id: int, payload: schemas.ActionItemUpdate, db: Session = Depends(get_db)):
    item = _get_item(db, item_id)
    data = payload.model_dump(exclude_unset=True)

    if data.get("title") is not None:
        title = data["title"].strip()
        if not title:
            raise HTTPException(status_code=422, detail="Title cannot be blank")
        item.title = title
    if data.get("completed") is not None and data["completed"] != item.completed:
        item.completed = data["completed"]
        item.completed_at = datetime.now(timezone.utc) if item.completed else None
    if "assignee_name" in data:
        item.assignee = service.get_participant(db, data["assignee_name"])

    db.commit()
    db.refresh(item)
    return item


@router.delete("/action-items/{item_id}", status_code=204)
def delete_action_item(item_id: int, db: Session = Depends(get_db)):
    db.delete(_get_item(db, item_id))
    db.commit()
    return Response(status_code=204)
