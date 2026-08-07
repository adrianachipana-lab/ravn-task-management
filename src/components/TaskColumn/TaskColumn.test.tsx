import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskColumn } from './TaskColumn';
import { TaskStatus, type Task } from '../../types/task';

const task: Task = {
  id: 'task-1',
  name: 'Build dashboard',
  status: TaskStatus.BACKLOG,
  dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
  pointEstimate: 'FOUR',
  tags: ['REACT'],
  assignee: null,
  position: 1,
  createdAt: new Date().toISOString(),
};

const secondTask: Task = {
  ...task,
  id: 'task-2',
  name: 'Fix filters',
  position: 2,
};

const thirdTask: Task = {
  ...task,
  id: 'task-4',
  name: 'Write docs',
  position: 3,
};

const todoTask: Task = {
  ...task,
  id: 'task-3',
  name: 'Review API',
  status: TaskStatus.TODO,
};

function getColumn() {
  return screen.getByRole('heading', { name: /backlog/i }).closest('section');
}

describe('TaskColumn drag and drop', () => {
  it('does not request a move when dropping a task into its current status column', () => {
    const onMoveTasks = vi.fn();
    render(
      <TaskColumn
        status={TaskStatus.BACKLOG}
        tasks={[task]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveTasks={onMoveTasks}
      />,
    );

    fireEvent.drop(getColumn()!, {
      dataTransfer: {
        getData: (key: string) => (key === 'application/task-id' ? task.id : ''),
      },
    });

    expect(onMoveTasks).not.toHaveBeenCalled();
  });

  it('requests a move when dropping a task into a different status column', () => {
    const onMoveTasks = vi.fn();
    render(
      <TaskColumn
        status={TaskStatus.BACKLOG}
        tasks={[task, todoTask]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveTasks={onMoveTasks}
      />,
    );

    fireEvent.drop(getColumn()!, {
      dataTransfer: {
        getData: (key: string) => (key === 'application/task-id' ? todoTask.id : ''),
      },
    });

    expect(onMoveTasks).toHaveBeenCalledWith(
      [{ id: todoTask.id, status: TaskStatus.BACKLOG, position: 2 }],
      todoTask.id,
    );
  });

  it('requests a position update when dropping a same-column task on the column background', () => {
    const onMoveTasks = vi.fn();
    render(
      <TaskColumn
        status={TaskStatus.BACKLOG}
        tasks={[task, secondTask]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveTasks={onMoveTasks}
      />,
    );

    fireEvent.drop(getColumn()!, {
      dataTransfer: {
        getData: (key: string) => (key === 'application/task-id' ? task.id : ''),
      },
    });

    expect(onMoveTasks).toHaveBeenCalledWith(
      [
        { id: secondTask.id, status: TaskStatus.BACKLOG, position: 1 },
        { id: task.id, status: TaskStatus.BACKLOG, position: 2 },
      ],
      task.id,
    );
  });

  it('requests a position update when dropping a task before another task in the same column', () => {
    const onMoveTasks = vi.fn();
    render(
      <TaskColumn
        status={TaskStatus.BACKLOG}
        tasks={[task, secondTask]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveTasks={onMoveTasks}
      />,
    );

    const targetCard = screen.getByText('Build dashboard').closest('article')!;
    targetCard.getBoundingClientRect = () => ({
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.drop(targetCard, {
      dataTransfer: {
        getData: (key: string) => (key === 'application/task-id' ? secondTask.id : ''),
      },
    });

    expect(onMoveTasks).toHaveBeenCalledWith(
      [
        { id: secondTask.id, status: TaskStatus.BACKLOG, position: 1 },
        { id: task.id, status: TaskStatus.BACKLOG, position: 2 },
      ],
      secondTask.id,
    );
  });

  it('renumbers affected tasks when dropping between two tasks', () => {
    const onMoveTasks = vi.fn();
    render(
      <TaskColumn
        status={TaskStatus.BACKLOG}
        tasks={[task, secondTask, thirdTask]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveTasks={onMoveTasks}
      />,
    );

    const targetCard = screen.getByText('Fix filters').closest('article')!;
    targetCard.getBoundingClientRect = () => ({
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.drop(targetCard, {
      dataTransfer: {
        getData: (key: string) => (key === 'application/task-id' ? thirdTask.id : ''),
      },
    });

    expect(onMoveTasks).toHaveBeenCalledWith(
      [
        { id: thirdTask.id, status: TaskStatus.BACKLOG, position: 2 },
        { id: secondTask.id, status: TaskStatus.BACKLOG, position: 3 },
      ],
      thirdTask.id,
    );
  });

  it('shows an insertion indicator while dragging over a target card', () => {
    render(
      <TaskColumn
        status={TaskStatus.BACKLOG}
        tasks={[task, secondTask]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMoveTasks={vi.fn()}
      />,
    );

    const targetCard = screen.getByText('Build dashboard').closest('article')!;
    targetCard.getBoundingClientRect = () => ({
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.dragOver(targetCard, {
      dataTransfer: {
        getData: (key: string) => (key === 'application/task-id' ? secondTask.id : ''),
      },
    });

    expect(targetCard).toHaveClass('task-card--drop-before');
  });
});
