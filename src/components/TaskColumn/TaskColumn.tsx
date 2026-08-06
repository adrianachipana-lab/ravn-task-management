import { useState } from 'react';
import type { Task } from '../../types/task';
import { TaskStatus } from '../../types/task';
import { TaskCard } from '../TaskCard';

type DropPlacement = 'before' | 'after';

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMoveTask?: (taskId: string, newStatus: TaskStatus, newPosition?: number) => void;
}

// Human-readable labels for each status column header
const STATUS_LABELS: Record<string, string> = {
  [TaskStatus.BACKLOG]: 'Backlog',
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.DONE]: 'Done',
  [TaskStatus.CANCELLED]: 'Cancelled',
};

// Pure function: no state needed, so it lives outside the component to avoid re-creation
function handleDragOver(e: React.DragEvent) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function byPosition(first: Task, second: Task) {
  return first.position - second.position;
}

// A single Kanban column that filters and renders tasks matching its status
// Supports drag-and-drop: cards can be dragged between columns to change status
export function TaskColumn({ status, tasks, onEdit, onDelete, onMoveTask }: TaskColumnProps) {
  const columnTasks = tasks.filter((task) => task.status === status).sort(byPosition);
  const label = STATUS_LABELS[status] ?? status;
  const [dragOver, setDragOver] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ taskId: string; placement: DropPlacement } | null>(null);

  const getPositionAtEnd = (draggedTaskId?: string) => {
    const nextOrder = draggedTaskId ? columnTasks.filter((task) => task.id !== draggedTaskId) : columnTasks;
    const lastTask = nextOrder.at(-1);
    return lastTask ? lastTask.position + 1 : 1;
  };

  const getPositionAroundTask = (draggedTaskId: string, targetTask: Task, placement: DropPlacement) => {
    const nextOrder = columnTasks.filter((task) => task.id !== draggedTaskId);
    const targetIndex = nextOrder.findIndex((task) => task.id === targetTask.id);
    if (targetIndex === -1) return getPositionAtEnd();

    const insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
    const previousTask = nextOrder[insertIndex - 1];
    const nextTask = nextOrder[insertIndex];

    if (!previousTask && !nextTask) return targetTask.position;
    if (!previousTask) return nextTask.position === 0 ? 0.5 : nextTask.position / 2;
    if (!nextTask) return previousTask.position + 1;
    if (previousTask.position === nextTask.position) return previousTask.position + 0.5;
    return (previousTask.position + nextTask.position) / 2;
  };

  // Highlight the column when a card is dragged over it
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOver(false);
    setDropTarget(null);
  };

  const getPlacementFromPointer = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return e.clientY > rect.top + rect.height / 2 ? 'after' : 'before';
  };

  const handleCardDragOver = (e: React.DragEvent, targetTask: Task) => {
    const draggedTaskId = e.dataTransfer.getData('application/task-id');
    if (!draggedTaskId || draggedTaskId === targetTask.id) {
      setDropTarget(null);
      return;
    }

    setDragOver(true);
    setDropTarget({ taskId: targetTask.id, placement: getPlacementFromPointer(e) });
  };

  const handleCardDrop = (e: React.DragEvent, targetTask: Task) => {
    const draggedTaskId = e.dataTransfer.getData('application/task-id');
    setDragOver(false);
    setDropTarget(null);
    if (!draggedTaskId || draggedTaskId === targetTask.id || !onMoveTask) return;

    const placement = getPlacementFromPointer(e);
    const newPosition = getPositionAroundTask(draggedTaskId, targetTask, placement);
    const draggedTask = tasks.find((task) => task.id === draggedTaskId);

    if (draggedTask?.status === status && draggedTask.position === newPosition) return;
    onMoveTask(draggedTaskId, status, newPosition);
  };

  // Handle the drop on column background: move the task to the end of a different column
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setDropTarget(null);
    const taskId = e.dataTransfer.getData('application/task-id');
    const sourceStatus = e.dataTransfer.getData('application/task-status');
    if (taskId && onMoveTask) {
      const newPosition = getPositionAtEnd(taskId);
      const draggedTask = tasks.find((task) => task.id === taskId);
      if (sourceStatus === status && draggedTask?.position === newPosition) return;
      onMoveTask(taskId, status, newPosition);
    }
  };

  return (
    <section
      className={`task-column${dragOver ? ' task-column--drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="task-column__header">
        <h2 className="task-column__title">
          {label}{' '}
          <span className="task-column__count">({String(columnTasks.length).padStart(2, '0')})</span>
        </h2>
      </div>

      <div className="task-column__list">
        {columnTasks.length === 0 ? (
          <div className="task-column__empty"><p>No tasks</p></div>
        ) : (
          columnTasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
              onDropTask={handleCardDrop}
              onDragOverTask={handleCardDragOver}
              dropPlacement={dropTarget?.taskId === task.id ? dropTarget.placement : null}
            />
          ))
        )}
      </div>
    </section>
  );
}
