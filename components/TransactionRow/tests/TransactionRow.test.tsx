import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

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

function renderRow(overrides: Partial<Transaction> = {}, props = {}) {
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

describe('TransactionRow', () => {
  it('renders transaction id, description and amount', () => {
    renderRow();
    expect(screen.getByText('txn_001')).toBeInTheDocument();
    expect(
      screen.getByText('Monthly subscription – Basic'),
    ).toBeInTheDocument();
    expect(screen.getByText('$14.99')).toBeInTheDocument();
  });

  it('shows Success badge for successful transaction', () => {
    renderRow({ status: 'success' });
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('shows Failed badge for failed transaction', () => {
    renderRow({ status: 'failed' });
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('shows checkbox only for failed transactions', () => {
    renderRow({ status: 'failed' });
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('disables checkbox for successful transactions', () => {
    renderRow({ status: 'success' });
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('shows Retry button only for failed transactions', () => {
    renderRow({ status: 'failed' });
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('does not show Retry button for successful transactions', () => {
    renderRow({ status: 'success' });
    expect(
      screen.queryByRole('button', { name: /retry/i }),
    ).not.toBeInTheDocument();
  });

  it('calls onRetry with transaction id when Retry is clicked', async () => {
    const onRetry = vi.fn();

    render(
      <table>
        <tbody>
          <TransactionRow
            transaction={{ ...base, status: 'failed' }}
            isSelected={false}
            isRetrying={false}
            isDownloadingInvoice={false}
            onSelectChange={vi.fn()}
            onRetry={onRetry}
            onDownloadInvoice={vi.fn()}
          />
        </tbody>
      </table>,
    );
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledWith('txn_001');
  });

  it('calls onDownloadInvoice when Invoice is clicked', async () => {
    const onDownloadInvoice = vi.fn();

    render(
      <table>
        <tbody>
          <TransactionRow
            transaction={base}
            isSelected={false}
            isRetrying={false}
            isDownloadingInvoice={false}
            onSelectChange={vi.fn()}
            onRetry={vi.fn()}
            onDownloadInvoice={onDownloadInvoice}
          />
        </tbody>
      </table>,
    );
    await userEvent.click(screen.getByRole('button', { name: /invoice/i }));
    expect(onDownloadInvoice).toHaveBeenCalledWith('txn_001');
  });

  it('calls onSelectChange when checkbox is toggled', async () => {
    const onSelectChange = vi.fn();

    render(
      <table>
        <tbody>
          <TransactionRow
            transaction={{ ...base, status: 'failed' }}
            isSelected={false}
            isRetrying={false}
            isDownloadingInvoice={false}
            onSelectChange={onSelectChange}
            onRetry={vi.fn()}
            onDownloadInvoice={vi.fn()}
          />
        </tbody>
      </table>,
    );
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onSelectChange).toHaveBeenCalledWith('txn_001', true);
  });
});
