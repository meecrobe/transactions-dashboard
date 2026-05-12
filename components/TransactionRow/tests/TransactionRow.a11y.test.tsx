import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { TransactionRow } from '@/components/TransactionRow';
import type { Transaction } from '@/types/transaction';

const base: Transaction = {
  id: 'txn_001',
  amount: 14.99,
  currency: 'USD',
  date: '2026-05-10T08:23:11Z',
  description: 'Monthly subscription – Basic',
  status: 'success',
};

function renderRow(
  overrides: Partial<Transaction> = {},
  props: Record<string, unknown> = {},
) {
  const tx = { ...base, ...overrides };

  return render(
    <table>
      <tbody>
        <TransactionRow
          transaction={tx}
          isSelected={false}
          isRetrying={false}
          isDownloadingInvoice={false}
          onSelectChange={vi.fn()}
          onRetry={vi.fn()}
          onDownloadInvoice={vi.fn()}
          {...props}
        />
      </tbody>
    </table>,
  );
}

describe('TransactionRow — axe violations', () => {
  it('has no axe violations for a success transaction', async () => {
    const { container } = renderRow({ status: 'success' });
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has no axe violations for a failed transaction (idle)', async () => {
    const { container } = renderRow({ status: 'failed' });
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has no axe violations for a pending transaction', async () => {
    const { container } = renderRow({ status: 'pending' });
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has no axe violations when the row retry button is in loading state', async () => {
    const { container } = renderRow({ status: 'failed' }, { isRetrying: true });
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has no axe violations when the invoice button is in loading state', async () => {
    const { container } = renderRow(
      { status: 'success' },
      { isDownloadingInvoice: true },
    );
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});

describe('TransactionRow — checkbox accessibility', () => {
  it('checkbox has an accessible label containing the transaction id', () => {
    renderRow({ status: 'failed', id: 'txn_abc' });
    const checkbox = screen.getByRole('checkbox', {
      name: /select transaction txn_abc/i,
    });

    expect(checkbox).toBeInTheDocument();
  });

  it('checkbox for a non-failed row is disabled so it cannot receive focus unintentionally', () => {
    renderRow({ status: 'success' });
    const checkbox = screen.getByRole('checkbox');

    expect(checkbox).toBeDisabled();
  });

  it('checkbox for a failed row is enabled', () => {
    renderRow({ status: 'failed' });
    const checkbox = screen.getByRole('checkbox');

    expect(checkbox).toBeEnabled();
  });
});

describe('TransactionRow — status badge text', () => {
  it('status badge for "success" contains visible text "Success"', () => {
    renderRow({ status: 'success' });
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('status badge for "failed" contains visible text "Failed"', () => {
    renderRow({ status: 'failed' });
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('status badge for "pending" contains visible text "Pending"', () => {
    renderRow({ status: 'pending' });
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});

describe('TransactionRow — spinner role when loading', () => {
  it('spinner has role="status" when the invoice button is loading', () => {
    renderRow({ status: 'success' }, { isDownloadingInvoice: true });
    // Icon renders a <span role="status"> wrapping the animated SVG
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('spinner has role="status" when the retry button is loading', () => {
    renderRow({ status: 'failed' }, { isRetrying: true });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('no role="status" element is present when neither button is loading', () => {
    renderRow({ status: 'failed' });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('TransactionRow — button accessible names', () => {
  it('Invoice button has an accessible name "Invoice"', () => {
    renderRow({ status: 'success' });
    expect(
      screen.getByRole('button', { name: /invoice/i }),
    ).toBeInTheDocument();
  });

  it('Retry button for a failed row has an accessible name "Retry"', () => {
    renderRow({ status: 'failed' });
    expect(
      screen.getByRole('button', { name: /^retry$/i }),
    ).toBeInTheDocument();
  });

  it('Invoice button is disabled while a download is in progress', () => {
    renderRow({ status: 'success' }, { isDownloadingInvoice: true });
    expect(screen.getByRole('button', { name: /invoice/i })).toBeDisabled();
  });

  it('Retry button is disabled while the row retry is in progress', () => {
    renderRow({ status: 'failed' }, { isRetrying: true });
    expect(screen.getByRole('button', { name: /^retry$/i })).toBeDisabled();
  });
});
