/**
 * Habit-related utility functions.
 * Pure functions that derive values from habit data — no side effects.
 */

import type { Habit, DailyHabitRecord, SortOption } from '@/types/habit';

/**
 * Computes the credited minutes for a single habit record.
 * Credited = min(actualTrackedMinutes, targetMinutes).
 */
export function getCreditedMinutes(record: DailyHabitRecord): number {
  const actualMinutes = record.elapsedMs / 60000;
  return Math.min(actualMinutes, record.targetMinutesSnapshot);
}

/**
 * Computes daily progress percentage from a set of habit records.
 * dailyProgress = sum(credited) / sum(targets) * 100, clamped to [0, 100].
 * Returns 0 when there are no habits (avoids NaN / Infinity).
 */
export function computeDailyProgress(records: DailyHabitRecord[]): number {
  if (records.length === 0) return 0;
  const totalTarget = records.reduce((sum, r) => sum + r.targetMinutesSnapshot, 0);
  if (totalTarget === 0) return 0;
  const totalCredited = records.reduce((sum, r) => sum + getCreditedMinutes(r), 0);
  return Math.min(Math.max((totalCredited / totalTarget) * 100, 0), 100);
}

/**
 * Counts how many habits are completed for a set of daily records.
 */
export function countCompletedHabits(records: DailyHabitRecord[]): number {
  return records.filter((r) => r.completionStatus === 'completed').length;
}

/**
 * Returns the total tracked minutes for a set of records.
 */
export function totalTrackedMinutes(records: DailyHabitRecord[]): number {
  return records.reduce((sum, r) => sum + r.elapsedMs / 60000, 0);
}

/**
 * Returns the total target minutes for a set of records.
 */
export function totalTargetMinutesFromRecords(records: DailyHabitRecord[]): number {
  return records.reduce((sum, r) => sum + r.targetMinutesSnapshot, 0);
}

/**
 * Sorts habits by the given option.
 * Returns a new array — never mutates the original.
 * Progress is calculated using today's records.
 */
export function sortHabits(
  habits: Habit[],
  sortOption: SortOption,
  todayRecords: DailyHabitRecord[]
): Habit[] {
  const getProgress = (habitId: string): number => {
    const record = todayRecords.find((r) => r.habitId === habitId);
    if (!record) return 0;
    if (record.targetMinutesSnapshot === 0) return 0;
    return Math.min((record.elapsedMs / 60000 / record.targetMinutesSnapshot) * 100, 100);
  };

  const sorted = [...habits];
  sorted.sort((a, b) => {
    switch (sortOption) {
      case 'duration-desc':
        return b.targetMinutes - a.targetMinutes;
      case 'duration-asc':
        return a.targetMinutes - b.targetMinutes;
      case 'progress-desc':
        return getProgress(b.id) - getProgress(a.id);
      case 'progress-asc':
        return getProgress(a.id) - getProgress(b.id);
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });
  return sorted;
}

/**
 * Generates a stable unique ID.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
