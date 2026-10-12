
import json
from datetime import date

from database import SessionLocal
from models import Meeting, Task


SAMPLE_MEETINGS = [
    {
        "title": "Product Planning & Roadmap",
        "date": str(date.today()),
        "duration": "32:15",
        "participants": ["Sneha", "Rahul", "Priya"],
        "summary": (
            "The team reviewed the upcoming product roadmap, prioritized "
            "the dashboard improvements, and agreed to finalize the next "
            "release scope by Friday."
        ),
        "topics": [
            "Product roadmap",
            "Dashboard improvements",
            "Release planning",
        ],
        "transcript": [
            {
                "timestamp": 0,
                "speaker": "Sneha",
                "text": "Let's review our roadmap and agree on the priorities for the next release.",
            },
            {
                "timestamp": 12,
                "speaker": "Rahul",
                "text": "The dashboard improvements should come first because they affect the main user workflow.",
            },
            {
                "timestamp": 28,
                "speaker": "Priya",
                "text": "I will prepare the revised designs and share them with the team by Wednesday.",
            },
            {
                "timestamp": 45,
                "speaker": "Sneha",
                "text": "Great. Let's finalize the release scope by Friday and review any remaining blockers.",
            },
        ],
        "tasks": [
            {"title": "Prepare revised dashboard designs", "completed": False},
            {"title": "Finalize the next release scope", "completed": False},
            {"title": "Review outstanding release blockers", "completed": True},
        ],
    },
    {
        "title": "Engineering Sprint Review",
        "date": str(date.today()),
        "duration": "24:40",
        "participants": ["Rahul", "Ananya", "Sneha"],
        "summary": (
            "The engineering team reviewed sprint progress, discussed API "
            "reliability, and identified testing work required before release."
        ),
        "topics": [
            "Sprint progress",
            "API reliability",
            "Testing",
        ],
        "transcript": [
            {
                "timestamp": 0,
                "speaker": "Rahul",
                "text": "Let's start with the sprint review and discuss what is ready for release.",
            },
            {
                "timestamp": 15,
                "speaker": "Ananya",
                "text": "The meeting endpoints are working, but we need additional validation for invalid requests.",
            },
            {
                "timestamp": 31,
                "speaker": "Sneha",
                "text": "I'll verify the create and edit flows and test that the data persists after refreshing.",
            },
            {
                "timestamp": 52,
                "speaker": "Rahul",
                "text": "Let's finish the regression tests before we approve the release.",
            },
        ],
        "tasks": [
            {"title": "Add API request validation tests", "completed": False},
            {"title": "Verify meeting edit and persistence flows", "completed": False},
            {"title": "Complete regression testing", "completed": False},
        ],
    },
    {
        "title": "Customer Feedback & UX Review",
        "date": str(date.today()),
        "duration": "18:25",
        "participants": ["Priya", "Ananya"],
        "summary": (
            "The team discussed customer feedback about navigation, transcript "
            "readability, and meeting search. The next step is to prioritize "
            "the most common usability issues."
        ),
        "topics": [
            "Customer feedback",
            "Navigation",
            "Transcript readability",
        ],
        "transcript": [
            {
                "timestamp": 0,
                "speaker": "Priya",
                "text": "Several users asked for a faster way to find older meetings.",
            },
            {
                "timestamp": 14,
                "speaker": "Ananya",
                "text": "We should make transcript speaker labels and timestamps easier to scan.",
            },
            {
                "timestamp": 29,
                "speaker": "Priya",
                "text": "Let's prioritize search improvements and review the updated layout next week.",
            },
        ],
        "tasks": [
            {"title": "Review meeting search usability", "completed": False},
            {"title": "Improve transcript readability", "completed": True},
        ],
    },
    {
        "title": "Weekly Team Stand-up",
        "date": str(date.today()),
        "duration": "12:30",
        "participants": ["Sneha", "Rahul", "Ananya", "Priya"],
        "summary": (
            "The team shared progress updates, identified a deployment "
            "configuration issue, and agreed on priorities for the day."
        ),
        "topics": [
            "Progress updates",
            "Deployment",
            "Daily priorities",
        ],
        "transcript": [
            {
                "timestamp": 0,
                "speaker": "Sneha",
                "text": "Let's share our progress and flag anything blocking today's work.",
            },
            {
                "timestamp": 10,
                "speaker": "Rahul",
                "text": "The backend is deployed, and I am checking the production API responses.",
            },
            {
                "timestamp": 23,
                "speaker": "Ananya",
                "text": "I will verify the frontend interactions and check for any remaining errors.",
            },
            {
                "timestamp": 38,
                "speaker": "Priya",
                "text": "I'll document the outstanding issues and share the next steps with everyone.",
            },
        ],
        "tasks": [
            {"title": "Verify production API responses", "completed": True},
            {"title": "Test frontend interactions", "completed": False},
            {"title": "Document remaining issues", "completed": False},
        ],
    },
]


def seed_database():
    db = SessionLocal()

    try:
        for sample in SAMPLE_MEETINGS:
            existing = (
                db.query(Meeting)
                .filter(Meeting.title == sample["title"])
                .first()
            )

            if existing:
                print(f"Already exists, skipping: {sample['title']}")
                continue

            meeting = Meeting(
                title=sample["title"],
                date=sample["date"],
                duration=sample["duration"],
                participants=json.dumps(sample["participants"]),
                summary=sample["summary"],
                topics=json.dumps(sample["topics"]),
                transcript=json.dumps(sample["transcript"]),
            )

            db.add(meeting)
            db.flush()

            for task_data in sample["tasks"]:
                db.add(
                    Task(
                        title=task_data["title"],
                        completed=task_data["completed"],
                        meeting_id=meeting.id,
                    )
                )

            print(f"Added: {sample['title']}")

        db.commit()
        print("Sample data seeding completed.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
