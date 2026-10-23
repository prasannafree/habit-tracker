/**
 * Analytics utilities for the Progress page.
 * Derives monthly summaries and per-date analytics from historical records.
 */

import type { DailyHabitRecord } from '@/types/habit';
import {
  computeDailyProgress,
  countCompletedHabits,
  totalTrackedMinutes,
  totalTargetMinutesFromRecords,
} from './habit-utils';
import { getLocalDateKey, getDaysInMonth } from './date-utils';

// ── Per-date analytics ────────────────────────────────────────────────

export interface DateAnalytics {
  dateKey: string;
  records: DailyHabitRecord[];
  totalTrackedMin: number;
  totalTargetMin: number;
  progressPercent: number;
  completedCount: number;
  incompleteCount: number;
}

export function getDateAnalytics(
  dateKey: string,
  allRecords: DailyHabitRecord[]
): DateAnalytics {
  const records = allRecords.filter((r) => r.dateKey === dateKey);
  const totalTrackedMin = totalTrackedMinutes(records);
  const totalTargetMin = totalTargetMinutesFromRecords(records);
  const progressPercent = computeDailyProgress(records);
  const completedCount = countCompletedHabits(records);
  const incompleteCount = records.length - completedCount;

  return {
    dateKey,
    records,
    totalTrackedMin,
    totalTargetMin,
    progressPercent,
    completedCount,
    incompleteCount,
  };
}

// ── Monthly summary ───────────────────────────────────────────────────

export interface MonthlySummary {
  totalTrackedMin: number;
  daysWithActivity: number;
  avgDailyProgress: number;
  fullyCompletedDays: number;
}

export function getMonthlySummary(
  year: number,
  month: number,
  allRecords: DailyHabitRecord[]
): MonthlySummary {
  const daysInMonth = getDaysInMonth(year, month);
  const today = getLocalDateKey();

  let totalTrackedMin = 0;
  let daysWithActivity = 0;
  let totalProgressPercent = 0;
  let fullyCompletedDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Skip future dates — they should not count as zero-progress days
    if (dateKey > today) continue;

    const dayRecords = allRecords.filter((r) => r.dateKey === dateKey);

    // Only count days that have actual records
    if (dayRecords.length === 0) continue;

    const dayTracked = totalTrackedMinutes(dayRecords);
    const dayProgress = computeDailyProgress(dayRecords);

    totalTrackedMin += dayTracked;
    daysWithActivity++;
    totalProgressPercent += dayProgress;

    if (dayProgress >= 100) {
      fullyCompletedDays++;
    }
  }

  const avgDailyProgress = daysWithActivity > 0 ? totalProgressPercent / daysWithActivity : 0;

  return {
    totalTrackedMin,
    daysWithActivity,
    avgDailyProgress,
    fullyCompletedDays,
  };
}

/**
 * Returns progress percentage for a specific date from historical records.
 * Returns null if no data exists for that date (distinguishes "no data" from "0%").
 */
export function getDateProgress(
  dateKey: string,
  allRecords: DailyHabitRecord[]
): number | null {
  const records = allRecords.filter((r) => r.dateKey === dateKey);
  if (records.length === 0) return null;
  return computeDailyProgress(records);
}
