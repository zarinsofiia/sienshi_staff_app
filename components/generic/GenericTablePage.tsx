'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import SearchBoxWithIcon from '@/components/search/SearchBoxWithIcon';
import Button from '@/components/button/Button';
import DataTable from '@/components/table/DataTable';
import DataTableWithColumnSearch from '@/components/table/DataTableWithColumnSearch';
import { defaultTableConfig, safeLower, TableConfig } from './tableConfig';

interface GenericTablePageProps<T> {
  fetchData: () => Promise<T[]>;
  columns: any[];
  config?: Partial<TableConfig<T>>; // allow overrides
  addRoute?: string; // <-- NEW: route for Add button
}

export default function GenericTablePage<T>({
  fetchData,
  columns,
  config = {},
  addRoute,
}: GenericTablePageProps<T>) {
  const router = useRouter();
  const finalConfig = { ...defaultTableConfig, ...config };

  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const TableComponent =
    finalConfig.tableType === 'columnSearch'
      ? DataTableWithColumnSearch
      : DataTable;

  useEffect(() => {
    (async () => setData(await fetchData()))();
  }, [fetchData]);

  const filtered = useMemo(() => {
    return data.filter((row: any) =>
      Object.values(row).some((v) =>
        safeLower(v).includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  useEffect(() => setCurrentPage(1), [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-4">
        <SearchBoxWithIcon
          placeholder={finalConfig.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {addRoute && (
          <Button
            variant="primary"
            icon={finalConfig.icon}
            onClick={() => router.push(addRoute)}
          >
            {finalConfig.addButtonLabel}
          </Button>
        )}
      </div>

      {/* Dynamic Table */}
      <TableComponent
        columns={columns}
        data={filtered}
        currentPage={currentPage}
        pageSize={finalConfig.pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
