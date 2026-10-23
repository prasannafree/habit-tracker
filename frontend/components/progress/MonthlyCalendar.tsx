/**
 * MonthlyCalendar — calendar heatmap for the Progress page.
 *
 * Features:
 * - Month/year navigation with previous/next and "today" button
 * - Correct weekday alignment and days-in-month (including leap years)
 * - Color-coded progress heatmap
 * - Future dates visually distinct and non-selectable
 * - Keyboard-accessible day buttons
 * - Legend explaining the color scale
 */

'use client';

import { useState, useMemo } from 'react';
import { useAppContext } from '@/components/AppProvider';
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getMonthName,
  getLocalDateKey,
  isFutureDate,
} from '@/lib/date-utils';
import { getDateProgress } from '@/lib/analytics';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface MonthlyCalendarProps {
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
  year?: number;
  month?: number;
  onMonthChange?: (year: number, month: number) => void;
}

export default function MonthlyCalendar({
  selectedDate,
  onSelectDate,
  year,
  month,
  onMonthChange,
}: MonthlyCalendarProps) {
  const { allRecords } = useAppContext();
  const today = getLocalDateKey();

  const [internalYear, setInternalYear] = useState(() => new Date().getFullYear());
  const [internalMonth, setInternalMonth] = useState(() => new Date().getMonth() + 1);

  const viewYear = year ?? internalYear;
  const viewMonth = month ?? internalMonth;

  const updateYearMonth = (y: number, m: number) => {
    if (onMonthChange) {
      onMonthChange(y, m);
    } else {
      setInternalYear(y);
      setInternalMonth(m);
    }
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOffset = getFirstDayOfMonth(viewYear, viewMonth);

  const goToPreviousMonth = () => {
    if (viewMonth === 1) {
      updateYearMonth(viewYear - 1, 12);
    } else {
      updateYearMonth(viewYear, viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 12) {
      updateYearMonth(viewYear + 1, 1);
    } else {
      updateYearMonth(viewYear, viewMonth + 1);
    }
  };

  const goToToday = () => {
    const now = new Date();
    updateYearMonth(now.getFullYear(), now.getMonth() + 1);
    onSelectDate(getLocalDateKey(now));
  };

  // Build calendar cells
  const calendarCells = useMemo(() => {
    const cells: (null | { dateKey: string; day: number })[] = [];

    // Empty cells before the first day
    for (let i = 0; i < firstDayOffset; i++) {
      cells.push(null);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ dateKey, day });
    }

    return cells;
  }, [viewYear, viewMonth, daysInMonth, firstDayOffset]);

  // Get progress color for a date
  const getProgressColor = (dateKey: string): string => {
    if (isFutureDate(dateKey)) {
      return 'bg-gray-50 dark:bg-gray-900 text-gray-300 dark:text-gray-700';
    }

    const progress = getDateProgress(dateKey, allRecords);

    if (progress === null) {
      // No data for this date
      return 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800';
    }

    if (progress >= 100) {
      return 'bg-teal-500 dark:bg-teal-600 text-white hover:bg-teal-600 dark:hover:bg-teal-500';
    }
    if (progress >= 75) {
      return 'bg-teal-300 dark:bg-teal-700 text-teal-900 dark:text-teal-100 hover:bg-teal-400 dark:hover:bg-teal-600';
    }
    if (progress >= 50) {
      return 'bg-teal-200 dark:bg-teal-800 text-teal-800 dark:text-teal-200 hover:bg-teal-300 dark:hover:bg-teal-700';
    }
    if (progress > 0) {
      return 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-800';
    }

    // Has records but 0% progress
    return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700';
  };

  const isCurrentMonth =
    viewYear === new Date().getFullYear() && viewMonth === new Date().getMonth() + 1;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      {/* Month navigation header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          aria-label="Previous month"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {getMonthName(viewMonth)} {viewYear}
          </h2>
          {!isCurrentMonth && (
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-950 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          aria-label="Next month"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`${getMonthName(viewMonth)} ${viewYear} calendar`}>
        {calendarCells.map((cell, idx) => {
          if (cell === null) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const { dateKey, day } = cell;
          const future = isFutureDate(dateKey);
          const isSelected = selectedDate === dateKey;
          const isToday = dateKey === today;

          return (
            <button
              key={dateKey}
              onClick={() => !future && onSelectDate(dateKey)}
              disabled={future}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900 ${
                isSelected
                  ? 'ring-2 ring-teal-500 ring-offset-1 dark:ring-offset-gray-900'
                  : ''
              } ${
                isToday && !isSelected
                  ? 'ring-1 ring-gray-300 dark:ring-gray-600'
                  : ''
              } ${getProgressColor(dateKey)} ${
                future ? 'cursor-default' : 'cursor-pointer'
              }`}
              aria-label={`${getMonthName(viewMonth)} ${day}, ${viewYear}`}
              aria-selected={isSelected}
              role="gridcell"
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
        <span className="text-xs text-gray-500 dark:text-gray-400">Less</span>
        <div className="w-4 h-4 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700" title="No data" />
        <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800" title="0% progress" />
        <div className="w-4 h-4 rounded bg-teal-100 dark:bg-teal-900" title="1-49% progress" />
        <div className="w-4 h-4 rounded bg-teal-200 dark:bg-teal-800" title="50-74% progress" />
        <div className="w-4 h-4 rounded bg-teal-300 dark:bg-teal-700" title="75-99% progress" />
        <div className="w-4 h-4 rounded bg-teal-500 dark:bg-teal-600" title="100% progress" />
        <span className="text-xs text-gray-500 dark:text-gray-400">More</span>
      </div>
    </div>
  );
}
