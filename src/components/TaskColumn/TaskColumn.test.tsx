import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskColumn } from './TaskColumn';
import { TaskStatus, type Task } from '../../types/task';

// Mock @dnd-kit since jsdom can't measure DOM for drag operations
vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
}));
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: {},
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));
vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

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

describe('TaskColumn rendering', () => {
  it('renders column header with status and count', () => {
    render(
      <TaskColumn
        status={TaskStatus.BACKLOG}
        tasks={[task, secondTask]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText('(02)')).toBeInTheDocument();
  });

  it('shows empty message when no tasks match the status', () => {
    render(
      <TaskColumn
        status={TaskStatus.TODO}
        tasks={[task]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('No tasks')).toBeInTheDocument();
  });

  it('renders task cards sorted by position', () => {
    render(
      <TaskColumn
        status={TaskStatus.BACKLOG}
        tasks={[secondTask, task]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const titles = screen.getAllByRole('heading', { level: 3 });
    expect(titles[0]).toHaveTextContent('Build dashboard');
    expect(titles[1]).toHaveTextContent('Fix filters');
  });

  it('only renders tasks that match the column status', () => {
    const todoTask: Task = { ...task, id: 'task-3', name: 'Review API', status: TaskStatus.TODO };
    render(
      <TaskColumn
        status={TaskStatus.BACKLOG}
        tasks={[task, todoTask]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Build dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Review API')).not.toBeInTheDocument();
  });
});
