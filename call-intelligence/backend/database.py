import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_ROOT = os.path.normpath(os.getenv("DATA_DIR", BASE_DIR))
os.makedirs(DATA_ROOT, exist_ok=True)
DATABASE_URL = f"sqlite:///{os.path.join(DATA_ROOT, 'call_intelligence.db')}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from models import Call  # noqa: F401

    Base.metadata.create_all(bind=engine)
