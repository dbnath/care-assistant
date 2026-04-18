import pytest
from sqlalchemy import text

from care_assistant.database import engine
from care_assistant.db_models import Base


@pytest.fixture(autouse=True)
def reset_db():
    """Drop and recreate all tables before every test for a clean slate."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
