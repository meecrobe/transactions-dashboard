'use client';

import { memo } from 'react';

import type { Transaction, TransactionStatus } from '@/types/transaction';

import { PlainButton } from '../PlainButton';

interface TransactionRowProps {
  transaction: Transaction;
  isSelected: boolean;
  isRetrying: boolean;
  isDownloadingInvoice: boolean;
  onSelectChange: (id: string, checked: boolean) => void;
  onRetry: (id: string) => void;
  onDownloadInvoice: (id: string) => void;
}

const badgeClasses: Record<TransactionStatus, string> = {
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-amber-100 text-amber-800',
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const locale =
  typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';
const currencyFormatters = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  let fmt = currencyFormatters.get(currency);

  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, { style: 'currency', currency });
    currencyFormatters.set(currency, fmt);
  }

  return fmt;
}

export const TransactionRow = memo(function TransactionRow({
  transaction,
  isSelected,
  isRetrying,
  isDownloadingInvoice,
  onSelectChange,
  onRetry,
  onDownloadInvoice,
}: TransactionRowProps) {
  const { id, amount, currency, date, description, status } = transaction;
  const isFailed = status === 'failed';

  const checkboxMarkup = (
    <input
      type="checkbox"
      checked={isSelected}
      disabled={!isFailed || isRetrying}
      onChange={(e) => onSelectChange(id, e.target.checked)}
      className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
      aria-label={`Select transaction ${id}`}
    />
  );

  const retryButtonMarkup = isFailed ? (
    <PlainButton icon="retry" loading={isRetrying} onClick={() => onRetry(id)}>
      Retry
    </PlainButton>
  ) : null;

  const formattedCurrency = getCurrencyFormatter(currency).format(amount);

  return (
    <tr className="even:bg-zinc-50 hover:bg-indigo-50/40 transition-colors">
      <td className="w-10 px-4 py-3">{checkboxMarkup}</td>

      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{id}</td>

      <td className="px-4 py-3 text-sm text-zinc-700">{description}</td>

      <td className="px-4 py-3 text-sm text-zinc-900 text-right tabular-nums">
        {formattedCurrency}
      </td>

      <td className="px-4 py-3 text-sm text-zinc-500 whitespace-nowrap">
        {dateFormatter.format(new Date(date))}
      </td>

      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClasses[status]}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <PlainButton
            icon="download"
            onClick={() => onDownloadInvoice(id)}
            loading={isDownloadingInvoice}
          >
            Invoice
          </PlainButton>

          {retryButtonMarkup}
        </div>
      </td>
    </tr>
  );
});
