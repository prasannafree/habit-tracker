/**
 * SortControl — dropdown for sorting the habit list.
 * Sorting only changes display order, never mutates the underlying array.
 */

'use client';

import type { SortOption } from '@/types/habit';
import { SORT_OPTIONS } from '@/types/habit';

interface SortControlProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export default function SortControl({ value, onChange }: SortControlProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="sort-habits"
        className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap"
      >
        Sort by
      </label>
      <select
        id="sort-habits"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors cursor-pointer"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
