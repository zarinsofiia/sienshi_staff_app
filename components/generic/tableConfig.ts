// /configs/tableConfig.ts
import { Plus } from 'lucide-react';
import { Column } from '@/components/table/DataTable';

export interface TableConfig<T> {
  pageSize: number;
  addButtonLabel: string;
  searchPlaceholder: string;
  icon: any;
  tableType: 'basic' | 'columnSearch';
}

export const defaultTableConfig: TableConfig<any> = {
  pageSize: 5,
  addButtonLabel: 'Add',
  searchPlaceholder: 'Search...',
  icon: Plus,
  tableType: 'basic', // default to normal table
};

// Utility for case-insensitive search
export const safeLower = (val: any) => (val ? String(val).toLowerCase() : '');
