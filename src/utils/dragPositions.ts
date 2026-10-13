import type { Task, TaskStatus, TaskPositionUpdate } from '../types/task';

function byPosition(a: Task, b: Task) {
  return a.position - b.position;
}

export function buildPositionUpdates(
  allTasks: Task[],
  draggedTaskId: string,
  targetStatus: TaskStatus,
  overTaskId: string | null,
): TaskPositionUpdate[] {
  const draggedTask = allTasks.find((t) => t.id === draggedTaskId);
  if (!draggedTask) return [];

  const columnTasks = allTasks
    .filter((t) => t.status === targetStatus && t.id !== draggedTaskId)
    .sort(byPosition);

  let insertIndex = columnTasks.length;
  if (overTaskId) {
    const overIdx = columnTasks.findIndex((t) => t.id === overTaskId);
    if (overIdx !== -1) insertIndex = overIdx;
  }

  const nextOrder = [...columnTasks];
  nextOrder.splice(insertIndex, 0, { ...draggedTask, status: targetStatus });

  const currentById = new Map(allTasks.map((t) => [t.id, t]));
  const updates: TaskPositionUpdate[] = [];
  nextOrder.forEach((task, index) => {
    const pos = index + 1;
    const current = currentById.get(task.id);
    if (current?.status !== targetStatus || current.position !== pos) {
      updates.push({ id: task.id, status: targetStatus, position: pos });
    }
  });

  return updates;
}
