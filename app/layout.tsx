import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';
import { MockProvider } from '@/components/MockProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Transactions Dashboard',
  description:
    'A dashboard showcasing a list of transactions with various features like retrying failed transactions and downloading invoices.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const contentMarkup =
    process.env.NODE_ENV === 'development' ? (
      <MockProvider>{children}</MockProvider>
    ) : (
      children
    );

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{contentMarkup}</body>
    </html>
  );
}
