import { http, HttpResponse } from 'msw';

import type { Transaction } from '@/types/transaction';

import { transactions as seedData } from './data';

// In-memory store so retries can mutate state within a session
const store: Transaction[] = seedData.map((t) => ({ ...t }));

const delay = (min: number, max: number) =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min),
  );

export const handlers = [
  http.get('/api/transactions', ({ request }) => {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
    const pageSize = Math.max(
      1,
      Number(url.searchParams.get('pageSize') ?? 20),
    );
    const start = (page - 1) * pageSize;

    return HttpResponse.json({
      data: store.slice(start, start + pageSize),
      total: store.length,
      page,
      pageSize,
    });
  }),

  http.post('/api/transactions/:id/retry', async ({ params }) => {
    const { id } = params as { id: string };

    await delay(1000, 4000);

    const tx = store.find((t) => t.id === id);

    if (!tx) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // 20% failure rate
    const succeeded = Math.random() > 0.2;

    tx.status = succeeded ? 'success' : 'failed';

    return HttpResponse.json({ id, status: tx.status });
  }),

  http.get('/api/transactions/failed-ids', () => {
    const ids = store.filter((t) => t.status === 'failed').map((t) => t.id);

    return HttpResponse.json({ ids });
  }),

  http.get('/api/transactions/:id/invoice', async ({ params }) => {
    const { id } = params as { id: string };

    await delay(2000, 2000);

    const tx = store.find((t) => t.id === id);

    if (!tx) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Return a minimal PDF-like blob (just a text file for the mock)
    const content = `INVOICE\nTransaction: ${id}\nAmount: ${tx.currency} ${tx.amount}\nDate: ${tx.date}\nStatus: ${tx.status}`;

    return new HttpResponse(content, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="invoice-${id}.txt"`,
      },
    });
  }),
];
