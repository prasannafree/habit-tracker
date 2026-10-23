/**
 * Validation utilities for habits and settings.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a habit name.
 */
export function validateHabitName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Habit name is required.' };
  }
  if (name.trim().length > 100) {
    return { valid: false, error: 'Habit name must be 100 characters or fewer.' };
  }
  return { valid: true };
}

/**
 * Validates a target duration in minutes.
 */
export function validateTargetMinutes(value: string | number): ValidationResult {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(num) || !isFinite(num)) {
    return { valid: false, error: 'Target duration must be a valid number.' };
  }
  if (!Number.isInteger(num)) {
    return { valid: false, error: 'Target duration must be a whole number.' };
  }
  if (num <= 0) {
    return { valid: false, error: 'Target duration must be a positive number.' };
  }
  if (num > 1440) {
    return { valid: false, error: 'Target duration cannot exceed 1440 minutes (24 hours).' };
  }
  return { valid: true };
}

/**
 * Validates a daily goal in minutes (optional field).
 */
export function validateDailyGoal(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { valid: true }; // optional
  }
  const num = parseInt(value, 10);
  if (isNaN(num) || !isFinite(num)) {
    return { valid: false, error: 'Daily goal must be a valid number.' };
  }
  if (!Number.isInteger(num) || num <= 0) {
    return { valid: false, error: 'Daily goal must be a positive whole number.' };
  }
  if (num > 1440) {
    return { valid: false, error: 'Daily goal cannot exceed 1440 minutes (24 hours).' };
  }
  return { valid: true };
}
