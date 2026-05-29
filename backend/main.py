"""
E-Library backend (FastAPI)

Реализует:
- GET  /api/books/search?q=...     — поиск книг через Open Library API
- GET  /api/books/favorites        — список избранного (в памяти)
- POST /api/books/favorites        — добавить книгу в избранное
- GET  /api/health                 — проверка работоспособности

Open Library API: https://openlibrary.org/developers/api
"""
from typing import List, Optional
import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="E-Library API",
    description="Прототип бэкенда электронной библиотеки на FastAPI + Open Library",
    version="0.1.0",
)

# CORS — на случай запуска фронта на :3000 без nginx-прокси
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Модели ----------
class Book(BaseModel):
    key: str = Field(..., description="Уникальный ключ книги в Open Library")
    title: str
    author: Optional[str] = None
    year: Optional[int] = None
    cover_url: Optional[str] = None


class BooksResponse(BaseModel):
    books: List[Book]
    total: int


# ---------- Хранилище избранного (in-memory) ----------
# Для прототипа достаточно. Для прод-версии — БД.
favorites_store: List[Book] = []


# ---------- Хелперы ----------
OPENLIB_SEARCH_URL = "https://openlibrary.org/search.json"
OPENLIB_COVER_URL = "https://covers.openlibrary.org/b/id/{cover_id}-M.jpg"


def _parse_openlib_doc(doc: dict) -> Book:
    """Преобразует ответ Open Library в нашу модель Book."""
    cover_id = doc.get("cover_i")
    cover_url = OPENLIB_COVER_URL.format(cover_id=cover_id) if cover_id else None
    authors = doc.get("author_name") or []
    return Book(
        key=doc.get("key", ""),
        title=doc.get("title", "Untitled"),
        author=", ".join(authors) if authors else None,
        year=doc.get("first_publish_year"),
        cover_url=cover_url,
    )


# ---------- Роуты ----------
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "e-library-backend"}


@app.get("/api/books/search", response_model=BooksResponse)
async def search_books(
    q: str = Query(..., min_length=1, description="Поисковый запрос"),
    limit: int = Query(12, ge=1, le=50),
):
    """GET-роут №1: поиск книг через Open Library API."""
    params = {"q": q, "limit": limit}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(OPENLIB_SEARCH_URL, params=params)
            r.raise_for_status()
            data = r.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Open Library недоступен: {e}")

    docs = data.get("docs", [])[:limit]
    books = [_parse_openlib_doc(d) for d in docs]
    return BooksResponse(books=books, total=data.get("numFound", len(books)))


@app.get("/api/books/favorites", response_model=BooksResponse)
def get_favorites():
    """GET-роут №2: получить список избранного."""
    return BooksResponse(books=favorites_store, total=len(favorites_store))


@app.post("/api/books/favorites", response_model=Book, status_code=201)
def add_favorite(book: Book):
    """POST-роут: добавить книгу в избранное."""
    if any(b.key == book.key for b in favorites_store):
        raise HTTPException(status_code=409, detail="Книга уже в избранном")
    favorites_store.append(book)
    return book


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)