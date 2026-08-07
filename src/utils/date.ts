import { TASK_POINT_LABELS } from '../constants/taskOptions';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDayDifference(dateString: string): number {
  const today = startOfDay(new Date());
  const target = startOfDay(new Date(dateString));
  return Math.round((target.getTime() - today.getTime()) / DAY_IN_MS);
}

function formatLongDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDate(dateString: string): string {
  const diffDays = getDayDifference(dateString);

  if (diffDays === 0) return 'TODAY';
  if (diffDays === -1) return 'YESTERDAY';

  return formatLongDate(dateString).toUpperCase();
}

export function formatListDate(dateString: string): string {
  const diffDays = getDayDifference(dateString);

  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';

  return formatLongDate(dateString);
}

export function formatDateInputValue(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatFormDateLabel(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export type DateColor = 'green' | 'yellow' | 'red' | 'default';

export function getDateColor(dateString: string): DateColor {
  const diffDays = getDayDifference(dateString);

  if (diffDays < 0) return 'red';
  if (diffDays === 0) return 'default';
  if (diffDays <= 2) return 'yellow';
  return 'green';
}

export function getListDateClassName(dateColor: DateColor): string {
  if (dateColor === 'red') return 'task-table__col-date--red';
  if (dateColor === 'yellow') return 'task-table__col-date--yellow';
  if (dateColor === 'green') return 'task-table__col-date--green';
  return '';
}

export function getPointLabel(pointEstimate: string): string {
  return TASK_POINT_LABELS[pointEstimate] ?? pointEstimate;
}
