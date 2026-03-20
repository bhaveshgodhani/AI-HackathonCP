import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

load_dotenv()

from database import DATA_ROOT, init_db  # noqa: E402
from routers import analysis, calls  # noqa: E402

init_db()

app = FastAPI(title="Call Intelligence API")

_default_cors = "http://localhost:5173,http://localhost:8080,http://127.0.0.1:8080"
_cors = (os.getenv("CORS_ORIGINS") or "").strip() or _default_cors
allow_origins = [o.strip() for o in _cors.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = os.path.join(DATA_ROOT, "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount(
    "/uploads",
    StaticFiles(directory=uploads_dir),
    name="uploads",
)

app.include_router(calls.router)
app.include_router(analysis.router)
