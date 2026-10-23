# Habit Tracker (Full-Stack MVP)

A clean, responsive, and persistent Habit Tracker application designed for cross-device synchronization and learning software engineering principles.

---

## 🏗️ Architecture Overview

The repository is cleanly split into two distinct, independently editable directories:

```text
habit tracker/
├── backend/                  # Standalone Python (FastAPI + SQLite) backend
│   ├── main.py               # REST API endpoints & CORS
│   ├── database.py           # SQLite connection, schema, and WAL CRUD operations
│   ├── models.py             # Pydantic schemas (typed to match frontend)
│   ├── test_backend.py       # Automated unit & integration tests
│   ├── README.md             # Guide on editing and testing the backend
│   └── data/                 # SQLite database storage (habit_tracker.db)
│
├── frontend/                 # Standalone Next.js (React 19 + TypeScript + Tailwind) frontend
│   ├── app/                  # Next.js App Router pages (Tracker, Progress, Settings)
│   ├── components/           # UI components (modular, accessible)
│   ├── hooks/                # Custom React hooks (timers, habits, theme)
│   ├── lib/                  # Client-side API fetch client & calculations
│   └── next.config.ts        # Next.js config with reverse proxy to FastAPI (/api/*)
│
└── pyproject.toml            # Python environment & dependencies (managed via uv)
```

---

## 🌐 Network & Access

- **Frontend App:** [http://10.72.18.118:3000](http://10.72.18.118:3000) (open on phone, tablet, or laptop on your Wi-Fi)
- **Backend API Docs (Swagger):** [http://10.72.18.118:8000/docs](http://10.72.18.118:8000/docs)
- **Local Proxy:** Next.js automatically proxies all `/api/*` requests directly to FastAPI at `http://127.0.0.1:8000/api/*`.

---

## ⚡ Service Control Commands (Start, Stop, Restart)

Both the frontend and backend are configured as `systemd` user services to run continuously 24/7 in the background.

### Quick Reference Table

| Action | Both Services (Frontend + Backend) | Backend Only | Frontend Only |
| :--- | :--- | :--- | :--- |
| **Start** | `systemctl --user start habit-tracker.service habit-tracker-backend.service` | `systemctl --user start habit-tracker-backend.service` | `systemctl --user start habit-tracker.service` |
| **Stop** | `systemctl --user stop habit-tracker.service habit-tracker-backend.service` | `systemctl --user stop habit-tracker-backend.service` | `systemctl --user stop habit-tracker.service` |
| **Restart** | `systemctl --user restart habit-tracker.service habit-tracker-backend.service` | `systemctl --user restart habit-tracker-backend.service` | `systemctl --user restart habit-tracker.service` |
| **Status** | `systemctl --user status habit-tracker.service habit-tracker-backend.service` | `systemctl --user status habit-tracker-backend.service` | `systemctl --user status habit-tracker.service` |

---

### Detailed Commands

#### 1. Check Service Status
```bash
systemctl --user status habit-tracker.service habit-tracker-backend.service
```

#### 2. Start Services
```bash
# Start both services
systemctl --user start habit-tracker.service habit-tracker-backend.service

# Or start only the backend
systemctl --user start habit-tracker-backend.service

# Or start only the frontend
systemctl --user start habit-tracker.service
```

#### 3. Stop Services
```bash
# Stop both services
systemctl --user stop habit-tracker.service habit-tracker-backend.service

# Or stop only the backend
systemctl --user stop habit-tracker-backend.service

# Or stop only the frontend
systemctl --user stop habit-tracker.service
```

#### 4. Restart Services (e.g., after editing code)
```bash
# Restart both services
systemctl --user restart habit-tracker.service habit-tracker-backend.service

# Restart only backend (after editing backend/ files)
systemctl --user restart habit-tracker-backend.service

# Restart only frontend (after rebuilding frontend)
systemctl --user restart habit-tracker.service
```

#### 5. View Live Logs
```bash
# View live backend logs
journalctl --user -u habit-tracker-backend.service -f

# View live frontend logs
journalctl --user -u habit-tracker.service -f
```

---

## 💻 Manual Running in Terminal (for Development)

If you want to run either service interactively in your terminal with live code reloading:

> [!NOTE]
> If the background service is already running on port 8000 or 3000, stop the background service first before starting a manual instance (`systemctl --user stop habit-tracker-backend.service` or `systemctl --user stop habit-tracker.service`).

### Run Backend with Auto-Reload:
```bash
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
# Press Ctrl + C to stop
```

### Run Frontend in Dev Mode:
```bash
cd frontend
npm run dev
# Press Ctrl + C to stop
```

---

## 🧪 Running Tests

```bash
# Run backend test suite
uv run python -m unittest backend/test_backend.py

# Run frontend test suite
cd frontend && npm test
```
