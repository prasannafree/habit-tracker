# Habit Tracker — Backend

This folder contains the standalone **FastAPI + SQLite** backend for the Habit Tracker application.

---

## 📁 File Structure

- [`main.py`](file:///home/prasanna/Documents/my_projects/habit%20tracker/backend/main.py) — FastAPI application entrypoint, CORS configuration, and REST API routes (`/api/sync`, `/api/habits`, `/api/records`, `/api/settings`, `/api/timer`).
- [`database.py`](file:///home/prasanna/Documents/my_projects/habit%20tracker/backend/database.py) — SQLite database connection, table schemas, queries, and WAL-mode configuration.
- [`models.py`](file:///home/prasanna/Documents/my_projects/habit%20tracker/backend/models.py) — Pydantic data schemas matching the frontend TypeScript models.
- [`test_backend.py`](file:///home/prasanna/Documents/my_projects/habit%20tracker/backend/test_backend.py) — Automated test suite verifying all endpoints and database operations.
- [`habit-tracker-backend.service`](file:///home/prasanna/Documents/my_projects/habit%20tracker/backend/habit-tracker-backend.service) — Systemd user service unit for running 24/7 in the background.
- `data/habit_tracker.db` — Persistent SQLite database file.

---

## ⚡ Service Control Commands (Start, Stop, Restart)

### 1. As 24/7 Background Service (`systemd`)

| Action | Command |
| :--- | :--- |
| **Start** | `systemctl --user start habit-tracker-backend.service` |
| **Stop** | `systemctl --user stop habit-tracker-backend.service` |
| **Restart** | `systemctl --user restart habit-tracker-backend.service` |
| **Status** | `systemctl --user status habit-tracker-backend.service` |
| **View Logs** | `journalctl --user -u habit-tracker-backend.service -f` |

### 2. Manual Running in Terminal (with Live Auto-Reload)
```bash
# Note: Stop background service first if running: systemctl --user stop habit-tracker-backend.service
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
# Press Ctrl + C to stop
```

---

## 🚀 Interactive API Documentation

When the backend is running, you can explore, test, and document all endpoints live in your browser:
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs) (or `http://10.72.18.118:8000/docs` from other devices on your Wi-Fi)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🛠️ How to Edit the Backend in the Future

### 1. Adding a new API endpoint
Open [`backend/main.py`](file:///home/prasanna/Documents/my_projects/habit%20tracker/backend/main.py) and define a new route:
```python
@app.get("/api/my-endpoint")
def my_endpoint():
    return {"message": "Hello from backend!"}
```

### 2. Changing or adding database columns/tables
1. Update SQL queries and table creation in [`backend/database.py`](file:///home/prasanna/Documents/my_projects/habit%20tracker/backend/database.py).
2. Update the Pydantic schema in [`backend/models.py`](file:///home/prasanna/Documents/my_projects/habit%20tracker/backend/models.py).

### 3. Applying changes to the background service
After editing any backend files, restart the service to apply changes:
```bash
systemctl --user restart habit-tracker-backend.service
```

---

## 🧪 Running Automated Tests

Run the test suite anytime after making edits:
```bash
uv run python -m unittest backend/test_backend.py
```
