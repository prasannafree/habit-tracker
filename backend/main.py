"""
FastAPI Backend for Habit Tracker.

Provides REST endpoints for:
- /api/sync: Live multi-device state synchronization and migration
- /api/habits: Habit CRUD operations
- /api/records: Daily tracking records
- /api/settings: User preferences
- /api/timer: Running timer state

Interactive API docs available at: /docs
"""

import uuid
from datetime import datetime, timezone
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    Habit,
    HabitCreate,
    DailyRecord,
    UserSettings,
    TimerData,
    SyncResponse,
    MigrationPayload,
)
from .database import (
    init_db,
    get_all_habits,
    insert_habit,
    delete_habit,
    get_all_records,
    upsert_record,
    get_user_settings,
    save_user_settings,
    get_timer_state,
    update_timer_state,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema on startup
    init_db()
    yield


app = FastAPI(
    title="Habit Tracker Backend",
    description="Cross-device persistence API for Habit Tracker",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS so frontend on any device/origin can communicate directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "habit-tracker-backend"}


# ── Full State Sync ─────────────────────────────────────────────────────

@app.get("/api/sync", response_model=SyncResponse)
def get_sync_state():
    """Returns the complete application state for real-time multi-device sync."""
    return SyncResponse(
        habits=get_all_habits(),
        allRecords=get_all_records(),
        settings=get_user_settings(),
        timerData=get_timer_state(),
    )


@app.post("/api/sync", response_model=SyncResponse)
def migrate_sync_state(payload: MigrationPayload):
    """
    Initial migration endpoint: if the server database has no habits yet,
    import the user's existing client records into SQLite.
    """
    current_habits = get_all_habits()
    if len(current_habits) == 0 and payload.habits:
        for habit in payload.habits:
            insert_habit(habit)
        if payload.allRecords:
            for rec in payload.allRecords:
                upsert_record(rec)
        if payload.settings:
            save_user_settings(payload.settings)

    return SyncResponse(
        habits=get_all_habits(),
        allRecords=get_all_records(),
        settings=get_user_settings(),
        timerData=get_timer_state(),
    )


# ── Habits CRUD ─────────────────────────────────────────────────────────

@app.get("/api/habits", response_model=list[Habit])
def list_habits():
    """Lists all active habits."""
    return get_all_habits()


@app.post("/api/habits")
def create_habit(data: HabitCreate):
    """Creates a new habit and initializes today's tracking record."""
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Habit name cannot be empty")
    if data.targetMinutes <= 0 or data.targetMinutes > 1440:
        raise HTTPException(
            status_code=400, detail="Target minutes must be between 1 and 1440"
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    new_habit = Habit(
        id=str(uuid.uuid4()),
        name=name,
        description=data.description.strip() if data.description else None,
        targetMinutes=data.targetMinutes,
        createdAt=now_iso,
        isArchived=False,
    )
    insert_habit(new_habit)

    initial_record = None
    if data.dateKey:
        initial_record = DailyRecord(
            dateKey=data.dateKey,
            habitId=new_habit.id,
            habitNameSnapshot=new_habit.name,
            targetMinutesSnapshot=new_habit.targetMinutes,
            elapsedMs=0,
            completionStatus="not_started",
            lastUpdatedAt=now_iso,
        )
        upsert_record(initial_record)

    return {"habit": new_habit, "record": initial_record}


@app.delete("/api/habits")
def remove_habit(id: str = Query(...), dateKey: Optional[str] = Query(None)):
    """Deletes a habit and removes its record for the current day."""
    delete_habit(id, dateKey)
    return {"success": True, "habitId": id}


# ── Daily Records ───────────────────────────────────────────────────────

@app.get("/api/records", response_model=list[DailyRecord])
def list_records(dateKey: Optional[str] = Query(None)):
    """Lists daily historical tracking records, optionally filtered by dateKey."""
    return get_all_records(dateKey)


@app.put("/api/records")
def save_record(record: DailyRecord):
    """Upserts a daily habit record."""
    upsert_record(record)
    return {"success": True, "record": record}


# ── Settings ────────────────────────────────────────────────────────────

@app.get("/api/settings", response_model=UserSettings)
def get_settings():
    """Gets user preferences."""
    return get_user_settings()


@app.put("/api/settings")
def update_settings(settings: UserSettings):
    """Updates user preferences."""
    save_user_settings(settings)
    return {"success": True, "settings": get_user_settings()}


# ── Timer State ─────────────────────────────────────────────────────────

@app.get("/api/timer", response_model=TimerData)
def get_timer():
    """Gets active running timer state for multi-device sync."""
    return get_timer_state()


@app.put("/api/timer")
def update_timer(timer: TimerData):
    """Updates active running timer state across devices."""
    update_timer_state(timer)
    return {"success": True, "timer": get_timer_state()}
