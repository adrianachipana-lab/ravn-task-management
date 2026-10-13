import { describe, it, expect } from 'vitest';
import { formatDate, getDateColor, getPointLabel } from '../utils/date';
import { getTagLabel, getTagClassName } from '../utils/tags';
import { buildPositionUpdates } from '../utils/dragPositions';
import { TaskStatus, type Task } from '../types/task';

// Utility function tests (unchanged from original)

describe('date utilities', () => {
  it('formatDate returns a non-empty string', () => {
    const result = formatDate('2026-08-05T00:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('getDateColor returns "red" for past dates', () => {
    const pastDate = new Date(Date.now() - 86400000 * 5).toISOString();
    expect(getDateColor(pastDate)).toBe('red');
  });

  it('getDateColor returns "yellow" for dates within 2 days', () => {
    const soonDate = new Date(Date.now() + 86400000).toISOString();
    expect(getDateColor(soonDate)).toBe('yellow');
  });

  it('getDateColor returns "green" for dates more than 2 days away', () => {
    const futureDate = new Date(Date.now() + 86400000 * 10).toISOString();
    expect(getDateColor(futureDate)).toBe('green');
  });

  it('getPointLabel returns correct labels', () => {
    expect(getPointLabel('ZERO')).toBe('0 Points');
    expect(getPointLabel('FOUR')).toBe('4 Points');
    expect(getPointLabel('EIGHT')).toBe('8 Points');
  });

  it('getPointLabel returns raw value for unknown inputs', () => {
    expect(getPointLabel('UNKNOWN')).toBe('UNKNOWN');
  });
});

describe('tag utilities', () => {
  it('getTagLabel returns the display label for each tag', () => {
    expect(getTagLabel('REACT')).toBe('React');
    expect(getTagLabel('ANDROID')).toBe('Android');
    expect(getTagLabel('IOS')).toBe('IOS APP');
    expect(getTagLabel('NODE_JS')).toBe('Node.js');
    expect(getTagLabel('RAILS')).toBe('Rails');
  });

  it('getTagClassName returns a CSS-safe class suffix', () => {
    expect(getTagClassName('REACT')).toBe('react');
    expect(getTagClassName('NODE_JS')).toBe('nodejs');
    expect(getTagClassName('ANDROID')).toBe('android');
  });
});

// Drag queue behavior tests via buildPositionUpdates (pure function)

const base: Task = {
  id: 'task-1',
  name: 'Build dashboard',
  status: TaskStatus.BACKLOG,
  dueDate: '2026-12-01T00:00:00Z',
  pointEstimate: 'FOUR',
  tags: ['REACT'],
  assignee: null,
  position: 1,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('drag position calculations', () => {
  it('produces no updates when task stays in place', () => {
    const updates = buildPositionUpdates([base], 'task-1', TaskStatus.BACKLOG, null);
    expect(updates).toEqual([]);
  });

  it('handles cross-column move correctly', () => {
    const todoTask: Task = { ...base, id: 'todo-1', status: TaskStatus.TODO };
    const updates = buildPositionUpdates(
      [base, todoTask],
      'todo-1',
      TaskStatus.BACKLOG,
      null,
    );
    expect(updates).toEqual([
      { id: 'todo-1', status: TaskStatus.BACKLOG, position: 2 },
    ]);
  });

  it('renumbers all affected tasks on reorder', () => {
    const a: Task = { ...base, id: 'a', position: 1 };
    const b: Task = { ...base, id: 'b', position: 2 };
    const c: Task = { ...base, id: 'c', position: 3 };
    const updates = buildPositionUpdates([a, b, c], 'c', TaskStatus.BACKLOG, 'a');
    // c moves before a: c=1, a=2, b=3
    expect(updates).toEqual([
      { id: 'c', status: TaskStatus.BACKLOG, position: 1 },
      { id: 'a', status: TaskStatus.BACKLOG, position: 2 },
      { id: 'b', status: TaskStatus.BACKLOG, position: 3 },
    ]);
  });
});
