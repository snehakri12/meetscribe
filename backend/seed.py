"""Seed the database with demo meetings.

Usage (from the backend/ directory):
    python seed.py           # add demo meetings that don't exist yet
    python seed.py --reset   # drop the app tables, recreate them and seed
"""

import argparse
from datetime import date, datetime, time, timedelta

from sqlalchemy import select

import models
from database import Base, SessionLocal, engine
from seed_data import MEETINGS
from services.meetings import get_or_create_participants, get_or_create_topics, replace_segments
from services.transcript_parser import parse_timestamp, parse_transcript


def _started_at(days_ago: int, start_time: str) -> datetime:
    hours, minutes = (int(part) for part in start_time.split(":"))
    return datetime.combine(date.today() - timedelta(days=days_ago), time(hours, minutes))


def seed_database() -> int:
    created = 0
    with SessionLocal() as db:
        try:
            for sample in MEETINGS:
                if db.scalar(select(models.Meeting.id).where(models.Meeting.title == sample["title"])):
                    print(f"Already exists, skipping: {sample['title']}")
                    continue

                meeting = models.Meeting(
                    title=sample["title"],
                    started_at=_started_at(sample["days_ago"], sample["start_time"]),
                    duration_seconds=int(parse_timestamp(sample["duration"])),
                    summary=sample["summary"],
                    source="seed",
                )
                db.add(meeting)
                meeting.participants = get_or_create_participants(db, sample["participants"])
                meeting.topics = get_or_create_topics(db, sample["topics"])
                replace_segments(db, meeting, parse_transcript(sample["transcript"], "txt"))

                for position, (title, start, summary) in enumerate(sample["chapters"]):
                    meeting.chapters.append(
                        models.Chapter(position=position, title=title, start_seconds=parse_timestamp(start), summary=summary)
                    )

                for title, assignee, start, completed in sample["action_items"]:
                    meeting.action_items.append(
                        models.ActionItem(
                            title=title,
                            assignee=get_or_create_participants(db, [assignee])[0],
                            source_start_seconds=parse_timestamp(start),
                            completed=completed,
                            completed_at=models.utc_now() if completed else None,
                        )
                    )

                db.flush()
                created += 1
                print(f"Added: {sample['title']}")

            # A couple of highlights and comments so the annotation features are visible.
            if created:
                for segment in db.scalars(
                    select(models.TranscriptSegment)
                    .join(models.Meeting)
                    .where(models.Meeting.source == "seed")
                    .where(
                        models.TranscriptSegment.text.ilike("%I'd like to propose that smart search%")
                        | models.TranscriptSegment.text.ilike("%nearly lost a renewal%")
                    )
                ):
                    segment.is_highlighted = True
                    segment.comments.append(
                        models.SegmentComment(author="Sneha", body="Key moment - worth sharing with the wider team.")
                    )

            db.commit()
        except Exception:
            db.rollback()
            raise
    print(f"Seeding complete: {created} meeting(s) added.")
    return created


def reset_database() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--reset", action="store_true", help="drop and recreate all app tables before seeding")
    args = parser.parse_args()

    from db_init import migrate_legacy_schema

    migrate_legacy_schema()
    if args.reset:
        reset_database()
    else:
        Base.metadata.create_all(bind=engine)
    seed_database()
