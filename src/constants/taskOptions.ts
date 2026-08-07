import { TaskStatus, TaskTag } from '../types/task';

export const TASK_STATUS_OPTIONS = [
  { value: TaskStatus.BACKLOG, label: 'Backlog' },
  { value: TaskStatus.TODO, label: 'To Do' },
  { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
  { value: TaskStatus.DONE, label: 'Done' },
  { value: TaskStatus.CANCELLED, label: 'Cancelled' },
] as const;

export const TASK_STATUS_VALUES = TASK_STATUS_OPTIONS.map((option) => option.value);

export const TASK_TAG_OPTIONS = [
  { value: TaskTag.REACT, label: 'React' },
  { value: TaskTag.ANDROID, label: 'Android' },
  { value: TaskTag.IOS, label: 'IOS APP' },
  { value: TaskTag.NODE_JS, label: 'Node.js' },
  { value: TaskTag.RAILS, label: 'Rails' },
] as const;

export const TASK_POINT_OPTIONS = [
  { value: 'ZERO', label: '0 Points' },
  { value: 'ONE', label: '1 Point' },
  { value: 'TWO', label: '2 Points' },
  { value: 'FOUR', label: '4 Points' },
  { value: 'EIGHT', label: '8 Points' },
] as const;

export const TASK_STATUS_LABELS = Object.fromEntries(
  TASK_STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<TaskStatus, string>;

export const TASK_TAG_LABELS = Object.fromEntries(
  TASK_TAG_OPTIONS.map((option) => [option.value, option.label]),
) as Record<TaskTag, string>;

export const TASK_TAG_CLASS_NAMES: Record<TaskTag, string> = {
  [TaskTag.ANDROID]: 'android',
  [TaskTag.IOS]: 'ios',
  [TaskTag.NODE_JS]: 'nodejs',
  [TaskTag.RAILS]: 'rails',
  [TaskTag.REACT]: 'react',
};

export const TASK_POINT_LABELS = Object.fromEntries(
  TASK_POINT_OPTIONS.map((option) => [option.value, option.label]),
) as Record<string, string>;
