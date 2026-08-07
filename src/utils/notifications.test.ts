import { describe, expect, it } from 'vitest';
import { TaskStatus, type CreateTaskInput, type Task, type User } from '../types/task';
import { buildTaskUpdateNotification } from './notifications';

const users: User[] = [
  {
    id: 'user-1',
    avatar: '',
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    type: 'USER',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    avatar: '',
    fullName: 'Grace Hopper',
    email: 'grace@example.com',
    type: 'USER',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const task: Task = {
  id: 'task-1',
  name: 'pruebeishon',
  status: TaskStatus.TODO,
  dueDate: '2026-08-07T12:00:00Z',
  pointEstimate: 'ONE',
  tags: ['REACT'],
  assignee: users[0],
  position: 1,
  createdAt: '2026-01-01T00:00:00Z',
};

const input: CreateTaskInput = {
  name: 'pruebeishon ajio',
  status: TaskStatus.TODO,
  dueDate: '2026-08-09T12:00:00Z',
  pointEstimate: 'FOUR',
  tags: ['REACT', 'NODE_JS'],
  assigneeId: 'user-2',
};

describe('buildTaskUpdateNotification', () => {
  it('describes all changed editable fields', () => {
    expect(buildTaskUpdateNotification(task, input, users)).toContain(
      'Task "pruebeishon" updated name from "pruebeishon" to "pruebeishon ajio"',
    );
    expect(buildTaskUpdateNotification(task, input, users)).toContain(
      'assignee from Ada Lovelace to Grace Hopper',
    );
    expect(buildTaskUpdateNotification(task, input, users)).toContain(
      'points from 1 Point to 4 Points',
    );
    expect(buildTaskUpdateNotification(task, input, users)).toContain(
      'tags from React to React, Node.js',
    );
  });

  it('uses a generic update message when no editable fields changed', () => {
    const unchangedInput = {
      name: task.name,
      status: task.status,
      dueDate: task.dueDate,
      pointEstimate: task.pointEstimate,
      tags: task.tags,
      assigneeId: task.assignee?.id ?? '',
    };

    expect(buildTaskUpdateNotification(task, unchangedInput, users)).toBe(
      'Task "pruebeishon" was updated successfully',
    );
  });
});
