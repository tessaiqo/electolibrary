"""Подключение к SQLite через SQLAlchemy."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = "sqlite:///./data/library.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # для SQLite + FastAPI
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Базовый класс для всех ORM-моделей."""
    pass


def get_db():
    """Зависимость FastAPI: открывает сессию на запрос, закрывает после."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()