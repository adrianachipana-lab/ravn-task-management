import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '../../types/task';
import { SortableTaskCard } from '../TaskCard/SortableTaskCard';
import { TASK_STATUS_LABELS } from '../../constants/taskOptions';

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  activeId?: string | null;
}

function byPosition(first: Task, second: Task) {
  return first.position - second.position;
}

export function TaskColumn({ status, tasks, onEdit, onDelete, activeId }: TaskColumnProps) {
  const columnTasks = tasks.reduce<Task[]>((matchingTasks, task) => {
    if (task.status === status) matchingTasks.push(task);
    return matchingTasks;
  }, []);
  columnTasks.sort(byPosition);

  const label = TASK_STATUS_LABELS[status] ?? status;
  const taskIds = columnTasks.map((t) => t.id);

  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}`, data: { status } });

  return (
    <section className={`task-column${isOver ? ' task-column--drag-over' : ''}`} ref={setNodeRef}>
      <div className="task-column__header">
        <h2 className="task-column__title">
          {label}{' '}
          <span className="task-column__count">
            ({String(columnTasks.length).padStart(2, '0')})
          </span>
        </h2>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="task-column__list">
          {columnTasks.length === 0 ? (
            <div className="task-column__empty">
              <p>No tasks</p>
            </div>
          ) : (
            columnTasks.map((task, index) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
                isDragOverlay={activeId === task.id}
              />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}
