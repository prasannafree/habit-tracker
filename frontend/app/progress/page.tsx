/**
 * Progress page (/progress) — monthly calendar heatmap and date analytics.
 *
 * Core features:
 * - Monthly calendar with color-coded progress
 * - Click a date to see detailed analytics
 * - Monthly summary statistics
 */

'use client';

import { useState } from 'react';
import MonthlyCalendar from '@/components/progress/MonthlyCalendar';
import DateAnalyticsPanel from '@/components/progress/DateAnalyticsPanel';
import MonthlySummaryCard from '@/components/progress/MonthlySummaryCard';
import { getLocalDateKey } from '@/lib/date-utils';
import { useIsMounted } from '@/hooks/useIsMounted';

function ProgressContent() {
  const [selectedDate, setSelectedDate] = useState<string | null>(() => getLocalDateKey());
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth() + 1);

  const handleMonthChange = (year: number, month: number) => {
    setViewYear(year);
    setViewMonth(month);
  };

  return (
    <div className="space-y-6">
      <MonthlySummaryCard year={viewYear} month={viewMonth} />
      <MonthlyCalendar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        year={viewYear}
        month={viewMonth}
        onMonthChange={handleMonthChange}
      />
      {selectedDate && <DateAnalyticsPanel dateKey={selectedDate} />}
    </div>
  );
}

export default function ProgressPage() {
  const isMounted = useIsMounted();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Progress
      </h1>

      {!isMounted ? (
        <div className="h-96 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse" />
      ) : (
        <ProgressContent />
      )}
    </div>
  );
}
