import { describe, expect, it } from 'vitest';
import { hasActiveFilters, hasAdvancedFilters } from './filters';

describe('filter utilities', () => {
  it('detects any active filter', () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ name: 'api' })).toBe(true);
    expect(hasActiveFilters({ tags: [] })).toBe(false);
    expect(hasActiveFilters({ tags: ['REACT'] })).toBe(true);
  });

  it('detects advanced filters without counting search text', () => {
    expect(hasAdvancedFilters({ name: 'api' })).toBe(false);
    expect(hasAdvancedFilters({ status: 'DONE' })).toBe(true);
    expect(hasAdvancedFilters({ tags: ['REACT'] })).toBe(true);
  });
});
