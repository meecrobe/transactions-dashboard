# Transactions Dashboard

A subscription management dashboard built with Next.js and TypeScript. Lets customers review transaction history, download invoices, and retry failed payments in bulk.

## Live Demo

- **App:** https://meecrobe.github.io/transactions-dashboard
- **Storybook:** https://meecrobe.github.io/transactions-dashboard/storybook

## Features

- **Transaction history** — paginated list with transaction ID, amount, date/time, and status
- **Invoice download** — simulates a 2-second PDF generation state, then triggers a browser download with a toast notification
- **Batch retry** — select multiple failed transactions and retry them concurrently; each row shows an independent loading spinner and resolves to Success or Failed (20% failure rate, 1–4s random delay per row)

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, static export)
- React 19, TypeScript
- [MSW 2](https://mswjs.io) for API mocking in browser and tests
- [Tailwind CSS 4](https://tailwindcss.com)
- [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) for unit/component tests
- [Playwright](https://playwright.dev) for end-to-end tests
- [Storybook 10](https://storybook.js.org) for component development and documentation

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

| Script                    | Description                           |
| ------------------------- | ------------------------------------- |
| `npm run dev`             | Start the development server          |
| `npm run build`           | Build for production                  |
| `npm run typecheck`       | Run TypeScript type checking          |
| `npm run lint`            | Lint with ESLint                      |
| `npm test`                | Run unit/component tests with Vitest  |
| `npm run test:run`        | Run tests once (no watch)             |
| `npm run test:e2e`        | Run Playwright end-to-end tests       |
| `npm run storybook`       | Start Storybook on port 6006          |
| `npm run build-storybook` | Build Storybook for static deployment |
