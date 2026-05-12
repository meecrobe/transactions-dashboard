import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { Transaction } from '@/types/transaction';

import { TransactionRow } from './TransactionRow';

const baseTransaction: Transaction = {
  id: 'txn_001',
  amount: 49.99,
  currency: 'USD',
  date: '2025-01-15T10:30:00Z',
  description: 'Monthly subscription',
  status: 'success',
};

const meta: Meta<typeof TransactionRow> = {
  component: TransactionRow,
  title: 'Components/TransactionRow',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <table>
        <tbody>
          <Story />
        </tbody>
      </table>
    ),
  ],
  args: {
    transaction: baseTransaction,
    isSelected: false,
    isRetrying: false,
    isDownloadingInvoice: false,
    onSelectChange: () => {},
    onRetry: () => {},
    onDownloadInvoice: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof TransactionRow>;

export const Success: Story = {};

export const Failed: Story = {
  args: {
    transaction: { ...baseTransaction, status: 'failed' },
  },
};

export const Pending: Story = {
  args: {
    transaction: { ...baseTransaction, status: 'pending' },
  },
};

export const Retrying: Story = {
  args: {
    transaction: { ...baseTransaction, status: 'failed' },
    isRetrying: true,
  },
};

export const DownloadingInvoice: Story = {
  args: {
    isDownloadingInvoice: true,
  },
};

export const Selected: Story = {
  args: {
    transaction: { ...baseTransaction, status: 'failed' },
    isSelected: true,
  },
};
