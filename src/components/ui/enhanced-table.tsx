import * as React from "react";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  ArrowUp, ArrowDown, ArrowUpDown, Search, X, Columns3,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  AlignJustify, List, Check, SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ─── Types ───────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc" | null;

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T, highlight?: (text: string) => React.ReactNode) => React.ReactNode;
  accessor?: (row: T) => any;
  minWidth?: number;
  align?: "left" | "right" | "center";
  className?: string;
  headerClassName?: string;
  /** If false, column cannot be hidden. Default true. */
  hideable?: boolean;
  /** If false, column is hidden by default. Default true. */
  defaultVisible?: boolean;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string; dot?: string }[];
}

interface EnhancedTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  rowKey: (row: T) => string;
  defaultSortKey?: string;
  defaultSortDirection?: SortDirection;
  isLoading?: boolean;
  loadingRows?: number;
  emptyMessage?: string;
  rowActions?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;

  // Enhanced features
  /** Enable multi-term smart search */
  enableSearch?: boolean;
  searchPlaceholder?: string;
  /** Enable column visibility picker */
  enableColumnToggle?: boolean;
  /** Enable row checkboxes for bulk selection */
  enableSelection?: boolean;
  onSelectionChange?: (selectedKeys: string[]) => void;
  bulkActions?: (selectedKeys: string[], clearSelection: () => void) => React.ReactNode;
  /** Quick filter chips (e.g. status) */
  filters?: FilterOption[];
  /** Enable pagination */
  enablePagination?: boolean;
  pageSizes?: number[];
  defaultPageSize?: number;
  /** Enable dense/comfortable toggle */
  enableDenseToggle?: boolean;
  /** Show sticky header */
  stickyHeader?: boolean;
  /** Enable search term highlighting in cells */
  enableHighlight?: boolean;
  /** Keyboard shortcut hint shown in search */
  enableKeyboardShortcut?: boolean;
  /** Custom toolbar actions (rendered after built-in toolbar) */
  toolbarActions?: React.ReactNode;
  /** Extra toolbar left content */
  toolbarLeft?: React.ReactNode;
}

// ─── Helpers ─────────────────────────────────────────────────────

function naturalCompare(a: any, b: any): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

function highlightText(text: string, terms: string[]): React.ReactNode {
  if (!terms.length || !text) return text;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5">{part}</mark>
    ) : (
      part
    )
  );
}

// ─── Component ───────────────────────────────────────────────────

export function EnhancedTable<T>({
  data,
  columns: allColumns,
  rowKey,
  defaultSortKey,
  defaultSortDirection = "asc",
  isLoading = false,
  loadingRows = 5,
  emptyMessage = "No data found",
  rowActions,
  onRowClick,
  className,
  enableSearch = true,
  searchPlaceholder = "Search across all fields...",
  enableColumnToggle = true,
  enableSelection = false,
  onSelectionChange,
  bulkActions,
  filters = [],
  enablePagination = true,
  pageSizes = [7, 15, 25, 50],
  defaultPageSize = 15,
  enableDenseToggle = true,
  stickyHeader = true,
  enableHighlight = true,
  enableKeyboardShortcut = true,
  toolbarActions,
  toolbarLeft,
}: EnhancedTableProps<T>) {
  // ── State ──
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultSortKey ? defaultSortDirection : null);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(() => {
    const set = new Set<string>();
    allColumns.forEach((c) => {
      if (c.defaultVisible !== false) set.add(c.key);
    });
    return set;
  });
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [dense, setDense] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Keyboard shortcut Ctrl+K ──
  useEffect(() => {
    if (!enableKeyboardShortcut) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enableKeyboardShortcut]);

  // ── Visible columns ──
  const columns = useMemo(() => allColumns.filter((c) => visibleCols.has(c.key)), [allColumns, visibleCols]);

  // ── Search terms ──
  const searchTerms = useMemo(() => search.trim().toLowerCase().split(/\s+/).filter(Boolean), [search]);

  // ── Filter + Search ──
  const filteredData = useMemo(() => {
    let result = data;

    // Quick filters
    for (const [key, value] of Object.entries(activeFilters)) {
      if (!value) continue;
      result = result.filter((row) => {
        const col = allColumns.find((c) => c.key === key);
        const accessor = col?.accessor ?? ((r: T) => (r as any)[key]);
        return String(accessor(row)).toLowerCase() === value.toLowerCase();
      });
    }

    // Multi-term AND search
    if (searchTerms.length > 0) {
      result = result.filter((row) => {
        // Build a single searchable string from all column values
        const searchable = allColumns
          .map((col) => {
            const accessor = col.accessor ?? ((r: T) => (r as any)[col.key]);
            return String(accessor(row) ?? "").toLowerCase();
          })
          .join(" ");
        return searchTerms.every((term) => searchable.includes(term));
      });
    }

    return result;
  }, [data, searchTerms, activeFilters, allColumns]);

  // ── Sort ──
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") { setSortDir(null); setSortKey(null); }
      else { setSortDir("asc"); setSortKey(key); }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return filteredData;
    const col = allColumns.find((c) => c.key === sortKey);
    if (!col) return filteredData;
    const accessor = col.accessor ?? ((row: T) => (row as any)[col.key]);
    return [...filteredData].sort((a, b) => {
      const result = naturalCompare(accessor(a), accessor(b));
      return sortDir === "desc" ? -result : result;
    });
  }, [filteredData, sortKey, sortDir, allColumns]);

  // ── Pagination ──
  const totalItems = sortedData.length;
  const totalPages = enablePagination ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1;
  const paginatedData = enablePagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  // Reset page when search/filter changes
  useEffect(() => { setCurrentPage(1); }, [search, activeFilters, pageSize]);

  // ── Selection ──
  const allPageKeys = useMemo(() => paginatedData.map(rowKey), [paginatedData, rowKey]);
  const allSelected = allPageKeys.length > 0 && allPageKeys.every((k) => selectedKeys.has(k));
  const someSelected = allPageKeys.some((k) => selectedKeys.has(k));

  const toggleSelectAll = useCallback(() => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        allPageKeys.forEach((k) => next.delete(k));
      } else {
        allPageKeys.forEach((k) => next.add(k));
      }
      return next;
    });
  }, [allSelected, allPageKeys]);

  const toggleSelect = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedKeys(new Set()), []);

  useEffect(() => {
    onSelectionChange?.(Array.from(selectedKeys));
  }, [selectedKeys, onSelectionChange]);

  // ── Highlight helper ──
  const makeHighlighter = useCallback(
    (text: string) => {
      if (!enableHighlight || searchTerms.length === 0) return text;
      return highlightText(text, searchTerms);
    },
    [enableHighlight, searchTerms]
  );

  // ── Page numbers ──
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length + (search ? 1 : 0);
  const totalCols = columns.length + (rowActions ? 1 : 0) + (enableSelection ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        {enableSearch && (
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-20 h-9"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearch("")}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
            {enableKeyboardShortcut && !search && (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
                ⌘K
              </kbd>
            )}
          </div>
        )}

        {toolbarLeft}

        {/* Quick Filters */}
        {filters.map((filter) => (
          <div key={filter.key} className="flex items-center gap-1">
            {filter.options.map((opt) => {
              const isActive = activeFilters[filter.key] === opt.value;
              return (
                <Button
                  key={opt.value}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={cn("h-7 text-xs gap-1.5", isActive && "shadow-sm")}
                  onClick={() =>
                    setActiveFilters((prev) => ({
                      ...prev,
                      [filter.key]: isActive ? "" : opt.value,
                    }))
                  }
                >
                  {opt.dot && <span className={cn("w-2 h-2 rounded-full", opt.dot)} />}
                  {opt.label}
                </Button>
              );
            })}
          </div>
        ))}

        <div className="flex-1" />

        {/* Active filter count */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground"
            onClick={() => { setSearch(""); setActiveFilters({}); }}
          >
            <X className="w-3 h-3" /> Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
          </Button>
        )}

        {/* Dense toggle */}
        {enableDenseToggle && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDense((d) => !d)}
            title={dense ? "Comfortable view" : "Dense view"}
          >
            {dense ? <AlignJustify className="w-4 h-4" /> : <List className="w-4 h-4" />}
          </Button>
        )}

        {/* Column picker */}
        {enableColumnToggle && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Columns3 className="w-4 h-4" /> Columns
                {allColumns.length - visibleCols.size > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {visibleCols.size}/{allColumns.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="end">
              <p className="text-xs font-medium text-muted-foreground px-2 pb-2">Toggle columns</p>
              {allColumns.map((col) => {
                const checked = visibleCols.has(col.key);
                const disabled = col.hideable === false;
                return (
                  <button
                    key={col.key}
                    className={cn(
                      "flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-sm hover:bg-accent transition-colors",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) return;
                      setVisibleCols((prev) => {
                        const next = new Set(prev);
                        if (next.has(col.key)) next.delete(col.key);
                        else next.add(col.key);
                        return next;
                      });
                    }}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                      checked ? "bg-primary border-primary" : "border-muted-foreground/30"
                    )}>
                      {checked && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    {col.header}
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>
        )}

        {toolbarActions}
      </div>

      {/* ── Bulk selection bar ── */}
      {enableSelection && selectedKeys.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-lg border border-primary/20">
          <span className="text-sm font-medium">{selectedKeys.size} selected</span>
          {bulkActions?.(Array.from(selectedKeys), clearSelection)}
          <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={clearSelection}>
            Clear selection
          </Button>
        </div>
      )}

      {/* ── Table ── */}
      <div className={cn("relative w-full overflow-auto rounded-lg border bg-card", className)}>
        <table className="w-full caption-bottom text-sm" style={{ tableLayout: "auto" }}>
          <thead className={cn("[&_tr]:border-b", stickyHeader && "sticky top-0 z-10 bg-card")}>
            <tr className="border-b transition-colors">
              {enableSelection && (
                <th className="h-11 px-4 w-[44px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                    className={cn(!allSelected && someSelected && "data-[state=unchecked]:bg-primary/20")}
                  />
                </th>
              )}
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
                  <td colSpan={totalCols} className={cn(dense ? "p-2" : "p-4")}>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="text-center text-muted-foreground py-12">
                  {search ? (
                    <div className="space-y-1">
                      <p>No results for "<strong>{search}</strong>"</p>
                      <p className="text-xs">Try different keywords or clear filters</p>
                    </div>
                  ) : (
                    emptyMessage
                  )}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const key = rowKey(row);
                const isSelected = selectedKeys.has(key);
                return (
                  <tr
                    key={key}
                    className={cn(
                      "border-b transition-colors hover:bg-muted/50",
                      onRowClick && "cursor-pointer",
                      isSelected && "bg-primary/5",
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {enableSelection && (
                      <td className={cn(dense ? "px-4 py-1" : "px-4 py-3")} onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(key)}
                          aria-label={`Select row ${key}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => {
                      const accessor = col.accessor ?? ((r: T) => (r as any)[col.key]);
                      const value = accessor(row);
                      return (
                        <td
                          key={col.key}
                          className={cn(
                            dense ? "px-4 py-1.5" : "px-4 py-3",
                            "align-middle whitespace-nowrap",
                            col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                            col.className,
                          )}
                          style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                        >
                          {col.render
                            ? col.render(row, makeHighlighter)
                            : makeHighlighter(String(value ?? "—"))}
                        </td>
                      );
                    })}
                    {rowActions && (
                      <td className={cn(dense ? "px-4 py-1" : "px-4 py-3", "align-middle")} onClick={(e) => e.stopPropagation()}>
                        {rowActions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer: result count + pagination ── */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          Showing {paginatedData.length} of {totalItems} result{totalItems !== 1 ? "s" : ""}
          {data.length !== totalItems && ` (${data.length} total)`}
        </p>

        <div className="flex items-center gap-3">
          {/* Page size selector */}
          {enablePagination && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows:</span>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="h-7 w-[60px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizes.map((s) => (
                    <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Page navigation */}
          {enablePagination && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
                <ChevronsLeft className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              {getPageNumbers().map((page, i) =>
                typeof page === "string" ? (
                  <span key={`e-${i}`} className="px-1.5 text-muted-foreground text-xs">…</span>
                ) : (
                  <Button key={page} variant={currentPage === page ? "default" : "outline"} size="icon" className="h-7 w-7 text-xs" onClick={() => setCurrentPage(page)}>
                    {page}
                  </Button>
                )
              )}
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>
                <ChevronsRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
