import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { delay, http, HttpResponse } from 'msw';

import { worker } from '@/mocks/browser';
import type { Transaction } from '@/types/transaction';

import { TransactionsTable } from './TransactionsTable';

const meta: Meta<typeof TransactionsTable> = {
  component: TransactionsTable,
  title: 'Components/TransactionsTable',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof TransactionsTable>;

const successTx = (id: string): Transaction => ({
  id,
  amount: 49.99,
  currency: 'USD',
  date: '2025-03-15T10:30:00Z',
  description: 'Monthly subscription – Premium',
  status: 'success',
});

const failedTx = (id: string): Transaction => ({
  id,
  amount: 14.99,
  currency: 'USD',
  date: '2025-04-02T08:12:00Z',
  description: 'Monthly subscription – Standard',
  status: 'failed',
});

const pendingTx = (id: string): Transaction => ({
  id,
  amount: 9.99,
  currency: 'USD',
  date: '2025-04-10T14:55:00Z',
  description: 'Monthly subscription – Basic',
  status: 'pending',
});

// Uses the default MSW handlers which serve paginated seed data.
export const Default: Story = {};

export const Loading: Story = {
  beforeEach() {
    worker.use(
      http.get('/api/transactions', async () => {
        await delay('infinite');
      }),
    );
  },
};

export const FetchError: Story = {
  beforeEach() {
    worker.use(
      http.get('/api/transactions', () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 }),
      ),
    );
  },
};

export const Empty: Story = {
  beforeEach() {
    worker.use(
      http.get('/api/transactions', () =>
        HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 10 }),
      ),
    );
  },
};

export const MixedStatuses: Story = {
  beforeEach() {
    const transactions = [
      successTx('txn_s01'),
      failedTx('txn_f01'),
      pendingTx('txn_p01'),
      successTx('txn_s02'),
      failedTx('txn_f02'),
    ];

    worker.use(
      http.get('/api/transactions', () =>
        HttpResponse.json({
          data: transactions,
          total: transactions.length,
          page: 1,
          pageSize: 10,
        }),
      ),
    );
  },
};

export const AllFailed: Story = {
  beforeEach() {
    const transactions = Array.from({ length: 5 }, (_, i) =>
      failedTx(`txn_f0${i + 1}`),
    );
    const ids = transactions.map((t) => t.id);

    worker.use(
      http.get('/api/transactions', () =>
        HttpResponse.json({
          data: transactions,
          total: transactions.length,
          page: 1,
          pageSize: 10,
        }),
      ),
      http.get('/api/transactions/failed-ids', () =>
        HttpResponse.json({ ids }),
      ),
    );
  },
};

export const Paginated: Story = {
  beforeEach() {
    const allTransactions = [
      ...Array.from({ length: 10 }, (_, i) => successTx(`txn_s0${i + 1}`)),
      ...Array.from({ length: 3 }, (_, i) => failedTx(`txn_f0${i + 1}`)),
    ];

    worker.use(
      http.get('/api/transactions', ({ request }) => {
        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
        const pageSize = Math.max(
          1,
          Number(url.searchParams.get('pageSize') ?? 4),
        );
        const start = (page - 1) * pageSize;

        return HttpResponse.json({
          data: allTransactions.slice(start, start + pageSize),
          total: allTransactions.length,
          page,
          pageSize,
        });
      }),
    );
  },
};
