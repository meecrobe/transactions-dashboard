'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Transaction } from '@/types/transaction';

import { usePaginate } from './usePaginate';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const PAGE_SIZE = 10;

export function useTransactions() {
  const { page, pageSize, totalPages, setPage, buildQuery, applyTotal } =
    usePaginate(PAGE_SIZE);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // null = all failed transactions selected (across all pages)
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(new Set());
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [batchRetryActive, setBatchRetryActive] = useState(false);

  // Cache of all failed IDs fetched when "Select all failed" is clicked,
  // used to convert back to an explicit set when the user deselects a row.
  const allFailedIdsRef = useRef<string[]>([]);

  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = Math.random().toString(36).slice(2);

    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }, []);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      try {
        const res = await fetch(buildQuery('/api/transactions'));

        if (!res.ok) {
          throw new Error('Failed to load transactions');
        }

        const { data, total } = (await res.json()) as {
          data: Transaction[];
          total: number;
          page: number;
          pageSize: number;
        };

        if (active) {
          setTransactions(data);
          applyTotal(total);
          setFetchError(null);
        }
      } catch {
        if (active) {
          setFetchError('Could not load transactions. Please try again.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [page, pageSize, refreshKey, buildQuery, applyTotal]);

  function fetchTransactions() {
    setFetchError(null);
    setRefreshKey((k) => k + 1);
  }

  const handleRetry = useCallback(
    async (id: string) => {
      setRetryingIds((prev) => new Set(prev).add(id));

      try {
        const res = await fetch(`/api/transactions/${id}/retry`, {
          method: 'POST',
        });

        if (!res.ok) {
          throw new Error('Retry failed');
        }

        const { status } = (await res.json()) as {
          id: string;
          status: Transaction['status'];
        };

        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status } : t)),
        );
        addToast(
          status === 'success'
            ? `Transaction ${id} retried successfully.`
            : `Transaction ${id} retry failed again.`,
          status === 'success' ? 'success' : 'error',
        );
      } catch {
        addToast(`Network error retrying ${id}.`, 'error');
      } finally {
        setRetryingIds((prev) => {
          const next = new Set(prev);

          next.delete(id);

          return next;
        });
      }
    },
    [addToast],
  );

  async function handleBatchRetry() {
    let ids: string[];

    if (selectedIds === null) {
      // "All failed" mode — use cached IDs or re-fetch
      if (allFailedIdsRef.current.length > 0) {
        ids = allFailedIdsRef.current;
      } else {
        try {
          const res = await fetch('/api/transactions/failed-ids');

          if (!res.ok) {
            throw new Error('Failed to fetch failed transaction IDs');
          }

          const { ids: fetchedIds } = (await res.json()) as { ids: string[] };

          ids = fetchedIds;
        } catch {
          addToast(
            'Could not load failed transactions. Please try again.',
            'error',
          );

          return;
        }
      }
    } else {
      ids = [...selectedIds];
    }

    setBatchRetryActive(true);
    allFailedIdsRef.current = [];
    await Promise.all(ids.map((id) => handleRetry(id)));
    setSelectedIds(new Set());
    setBatchRetryActive(false);
  }

  const handleDownloadInvoice = useCallback(
    async (id: string) => {
      setDownloadingIds((prev) => new Set(prev).add(id));

      try {
        const res = await fetch(`/api/transactions/${id}/invoice`);

        if (!res.ok) {
          throw new Error('Invoice fetch failed');
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), {
          href: url,
          download: `invoice-${id}.txt`,
        });

        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        addToast(`Invoice for ${id} downloaded.`, 'info');
      } catch {
        addToast(`Failed to download invoice for ${id}.`, 'error');
      } finally {
        setDownloadingIds((prev) => {
          const next = new Set(prev);

          next.delete(id);

          return next;
        });
      }
    },
    [addToast],
  );

  const handleSelectChange = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (prev === null) {
        // Convert from "all selected" to an explicit set, then apply the change
        const next = new Set(allFailedIdsRef.current);

        if (!checked) {
          next.delete(id);
        }

        return next;
      }

      const next = new Set(prev);

      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  }, []);

  async function handleSelectAllFailed() {
    try {
      const res = await fetch('/api/transactions/failed-ids');

      if (!res.ok) {
        throw new Error('Failed to fetch failed transaction IDs');
      }

      const { ids } = (await res.json()) as { ids: string[] };

      allFailedIdsRef.current = ids;
      setSelectedIds(null);
    } catch {
      addToast(
        'Could not select all failed transactions. Please try again.',
        'error',
      );
    }
  }

  const failedTransactions = transactions.filter((t) => t.status === 'failed');

  const allFailedSelected =
    selectedIds === null ||
    (failedTransactions.length > 0 &&
      failedTransactions.every((t) => (selectedIds as Set<string>).has(t.id)));

  const someFailedSelected =
    selectedIds === null ||
    failedTransactions.some((t) => (selectedIds as Set<string>).has(t.id));

  const selectAllFailed = selectedIds === null;

  const selectAllRef = useCallback(
    (el: HTMLInputElement | null) => {
      if (el) {
        el.indeterminate =
          !selectAllFailed && someFailedSelected && !allFailedSelected;
      }
    },
    [someFailedSelected, allFailedSelected, selectAllFailed],
  );

  function handleSelectAll(checked: boolean) {
    if (!checked) {
      allFailedIdsRef.current = [];
      setSelectedIds(new Set());

      return;
    }

    setSelectedIds(new Set(failedTransactions.map((t) => t.id)));
  }

  const selectedCount =
    selectedIds === null ? null : (selectedIds as Set<string>).size;

  const hasSelection =
    selectedIds === null || (selectedIds as Set<string>).size > 0;

  const batchRetryLoading = batchRetryActive;

  return {
    transactions,
    page,
    totalPages,
    setPage,
    loading,
    fetchError,
    selectedIds,
    selectedCount,
    hasSelection,
    selectAllFailed,
    retryingIds,
    downloadingIds,
    toasts,
    failedTransactions,
    allFailedSelected,
    someFailedSelected,
    batchRetryLoading,
    selectAllRef,
    fetchTransactions,
    handleRetry,
    handleBatchRetry,
    handleDownloadInvoice,
    handleSelectChange,
    handleSelectAll,
    handleSelectAllFailed,
  };
}
