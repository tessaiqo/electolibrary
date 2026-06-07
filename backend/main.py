"""
ElectoLibrary backend (FastAPI + SQLite)

Реализует CRUD-методы:
- GET    /api/books           — список книг (с фильтрами)
- GET    /api/books/{id}      — одна книга
- POST   /api/books           — создать
- PUT    /api/books/{id}      — обновить
- DELETE /api/books/{id}      — удалить

Доп. эндпоинты:
- POST  /api/upload-cover     — загрузка обложки (multipart)
- GET   /api/openlibrary/search — поиск в Open Library (для импорта)
- GET   /uploads/{filename}   — отдача загруженных обложек
- GET   /api/health           — проверка
"""
import os
import uuid
from pathlib import Path
from typing import List, Optional

import httpx
from fastapi import FastAPI, HTTPException, Query, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Book, User, Favorite
import schemas

from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_current_user_optional, require_admin,
)

# ---------- Инициализация ----------
DATA_DIR = Path("data")
UPLOAD_DIR = Path("uploads")
DATA_DIR.mkdir(exist_ok=True)
UPLOAD_DIR.mkdir(exist_ok=True)

# Создаём таблицы при старте
Base.metadata.create_all(bind=engine)

# ---------- Автосоздание админа ----------
DEFAULT_ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@library.local")
DEFAULT_ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin1234")

def ensure_default_admin():
    """
    При старте создаёт единственного админа по умолчанию, если его ещё нет.
    Никаких автоматических повышений других пользователей не происходит —
    они остаются обычными user'ами и не могут менять каталог.
    """
    from database import SessionLocal
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == DEFAULT_ADMIN_EMAIL).first()
        if existing:
            print(f"[startup] Админ {DEFAULT_ADMIN_EMAIL} уже существует")
            return

        admin = User(
            email=DEFAULT_ADMIN_EMAIL,
            hashed_password=hash_password(DEFAULT_ADMIN_PASSWORD),
            is_admin=True,
        )
        db.add(admin)
        db.commit()
        print(f"[startup] Создан админ по умолчанию: {DEFAULT_ADMIN_EMAIL}")
    finally:
        db.close()

app = FastAPI(
    title="ElectoLibrary API",
    description="CRUD-сервер электронной библиотеки на FastAPI + SQLite",
    version="1.0.0",
)

# CORS — для dev-режима фронта на :3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Раздаём загруженные обложки как статику
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


# ---------- Служебное ----------
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "electolibrary-backend"}

# ---------- Аутентификация ----------
@app.post("/api/auth/register", response_model=schemas.TokenResponse, status_code=201)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    """Регистрация нового пользователя. По умолчанию is_admin=False."""
    # Проверка дубликата
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Пользователь с таким email уже существует")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return schemas.TokenResponse(access_token=token, user=user)


@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    """Логин: проверяет email/пароль, возвращает JWT."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    token = create_access_token(user.id)
    return schemas.TokenResponse(access_token=token, user=user)


@app.get("/api/auth/me", response_model=schemas.UserOut)
def me(user: User = Depends(get_current_user)):
    """Возвращает данные текущего залогиненного пользователя."""
    return user

# ---------- CRUD /api/books ----------
@app.get("/api/books", response_model=List[schemas.BookOut])
def list_books(
    in_stock: Optional[bool] = Query(None, description="Фильтр по статусу"),
    sort: str = Query("created_desc", description="created_desc|created_asc|title_asc|title_desc"),
    db: Session = Depends(get_db),
):
    """GET список книг с фильтрами и сортировкой."""
    q = db.query(Book)
    if in_stock is not None:
        q = q.filter(Book.in_stock == in_stock)

    sort_map = {
        "created_desc": Book.created_at.desc(),
        "created_asc":  Book.created_at.asc(),
        "title_asc":    Book.title.asc(),
        "title_desc":   Book.title.desc(),
    }
    q = q.order_by(sort_map.get(sort, Book.created_at.desc()))
    return q.all()


@app.get("/api/books/{book_id}", response_model=schemas.BookOut)
def get_book(book_id: int, db: Session = Depends(get_db)):
    """GET одна книга по id."""
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")
    return book


@app.post("/api/books", response_model=schemas.BookOut, status_code=201)
def create_book(
    payload: schemas.BookCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """POST создание книги. Только админ."""
    book = Book(**payload.model_dump())
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


@app.put("/api/books/{book_id}", response_model=schemas.BookOut)
def update_book(
    book_id: int,
    payload: schemas.BookUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """PUT обновление книги. Только админ."""
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")
    for field, value in payload.model_dump().items():
        setattr(book, field, value)
    db.commit()
    db.refresh(book)
    return book


@app.delete("/api/books/{book_id}", status_code=204)
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """DELETE удаление книги. Только админ."""
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")
    db.delete(book)
    db.commit()
    return None

# ---------- Загрузка обложек ----------
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp"}
MAX_SIZE = 5 * 1024 * 1024  # 5 МБ


@app.post("/api/upload-cover")
async def upload_cover(
    file: UploadFile = File(...),
    _admin: User = Depends(require_admin),
):
    """Загрузка обложки книги. Только админ."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Допустимы форматы: {', '.join(ALLOWED_EXT)}")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Файл слишком большой (макс. 5 МБ)")

    new_name = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / new_name
    dest.write_bytes(content)
    return {"cover_url": f"/uploads/{new_name}"}


# ---------- Open Library ----------
OPENLIB_SEARCH_URL = "https://openlibrary.org/search.json"
OPENLIB_COVER_URL = "https://covers.openlibrary.org/b/id/{cover_id}-M.jpg"


@app.get("/api/openlibrary/search", response_model=schemas.OpenLibResponse)
async def openlib_search(q: str = Query(..., min_length=1), limit: int = Query(12, ge=1, le=50)):
    """Поиск книг в Open Library API — для импорта в нашу библиотеку."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                OPENLIB_SEARCH_URL,
                params={
                    "q": q,
                    "limit": limit,
                    # Явно перечисляем нужные поля — иначе subject не возвращается
                    "fields": "key,title,author_name,first_publish_year,cover_i,subject",
                },
            )
            r.raise_for_status()
            data = r.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Open Library недоступен: {e}")

    books = []
    for doc in data.get("docs", [])[:limit]:
        cover_id = doc.get("cover_i")
        authors = doc.get("author_name") or []
        subjects = (doc.get("subject") or [])[:5]
        books.append(schemas.OpenLibBook(
            key=doc.get("key", ""),
            title=doc.get("title", "Untitled"),
            author=", ".join(authors) if authors else None,
            year=doc.get("first_publish_year"),
            cover_url=OPENLIB_COVER_URL.format(cover_id=cover_id) if cover_id else None,
            subjects=subjects,
        ))
    return schemas.OpenLibResponse(books=books, total=data.get("numFound", len(books)))

# ---------- Избранное ----------
@app.get("/api/favorites", response_model=schemas.FavoriteIdsResponse)
def get_favorites(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Возвращает список id книг, которые текущий пользователь добавил в избранное."""
    rows = db.query(Favorite.book_id).filter(Favorite.user_id == user.id).all()
    return schemas.FavoriteIdsResponse(ids=[r[0] for r in rows])


@app.get("/api/favorites/books", response_model=List[schemas.BookOut])
def get_favorite_books(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Возвращает полные данные книг из избранного.
    Удобно для страницы /favorites — за один запрос всё что нужно.
    """
    books = (
        db.query(Book)
        .join(Favorite, Favorite.book_id == Book.id)
        .filter(Favorite.user_id == user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )
    return books


@app.post("/api/favorites", status_code=201, response_model=schemas.FavoriteIdsResponse)
def add_favorite(
    payload: schemas.FavoriteAdd,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Добавляет книгу в избранное текущего пользователя. Идемпотентно."""
    # Проверка, что книга существует
    if not db.get(Book, payload.book_id):
        raise HTTPException(status_code=404, detail="Книга не найдена")

    # Если уже в избранном — просто возвращаем текущий список (идемпотентность)
    existing = (
        db.query(Favorite)
        .filter(Favorite.user_id == user.id, Favorite.book_id == payload.book_id)
        .first()
    )
    if not existing:
        db.add(Favorite(user_id=user.id, book_id=payload.book_id))
        db.commit()

    rows = db.query(Favorite.book_id).filter(Favorite.user_id == user.id).all()
    return schemas.FavoriteIdsResponse(ids=[r[0] for r in rows])


@app.delete("/api/favorites/{book_id}", status_code=204)
def remove_favorite(
    book_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Удаляет книгу из избранного. Если её не было — тоже 204 (идемпотентно)."""
    db.query(Favorite).filter(
        Favorite.user_id == user.id,
        Favorite.book_id == book_id,
    ).delete()
    db.commit()
    return None


@app.post("/api/favorites/merge", response_model=schemas.FavoriteIdsResponse)
def merge_favorites(
    payload: schemas.FavoriteIdsResponse,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Слияние локального избранного (из localStorage) с серверным.
    Вызывается фронтом сразу после успешного логина, передаёт ids из localStorage.
    Все эти книги добавляются в избранное пользователя (если их ещё нет в БД).
    Возвращает финальный список id, чтобы фронт сразу синхронизировался.
    """
    valid_book_ids = {b[0] for b in db.query(Book.id).all()}
    for book_id in payload.ids:
        if book_id not in valid_book_ids:
            continue  # пропускаем id несуществующих книг

        existing = (
            db.query(Favorite)
            .filter(Favorite.user_id == user.id, Favorite.book_id == book_id)
            .first()
        )
        if not existing:
            db.add(Favorite(user_id=user.id, book_id=book_id))
    db.commit()

    rows = db.query(Favorite.book_id).filter(Favorite.user_id == user.id).all()
    return schemas.FavoriteIdsResponse(ids=[r[0] for r in rows])
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)