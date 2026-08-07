import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateInputValue,
  formatFormDateLabel,
  formatListDate,
  getDateColor,
  getListDateClassName,
  getPointLabel,
} from './date';

describe('formatDate', () => {
  it('formats a date string to readable format', () => {
    const result = formatDate('2026-07-20T00:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('getDateColor', () => {
  it('returns "red" for past dates', () => {
    const pastDate = new Date(Date.now() - 86400000 * 5).toISOString();
    expect(getDateColor(pastDate)).toBe('red');
  });

  it('returns "yellow" for dates within 2 days', () => {
    const soonDate = new Date(Date.now() + 86400000).toISOString();
    expect(getDateColor(soonDate)).toBe('yellow');
  });

  it('returns "green" for dates more than 2 days away', () => {
    const futureDate = new Date(Date.now() + 86400000 * 10).toISOString();
    expect(getDateColor(futureDate)).toBe('green');
  });
});

describe('date display helpers', () => {
  it('formats a date for list rows', () => {
    expect(formatListDate('2026-07-20T12:00:00Z')).toEqual(
      expect.stringMatching(/Today|Yesterday|July 20, 2026/),
    );
  });

  it('formats API dates for date inputs', () => {
    expect(formatDateInputValue('2026-07-20T12:00:00Z')).toBe('2026-07-20');
  });

  it('formats date input values for form chips', () => {
    expect(formatFormDateLabel('2026-07-20')).toBe('Jul 20, 2026');
  });

  it('returns list date BEM modifiers from date colors', () => {
    expect(getListDateClassName('red')).toBe('task-table__col-date--red');
    expect(getListDateClassName('yellow')).toBe('task-table__col-date--yellow');
    expect(getListDateClassName('green')).toBe('task-table__col-date--green');
    expect(getListDateClassName('default')).toBe('');
  });
});

describe('getPointLabel', () => {
  it('returns correct label for known values', () => {
    expect(getPointLabel('ZERO')).toBe('0 Points');
    expect(getPointLabel('ONE')).toBe('1 Point');
    expect(getPointLabel('FOUR')).toBe('4 Points');
    expect(getPointLabel('EIGHT')).toBe('8 Points');
  });

  it('returns the raw value for unknown inputs', () => {
    expect(getPointLabel('UNKNOWN')).toBe('UNKNOWN');
  });
});
