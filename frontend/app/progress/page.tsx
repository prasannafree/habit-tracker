/**
 * Progress page (/progress) — monthly calendar heatmap and date analytics.
 *
 * Core features:
 * - Monthly calendar with color-coded progress
 * - Click a date to see detailed analytics
 * - Monthly summary statistics
 *
 * Uses useEffect to defer Date reads to avoid Next.js 16 prerender errors.
 */

'use client';

import { useState, useEffect } from 'react';
import MonthlyCalendar from '@/components/progress/MonthlyCalendar';
import DateAnalyticsPanel from '@/components/progress/DateAnalyticsPanel';
import MonthlySummaryCard from '@/components/progress/MonthlySummaryCard';
import { getLocalDateKey } from '@/lib/date-utils';

export default function ProgressPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(2000); // placeholder, set on mount
  const [viewMonth, setViewMonth] = useState(1); // placeholder, set on mount
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth() + 1);
    setSelectedDate(getLocalDateKey(now));
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a lightweight placeholder to avoid hydration mismatch
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Progress
        </h1>
        <div className="h-96 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Progress
      </h1>

      <div className="space-y-6">
        <MonthlySummaryCard year={viewYear} month={viewMonth} />
        <MonthlyCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        {selectedDate && <DateAnalyticsPanel dateKey={selectedDate} />}
      </div>
    </div>
  );
}
