import type { FilterInput } from '../types/task';

export function hasActiveFilters(filters: FilterInput): boolean {
  return Object.values(filters).some((value) =>
    Array.isArray(value) ? value.length > 0 : value !== undefined,
  );
}

export function hasAdvancedFilters(filters: FilterInput): boolean {
  return Boolean(
    filters.status ||
    (filters.tags && filters.tags.length > 0) ||
    filters.pointEstimate ||
    filters.assigneeId ||
    filters.dueDate,
  );
}
