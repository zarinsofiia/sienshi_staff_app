'use client';

import { ReactNode } from 'react';
import Button from '../button/Button';
import Tooltip from '../tooltip/Tooltip';
import { MoveLeft } from 'lucide-react';

export interface TableAction<T> {
  label?: string;
  icon?: React.ComponentType<any>;
  variant?: 'primary' | 'outline' | 'danger';
  iconPosition?: 'left' | 'right';
  tooltip?: string;
  onClick?: (item: T) => void;
  showIf?: (item: T) => boolean;
}

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  position?: 'left' | 'middle' | 'right';
  /** 1–12: portion of 12-column grid */
  grid?: number;
  actions?: TableAction<T>[];
  filterComponent?: (value: string, onChange: (val: string) => void) => ReactNode;
  exactMatch?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  rowClassName?: (item: T, index: number) => string;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

const getAlignment = (pos?: 'left' | 'middle' | 'right') => {
  switch (pos) {
    case 'middle':
      return 'text-center';
    case 'right':
      return 'text-right';
    default:
      return 'text-left';
  }
};

export default function DataTable<T>({
  columns,
  data,
  emptyMessage = 'No records found.',
  rowClassName,
  currentPage = 1,
  pageSize = 5,
  onPageChange,
}: DataTableProps<T>) {
  // pagination
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(data.length / pageSize);

  const getWidth = (grid?: number) =>
    grid ? `${(grid / 12) * 100}%` : undefined;

  return (
    <div className="flex flex-col gap-2 text-[var(--text)]">
      <div className="overflow-x-auto bg-[var(--card-bg)] shadow-sm rounded-xl border border-[var(--border-color)]">
        <table className="min-w-full divide-y divide-[var(--border-color)]">
          <thead className="bg-[var(--form-header-bg)]">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{ width: getWidth(col.grid) }}
                  className={`px-4 py-3 text-left text-sm font-semibold text-[var(--text)] ${getAlignment(col.position)} ${col.headerClassName || ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border-color)]">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={`px-4 py-6 text-center text-[var(--text)]`}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => (
                <tr
                  key={idx}
                  className={`transition-colors
                              ${idx % 2 === 0 ? 'bg-[var(--card-bg)]' : 'bg-[var(--sidebar-bg)]'}
                              hover:bg-[var(--sidebar-hover-bg)]
                              ${rowClassName ? rowClassName(item, idx) : ''}`}
                  style={{ height: '50px' }}
                >
                  {columns.map((col, cIdx) => {
                    const cellContent = col.actions ? (
                      <div className="flex justify-end gap-2">
                        {col.actions.map((action, aIdx) =>
                          action.showIf && !action.showIf(item) ? null : (
                            <Button
                              key={aIdx}
                              variant={action.variant || 'outline'}
                              icon={action.icon}
                              iconPosition={action.iconPosition}
                              tooltip={action.tooltip}
                              onClick={() => action.onClick?.(item)}
                            >
                              {action.label}
                            </Button>
                          )
                        )}
                      </div>
                    ) : col.render ? (
                      col.render(item)
                    ) : (
                      (item as any)[col.key]
                    );

                    return (
                      <td
                        key={cIdx}
                        style={{ width: getWidth(col.grid), maxWidth: getWidth(col.grid), height: '60px', color: 'var(--card-text)' }}
                        className={`px-4 py-3 text-sm ${getAlignment(col.position)} ${col.className || ''}`}
                      >
                        {typeof cellContent === 'string' ? (
                          <Tooltip content={cellContent}>{cellContent}</Tooltip>
                        ) : (
                          cellContent
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}

            {/* Fill empty rows for consistent height */}
            {paginatedData.length < pageSize &&
              Array.from({ length: pageSize - paginatedData.length }).map((_, idx) => (
                <tr
                  key={`empty-${idx}`}
                  className={`${(paginatedData.length + idx) % 2 === 0 ? 'bg-[var(--card-bg)]' : 'bg-[var(--sidebar-bg)]'}`}
                  style={{ height: '60px' }}
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} style={{ width: getWidth(col.grid) }} className={`px-4 py-3 text-sm ${col.className || ''}`}>
                      &nbsp;
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center px-4 py-3 bg-[var(--form-header-bg)]
                        border-t border-[var(--border-color)] text-sm text-[var(--text)]
                        rounded-xl">
          <div className="flex-1 flex justify-start">
            <button
              disabled={currentPage === 1}
              onClick={() => onPageChange?.(currentPage - 1)}
              className="px-3 py-1 rounded border border-[var(--border-color)]
                         bg-[var(--button-bg)] text-[var(--button-text)]
                         hover:opacity-90 disabled:opacity-50"
            >
              Previous
            </button>
          </div>

          <div className="flex-1 flex justify-center">
            Page {currentPage} of {totalPages}
          </div>

          <div className="flex-1 flex justify-end">
            <button
              disabled={currentPage === totalPages}
              onClick={() => onPageChange?.(currentPage + 1)}
              className="px-3 py-1 rounded border border-[var(--border-color)]
                         bg-[var(--button-bg)] text-[var(--button-text)]
                         hover:opacity-90 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}