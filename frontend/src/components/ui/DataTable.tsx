import React from 'react';

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  emptyText?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  emptyText = 'No data.',
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (pageSize || 10)));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded border bg-white">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} className={`px-4 py-3 text-sm font-semibold text-slate-700 ${col.className ?? ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-sm text-slate-600">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="border-t">
                  {columns.map((col) => (
                    <td key={String(col.key)} className={`px-4 py-3 text-sm ${col.className ?? ''}`}>
                      {col.render ? col.render(row) : String(row[col.key as keyof typeof row] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>
            Page {page} of {totalPages}
          </span>
          <span className="ml-3">
            Rows per page:
            <select
              className="ml-2 rounded border px-2 py-1"
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            >
              {[5, 10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className={`rounded border px-3 py-1 text-sm ${canPrev ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-400 cursor-not-allowed'}`}
            onClick={() => canPrev && onPageChange?.(page - 1)}
            disabled={!canPrev}
          >
            Prev
          </button>
          <button
            className={`rounded border px-3 py-1 text-sm ${canNext ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-400 cursor-not-allowed'}`}
            onClick={() => canNext && onPageChange?.(page + 1)}
            disabled={!canNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}