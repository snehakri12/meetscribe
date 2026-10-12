"""Transcript segment annotations: highlights (soundbites) and comments."""

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from services.meetings import CURRENT_USER_NAME

router = APIRouter(tags=["transcript"])


def _get_segment(db: Session, segment_id: int) -> models.TranscriptSegment:
    segment = db.get(models.TranscriptSegment, segment_id)
    if segment is None:
        raise HTTPException(status_code=404, detail="Transcript segment not found")
    return segment


@router.patch("/segments/{segment_id}", response_model=schemas.SegmentOut)
def update_segment(segment_id: int, payload: schemas.SegmentUpdate, db: Session = Depends(get_db)):
    segment = _get_segment(db, segment_id)
    segment.is_highlighted = payload.is_highlighted
    db.commit()
    db.refresh(segment)
    return segment


@router.post("/segments/{segment_id}/comments", response_model=schemas.CommentOut, status_code=201)
def add_comment(segment_id: int, payload: schemas.CommentCreate, db: Session = Depends(get_db)):
    segment = _get_segment(db, segment_id)
    body = payload.body.strip()
    if not body:
        raise HTTPException(status_code=422, detail="Comment cannot be blank")
    comment = models.SegmentComment(segment=segment, author=CURRENT_USER_NAME, body=body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    comment = db.get(models.SegmentComment, comment_id)
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    db.delete(comment)
    db.commit()
    return Response(status_code=204)
