/**
 * Date utility functions.
 *
 * All date keys use the user's local timezone (YYYY-MM-DD).
 * This avoids the common bug where new Date().toISOString().slice(0, 10)
 * produces a UTC date that may differ from the user's local calendar date
 * (e.g. 11 PM IST on Oct 23 is Oct 23 locally but Oct 23 in UTC too,
 * but at midnight boundary this diverges).
 */

/**
 * Returns today's date as a local YYYY-MM-DD string.
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses a YYYY-MM-DD date key into year/month/day numbers.
 */
export function parseDateKey(dateKey: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateKey.split('-').map(Number);
  return { year: y, month: m, day: d };
}

/**
 * Returns the number of days in a given month (1-indexed month).
 * Handles leap years correctly.
 */
export function getDaysInMonth(year: number, month: number): number {
  // month is 1-indexed; Date constructor uses 0-indexed months.
  // Day 0 of the next month = last day of current month.
  return new Date(year, month, 0).getDate();
}

/**
 * Returns the weekday index (0=Sunday, 6=Saturday) of the first day of a month.
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

/**
 * Formats milliseconds into a human-readable string like "12m 35s" or "1h 05m".
 */
export function formatElapsedTime(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

/**
 * Formats minutes into a human-readable string like "45 min" or "1h 30m".
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Returns the month name for a 1-indexed month number.
 */
export function getMonthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' });
}

/**
 * Formats a YYYY-MM-DD date key into a readable date string.
 */
export function formatDateKey(dateKey: string): string {
  const { year, month, day } = parseDateKey(dateKey);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Returns true if the given date key represents a future date (after today).
 */
export function isFutureDate(dateKey: string): boolean {
  const today = getLocalDateKey();
  return dateKey > today;
}

/**
 * Returns true if two date key strings represent the same date.
 */
export function isSameDate(a: string, b: string): boolean {
  return a === b;
}
