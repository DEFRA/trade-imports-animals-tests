import type { DateInput, DateTimeInput } from '@domain/shared/types/date-time-input';

/**
 * Date utility functions for test automation
 */

export type RelativeDateTimeOptions = {
  dayOffset?: number;
  monthOffset?: number;
  yearOffset?: number;
  hourOffset?: number;
  minuteOffset?: number;
  secondOffset?: number;
};

function toDateTimeInput(date: Date): DateTimeInput {
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: (date.getMonth() + 1).toString().padStart(2, '0'),
    year: date.getFullYear().toString(),
    hour: date.getHours().toString().padStart(2, '0'),
    minute: date.getMinutes().toString().padStart(2, '0'),
  };
}

function toDateInput(date: Date): DateInput {
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: (date.getMonth() + 1).toString().padStart(2, '0'),
    year: date.getFullYear().toString(),
  };
}

/**
 * Gets a Date relative to now with optional time offsets.
 * @param options.dayOffset - Number of days to offset (can be negative, default: 0)
 * @param options.monthOffset - Number of months to offset (can be negative, default: 0)
 * @param options.yearOffset - Number of years to offset (can be negative, default: 0)
 * @param options.hourOffset - Number of hours to offset (can be negative, default: 0)
 * @param options.minuteOffset - Number of minutes to offset (can be negative, default: 0)
 * @param options.secondOffset - Number of seconds to offset (can be negative, default: 0)
 * @returns Date object in local time
 */
export function getRelativeDateTime({
  dayOffset = 0,
  monthOffset = 0,
  yearOffset = 0,
  hourOffset = 0,
  minuteOffset = 0,
  secondOffset = 0,
}: RelativeDateTimeOptions = {}): Date {
  const date = new Date();
  date.setSeconds(date.getSeconds() + secondOffset);
  date.setMinutes(date.getMinutes() + minuteOffset);
  date.setHours(date.getHours() + hourOffset);
  date.setMonth(date.getMonth() + monthOffset);
  date.setFullYear(date.getFullYear() + yearOffset);
  date.setDate(date.getDate() + dayOffset);

  return date;
}

/**
 * Gets a date-time relative to now with optional time offsets
 * @param options.dayOffset - Number of days to offset (can be negative, default: 0)
 * @param options.hourOffset - Number of hours to offset (can be negative, default: 0)
 * @param options.minuteOffset - Number of minutes to offset (can be negative, default: 0)
 * @param options.secondOffset - Number of seconds to offset (can be negative, default: 0)
 * @returns Formatted date object with day, month, year, hour, and minute as strings
 */
export function getRelativeDateTimeInput(options: RelativeDateTimeOptions = {}): DateTimeInput {
  return toDateTimeInput(getRelativeDateTime(options));
}

/**
 * Gets a Date relative to now, normalized to 00:00 local time.
 * Time offsets are ignored by design.
 */
export function getRelativeDate({ dayOffset = 0, monthOffset = 0, yearOffset = 0 }: RelativeDateTimeOptions = {}): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setMonth(date.getMonth() + monthOffset);
  date.setFullYear(date.getFullYear() + yearOffset);
  date.setDate(date.getDate() + dayOffset);

  return date;
}

/**
 * Gets a date-only input relative to now.
 */
export function getRelativeDateInput(options: RelativeDateTimeOptions = {}): DateInput {
  return toDateInput(getRelativeDate(options));
}

/**
 * Formats a Date for display using en-GB locale and optional format options.
 */
export function toDisplayDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  },
): string {
  return new Intl.DateTimeFormat('en-GB', options).format(date);
}

/**
 * Converts a DateInput or DateTimeInput into a UTC Date.
 * Missing time parts default to 00:00.
 */
export function toUtcDate(input: DateInput | DateTimeInput): Date {
  const year = Number(input.year);
  // JS months are zero-indexed (0 = Jan).
  const month = Number(input.month) - 1;
  const day = Number(input.day);
  const hour = 'hour' in input ? Number(input.hour) : 0;
  const minute = 'minute' in input ? Number(input.minute) : 0;

  return new Date(Date.UTC(year, month, day, hour, minute, 0, 0));
}
