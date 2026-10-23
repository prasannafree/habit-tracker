/**
 * HabitList — orchestrates the habit card grid with sorting and add controls.
 */

'use client';

import { useState, useMemo } from 'react';
import { useAppContext } from '@/components/AppProvider';
import HabitCard from './HabitCard';
import SortControl from './SortControl';
import AddHabitModal from './AddHabitModal';
import { sortHabits } from '@/lib/habit-utils';
import type { SortOption } from '@/types/habit';

export default function HabitList() {
  const { habits, todayRecords } = useAppContext();
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [showAddModal, setShowAddModal] = useState(false);

  const sortedHabits = useMemo(
    () => sortHabits(habits, sortOption, todayRecords),
    [habits, sortOption, todayRecords]
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            My Habits
          </h2>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {habits.length} {habits.length === 1 ? 'habit' : 'habits'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {habits.length > 1 && (
            <SortControl value={sortOption} onChange={setSortOption} />
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
          >
            + Add Habit
          </button>
        </div>
      </div>

      {/* Habit cards */}
      {sortedHabits.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            No habits yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Add your first habit to start tracking your progress.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            + Add Habit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedHabits.map((habit) => {
            const record = todayRecords.find((r) => r.habitId === habit.id);
            return <HabitCard key={habit.id} habit={habit} record={record} />;
          })}
        </div>
      )}

      <AddHabitModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
