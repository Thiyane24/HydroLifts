import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, get_db

# Use a separate SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    # Create tables for tests
    Base.metadata.create_all(bind=engine)
    yield
    # Drop tables after tests
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    connection = TestingSessionLocal()
    try:
        yield connection
    finally:
        connection.close()

@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    del app.dependency_overrides[get_db]
