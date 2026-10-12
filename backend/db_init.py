"""Database bootstrap: create tables, migrate the legacy schema, seed demo data."""

import logging
import os

from sqlalchemy import func, inspect, select, text

import models  # noqa: F401  (registers tables on Base.metadata)
from database import Base, SessionLocal, engine

logger = logging.getLogger("meetscribe.db")

# The first version stored transcripts/participants/topics as JSON strings in
# `meetings` and action items in `tasks`. Those tables are renamed (never
# dropped) so the new relational schema can be created alongside them.
LEGACY_RENAMES = {"tasks": "legacy_tasks", "meetings": "legacy_meetings"}


def _is_legacy_schema(inspector) -> bool:
    tables = set(inspector.get_table_names())
    if "meetings" not in tables:
        return False
    columns = {column["name"] for column in inspector.get_columns("meetings")}
    return "transcript" in columns and "started_at" not in columns


def migrate_legacy_schema() -> bool:
    inspector = inspect(engine)
    if not _is_legacy_schema(inspector):
        return False
    tables = set(inspector.get_table_names())
    is_postgres = engine.dialect.name == "postgresql"
    with engine.begin() as connection:
        for old, new in LEGACY_RENAMES.items():
            if old not in tables or new in tables:
                continue
            pk_name = inspector.get_pk_constraint(old).get("name")
            connection.execute(text(f'ALTER TABLE "{old}" RENAME TO "{new}"'))
            if is_postgres:
                # Free up the names Postgres would give the new tables' key/sequence.
                if pk_name:
                    connection.execute(text(f'ALTER TABLE "{new}" RENAME CONSTRAINT "{pk_name}" TO "{new}_pkey"'))
                connection.execute(text(f'ALTER SEQUENCE IF EXISTS "{old}_id_seq" RENAME TO "{new}_id_seq"'))
            logger.warning("Renamed legacy table %s -> %s", old, new)
    return True


def seed_if_empty() -> bool:
    from seed import seed_database

    with SessionLocal() as db:
        has_meetings = db.scalar(select(func.count(models.Meeting.id))) > 0
    if has_meetings:
        return False
    seed_database()
    return True


def init_db(seed: bool | None = None) -> None:
    migrate_legacy_schema()
    Base.metadata.create_all(bind=engine)
    if seed is None:
        seed = os.getenv("SEED_ON_STARTUP", "true").lower() in ("1", "true", "yes")
    if seed:
        seed_if_empty()
