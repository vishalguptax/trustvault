'use client';

import { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { CaretLeft, CaretRight, CaretDoubleLeft, CaretDoubleRight, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface BulkAction {
  label: string;
  onClick: (selectedRows: Record<string, boolean>) => void;
  variant?: 'default' | 'destructive' | 'outline';
  disabled?: boolean;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  bulkActions?: BulkAction[];
  pageSize?: number;
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

function TableSkeleton({ cols, rows = 6 }: { cols: number; rows?: number }) {
  return (
    <div className="p-6 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          {Array.from({ length: Math.min(cols, 5) }).map((_, j) => (
            <div key={j} className="h-4 bg-muted rounded" style={{ width: `${60 + Math.random() * 80}px` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DataTable                                                           */
/* ------------------------------------------------------------------ */

export function DataTable<TData, TValue>({
  columns,
  data,
  loading,
  emptyMessage = 'No results.',
  emptyAction,
  bulkActions,
  pageSize = 10,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    initialState: { pagination: { pageSize } },
  });

  const selectedCount = Object.keys(rowSelection).filter((k) => rowSelection[k]).length;
  const pageIndex = table.getState().pagination.pageIndex;
  const currentPageSize = table.getState().pagination.pageSize;
  const totalRows = table.getFilteredRowModel().rows.length;
  const totalPages = table.getPageCount();
  const start = pageIndex * currentPageSize + 1;
  const end = Math.min((pageIndex + 1) * currentPageSize, totalRows);

  if (loading) {
    return <TableSkeleton cols={columns.length} />;
  }

  return (
    <div>
      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedCount > 0 && bulkActions && bulkActions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-6 py-2.5 bg-primary/10 border-b border-primary/20"
          >
            <span className="text-xs font-medium text-primary">
              {selectedCount} selected
            </span>
            <div className="flex items-center gap-1.5">
              {bulkActions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => action.onClick(rowSelection)}
                  disabled={action.disabled}
                >
                  {action.label}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 ml-auto text-muted-foreground hover:text-foreground"
              onClick={() => setRowSelection({})}
              aria-label="Clear selection"
            >
              <X size={14} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {data.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
          {emptyAction}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b border-border">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalRows > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {selectedCount > 0 && `${selectedCount} selected · `}
                  Showing {start}–{end} of {totalRows}
                </span>
                <span className="text-border">|</span>
                <span>Rows:</span>
                <select
                  value={currentPageSize}
                  onChange={(e) => table.setPageSize(Number(e.target.value))}
                  className="bg-transparent border border-border/50 rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {[10, 25, 50].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} aria-label="First page">
                  <CaretDoubleLeft size={14} />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page">
                  <CaretLeft size={14} />
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  Page <span className="text-foreground font-medium">{pageIndex + 1}</span> of {totalPages}
                </span>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page">
                  <CaretRight size={14} />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => table.setPageIndex(totalPages - 1)} disabled={!table.getCanNextPage()} aria-label="Last page">
                  <CaretDoubleRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
