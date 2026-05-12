import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { Toast } from '@/hooks/useTransactions';
import type { Transaction } from '@/types/transaction';

import { TransactionsTable } from '../TransactionsTable';

// --- Mock useTransactions so the table is tested in isolation ---
vi.mock('@/hooks/useTransactions', () => ({
  useTransactions: vi.fn(),
}));

import { useTransactions } from '@/hooks/useTransactions';

const mockUseTransactions = vi.mocked(useTransactions);

// ---------------------------------------------------------------------------
// Shared test data helpers
// ---------------------------------------------------------------------------

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'txn_001',
    amount: 29.99,
    currency: 'USD',
    date: '2026-05-10T08:23:11Z',
    description: 'Monthly subscription',
    status: 'success',
    ...overrides,
  };
}

function makeFailedTransaction(
  id: string,
  overrides: Partial<Transaction> = {},
): Transaction {
  return makeTransaction({ id, status: 'failed', ...overrides });
}

// Default mock return value representing an idle, empty state
function defaultHookState(
  overrides: Partial<ReturnType<typeof useTransactions>> = {},
): ReturnType<typeof useTransactions> {
  return {
    transactions: [],
    page: 1,
    totalPages: 1,
    setPage: vi.fn(),
    loading: false,
    fetchError: null,
    selectedIds: new Set<string>(),
    selectedCount: 0,
    hasSelection: false,
    selectAllFailed: false,
    retryingIds: new Set<string>(),
    downloadingIds: new Set<string>(),
    toasts: [] as Toast[],
    failedTransactions: [],
    allFailedSelected: false,
    someFailedSelected: false,
    batchRetryLoading: false,
    selectAllRef: vi.fn(),
    fetchTransactions: vi.fn(),
    handleRetry: vi.fn(),
    handleBatchRetry: vi.fn(),
    handleDownloadInvoice: vi.fn(),
    handleSelectChange: vi.fn(),
    handleSelectAll: vi.fn(),
    handleSelectAllFailed: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  mockUseTransactions.mockReturnValue(defaultHookState());
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TransactionsTable', () => {
  describe('page structure', () => {
    it('renders the heading "Transactions"', () => {
      render(<TransactionsTable />);
      expect(
        screen.getByRole('heading', { name: 'Transactions' }),
      ).toBeInTheDocument();
    });

    it('renders the sub-heading "Your payment history"', () => {
      render(<TransactionsTable />);
      expect(screen.getByText('Your payment history')).toBeInTheDocument();
    });

    it('renders the table with expected column headers', () => {
      render(<TransactionsTable />);
      const headers = [
        'ID',
        'Description',
        'Amount',
        'Date',
        'Status',
        'Actions',
      ];

      for (const header of headers) {
        expect(screen.getByText(header)).toBeInTheDocument();
      }
    });

    it('renders a "Retry Selected" button in the header area', () => {
      render(<TransactionsTable />);
      expect(
        screen.getByRole('button', { name: /retry selected/i }),
      ).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows a loading spinner row when loading is true', () => {
      mockUseTransactions.mockReturnValue(defaultHookState({ loading: true }));
      render(<TransactionsTable />);
      expect(screen.getByText(/loading transactions/i)).toBeInTheDocument();
    });

    it('does not render transaction rows while loading', () => {
      const tx = makeTransaction();

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          loading: true,
          transactions: [tx],
          failedTransactions: [],
        }),
      );
      render(<TransactionsTable />);
      expect(screen.queryByText(tx.id)).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows the fetch error message when fetchError is set', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({
          fetchError: 'Could not load transactions. Please try again.',
        }),
      );
      render(<TransactionsTable />);
      expect(
        screen.getByText(/could not load transactions/i),
      ).toBeInTheDocument();
    });

    it('shows a "Try again" button when there is a fetch error', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({
          fetchError: 'Could not load transactions. Please try again.',
        }),
      );
      render(<TransactionsTable />);
      expect(
        screen.getByRole('button', { name: /try again/i }),
      ).toBeInTheDocument();
    });

    it('calls fetchTransactions when "Try again" is clicked', async () => {
      const fetchTransactions = vi.fn();

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          fetchError: 'Could not load transactions. Please try again.',
          fetchTransactions,
        }),
      );
      render(<TransactionsTable />);
      await userEvent.click(screen.getByRole('button', { name: /try again/i }));
      expect(fetchTransactions).toHaveBeenCalledOnce();
    });

    it('does not render transaction rows when there is a fetch error', () => {
      const tx = makeTransaction();

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          fetchError: 'error',
          transactions: [tx],
          failedTransactions: [],
        }),
      );
      render(<TransactionsTable />);
      expect(screen.queryByText(tx.id)).not.toBeInTheDocument();
    });
  });

  describe('transaction rows', () => {
    it('renders a row for each transaction', () => {
      const txs = [
        makeTransaction({ id: 'txn_001' }),
        makeTransaction({ id: 'txn_002' }),
        makeTransaction({ id: 'txn_003' }),
      ];

      mockUseTransactions.mockReturnValue(
        defaultHookState({ transactions: txs, failedTransactions: [] }),
      );
      render(<TransactionsTable />);
      expect(screen.getByText('txn_001')).toBeInTheDocument();
      expect(screen.getByText('txn_002')).toBeInTheDocument();
      expect(screen.getByText('txn_003')).toBeInTheDocument();
    });

    it('renders "Success" badge for a successful transaction', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({
          transactions: [makeTransaction({ status: 'success' })],
          failedTransactions: [],
        }),
      );
      render(<TransactionsTable />);
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('renders "Failed" badge for a failed transaction', () => {
      const tx = makeFailedTransaction('txn_fail_1');

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          transactions: [tx],
          failedTransactions: [tx],
        }),
      );
      render(<TransactionsTable />);
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('renders "Pending" badge for a pending transaction', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({
          transactions: [makeTransaction({ status: 'pending' })],
          failedTransactions: [],
        }),
      );
      render(<TransactionsTable />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('retry selected button label', () => {
    it('shows "Retry Selected" when no transactions are selected', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({ selectedCount: 0, selectAllFailed: false }),
      );
      render(<TransactionsTable />);
      expect(
        screen.getByRole('button', { name: 'Retry Selected' }),
      ).toBeInTheDocument();
    });

    it('shows count in label when some transactions are selected', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({
          selectedCount: 3,
          selectAllFailed: false,
          hasSelection: true,
        }),
      );
      render(<TransactionsTable />);
      expect(
        screen.getByRole('button', { name: 'Retry Selected (3)' }),
      ).toBeInTheDocument();
    });

    it('shows "Retry All Failed" when selectAllFailed is true', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({
          selectAllFailed: true,
          selectedIds: null,
          selectedCount: null,
          hasSelection: true,
        }),
      );
      render(<TransactionsTable />);
      expect(
        screen.getByRole('button', { name: 'Retry All Failed' }),
      ).toBeInTheDocument();
    });

    it('disables the batch retry button when hasSelection is false', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({ hasSelection: false }),
      );
      render(<TransactionsTable />);
      expect(
        screen.getByRole('button', { name: /retry selected/i }),
      ).toBeDisabled();
    });

    it('enables the batch retry button when hasSelection is true', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({
          hasSelection: true,
          selectedCount: 1,
          selectAllFailed: false,
        }),
      );
      render(<TransactionsTable />);
      expect(
        screen.getByRole('button', { name: /retry selected/i }),
      ).not.toBeDisabled();
    });

    it('calls handleBatchRetry when the batch retry button is clicked', async () => {
      const handleBatchRetry = vi.fn();

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          hasSelection: true,
          selectedCount: 2,
          selectAllFailed: false,
          handleBatchRetry,
        }),
      );
      render(<TransactionsTable />);
      await userEvent.click(
        screen.getByRole('button', { name: /retry selected/i }),
      );
      expect(handleBatchRetry).toHaveBeenCalledOnce();
    });
  });

  describe('select-all checkbox in header', () => {
    it('does not render select-all checkbox when there are no failed transactions', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({ failedTransactions: [] }),
      );
      render(<TransactionsTable />);
      expect(
        screen.queryByRole('checkbox', {
          name: /select all failed/i,
        }),
      ).not.toBeInTheDocument();
    });

    it('renders select-all checkbox when there are failed transactions', () => {
      const tx = makeFailedTransaction('txn_f1');

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          transactions: [tx],
          failedTransactions: [tx],
        }),
      );
      render(<TransactionsTable />);
      expect(
        screen.getByRole('checkbox', {
          name: /select all failed transactions on this page/i,
        }),
      ).toBeInTheDocument();
    });

    it('calls handleSelectAll with true when select-all checkbox is checked', async () => {
      const handleSelectAll = vi.fn();
      const tx = makeFailedTransaction('txn_f1');

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          transactions: [tx],
          failedTransactions: [tx],
          allFailedSelected: false,
          handleSelectAll,
        }),
      );
      render(<TransactionsTable />);
      await userEvent.click(
        screen.getByRole('checkbox', {
          name: /select all failed transactions on this page/i,
        }),
      );
      expect(handleSelectAll).toHaveBeenCalledWith(true);
    });

    it('calls handleSelectAll with false when select-all checkbox is unchecked', async () => {
      const handleSelectAll = vi.fn();
      const tx = makeFailedTransaction('txn_f1');

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          transactions: [tx],
          failedTransactions: [tx],
          allFailedSelected: true,
          handleSelectAll,
        }),
      );
      render(<TransactionsTable />);
      await userEvent.click(
        screen.getByRole('checkbox', {
          name: /select all failed transactions on this page/i,
        }),
      );
      expect(handleSelectAll).toHaveBeenCalledWith(false);
    });
  });

  describe('"Select all failed transactions" global button', () => {
    it('shows the global select-all button when allFailedSelected and not selectAllFailed', () => {
      const tx = makeFailedTransaction('txn_f1');

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          transactions: [tx],
          failedTransactions: [tx],
          allFailedSelected: true,
          selectAllFailed: false,
        }),
      );
      render(<TransactionsTable />);
      expect(
        screen.getByRole('button', { name: /select all failed transactions/i }),
      ).toBeInTheDocument();
    });

    it('does not show the global select-all button when selectAllFailed is true', () => {
      const tx = makeFailedTransaction('txn_f1');

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          transactions: [tx],
          failedTransactions: [tx],
          allFailedSelected: true,
          selectAllFailed: true,
          selectedIds: null,
        }),
      );
      render(<TransactionsTable />);
      // "Retry All Failed" button exists but "Select all failed transactions" should not
      expect(
        screen.queryByRole('button', {
          name: 'Select all failed transactions',
        }),
      ).not.toBeInTheDocument();
    });

    it('calls handleSelectAllFailed when global select-all button is clicked', async () => {
      const handleSelectAllFailed = vi.fn();
      const tx = makeFailedTransaction('txn_f1');

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          transactions: [tx],
          failedTransactions: [tx],
          allFailedSelected: true,
          selectAllFailed: false,
          handleSelectAllFailed,
        }),
      );
      render(<TransactionsTable />);
      await userEvent.click(
        screen.getByRole('button', { name: /select all failed transactions/i }),
      );
      expect(handleSelectAllFailed).toHaveBeenCalledOnce();
    });
  });

  describe('isSelected prop forwarded to transaction rows', () => {
    it('marks a failed row as selected when its id is in selectedIds', () => {
      const tx = makeFailedTransaction('txn_f1');

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          transactions: [tx],
          failedTransactions: [tx],
          selectedIds: new Set(['txn_f1']),
        }),
      );
      render(<TransactionsTable />);
      const checkbox = screen.getByRole('checkbox', {
        name: /select transaction txn_f1/i,
      });

      expect(checkbox).toBeChecked();
    });

    it('marks a failed row as selected when selectedIds is null (select-all mode)', () => {
      const tx = makeFailedTransaction('txn_f1');

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          transactions: [tx],
          failedTransactions: [tx],
          selectedIds: null,
          selectAllFailed: true,
        }),
      );
      render(<TransactionsTable />);
      const checkbox = screen.getByRole('checkbox', {
        name: /select transaction txn_f1/i,
      });

      expect(checkbox).toBeChecked();
    });

    it('marks a failed row as unselected when its id is not in selectedIds', () => {
      const tx = makeFailedTransaction('txn_f1');

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          transactions: [tx],
          failedTransactions: [tx],
          selectedIds: new Set<string>(),
        }),
      );
      render(<TransactionsTable />);
      const checkbox = screen.getByRole('checkbox', {
        name: /select transaction txn_f1/i,
      });

      expect(checkbox).not.toBeChecked();
    });
  });

  describe('toasts', () => {
    it('renders a toast notification when one is present', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({
          toasts: [
            {
              id: 'toast_1',
              message: 'Invoice downloaded.',
              type: 'info',
            },
          ],
        }),
      );
      render(<TransactionsTable />);
      expect(screen.getByText('Invoice downloaded.')).toBeInTheDocument();
    });

    it('renders multiple toasts when multiple are present', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({
          toasts: [
            { id: 't1', message: 'First toast', type: 'success' },
            { id: 't2', message: 'Second toast', type: 'error' },
          ],
        }),
      );
      render(<TransactionsTable />);
      expect(screen.getByText('First toast')).toBeInTheDocument();
      expect(screen.getByText('Second toast')).toBeInTheDocument();
    });

    it('renders no toast notifications when toasts array is empty', () => {
      mockUseTransactions.mockReturnValue(defaultHookState({ toasts: [] }));
      render(<TransactionsTable />);
      expect(screen.queryByText(/toast/i)).not.toBeInTheDocument();
    });
  });

  describe('pagination', () => {
    it('does not render pagination controls when there is only one page', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({ page: 1, totalPages: 1 }),
      );
      render(<TransactionsTable />);
      expect(
        screen.queryByRole('button', { name: /← prev/i }),
      ).not.toBeInTheDocument();
    });

    it('renders pagination controls when totalPages > 1', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({ page: 1, totalPages: 3 }),
      );
      render(<TransactionsTable />);
      expect(
        screen.getByRole('button', { name: /← prev/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /next →/i }),
      ).toBeInTheDocument();
    });

    it('shows "Page 1 of 3" label when on first page of 3', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({ page: 1, totalPages: 3 }),
      );
      render(<TransactionsTable />);
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    it('disables Prev button on the first page', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({ page: 1, totalPages: 3 }),
      );
      render(<TransactionsTable />);
      expect(screen.getByRole('button', { name: /← prev/i })).toBeDisabled();
    });

    it('disables Next button on the last page', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({ page: 3, totalPages: 3 }),
      );
      render(<TransactionsTable />);
      expect(screen.getByRole('button', { name: /next →/i })).toBeDisabled();
    });

    it('calls setPage with page - 1 when Prev is clicked', async () => {
      const setPage = vi.fn();

      mockUseTransactions.mockReturnValue(
        defaultHookState({ page: 2, totalPages: 3, setPage }),
      );
      render(<TransactionsTable />);
      await userEvent.click(screen.getByRole('button', { name: /← prev/i }));
      expect(setPage).toHaveBeenCalledWith(1);
    });

    it('calls setPage with page + 1 when Next is clicked', async () => {
      const setPage = vi.fn();

      mockUseTransactions.mockReturnValue(
        defaultHookState({ page: 2, totalPages: 3, setPage }),
      );
      render(<TransactionsTable />);
      await userEvent.click(screen.getByRole('button', { name: /next →/i }));
      expect(setPage).toHaveBeenCalledWith(3);
    });

    it('renders a numbered button for each page', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({ page: 1, totalPages: 4 }),
      );
      render(<TransactionsTable />);
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
    });

    it('calls setPage with the correct page number when a page button is clicked', async () => {
      const setPage = vi.fn();

      mockUseTransactions.mockReturnValue(
        defaultHookState({ page: 1, totalPages: 3, setPage }),
      );
      render(<TransactionsTable />);
      await userEvent.click(screen.getByRole('button', { name: '3' }));
      expect(setPage).toHaveBeenCalledWith(3);
    });
  });

  describe('row callbacks wired to hook handlers', () => {
    it('calls handleSelectChange when a row checkbox is toggled', async () => {
      const handleSelectChange = vi.fn();
      const tx = makeFailedTransaction('txn_f1');

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          transactions: [tx],
          failedTransactions: [tx],
          selectedIds: new Set<string>(),
          handleSelectChange,
        }),
      );
      render(<TransactionsTable />);
      await userEvent.click(
        screen.getByRole('checkbox', {
          name: /select transaction txn_f1/i,
        }),
      );
      expect(handleSelectChange).toHaveBeenCalledWith('txn_f1', true);
    });

    it('calls handleRetry when a row Retry button is clicked', async () => {
      const handleRetry = vi.fn();
      const tx = makeFailedTransaction('txn_f1');

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          transactions: [tx],
          failedTransactions: [tx],
          handleRetry,
        }),
      );
      render(<TransactionsTable />);
      await userEvent.click(screen.getByRole('button', { name: /^retry$/i }));
      expect(handleRetry).toHaveBeenCalledWith('txn_f1');
    });

    it('calls handleDownloadInvoice when a row Invoice button is clicked', async () => {
      const handleDownloadInvoice = vi.fn();
      const tx = makeTransaction({ id: 'txn_001' });

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          transactions: [tx],
          failedTransactions: [],
          handleDownloadInvoice,
        }),
      );
      render(<TransactionsTable />);
      await userEvent.click(screen.getByRole('button', { name: /invoice/i }));
      expect(handleDownloadInvoice).toHaveBeenCalledWith('txn_001');
    });
  });

  describe('edge cases', () => {
    it('renders an empty table body without crashing when transactions is empty', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({ transactions: [], failedTransactions: [] }),
      );
      render(<TransactionsTable />);
      // Table still renders with column headers
      expect(screen.getByText('ID')).toBeInTheDocument();
    });

    it('renders multiple failed rows each with their own checkbox', () => {
      const txs = [
        makeFailedTransaction('txn_f1'),
        makeFailedTransaction('txn_f2'),
        makeFailedTransaction('txn_f3'),
      ];

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          transactions: txs,
          failedTransactions: txs,
          selectedIds: new Set<string>(),
        }),
      );
      render(<TransactionsTable />);
      // 3 row checkboxes + 1 select-all header checkbox
      const checkboxes = screen.getAllByRole('checkbox');

      expect(checkboxes.length).toBe(4);
    });

    it('handles a mix of statuses without error', () => {
      const txs = [
        makeTransaction({ id: 'txn_s', status: 'success' }),
        makeFailedTransaction('txn_f'),
        makeTransaction({ id: 'txn_p', status: 'pending' }),
      ];

      mockUseTransactions.mockReturnValue(
        defaultHookState({
          transactions: txs,
          failedTransactions: [txs[1]],
          selectedIds: new Set<string>(),
        }),
      );
      render(<TransactionsTable />);
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('shows batchRetryLoading spinner on retry button when batchRetryLoading is true', () => {
      mockUseTransactions.mockReturnValue(
        defaultHookState({
          hasSelection: true,
          selectedCount: 1,
          batchRetryLoading: true,
        }),
      );
      render(<TransactionsTable />);
      const retryBtn = screen.getByRole('button', { name: /retry selected/i });

      // RetryButton renders a spinner svg and sets aria-busy when loading
      expect(retryBtn).toHaveAttribute('aria-busy', 'true');
    });
  });
});
