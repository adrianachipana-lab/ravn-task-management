import { useState, useCallback, useMemo, type ReactNode } from 'react';
import type { FilterInput } from '../types/task';
import { FilterContext } from './filterContextValue';

// Context that shares the active filter state across all pages
// Any component can read or update filters without prop drilling

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterInput>({});
  const clearFilters = useCallback(() => setFilters({}), []);

  // Memoize the context value so consumers only re-render when filters actually change
  const value = useMemo(() => ({ filters, setFilters, clearFilters }), [filters, clearFilters]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}
