"""Pydantic-схемы для API."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    author: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = ""
    publisher: Optional[str] = ""
    year: Optional[int] = Field(None, ge=0, le=2100)
    category: str = Field("0+", pattern=r"^(0\+|6\+|12\+|16\+|18\+)$")
    cover_url: Optional[str] = None
    subjects: Optional[str] = ""   # CSV-строка тегов
    in_stock: bool = True


class BookCreate(BookBase):
    pass


class BookUpdate(BookBase):
    pass


class BookOut(BookBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ---- Open Library ----
class OpenLibBook(BaseModel):
    key: str
    title: str
    author: Optional[str] = None
    year: Optional[int] = None
    cover_url: Optional[str] = None
    subjects: List[str] = []   # массив тегов


class OpenLibResponse(BaseModel):
    books: list[OpenLibBook]
    total: int

# ---- Аутентификация ----
class UserRegister(BaseModel):
    """Тело запроса при регистрации."""
    email: str = Field(..., min_length=3, max_length=200)
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    """Тело запроса при логине."""
    email: str
    password: str


class UserOut(BaseModel):
    """То, что возвращаем клиенту о пользователе."""
    id: int
    email: str
    is_admin: bool
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """Ответ при успешном логине/регистрации."""
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# ---- Избранное ----
class FavoriteAdd(BaseModel):
    """Тело для POST /api/favorites."""
    book_id: int


class FavoriteIdsResponse(BaseModel):
    """Список id книг, которые пользователь добавил в избранное."""
    ids: List[int]