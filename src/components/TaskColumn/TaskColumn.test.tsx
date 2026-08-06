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
    const onMoveTask = vi.fn();
    render(<TaskColumn status={TaskStatus.BACKLOG} tasks={[task]} onEdit={vi.fn()} onDelete={vi.fn()} onMoveTask={onMoveTask} />);

    fireEvent.drop(getColumn()!, {
      dataTransfer: {
        getData: (key: string) => key === 'application/task-id' ? task.id : TaskStatus.BACKLOG,
      },
    });

    expect(onMoveTask).not.toHaveBeenCalled();
  });

  it('requests a move when dropping a task into a different status column', () => {
    const onMoveTask = vi.fn();
    render(<TaskColumn status={TaskStatus.BACKLOG} tasks={[task, todoTask]} onEdit={vi.fn()} onDelete={vi.fn()} onMoveTask={onMoveTask} />);

    fireEvent.drop(getColumn()!, {
      dataTransfer: {
        getData: (key: string) => key === 'application/task-id' ? todoTask.id : TaskStatus.TODO,
      },
    });

    expect(onMoveTask).toHaveBeenCalledWith(todoTask.id, TaskStatus.BACKLOG, 2);
  });

  it('requests a position update when dropping a same-column task on the column background', () => {
    const onMoveTask = vi.fn();
    render(<TaskColumn status={TaskStatus.BACKLOG} tasks={[task, secondTask]} onEdit={vi.fn()} onDelete={vi.fn()} onMoveTask={onMoveTask} />);

    fireEvent.drop(getColumn()!, {
      dataTransfer: {
        getData: (key: string) => key === 'application/task-id' ? task.id : TaskStatus.BACKLOG,
      },
    });

    expect(onMoveTask).toHaveBeenCalledWith(task.id, TaskStatus.BACKLOG, 3);
  });

  it('requests a position update when dropping a task before another task in the same column', () => {
    const onMoveTask = vi.fn();
    render(<TaskColumn status={TaskStatus.BACKLOG} tasks={[task, secondTask]} onEdit={vi.fn()} onDelete={vi.fn()} onMoveTask={onMoveTask} />);

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
        getData: (key: string) => key === 'application/task-id' ? secondTask.id : TaskStatus.BACKLOG,
      },
    });

    expect(onMoveTask).toHaveBeenCalledWith(secondTask.id, TaskStatus.BACKLOG, 0.5);
  });

  it('uses an intermediate position when dropping between two tasks', () => {
    const onMoveTask = vi.fn();
    render(<TaskColumn status={TaskStatus.BACKLOG} tasks={[task, secondTask, thirdTask]} onEdit={vi.fn()} onDelete={vi.fn()} onMoveTask={onMoveTask} />);

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
        getData: (key: string) => key === 'application/task-id' ? thirdTask.id : TaskStatus.BACKLOG,
      },
    });

    expect(onMoveTask).toHaveBeenCalledWith(thirdTask.id, TaskStatus.BACKLOG, 1.5);
  });

  it('shows an insertion indicator while dragging over a target card', () => {
    render(<TaskColumn status={TaskStatus.BACKLOG} tasks={[task, secondTask]} onEdit={vi.fn()} onDelete={vi.fn()} onMoveTask={vi.fn()} />);

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
        getData: (key: string) => key === 'application/task-id' ? secondTask.id : TaskStatus.BACKLOG,
      },
    });

    expect(targetCard).toHaveClass('task-card--drop-before');
  });
});
