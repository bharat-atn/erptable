import * as React from "react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SortDirection = "asc" | "desc" | null;

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  /** Custom render function for the cell */
  render?: (row: T) => React.ReactNode;
  /** Accessor for sorting/display — returns the raw value */
  accessor?: (row: T) => any;
  /** Min width in px */
  minWidth?: number;
  /** Align */
  align?: "left" | "right" | "center";
  /** Extra className for the cell */
  className?: string;
  /** Extra className for the header */
  headerClassName?: string;
}

interface SortableTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  /** Key extractor for rows */
  rowKey: (row: T) => string;
  /** If provided, the table starts sorted by this column key */
  defaultSortKey?: string;
  defaultSortDirection?: SortDirection;
  isLoading?: boolean;
  loadingRows?: number;
  emptyMessage?: string;
  /** Render extra content at the end of each row (e.g. actions dropdown) */
  rowActions?: (row: T) => React.ReactNode;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Additional className for the table wrapper */
  className?: string;
}

function naturalCompare(a: any, b: any): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  // Numbers
  if (typeof a === "number" && typeof b === "number") return a - b;

  // Dates
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();

  // Strings — natural sort with locale
  const strA = String(a);
  const strB = String(b);
  return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: "base" });
}

export function SortableTable<T>({
  data,
  columns,
  rowKey,
  defaultSortKey,
  defaultSortDirection = "asc",
  isLoading = false,
  loadingRows = 5,
  emptyMessage = "No data found",
  rowActions,
  onRowClick,
  className,
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? columns[0]?.key ?? null);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultSortKey || columns[0]?.key ? defaultSortDirection : null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      // Cycle: asc → desc → none → asc
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") { setSortDir(null); setSortKey(null); }
      else { setSortDir("asc"); setSortKey(key); }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;
    const accessor = col.accessor ?? ((row: T) => (row as any)[col.key]);
    return [...data].sort((a, b) => {
      const result = naturalCompare(accessor(a), accessor(b));
      return sortDir === "desc" ? -result : result;
    });
  }, [data, sortKey, sortDir, columns]);

  const totalCols = columns.length + (rowActions ? 1 : 0);

  return (
    <div className={cn("relative w-full overflow-auto", className)}>
      <table className="w-full caption-bottom text-sm" style={{ tableLayout: "auto" }}>
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "h-11 px-4 align-middle font-medium text-muted-foreground whitespace-nowrap",
                  col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                  col.headerClassName,
                )}
                style={col.minWidth ? { minWidth: col.minWidth } : undefined}
              >
                {col.sortable !== false ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 gap-1 font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground"
                    data-state={sortKey === col.key ? "active" : undefined}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.header}
                    {sortKey === col.key && sortDir === "asc" ? (
                      <ArrowUp className="w-3.5 h-3.5" />
                    ) : sortKey === col.key && sortDir === "desc" ? (
                      <ArrowDown className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </Button>
                ) : (
                  col.header
                )}
              </th>
            ))}
            {rowActions && <th className="h-11 px-4 w-[48px]" />}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {isLoading ? (
            [...Array(loadingRows)].map((_, i) => (
              <tr key={i} className="border-b">
                <td colSpan={totalCols} className="p-4">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </td>
              </tr>
            ))
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={totalCols} className="text-center text-muted-foreground py-8">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => (
              <tr
                key={rowKey(row)}
                className={cn(
                  "border-b transition-colors hover:bg-muted/50",
                  onRowClick && "cursor-pointer",
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => {
                  const accessor = col.accessor ?? ((r: T) => (r as any)[col.key]);
                  const value = accessor(row);
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        "p-4 align-middle whitespace-nowrap",
                        col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                        col.className,
                      )}
                      style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                    >
                      {col.render ? col.render(row) : (value ?? "—")}
                    </td>
                  );
                })}
                {rowActions && (
                  <td className="p-4 align-middle" onClick={(e) => e.stopPropagation()}>
                    {rowActions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
