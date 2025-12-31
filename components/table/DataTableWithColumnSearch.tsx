'use client';

import { ReactNode, useState, useMemo } from 'react';
import Button from '../button/Button';
import Tooltip from '../tooltip/Tooltip';

/* ---------- Types ---------- */

export interface TableAction<T> {
  label?: string;
  icon?: React.ComponentType<any>;
  variant?: 'primary' | 'outline' | 'danger';
  iconPosition?: 'left' | 'right';
  tooltip?: string;
  onClick?: (item: T) => void;
  showIf?: (item: T) => boolean;
}

/**
 * Column definition
 * K extends keyof T lets you pass keys of T for type-safety,
 * but you can still use arbitrary strings for virtual columns.
 */
export interface Column<T, K extends keyof T = keyof T> {
  key: K | string;
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
  /** enable sorting later if needed */
  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null;

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  rowClassName?: (item: T, index: number) => string;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  /** Optional key extractor for stable row keys */
  keyExtractor?: (item: T, index: number) => string | number;
}

/* ---------- Component ---------- */

export default function DataTable<T>({
  columns,
  data,
  emptyMessage = 'No records found.',
  rowClassName,
  currentPage = 1,
  pageSize = 5,
  onPageChange,
  keyExtractor,
}: DataTableProps<T>) {
  /** Track filters per column key */
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortState, setSortState] = useState<SortState>(null);

  const handleFilterChange = (key: string, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const toggleSort = (key: string) => {
    setSortState((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null; // third click clears sorting
    });
  };
  /* ---- Derived state ---- */

  const widths = useMemo(
    () => columns.map((c) => (c.grid ? `${(c.grid / 12) * 100}%` : undefined)),
    [columns]
  );

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

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const col = columns.find((c) => c.key === key);
        const raw = (item as any)[key];
        if (raw == null) return false;
        const str = String(raw);
        return col?.exactMatch
          ? str === value
          : str.toLowerCase().includes(value.trim().toLowerCase());
      })
    );
  }, [data, filters, columns]);

  const sortedData = useMemo(() => {
    if (!sortState) return filteredData;
    const col = columns.find((c) => c.key === sortState.key);
    if (!col) return filteredData;

    const compare =
      col.sortFn ??
      ((a: any, b: any) => {
        const av = a[sortState.key];
        const bv = b[sortState.key];
        // try numeric first
        const na = parseFloat(av);
        const nb = parseFloat(bv);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return String(av).localeCompare(String(bv));
      });

    const sorted = [...filteredData].sort(compare);
    return sortState.dir === 'asc' ? sorted : sorted.reverse();
  }, [filteredData, sortState, columns]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(sortedData.length / pageSize);

  /* ---- Render helpers ---- */

  const renderActions = (actions: TableAction<T>[], item: T) => (
    <div className="flex justify-end gap-2">
      {actions.map((action, aIdx) =>
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
  );

  /* ---------- JSX ---------- */

  return (
    <div className="flex flex-col gap-2 text-[var(--text)]">
      <div className="overflow-x-auto bg-[var(--card-bg)] shadow-sm rounded-xl border border-[var(--border-color)]">
        <table
          className="min-w-full divide-y divide-[var(--border-color)]"
          role="grid"
          aria-rowcount={filteredData.length}
        >
          {/* ----- Header ----- */}
          <thead className="bg-[var(--form-header-bg)]">
            <tr>
              {columns.map((col, idx) => {
                const isSorted =
                  sortState && sortState.key === col.key ? sortState.dir : null;
                return (
                  <th
                    key={idx}
                    style={{ width: widths[idx] }}
                    className={`px-4 py-3 text-sm font-semibold text-[var(--text)] ${getAlignment(col.position)}  ${
                      col.headerClassName || ''
                    } ${col.sortable ? 'cursor-pointer select-none' : ''}`}
                    onClick={() => col.sortable && toggleSort(col.key as string)}
                    scope="col"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        <span className="text-xs">
                          {isSorted === 'asc'
                            ? '▲'
                            : isSorted === 'desc'
                            ? '▼'
                            : '⇅'}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>

            {/* Column search row */}
            <tr className="bg-[var(--form-body-bg)]">
              {columns.map((col, idx) => (
                <th
                  key={`search-${idx}`}
                  style={{ width: widths[idx] }}
                  className="px-2 py-1"
                >
                  {!col.actions &&
                    (col.filterComponent ? (
                      col.filterComponent(filters[col.key as string] ?? '', (val) =>
                        handleFilterChange(col.key as string, val)
                      )
                    ) : (
                      <input
                        type="text"
                        aria-label={`Search ${col.label}`}
                        value={filters[col.key as string] ?? ''}
                        onChange={(e) =>
                          handleFilterChange(col.key as string, e.target.value)
                        }
                        placeholder={`Search ${col.label}`}
                        className="w-full px-2 py-1 text-sm border border-[var(--border-color)]
                                   rounded focus:outline-none focus:ring-1 focus:ring-[var(--link-color)]
                                   bg-[var(--form-body-bg)] text-[var(--text)]"
                      />
                    ))}
                </th>
              ))}
            </tr>
          </thead>

          {/* ----- Body ----- */}
          <tbody className="divide-y divide-[var(--border-color)]">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-[var(--text)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => {
                const bg =
                  idx % 2 === 0
                    ? 'bg-[var(--card-bg)]'
                    : 'bg-[var(--sidebar-bg)]';
                const key =
                  keyExtractor?.(item, idx) ?? `${startIndex + idx}`;
                return (
                  <tr
                    key={key}
                    className={`transition-colors hover:bg-[var(--sidebar-hover-bg)] ${bg} ${
                      rowClassName?.(item, idx) ?? ''
                    }`}
                    style={{ height: '50px' }}
                  >
                    {columns.map((col, cIdx) => {
                      const cellContent = col.actions
                        ? renderActions(col.actions, item)
                        : col.render
                        ? col.render(item)
                        : (item as any)[col.key];
                      return (
                        <td
                          key={cIdx}
                          style={{
                            width: widths[cIdx],
                            maxWidth: '600px',
                            height: '60px',
                            color: 'var(--card-text)',
                          }}
                          className={`px-4 py-3 text-sm ${getAlignment(col.position)} ${col.className || ''}`}
                        >
                          {typeof cellContent === 'string' ? (
                            <Tooltip content={cellContent}>
                              {cellContent}
                            </Tooltip>
                          ) : (
                            cellContent
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ----- Pagination ----- */}
      {totalPages > 1 && (
        <div
          className="flex items-center px-4 py-3 bg-[var(--form-header-bg)]
                     border-t border-[var(--border-color)] text-sm text-[var(--text)]
                     rounded-xl"
        >
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
