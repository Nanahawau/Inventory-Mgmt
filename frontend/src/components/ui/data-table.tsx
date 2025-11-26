import React from "react";

type Column<T> = { key: keyof T; header: string; render?: (row: T) => React.ReactNode };
type Props<T> = { columns: Column<T>[]; data: T[]; emptyText?: string };

export function DataTable<T extends Record<string, any>>({ columns, data, emptyText = 'No data' }: Props<T>) {
  if (!data?.length) return <div className="text-sm text-muted-foreground">{emptyText}</div>;
  return (
    <div className="overflow-x-auto rounded border">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className="px-3 py-2 text-left font-semibold">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t">
              {columns.map((c) => (
                <td key={String(c.key)} className="px-3 py-2">
                  {c.render ? c.render(row) : String(row[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}