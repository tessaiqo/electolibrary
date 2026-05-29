"""ORM-модели SQLAlchemy."""
from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Book(Base):
    """Модель книги в библиотеке."""
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    author: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, default="")
    publisher: Mapped[str | None] = mapped_column(String(200), default="")
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    category: Mapped[str] = mapped_column(String(20), default="0+")  # 0+ / 6+ / 12+ / 16+ / 18+
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    in_stock: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    subjects: Mapped[str | None] = mapped_column(Text, default="")  # CSV-теги жанров