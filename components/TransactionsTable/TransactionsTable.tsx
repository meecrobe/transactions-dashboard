'use client';

import { RetryButton } from '@/components/RetryButton';
import { TransactionRow } from '@/components/TransactionRow';
import type { Toast } from '@/hooks/useTransactions';
import { useTransactions } from '@/hooks/useTransactions';

import { PlainButton } from '../PlainButton';

const toastBg: Record<Toast['type'], string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export function TransactionsTable() {
  const {
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
    batchRetryLoading,
    selectAllRef,
    fetchTransactions,
    handleRetry,
    handleBatchRetry,
    handleDownloadInvoice,
    handleSelectChange,
    handleSelectAll,
    handleSelectAllFailed,
  } = useTransactions();

  const retryButtonLabel = selectAllFailed
    ? 'Retry All Failed'
    : selectedCount != null && selectedCount > 0
      ? `Retry Selected (${selectedCount})`
      : 'Retry Selected';

  const selectAllCheckboxMarkup =
    failedTransactions.length > 0 ? (
      <input
        ref={selectAllRef}
        type="checkbox"
        checked={allFailedSelected}
        onChange={(e) => handleSelectAll(e.target.checked)}
        className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        aria-label="Select all failed transactions on this page"
      />
    ) : null;

  const showSelectAllFailedButton =
    allFailedSelected && !selectAllFailed && failedTransactions.length > 0;

  const selectAllFailedButtonMarkup = showSelectAllFailedButton ? (
    <PlainButton onClick={handleSelectAllFailed}>
      Select all failed transactions
    </PlainButton>
  ) : null;

  const loadingRowMarkup = loading ? (
    <tr>
      <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-400">
        <div className="flex items-center justify-center gap-2">
          <svg
            className="h-5 w-5 animate-spin text-indigo-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading transactions…
        </div>
      </td>
    </tr>
  ) : null;

  const errorRowMarkup = fetchError ? (
    <tr>
      <td colSpan={7} className="px-4 py-12 text-center text-sm text-red-600">
        {fetchError}
        <button
          type="button"
          onClick={fetchTransactions}
          className="ml-3 text-indigo-600 underline hover:text-indigo-800"
        >
          Try again
        </button>
      </td>
    </tr>
  ) : null;

  const transactionRowsMarkup =
    !loading && !fetchError
      ? transactions.map((tx) => (
          <TransactionRow
            key={tx.id}
            transaction={tx}
            isSelected={
              selectedIds === null
                ? tx.status === 'failed'
                : selectedIds.has(tx.id)
            }
            isRetrying={retryingIds.has(tx.id)}
            isDownloadingInvoice={downloadingIds.has(tx.id)}
            onSelectChange={handleSelectChange}
            onRetry={handleRetry}
            onDownloadInvoice={handleDownloadInvoice}
          />
        ))
      : null;

  const headingsMarkup = !showSelectAllFailedButton ? (
    <>
      <th
        scope="col"
        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
      >
        ID
      </th>
      <th
        scope="col"
        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
      >
        Description
      </th>
      <th
        scope="col"
        className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500"
      >
        Amount
      </th>
      <th
        scope="col"
        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
      >
        Date
      </th>
      <th
        scope="col"
        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
      >
        Status
      </th>
      <th
        scope="col"
        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
      >
        Actions
      </th>
    </>
  ) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Transactions</h1>
          <p className="mt-1 text-sm text-zinc-500">Your payment history</p>
        </div>
        <RetryButton
          onClick={handleBatchRetry}
          loading={batchRetryLoading}
          disabled={!hasSelection}
        >
          {retryButtonLabel}
        </RetryButton>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50 h-14">
            <tr>
              <th
                className="relative text-left w-10 px-4 py-3"
                scope="col"
                colSpan={showSelectAllFailedButton ? 7 : 1}
              >
                <span className="sr-only">Select</span>
                <div className="flex flex-nowrap gap-4 items-center">
                  {selectAllCheckboxMarkup}
                  {selectAllFailedButtonMarkup}
                </div>
              </th>
              {headingsMarkup}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {loadingRowMarkup}
            {errorRowMarkup}
            {transactionRowsMarkup}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="rounded px-3 py-1.5 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`rounded px-3 py-1.5 ${p === page ? 'bg-indigo-600 text-white' : 'hover:bg-zinc-100'}`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="rounded px-3 py-1.5 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      <div className="fixed top-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg border px-4 py-3 text-sm shadow-md ${toastBg[toast.type]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
