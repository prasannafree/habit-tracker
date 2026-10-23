"""
Pydantic data models for Habit Tracker API.
These match the frontend TypeScript types in types/habit.ts and types/settings.ts.
"""

from typing import Optional, Dict
from pydantic import BaseModel, Field


class Habit(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    targetMinutes: int
    createdAt: str
    isArchived: bool = False


class HabitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    targetMinutes: int = Field(..., gt=0, le=1440)
    description: Optional[str] = None
    dateKey: Optional[str] = None


class DailyRecord(BaseModel):
    dateKey: str
    habitId: str
    habitNameSnapshot: str
    targetMinutesSnapshot: int
    elapsedMs: int = 0
    completionStatus: str = "not_started"
    lastUpdatedAt: str


class UserSettings(BaseModel):
    displayName: str = ""
    greetingName: Optional[str] = None
    dailyGoalMinutes: Optional[int] = Field(None, gt=0, le=1440)
    theme: str = "system"


class TimerData(BaseModel):
    runningHabitId: Optional[str] = None
    sessionStartedAt: Optional[int] = None
    accumulatedMs: Dict[str, int] = {}


class SyncResponse(BaseModel):
    habits: list[Habit]
    allRecords: list[DailyRecord]
    settings: UserSettings
    timerData: TimerData


class MigrationPayload(BaseModel):
    habits: Optional[list[Habit]] = None
    allRecords: Optional[list[DailyRecord]] = None
    settings: Optional[UserSettings] = None
