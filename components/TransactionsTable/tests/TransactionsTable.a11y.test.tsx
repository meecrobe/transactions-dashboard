import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import type { Toast } from '@/hooks/useTransactions';
import type { Transaction } from '@/types/transaction';

import { TransactionsTable } from '../TransactionsTable';

vi.mock('@/hooks/useTransactions', () => ({
  useTransactions: vi.fn(),
}));

import { useTransactions } from '@/hooks/useTransactions';

const mockUseTransactions = vi.mocked(useTransactions);

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

describe('TransactionsTable — axe violations', () => {
  it('has no axe violations in the empty/idle state', async () => {
    const { container } = render(<TransactionsTable />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has no axe violations while loading', async () => {
    mockUseTransactions.mockReturnValue(defaultHookState({ loading: true }));
    const { container } = render(<TransactionsTable />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has no axe violations in the error state', async () => {
    mockUseTransactions.mockReturnValue(
      defaultHookState({
        fetchError: 'Could not load transactions. Please try again.',
      }),
    );
    const { container } = render(<TransactionsTable />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has no axe violations with a mix of transaction statuses', async () => {
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
    const { container } = render(<TransactionsTable />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has no axe violations when the batch retry button is in loading state', async () => {
    const txs = [makeFailedTransaction('txn_f1')];

    mockUseTransactions.mockReturnValue(
      defaultHookState({
        transactions: txs,
        failedTransactions: txs,
        hasSelection: true,
        selectedCount: 1,
        batchRetryLoading: true,
        retryingIds: new Set(['txn_f1']),
      }),
    );
    const { container } = render(<TransactionsTable />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has no axe violations when toasts are visible', async () => {
    mockUseTransactions.mockReturnValue(
      defaultHookState({
        toasts: [
          { id: 't1', message: 'Invoice downloaded.', type: 'info' },
          { id: 't2', message: 'Retry failed.', type: 'error' },
        ],
      }),
    );
    const { container } = render(<TransactionsTable />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has no axe violations on a multi-page dataset (pagination controls present)', async () => {
    const txs = [makeTransaction({ id: 'txn_001' })];

    mockUseTransactions.mockReturnValue(
      defaultHookState({
        transactions: txs,
        failedTransactions: [],
        page: 2,
        totalPages: 5,
      }),
    );
    const { container } = render(<TransactionsTable />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});

describe('TransactionsTable — ARIA table structure', () => {
  it('renders a <table> element with implicit role="table"', () => {
    render(<TransactionsTable />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('all column headers have role="columnheader"', () => {
    render(<TransactionsTable />);
    const columnHeaders = screen.getAllByRole('columnheader');

    // 7 columns: checkbox, ID, Description, Amount, Date, Status, Actions
    expect(columnHeaders.length).toBe(7);
  });

  it('column header cells include the expected labels', () => {
    render(<TransactionsTable />);
    const expectedLabels = [
      'ID',
      'Description',
      'Amount',
      'Date',
      'Status',
      'Actions',
    ];

    for (const label of expectedLabels) {
      // getAllByRole('columnheader') would give all; getByText is precise here
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('data cells have role="cell" when a transaction is present', () => {
    const tx = makeTransaction({ id: 'txn_001' });

    mockUseTransactions.mockReturnValue(
      defaultHookState({ transactions: [tx], failedTransactions: [] }),
    );
    render(<TransactionsTable />);
    const cells = screen.getAllByRole('cell');

    // 7 cells per row
    expect(cells.length).toBeGreaterThanOrEqual(7);
  });

  it('renders a row for each transaction (role="row")', () => {
    const txs = [
      makeTransaction({ id: 'txn_001' }),
      makeTransaction({ id: 'txn_002' }),
    ];

    mockUseTransactions.mockReturnValue(
      defaultHookState({ transactions: txs, failedTransactions: [] }),
    );
    render(<TransactionsTable />);
    // 1 header row + 2 data rows = 3
    const rows = screen.getAllByRole('row');

    expect(rows.length).toBe(3);
  });
});

describe('TransactionsTable — "Retry Selected" button ARIA states', () => {
  it('has aria-busy="true" when batchRetryLoading is true', () => {
    mockUseTransactions.mockReturnValue(
      defaultHookState({
        hasSelection: true,
        selectedCount: 1,
        batchRetryLoading: true,
      }),
    );
    render(<TransactionsTable />);
    const btn = screen.getByRole('button', { name: /retry selected/i });

    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('does not have aria-busy when not loading', () => {
    mockUseTransactions.mockReturnValue(
      defaultHookState({
        hasSelection: true,
        selectedCount: 1,
        batchRetryLoading: false,
      }),
    );
    render(<TransactionsTable />);
    const btn = screen.getByRole('button', { name: /retry selected/i });

    // aria-busy should be false or absent when not loading
    const ariaBusy = btn.getAttribute('aria-busy');

    expect(ariaBusy === null || ariaBusy === 'false').toBe(true);
  });

  it('is disabled (not just visually muted) when there is no selection', () => {
    mockUseTransactions.mockReturnValue(
      defaultHookState({ hasSelection: false }),
    );
    render(<TransactionsTable />);
    expect(
      screen.getByRole('button', { name: /retry selected/i }),
    ).toBeDisabled();
  });

  it('updates its accessible label to include count when transactions are selected', () => {
    mockUseTransactions.mockReturnValue(
      defaultHookState({
        hasSelection: true,
        selectedCount: 4,
        selectAllFailed: false,
      }),
    );
    render(<TransactionsTable />);
    expect(
      screen.getByRole('button', { name: 'Retry Selected (4)' }),
    ).toBeInTheDocument();
  });

  it('updates its accessible label to "Retry All Failed" in select-all-failed mode', () => {
    mockUseTransactions.mockReturnValue(
      defaultHookState({
        selectAllFailed: true,
        selectedIds: null,
        hasSelection: true,
      }),
    );
    render(<TransactionsTable />);
    expect(
      screen.getByRole('button', { name: 'Retry All Failed' }),
    ).toBeInTheDocument();
  });
});

describe('TransactionsTable — select-all checkbox accessible label', () => {
  it('select-all checkbox is present with an aria-label when failed transactions exist', () => {
    const tx = makeFailedTransaction('txn_f1');

    mockUseTransactions.mockReturnValue(
      defaultHookState({ transactions: [tx], failedTransactions: [tx] }),
    );
    render(<TransactionsTable />);
    expect(
      screen.getByRole('checkbox', {
        name: /select all failed transactions on this page/i,
      }),
    ).toBeInTheDocument();
  });
});

describe('TransactionsTable — loading state identification', () => {
  it('loading state is announced via visible text, not colour alone', () => {
    mockUseTransactions.mockReturnValue(defaultHookState({ loading: true }));
    render(<TransactionsTable />);
    // The loading row must contain legible text so screen readers announce it
    expect(screen.getByText(/loading transactions/i)).toBeInTheDocument();
  });
});

describe('TransactionsTable — error state accessibility', () => {
  it('error message is rendered as visible text', () => {
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

  it('"Try again" button has an accessible name', () => {
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
});
