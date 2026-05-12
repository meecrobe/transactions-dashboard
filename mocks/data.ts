import { faker } from '@faker-js/faker';

import type { Transaction, TransactionStatus } from '@/types/transaction';

faker.seed(4242);

const PLANS = [
  { label: 'Basic', amount: 9.99 },
  { label: 'Standard', amount: 14.99 },
  { label: 'Premium', amount: 49.99 },
];

const STATUSES: {
  weight: number;
  value: TransactionStatus;
}[] = [
  { weight: 0.7, value: 'success' },
  { weight: 0.2, value: 'failed' },
  { weight: 0.1, value: 'pending' },
];

function makeTransaction(): Transaction {
  const plan = faker.helpers.arrayElement(PLANS);
  const status = faker.helpers.weightedArrayElement(STATUSES);

  return {
    id: faker.string.numeric({
      length: 8,
    }),
    amount: plan.amount,
    currency: 'USD',
    date: faker.date
      .between({ from: '2025-01-01T00:00:00Z', to: '2026-05-11T23:59:59Z' })
      .toISOString(),
    description: `Monthly subscription – ${plan.label}`,
    status,
  };
}

export const transactions: Transaction[] = Array.from({ length: 42 }, () =>
  makeTransaction(),
).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
