#  E-Library — Электронная библиотека

Учебный прототип со структурой fullstack-приложения электронной библиотеки.
Фронтенд на **Vue 3 + Vite**, бэкенд на **FastAPI**, оба сервиса упакованы в Docker
и оркеструются через docker-compose. В качестве источника данных используется
[Open Library API](https://openlibrary.org/developers/api).

![Скриншот приложения](docs/imgs/app-screenshot.jpg)
![Скриншот приложения](docs/imgs/app-screenshot2.jpg)


## ⚙️ Стек

| Слой       | Технологии                                |
|------------|-------------------------------------------|
| Frontend   | Vue 3, Vite, Axios                        |
| Backend    | FastAPI, Uvicorn, httpx, Pydantic         |
| Source API | Open Library Search API                   |
| Инфра      | Docker, docker-compose, Nginx             |

## 📁 Структура проекта

```
ebook-library/
├── backend/                # FastAPI: GET /search, GET/POST /favorites
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # Vue 3 + Vite
│   ├── src/
│   │   ├── components/BookCard.vue
│   │   ├── services/api.js
│   │   ├── assets/styles.css
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   ├── nginx.conf          # для production-сборки в Docker
│   └── Dockerfile          # multi-stage: build → nginx:alpine
├── docs/imgs/              # скриншоты приложения
├── docker-compose.yml
└── README.md
```

## 🔌 API бэкенда

| Метод | Путь                    | Описание                                       |
|-------|-------------------------|------------------------------------------------|
| GET   | `/api/health`           | Проверка работоспособности                     |
| GET   | `/api/books/search?q=…` | Поиск книг через Open Library API              |
| GET   | `/api/books/favorites`  | Список книг в избранном                        |
| POST  | `/api/books/favorites`  | Добавить книгу в избранное (в памяти)          |

Интерактивная документация Swagger доступна на `http://localhost:8000/docs`.

## 🚀 Запуск

### Вариант 1. Через Docker (рекомендуется)

```bash
docker compose up --build
```

После сборки откройте **http://localhost** в браузере. Nginx раздаёт собранный
Vue-фронт и проксирует запросы `/api/...` на бэкенд-контейнер.

Остановка:
```bash
docker compose down
```
![Скриншот приложения](docs/imgs/dockercompose1.jpg)
![Скриншот приложения](docs/imgs/dockerDesktop.jpg)

### Вариант 2. Локально (для разработки)

**Бэкенд** (терминал 1):
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Фронтенд** (терминал 2):
```bash
cd frontend
npm install
npm run dev
```

Откройте **http://localhost:3000**. Vite-сервер сам проксирует `/api/...` на
`localhost:8000` (см. `vite.config.js`).

### Production-сборка фронта

```bash
cd frontend
npm run build      # результат в dist/
npm run preview    # быстрая проверка собранной версии
```

## 🧪 Как пользоваться

1. Введите название книги или автора в строке поиска (например, `гарри`).
2. В сетке отобразятся карточки книг с обложками, автором и годом издания.
3. Кнопка **★ В избранное** на карточке отправляет POST-запрос на бэкенд.
4. Вкладка **Избранное** показывает сохранённые книги (GET с бэкенда).

## 📝 Заметки

- Избранное хранится в памяти процесса бэкенда (`favorites_store`). При
  перезапуске контейнера сбрасывается. Для прода нужна БД (PostgreSQL/SQLite).
- Бэкенд не кэширует ответы Open Library — каждый запрос идёт во внешний API.
- CORS на бэкенде настроен на `localhost:3000` / `localhost:80` для разработки.

## 📚 Источники

- [Open Library Developers](https://openlibrary.org/developers/api)
- [Vite](https://vitejs.dev/)
- [Vue 3](https://vuejs.org/)
- [FastAPI](https://fastapi.tiangolo.com/)