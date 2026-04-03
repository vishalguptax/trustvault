import { useMemo, useState } from 'react';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export function usePagination<T>(items: T[], defaultPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safeCurrentPage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safeCurrentPage, pageSize]);

  function goToPage(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }

  function changePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(ids: string[]) {
    setSelected((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...ids]);
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  // Reset page when items change significantly
  if (safeCurrentPage !== page) {
    setPage(safeCurrentPage);
  }

  return {
    page: safeCurrentPage,
    pageSize,
    totalPages,
    totalItems: items.length,
    paginatedItems,
    goToPage,
    changePageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    selected,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    hasSelection: selected.size > 0,
    selectedCount: selected.size,
  };
}
