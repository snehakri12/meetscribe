import os
import sys
import tempfile
from pathlib import Path

import pytest

# Point the app at a throwaway SQLite file *before* any app module is imported,
# so tests never touch the database configured in backend/.env.
_DB_DIR = tempfile.mkdtemp(prefix="meetscribe-tests-")
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_DB_DIR) / 'test.db'}"
os.environ["SEED_ON_STARTUP"] = "false"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from database import Base, engine  # noqa: E402
from main import app  # noqa: E402
from seed import seed_database  # noqa: E402


@pytest.fixture()
def client():
    """Fresh, seeded database for every test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_database()
    with TestClient(app) as test_client:
        yield test_client
