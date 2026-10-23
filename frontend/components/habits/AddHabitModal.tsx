/**
 * AddHabitModal — modal dialog for adding a new habit.
 *
 * Validates inputs and prevents duplicate submissions.
 * Uses a <dialog> element for built-in accessibility.
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '@/components/AppProvider';
import { validateHabitName, validateTargetMinutes } from '@/lib/validation';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddHabitModal({ isOpen, onClose }: AddHabitModalProps) {
  const { addHabit } = useAppContext();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [name, setName] = useState('');
  const [targetMinutes, setTargetMinutes] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ name?: string; target?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setName('');
    setTargetMinutes('');
    setDescription('');
    setErrors({});
    setIsSaving(false);
    onClose();
  }, [onClose]);

  // Handle backdrop click to close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClick = (e: MouseEvent) => {
      if (e.target === dialog) {
        handleClose();
      }
    };

    dialog.addEventListener('click', handleClick);
    return () => dialog.removeEventListener('click', handleClick);
  }, [handleClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const nameResult = validateHabitName(name);
    const targetResult = validateTargetMinutes(targetMinutes);

    const newErrors: { name?: string; target?: string } = {};
    if (!nameResult.valid) newErrors.name = nameResult.error;
    if (!targetResult.valid) newErrors.target = targetResult.error;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    addHabit(name.trim(), parseInt(targetMinutes, 10), description || undefined);
    handleClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 m-auto w-full max-w-md p-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit} className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">
          Add New Habit
        </h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="habit-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Habit Name <span className="text-red-500">*</span>
            </label>
            <input
              id="habit-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g. Reading, Meditation"
              className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                errors.name
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Target duration */}
          <div>
            <label
              htmlFor="habit-target"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Target Duration (minutes) <span className="text-red-500">*</span>
            </label>
            <input
              id="habit-target"
              type="number"
              value={targetMinutes}
              onChange={(e) => {
                setTargetMinutes(e.target.value);
                if (errors.target) setErrors((prev) => ({ ...prev, target: undefined }));
              }}
              placeholder="e.g. 30"
              min="1"
              className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                errors.target
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.target && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.target}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="habit-desc"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Description (optional)
            </label>
            <textarea
              id="habit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a short description…"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
          >
            {isSaving ? 'Adding…' : 'Add Habit'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
