import { useState } from 'react';
import type { Task, TaskStatus } from '../../types/task';
import { TaskCard } from '../TaskCard';
import { TASK_STATUS_LABELS } from '../../constants/taskOptions';

type DropPlacement = 'before' | 'after';
type TaskPositionUpdate = { id: string; status: TaskStatus; position: number };

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMoveTasks?: (updates: TaskPositionUpdate[], movedTaskId: string) => void;
}

function handleDragOver(e: React.DragEvent) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function byPosition(first: Task, second: Task) {
  return first.position - second.position;
}

function getPlacementFromPointer(e: React.DragEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  return e.clientY > rect.top + rect.height / 2 ? 'after' : 'before';
}

export function TaskColumn({ status, tasks, onEdit, onDelete, onMoveTasks }: TaskColumnProps) {
  const columnTasks = tasks.reduce<Task[]>((matchingTasks, task) => {
    if (task.status === status) matchingTasks.push(task);
    return matchingTasks;
  }, []);
  columnTasks.sort(byPosition);

  const label = TASK_STATUS_LABELS[status] ?? status;
  const [dragOver, setDragOver] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ taskId: string; placement: DropPlacement } | null>(
    null,
  );

  const getInsertIndex = (draggedTaskId: string, targetTask: Task, placement: DropPlacement) => {
    const nextOrder = columnTasks.filter((task) => task.id !== draggedTaskId);
    const targetIndex = nextOrder.findIndex((task) => task.id === targetTask.id);
    if (targetIndex === -1) return nextOrder.length;

    return placement === 'before' ? targetIndex : targetIndex + 1;
  };

  const buildPositionUpdates = (draggedTaskId: string, insertIndex: number) => {
    const draggedTask = tasks.find((task) => task.id === draggedTaskId);
    if (!draggedTask) return [];

    const nextOrder = columnTasks.filter((task) => task.id !== draggedTaskId);
    nextOrder.splice(insertIndex, 0, { ...draggedTask, status });

    const currentTasksById = new Map(tasks.map((task) => [task.id, task]));
    const updates: TaskPositionUpdate[] = [];

    nextOrder.forEach((task, index) => {
      const update = { id: task.id, status, position: index + 1 };
      const currentTask = currentTasksById.get(update.id);
      if (currentTask?.status !== update.status || currentTask.position !== update.position) {
        updates.push(update);
      }
    });

    return updates;
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOver(false);
    setDropTarget(null);
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
    if (!draggedTaskId || draggedTaskId === targetTask.id || !onMoveTasks) return;

    const placement = getPlacementFromPointer(e);
    const updates = buildPositionUpdates(
      draggedTaskId,
      getInsertIndex(draggedTaskId, targetTask, placement),
    );
    if (updates.length > 0) onMoveTasks(updates, draggedTaskId);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setDropTarget(null);
    const taskId = e.dataTransfer.getData('application/task-id');
    if (taskId && onMoveTasks) {
      const updates = buildPositionUpdates(
        taskId,
        columnTasks.filter((task) => task.id !== taskId).length,
      );
      if (updates.length > 0) onMoveTasks(updates, taskId);
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
          <span className="task-column__count">
            ({String(columnTasks.length).padStart(2, '0')})
          </span>
        </h2>
      </div>

      <div className="task-column__list">
        {columnTasks.length === 0 ? (
          <div className="task-column__empty">
            <p>No tasks</p>
          </div>
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
