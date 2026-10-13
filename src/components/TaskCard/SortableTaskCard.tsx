import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../types/task';
import { TaskCard } from './TaskCard';

interface SortableTaskCardProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isDragOverlay?: boolean;
}

export function SortableTaskCard({
  task,
  index,
  onEdit,
  onDelete,
  isDragOverlay,
}: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isDragOverlay ? 0.4 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} index={index} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
