/**
 * Habit Tracker page (/) — the main dashboard.
 *
 * Composed of DailyOverview (stats) and HabitList (cards + sorting + add).
 * This is a client component because it consumes context for habits and timer state.
 */

'use client';

import DailyOverview from '@/components/habits/DailyOverview';
import HabitList from '@/components/habits/HabitList';

export default function HabitTrackerPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <DailyOverview />
        <HabitList />
      </div>
    </div>
  );
}
