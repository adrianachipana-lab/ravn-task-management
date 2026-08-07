import { useContext } from 'react';
import { FilterContext } from '../context/filterContextValue';

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}
