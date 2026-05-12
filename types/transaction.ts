export type TransactionStatus = 'success' | 'failed' | 'pending';

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  status: TransactionStatus;
}
