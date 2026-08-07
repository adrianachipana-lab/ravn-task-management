import { createContext } from 'react';
import type { FilterInput } from '../types/task';

export interface FilterContextValue {
  filters: FilterInput;
  setFilters: (filters: FilterInput) => void;
  clearFilters: () => void;
}

export const FilterContext = createContext<FilterContextValue | null>(null);
