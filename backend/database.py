"""
Database layer using SQLite.
Stores habits, daily records, user settings, and timer state with WAL mode.
"""

import sqlite3
import json
import os
from pathlib import Path
from typing import List, Optional
from .models import Habit, DailyRecord, UserSettings, TimerData

DB_DIR = Path(__file__).parent / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "habit_tracker.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db():
    conn = get_connection()
    with conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS habits (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                target_minutes INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                is_archived INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS daily_records (
                date_key TEXT NOT NULL,
                habit_id TEXT NOT NULL,
                habit_name_snapshot TEXT NOT NULL,
                target_minutes_snapshot INTEGER NOT NULL,
                elapsed_ms INTEGER NOT NULL DEFAULT 0,
                completion_status TEXT NOT NULL DEFAULT 'not_started',
                last_updated_at TEXT NOT NULL,
                PRIMARY KEY (date_key, habit_id)
            );

            CREATE TABLE IF NOT EXISTS settings (
                id TEXT PRIMARY KEY DEFAULT 'default',
                display_name TEXT NOT NULL DEFAULT '',
                greeting_name TEXT,
                daily_goal_minutes INTEGER,
                theme TEXT NOT NULL DEFAULT 'system'
            );

            CREATE TABLE IF NOT EXISTS timer_state (
                id TEXT PRIMARY KEY DEFAULT 'current',
                running_habit_id TEXT,
                session_started_at INTEGER,
                accumulated_ms TEXT NOT NULL DEFAULT '{}'
            );

            INSERT OR IGNORE INTO settings (id, display_name, greeting_name, daily_goal_minutes, theme)
            VALUES ('default', '', '', NULL, 'system');

            INSERT OR IGNORE INTO timer_state (id, running_habit_id, session_started_at, accumulated_ms)
            VALUES ('current', NULL, NULL, '{}');
        """)
    conn.close()


# ── Habits CRUD ─────────────────────────────────────────────────────────

def get_all_habits() -> List[Habit]:
    conn = get_connection()
    rows = conn.execute("""
        SELECT id, name, description, target_minutes, created_at, is_archived
        FROM habits
        WHERE is_archived = 0
        ORDER BY created_at ASC
    """).fetchall()
    conn.close()

    return [
        Habit(
            id=row["id"],
            name=row["name"],
            description=row["description"],
            targetMinutes=row["target_minutes"],
            createdAt=row["created_at"],
            isArchived=bool(row["is_archived"]),
        )
        for row in rows
    ]


def insert_habit(habit: Habit):
    conn = get_connection()
    with conn:
        conn.execute(
            """
            INSERT INTO habits (id, name, description, target_minutes, created_at, is_archived)
            VALUES (?, ?, ?, ?, ?, ?)
        """,
            (
                habit.id,
                habit.name,
                habit.description,
                habit.targetMinutes,
                habit.createdAt,
                1 if habit.isArchived else 0,
            ),
        )
    conn.close()


def delete_habit(habit_id: str, date_key: Optional[str] = None):
    conn = get_connection()
    with conn:
        conn.execute("DELETE FROM habits WHERE id = ?", (habit_id,))
        if date_key:
            conn.execute(
                "DELETE FROM daily_records WHERE date_key = ? AND habit_id = ?",
                (date_key, habit_id),
            )
        # Clear timer if running
        timer = get_timer_state()
        if timer.runningHabitId == habit_id:
            timer.runningHabitId = None
            timer.sessionStartedAt = None
            update_timer_state(timer)
    conn.close()


# ── Daily Records CRUD ──────────────────────────────────────────────────

def get_all_records(date_key: Optional[str] = None) -> List[DailyRecord]:
    conn = get_connection()
    if date_key:
        rows = conn.execute(
            """
            SELECT date_key, habit_id, habit_name_snapshot, target_minutes_snapshot, elapsed_ms, completion_status, last_updated_at
            FROM daily_records
            WHERE date_key = ?
            ORDER BY habit_name_snapshot ASC
        """,
            (date_key,),
        ).fetchall()
    else:
        rows = conn.execute("""
            SELECT date_key, habit_id, habit_name_snapshot, target_minutes_snapshot, elapsed_ms, completion_status, last_updated_at
            FROM daily_records
            ORDER BY date_key ASC
        """).fetchall()
    conn.close()

    return [
        DailyRecord(
            dateKey=row["date_key"],
            habitId=row["habit_id"],
            habitNameSnapshot=row["habit_name_snapshot"],
            targetMinutesSnapshot=row["target_minutes_snapshot"],
            elapsedMs=row["elapsed_ms"],
            completionStatus=row["completion_status"],
            lastUpdatedAt=row["last_updated_at"],
        )
        for row in rows
    ]


def upsert_record(record: DailyRecord):
    conn = get_connection()
    with conn:
        conn.execute(
            """
            INSERT INTO daily_records (date_key, habit_id, habit_name_snapshot, target_minutes_snapshot, elapsed_ms, completion_status, last_updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(date_key, habit_id) DO UPDATE SET
                habit_name_snapshot = excluded.habit_name_snapshot,
                target_minutes_snapshot = excluded.target_minutes_snapshot,
                elapsed_ms = excluded.elapsed_ms,
                completion_status = excluded.completion_status,
                last_updated_at = excluded.last_updated_at
        """,
            (
                record.dateKey,
                record.habitId,
                record.habitNameSnapshot,
                record.targetMinutesSnapshot,
                record.elapsedMs,
                record.completionStatus,
                record.lastUpdatedAt,
            ),
        )
    conn.close()


# ── Settings CRUD ───────────────────────────────────────────────────────

def get_user_settings() -> UserSettings:
    conn = get_connection()
    row = conn.execute("""
        SELECT display_name, greeting_name, daily_goal_minutes, theme
        FROM settings
        WHERE id = 'default'
    """).fetchone()
    conn.close()

    if not row:
        return UserSettings()

    return UserSettings(
        displayName=row["display_name"] or "",
        greetingName=row["greeting_name"],
        dailyGoalMinutes=row["daily_goal_minutes"],
        theme=row["theme"] or "system",
    )


def save_user_settings(settings: UserSettings):
    conn = get_connection()
    with conn:
        conn.execute(
            """
            INSERT INTO settings (id, display_name, greeting_name, daily_goal_minutes, theme)
            VALUES ('default', ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                display_name = excluded.display_name,
                greeting_name = excluded.greeting_name,
                daily_goal_minutes = excluded.daily_goal_minutes,
                theme = excluded.theme
        """,
            (
                settings.displayName,
                settings.greetingName,
                settings.dailyGoalMinutes,
                settings.theme,
            ),
        )
    conn.close()


# ── Timer State CRUD ────────────────────────────────────────────────────

def get_timer_state() -> TimerData:
    conn = get_connection()
    row = conn.execute("""
        SELECT running_habit_id, session_started_at, accumulated_ms
        FROM timer_state
        WHERE id = 'current'
    """).fetchone()
    conn.close()

    if not row:
        return TimerData()

    accumulated = {}
    try:
        accumulated = json.loads(row["accumulated_ms"] or "{}")
    except Exception:
        pass

    return TimerData(
        runningHabitId=row["running_habit_id"],
        sessionStartedAt=row["session_started_at"],
        accumulatedMs=accumulated,
    )


def update_timer_state(state: TimerData):
    conn = get_connection()
    with conn:
        conn.execute(
            """
            INSERT INTO timer_state (id, running_habit_id, session_started_at, accumulated_ms)
            VALUES ('current', ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                running_habit_id = excluded.running_habit_id,
                session_started_at = excluded.session_started_at,
                accumulated_ms = excluded.accumulated_ms
        """,
            (
                state.runningHabitId,
                state.sessionStartedAt,
                json.dumps(state.accumulatedMs),
            ),
        )
    conn.close()
