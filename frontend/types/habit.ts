/**
 * Core types for the Habit Tracker application.
 *
 * Design decisions:
 * - Stable string IDs (crypto.randomUUID) instead of array indices.
 * - Historical records snapshot habit name/target at tracking time,
 *   so editing or deleting a current habit never corrupts past analytics.
 * - Date keys use local YYYY-MM-DD format to align with the user's calendar day.
 * - Timer state separates accumulated elapsed time from session timestamps
 *   to handle browser tab inactivity accurately.
 */

// ── Habit definition ──────────────────────────────────────────────────

export interface Habit {
  id: string;
  name: string;
  description?: string;
  targetMinutes: number;
  createdAt: string; // ISO 8601
  isArchived: boolean;
}

// ── Completion status for a daily record ──────────────────────────────

export type CompletionStatus = 'not_started' | 'in_progress' | 'paused' | 'completed';

// ── Single habit's tracking record for one day ────────────────────────

export interface DailyHabitRecord {
  dateKey: string; // local YYYY-MM-DD
  habitId: string;
  habitNameSnapshot: string;
  targetMinutesSnapshot: number;
  elapsedMs: number; // total tracked milliseconds
  completionStatus: CompletionStatus;
  lastUpdatedAt: string; // ISO 8601
}

// ── Timer state ───────────────────────────────────────────────────────

export interface TimerState {
  /** ID of the habit whose timer is currently running, or null */
  runningHabitId: string | null;
  /** Accumulated elapsed milliseconds (time tracked before current session) */
  accumulatedElapsedMs: number;
  /** Timestamp when the current running session started, or null if paused/stopped */
  sessionStartedAt: number | null;
}

// ── Sort options ──────────────────────────────────────────────────────

export type SortOption =
  | 'duration-desc'
  | 'duration-asc'
  | 'progress-desc'
  | 'progress-asc'
  | 'name-asc'
  | 'name-desc';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'duration-desc', label: 'Duration: High to Low' },
  { value: 'duration-asc', label: 'Duration: Low to High' },
  { value: 'progress-desc', label: 'Progress: High to Low' },
  { value: 'progress-asc', label: 'Progress: Low to High' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
];
