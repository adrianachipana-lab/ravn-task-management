import { describe, it, expect } from 'vitest';
import { buildPositionUpdates } from './dragPositions';
import { TaskStatus, type Task } from '../types/task';

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

const taskA: Task = { ...base, id: 'a', position: 1 };
const taskB: Task = { ...base, id: 'b', position: 2 };
const taskC: Task = { ...base, id: 'c', position: 3 };
const todoTask: Task = { ...base, id: 'd', name: 'Review API', status: TaskStatus.TODO, position: 1 };

describe('buildPositionUpdates', () => {
  it('returns empty when dropping a task back in its only position', () => {
    const updates = buildPositionUpdates([taskA], 'a', TaskStatus.BACKLOG, null);
    expect(updates).toEqual([]);
  });

  it('moves a task from another column to the end', () => {
    const updates = buildPositionUpdates(
      [taskA, todoTask],
      'd',
      TaskStatus.BACKLOG,
      null,
    );
    expect(updates).toEqual([{ id: 'd', status: TaskStatus.BACKLOG, position: 2 }]);
  });

  it('moves a task before another task in the same column', () => {
    const updates = buildPositionUpdates(
      [taskA, taskB],
      'b',
      TaskStatus.BACKLOG,
      'a',
    );
    expect(updates).toEqual([
      { id: 'b', status: TaskStatus.BACKLOG, position: 1 },
      { id: 'a', status: TaskStatus.BACKLOG, position: 2 },
    ]);
  });

  it('reorders when dropping a task between two others', () => {
    const updates = buildPositionUpdates(
      [taskA, taskB, taskC],
      'c',
      TaskStatus.BACKLOG,
      'b',
    );
    expect(updates).toEqual([
      { id: 'c', status: TaskStatus.BACKLOG, position: 2 },
      { id: 'b', status: TaskStatus.BACKLOG, position: 3 },
    ]);
  });

  it('returns empty for a nonexistent task', () => {
    const updates = buildPositionUpdates([taskA], 'nonexistent', TaskStatus.BACKLOG, null);
    expect(updates).toEqual([]);
  });

  it('inserts at end when overTaskId is not found in the column', () => {
    const updates = buildPositionUpdates(
      [taskA, todoTask],
      'd',
      TaskStatus.BACKLOG,
      'nonexistent',
    );
    expect(updates).toEqual([{ id: 'd', status: TaskStatus.BACKLOG, position: 2 }]);
  });

  it('moves a same-column task to the end when dropped on column background', () => {
    const updates = buildPositionUpdates(
      [taskA, taskB],
      'a',
      TaskStatus.BACKLOG,
      null,
    );
    expect(updates).toEqual([
      { id: 'b', status: TaskStatus.BACKLOG, position: 1 },
      { id: 'a', status: TaskStatus.BACKLOG, position: 2 },
    ]);
  });

  it('moves a task across columns and assigns correct positions', () => {
    const otherTask: Task = { ...base, id: 'e', status: TaskStatus.TODO, position: 2 };
    const updates = buildPositionUpdates(
      [taskA, todoTask, otherTask],
      'a',
      TaskStatus.TODO,
      'd',
    );
    // taskA inserted before todoTask (position 1), todoTask becomes 2, otherTask becomes 3
    expect(updates).toEqual([
      { id: 'a', status: TaskStatus.TODO, position: 1 },
      { id: 'd', status: TaskStatus.TODO, position: 2 },
      { id: 'e', status: TaskStatus.TODO, position: 3 },
    ]);
  });
});
