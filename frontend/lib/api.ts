/**
 * Client-side API functions for communicating with the backend.
 */

import type { Habit, DailyHabitRecord } from '@/types/habit';
import type { UserSettings } from '@/types/settings';
import type { TimerData } from '@/hooks/useHabitTimer';

export interface SyncResponse {
  habits: Habit[];
  allRecords: DailyHabitRecord[];
  settings: UserSettings;
  timerData: TimerData;
}

export async function fetchSyncState(): Promise<SyncResponse> {
  const res = await fetch('/api/sync', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch sync state');
  return res.json();
}

export async function migrateLocalStorage(data: {
  habits?: Habit[];
  allRecords?: DailyHabitRecord[];
  settings?: UserSettings;
}): Promise<SyncResponse> {
  const res = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Migration failed');
  return res.json();
}

export async function apiAddHabit(
  name: string,
  targetMinutes: number,
  description?: string,
  dateKey?: string
): Promise<{ habit: Habit; record: DailyHabitRecord | null }> {
  const res = await fetch('/api/habits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, targetMinutes, description, dateKey }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create habit' }));
    throw new Error(err.error || 'Failed to create habit');
  }
  return res.json();
}

export async function apiDeleteHabit(habitId: string, dateKey?: string): Promise<void> {
  const url = `/api/habits?id=${encodeURIComponent(habitId)}${
    dateKey ? `&dateKey=${encodeURIComponent(dateKey)}` : ''
  }`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete habit');
}

export async function apiUpsertRecord(record: DailyHabitRecord): Promise<void> {
  const res = await fetch('/api/records', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error('Failed to update record');
}

export async function apiUpdateSettings(settings: UserSettings): Promise<UserSettings> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update settings' }));
    throw new Error(err.error || 'Failed to update settings');
  }
  const data = await res.json();
  return data.settings;
}

export async function apiUpdateTimer(timerData: TimerData): Promise<void> {
  const res = await fetch('/api/timer', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(timerData),
  });
  if (!res.ok) throw new Error('Failed to update timer state');
}
