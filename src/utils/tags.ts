import type { TaskTag } from '../types/task';
import { TASK_TAG_CLASS_NAMES, TASK_TAG_LABELS } from '../constants/taskOptions';

export function getTagLabel(tag: TaskTag): string {
  return TASK_TAG_LABELS[tag];
}

export function getTagClassName(tag: TaskTag): string {
  return TASK_TAG_CLASS_NAMES[tag];
}
