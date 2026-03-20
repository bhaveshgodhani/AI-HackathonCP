# Call Intelligence Platform

AI-powered hackathon project for sales call recordings: upload audio, transcribe with **OpenAI Whisper**, analyze with **OpenAI chat completions** (JSON structured output), and explore insights on a React dashboard (WaveSurfer + Recharts).

## Architecture

| Layer | Technology |
| -------- | ------------ |
| Frontend | React (Vite), TailwindCSS, React Router, Axios, WaveSurfer.js, Recharts |
| Backend | FastAPI, SQLAlchemy, SQLite |
| Transcription | OpenAI Whisper API (`whisper-1`, verbose JSON) |
| Analysis | OpenAI Chat Completions API (JSON structured output) |

Flow:

1. User uploads audio via the UI → `POST /api/calls/upload` stores the file under `backend/uploads/` and creates a `Call` row (`status: uploaded`).
2. UI triggers `POST /api/analyze/{id}` which sets `transcribing` and runs a **background task**: Whisper → save transcript/duration → OpenAI analysis → save scores, keywords, questionnaire, etc. → `complete` (or `error` on failure).
3. The dashboard polls `GET /api/calls/{id}` while processing; static audio is served at `/uploads/{filename}`.

## Run with Docker (recommended)

Requires [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2.

```bash
cd call-intelligence
chmod +x setup.sh
./setup.sh
```

Open **http://localhost:8080** (override with `WEB_PORT=3000 ./setup.sh`). Put `OPENAI_API_KEY` in **`backend/.env`** (`./setup.sh` creates it from `backend/.env.example` if missing). The backend container loads that file via Compose `env_file`. Optional compose overrides (e.g. `WEB_PORT`) can still live in a `.env` next to `docker-compose.yaml`. Data (SQLite DB + uploads) persists in the `call_intel_data` volume.

Useful commands:

```bash
docker compose logs -f
docker compose down
```

After **frontend** code changes, the `web` container serves files baked into the image at build time. Clear caches and rebuild that image from the project root:

```bash
cd call-intelligence
./cacheclean.sh
```

Use `./cacheclean.sh --local-only` if you only want to wipe `frontend/dist` and Vite caches without Docker (e.g. before `npm run dev` / `npm run build` on the host).

**Shell into a running container** (from `call-intelligence`):

```bash
docker compose exec backend sh   # FastAPI / Python
docker compose exec web sh       # nginx + static files (no Node)
```

### SQLite database (DB Browser)

The **backend** image installs [DB Browser for SQLite](https://sqlitebrowser.org/) (`sqlitebrowser`) so the database can be opened from the same environment that stores it. In Docker, the SQLite file is **`/data/call_intelligence.db`** (volume `call_intel_data`).

**On your machine** (Ubuntu/Debian), install the GUI and copy the DB out of the container:

```bash
sudo apt update && sudo apt install sqlitebrowser
docker compose cp backend:/data/call_intelligence.db ./call_intelligence.db
sqlitebrowser ./call_intelligence.db
```

**Inside the running backend container** (needs a display — e.g. Linux with X11 forwarded to the host):

```bash
docker compose exec -e DISPLAY="$DISPLAY" backend sqlitebrowser /data/call_intelligence.db
```

On some setups you must mount the X11 socket (e.g. `-v /tmp/.X11-unix:/tmp/.X11-unix`) via an override file; copying the file to the host is the most reliable option.

## Prerequisites (local dev without Docker)

- Python 3.10+
- Node.js 18+
- `OPENAI_API_KEY` (used for Whisper transcription and call analysis)

Optional: set `OPENAI_MODEL` to override the analysis model (default: `gpt-4o-mini`).

## Backend setup

```bash
cd call-intelligence/backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Copy `.env` and add real keys:

```
OPENAI_API_KEY=sk-...
```

Run the API:

```bash
uvicorn main:app --reload
```

API base URL: `http://localhost:8000`

## Frontend setup

```bash
cd call-intelligence/frontend
npm install
```

Ensure `frontend/.env` contains:

```
VITE_API_BASE_URL=http://localhost:8000
```

Run the dev server:

```bash
npm run dev
```

Open `http://localhost:5173`.

## How to use

1. Start backend and frontend (two terminals).
2. On the dashboard, click **Upload New Call** and pick an `.mp3`, `.wav`, `.m4a`, or `.ogg` file.
3. Wait for **Uploading → Transcribing → Analyzing → Complete** (the modal polls every 3 seconds).
4. Use **View** to open the call detail page: waveform player, talk-time donut, performance bars, questionnaire, keywords, and action items.
5. **Delete** removes the DB row and the file on disk.

## API highlights

- `POST /api/calls/upload` — multipart file upload
- `GET /api/calls` — list all calls
- `GET /api/calls/{id}` — single call
- `DELETE /api/calls/{id}` — delete call + file
- `POST /api/analyze/{id}` — enqueue full pipeline (background)

## License

Hackathon / demo use.
