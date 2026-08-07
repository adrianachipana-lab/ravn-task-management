import type { CreateTaskInput, Task, User } from '../types/task';
import { formatDateInputValue, formatFormDateLabel, getPointLabel } from './date';
import { getTagLabel } from './tags';

function formatTaskDate(dateString: string): string {
  return formatFormDateLabel(formatDateInputValue(dateString));
}

function formatTags(tags: Task['tags']): string {
  return tags.length > 0 ? tags.map(getTagLabel).join(', ') : 'No tags';
}

function getAssigneeName(assigneeId: string, users: User[]): string {
  return users.find((user) => user.id === assigneeId)?.fullName ?? 'Unassigned';
}

function areTagsEqual(previousTags: Task['tags'], nextTags: Task['tags']): boolean {
  if (previousTags.length !== nextTags.length) return false;
  return previousTags.every((tag, index) => tag === nextTags[index]);
}

export function buildTaskUpdateNotification(
  task: Task,
  input: CreateTaskInput,
  users: User[],
): string {
  const changes: string[] = [];

  if (task.name !== input.name) {
    changes.push(`name from "${task.name}" to "${input.name}"`);
  }

  const previousAssigneeId = task.assignee?.id ?? '';
  if (previousAssigneeId !== input.assigneeId) {
    const previousAssignee = task.assignee?.fullName ?? 'Unassigned';
    const nextAssignee = getAssigneeName(input.assigneeId, users);
    changes.push(`assignee from ${previousAssignee} to ${nextAssignee}`);
  }

  if (formatDateInputValue(task.dueDate) !== formatDateInputValue(input.dueDate)) {
    changes.push(
      `due date from ${formatTaskDate(task.dueDate)} to ${formatTaskDate(input.dueDate)}`,
    );
  }

  if (task.pointEstimate !== input.pointEstimate) {
    changes.push(
      `points from ${getPointLabel(task.pointEstimate)} to ${getPointLabel(input.pointEstimate)}`,
    );
  }

  if (!areTagsEqual(task.tags, input.tags)) {
    changes.push(`tags from ${formatTags(task.tags)} to ${formatTags(input.tags)}`);
  }

  if (changes.length === 0) {
    return `Task "${input.name}" was updated successfully`;
  }

  return `Task "${task.name}" updated ${changes.join('; ')} successfully`;
}
