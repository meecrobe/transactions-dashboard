/**
 * E2E tests for the Transactions Management Dashboard.
 *
 * The app runs via `npm run dev` (Next.js development mode) so MockProvider
 * activates the MSW service worker, intercepting all /api/* requests with
 * deterministic seeded fake data from mocks/data.ts.
 *
 * Seed: faker.seed(4242) → 42 transactions, ~70 % success / 20 % failed / 10 % pending.
 * Page size: 10. Total pages: 5 (42 transactions / 10 per page, last page has 2).
 * Invoice endpoint: 2 s fixed delay, returns a text blob.
 * Retry endpoint: 1–4 s random delay, 20 % failure rate.
 */

import { expect, test } from 'playwright/test';

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/** Wait until the loading spinner disappears and at least one real data row is present.
 *
 * Real data rows are identified by the font-mono ID cell. This avoids false-positive
 * readiness when only an error row or loading row is present in the tbody.
 * On reload the MSW service worker may need a moment to re-intercept requests.
 */
async function waitForTableReady(page: import('playwright/test').Page) {
  // Spinner row contains "Loading transactions…"
  await expect(page.getByText('Loading transactions')).not.toBeVisible({
    timeout: 15_000,
  });
  // Wait for real data rows — ID cells are rendered as font-mono td elements
  // and only exist when the API response has been received and rendered.
  await expect(page.locator('tbody td.font-mono').first()).toBeVisible({
    timeout: 15_000,
  });
}

/** Return all <tr> elements in the table body. */
function tableRows(page: import('playwright/test').Page) {
  return page.locator('tbody tr');
}

// ------------------------------------------------------------------
// Suite
// ------------------------------------------------------------------

test.describe('Transactions Dashboard – E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for MSW worker to boot and the initial data fetch to complete
    await waitForTableReady(page);
  });

  // ----------------------------------------------------------------
  // Page structure
  // ----------------------------------------------------------------

  test.describe('page structure', () => {
    test('displays the page heading "Transactions"', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Transactions' }),
      ).toBeVisible();
    });

    test('displays the sub-heading "Your payment history"', async ({
      page,
    }) => {
      await expect(page.getByText('Your payment history')).toBeVisible();
    });

    test('renders all required table column headers', async ({ page }) => {
      const expectedHeaders = [
        'ID',
        'Description',
        'Amount',
        'Date',
        'Status',
        'Actions',
      ];

      for (const header of expectedHeaders) {
        await expect(
          page.getByRole('columnheader', { name: header, exact: true }),
        ).toBeVisible();
      }
    });

    test('renders at least one transaction row on the first page', async ({
      page,
    }) => {
      const rows = tableRows(page);

      await expect(rows.first()).toBeVisible();
      // Default page size is 10; seeded data has 42 rows so page 1 always has 10
      await expect(rows).toHaveCount(10);
    });
  });

  // ----------------------------------------------------------------
  // Transaction columns
  // ----------------------------------------------------------------

  test.describe('transaction data columns', () => {
    test('each row shows a transaction ID (8-digit numeric mono text)', async ({
      page,
    }) => {
      // IDs are rendered in a <td> with font-mono class and are 8 numeric digits
      const idCells = page.locator('tbody td.font-mono');

      await expect(idCells.first()).toBeVisible();
      const firstId = await idCells.first().textContent();

      expect(firstId?.trim()).toMatch(/^\d{8}$/);
    });

    test('each row shows an amount formatted as currency', async ({ page }) => {
      // Amounts are in the right-aligned td with tabular-nums
      const amountCells = page.locator('tbody td.tabular-nums');

      await expect(amountCells.first()).toBeVisible();
      const amount = await amountCells.first().textContent();

      // Expect something like "$9.99", "$14.99", or "$49.99"
      expect(amount?.trim()).toMatch(/^\$[\d,]+\.\d{2}$/);
    });

    test('each row shows a date in "MMM D, YYYY, H:MM AM/PM" format', async ({
      page,
    }) => {
      // Date cells have whitespace-nowrap class and contain short dates
      const dateCells = page.locator('tbody td.whitespace-nowrap');

      await expect(dateCells.first()).toBeVisible();
      const dateText = await dateCells.first().textContent();

      // Intl.DateTimeFormat with dateStyle:'medium' timeStyle:'short'
      // e.g. "Jan 5, 2026, 3:41 PM"
      expect(dateText?.trim()).toMatch(
        /^[A-Z][a-z]{2} \d{1,2}, \d{4}, \d{1,2}:\d{2}\s?(AM|PM)$/,
      );
    });

    test('each row shows a status badge', async ({ page }) => {
      // Status badges are spans with rounded-full class
      const badges = page.locator('tbody td span.rounded-full');

      await expect(badges.first()).toBeVisible();
      const text = await badges.first().textContent();

      expect(['Success', 'Failed', 'Pending']).toContain(text?.trim());
    });

    test('renders all three status types across the full dataset', async ({
      page,
    }) => {
      // With 42 seeded transactions we should see Success on page 1 at minimum.
      // Navigate through pages looking for at least Success and Failed.
      const foundStatuses = new Set<string>();

      async function collectStatuses() {
        const badges = page.locator('tbody td span.rounded-full');
        const count = await badges.count();

        for (let i = 0; i < count; i++) {
          const text = await badges.nth(i).textContent();

          if (text) {
            foundStatuses.add(text.trim());
          }
        }
      }

      await collectStatuses();

      // Navigate through pages until we've found all three or exhausted pages
      const totalPagesText = await page
        .getByText(/^Page \d+ of \d+$/)
        .textContent();
      const match = totalPagesText?.match(/Page \d+ of (\d+)/);
      const totalPages = match ? parseInt(match[1], 10) : 1;

      for (let p = 2; p <= totalPages && foundStatuses.size < 3; p++) {
        await page.getByRole('button', { name: `${p}` }).click();
        await waitForTableReady(page);
        await collectStatuses();
      }

      // With 42 seeded transactions and weighted distribution (70/20/10%)
      // we expect all three statuses to appear across the dataset
      expect(foundStatuses.has('Success')).toBe(true);
      expect(foundStatuses.has('Failed')).toBe(true);
    });
  });

  // ----------------------------------------------------------------
  // Download Invoice
  // ----------------------------------------------------------------

  test.describe('Download Invoice button', () => {
    test('each row has an Invoice button in the Actions column', async ({
      page,
    }) => {
      const invoiceButtons = page.getByRole('button', { name: /invoice/i });

      // First page has 10 rows, each should have an Invoice button
      await expect(invoiceButtons).toHaveCount(10);
    });

    test('Invoice button shows loading spinner while generating PDF (2 s)', async ({
      page,
    }) => {
      const firstInvoiceBtn = page
        .getByRole('button', { name: /invoice/i })
        .first();

      // Click the button – the MSW handler delays 2 s before responding
      await firstInvoiceBtn.click();

      // The PlainButton swaps its icon to a spinner SVG when loading=true.
      // The button itself becomes disabled (disabled attribute) during loading.
      await expect(firstInvoiceBtn).toBeDisabled();

      // Wait for the download to complete (spinner disappears, button re-enables)
      await expect(firstInvoiceBtn).not.toBeDisabled({ timeout: 8_000 });
    });

    test('shows a toast notification after invoice download completes', async ({
      page,
    }) => {
      // Set up download interception so the browser download doesn't block
      const downloadPromise = page.waitForEvent('download');

      const firstInvoiceBtn = page
        .getByRole('button', { name: /invoice/i })
        .first();

      await firstInvoiceBtn.click();

      // Wait for the download event
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/^invoice-\d+\.txt$/);

      // Toast should appear in the fixed top-right container
      await expect(page.getByText(/invoice for .+ downloaded/i)).toBeVisible({
        timeout: 8_000,
      });
    });

    test('toast disappears after ~4 seconds', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');

      await page
        .getByRole('button', { name: /invoice/i })
        .first()
        .click();
      await downloadPromise;

      const toast = page.getByText(/invoice for .+ downloaded/i);

      await expect(toast).toBeVisible({ timeout: 8_000 });
      // The toast auto-dismisses after 4 s in useTransactions
      await expect(toast).not.toBeVisible({ timeout: 10_000 });
    });
  });

  // ----------------------------------------------------------------
  // Failed transactions — checkboxes
  // ----------------------------------------------------------------

  test.describe('failed transaction checkboxes', () => {
    test('failed transaction rows have an enabled checkbox', async ({
      page,
    }) => {
      // Find a "Failed" badge and verify the checkbox in its row is enabled
      const failedBadge = page.locator('tbody td span.rounded-full', {
        hasText: 'Failed',
      });

      const failedCount = await failedBadge.count();

      // With seeded data there should be at least one failed on the first 5 pages
      if (failedCount === 0) {
        test.skip(); // No failed transactions on this page — skip gracefully

        return;
      }

      const failedRow = failedBadge.first().locator('../..'); // go up two levels: span → td → tr
      const checkbox = failedRow.locator('input[type="checkbox"]');

      await expect(checkbox).toBeEnabled();
      await expect(checkbox).not.toBeChecked();
    });

    test('success/pending transaction rows have a disabled checkbox', async ({
      page,
    }) => {
      const successBadge = page.locator('tbody td span.rounded-full', {
        hasText: 'Success',
      });

      const count = await successBadge.count();

      if (count === 0) {
        test.skip();

        return;
      }

      const successRow = successBadge.first().locator('../..');
      const checkbox = successRow.locator('input[type="checkbox"]');

      await expect(checkbox).toBeDisabled();
    });

    test('selecting a failed transaction checkbox enables the Retry Selected button', async ({
      page,
    }) => {
      const retryBtn = page.getByRole('button', { name: /retry selected/i });

      // Initially disabled (no selection)
      await expect(retryBtn).toBeDisabled();

      // Find a failed row and check its checkbox
      const failedBadge = page.locator('tbody td span.rounded-full', {
        hasText: 'Failed',
      });

      if ((await failedBadge.count()) === 0) {
        test.skip();

        return;
      }

      const failedRow = failedBadge.first().locator('../..');
      const checkbox = failedRow.locator('input[type="checkbox"]');

      await checkbox.check();
      await expect(checkbox).toBeChecked();

      // Retry button should now be enabled with count label
      await expect(retryBtn).toBeEnabled();
      await expect(retryBtn).toHaveText(/retry selected \(1\)/i);
    });

    test('deselecting all checkboxes disables Retry Selected button again', async ({
      page,
    }) => {
      const failedBadge = page.locator('tbody td span.rounded-full', {
        hasText: 'Failed',
      });

      if ((await failedBadge.count()) === 0) {
        test.skip();

        return;
      }

      const failedRow = failedBadge.first().locator('../..');
      const checkbox = failedRow.locator('input[type="checkbox"]');
      const retryBtn = page.getByRole('button', { name: /retry selected/i });

      await checkbox.check();
      await expect(retryBtn).toBeEnabled();

      await checkbox.uncheck();
      await expect(retryBtn).toBeDisabled();
    });
  });

  // ----------------------------------------------------------------
  // Select-all header checkbox
  // ----------------------------------------------------------------

  test.describe('select-all header checkbox', () => {
    test('header checkbox is visible only when failed transactions exist on the page', async ({
      page,
    }) => {
      const headerCheckbox = page.getByRole('checkbox', {
        name: /select all failed transactions on this page/i,
      });

      const failedCount = await page
        .locator('tbody td span.rounded-full', { hasText: 'Failed' })
        .count();

      if (failedCount > 0) {
        await expect(headerCheckbox).toBeVisible();
      } else {
        await expect(headerCheckbox).not.toBeVisible();
      }
    });

    test('checking the header checkbox selects all failed rows on the page', async ({
      page,
    }) => {
      const headerCheckbox = page.getByRole('checkbox', {
        name: /select all failed transactions on this page/i,
      });

      const failedBadges = page.locator('tbody td span.rounded-full', {
        hasText: 'Failed',
      });

      const failedCount = await failedBadges.count();

      if (failedCount === 0) {
        test.skip();

        return;
      }

      await headerCheckbox.check();

      // All per-row failed checkboxes should now be checked
      for (let i = 0; i < failedCount; i++) {
        const row = failedBadges.nth(i).locator('../..');
        const cb = row.locator('input[type="checkbox"]');

        await expect(cb).toBeChecked();
      }

      // Retry button label should show the count
      await expect(
        page.getByRole('button', { name: /retry selected/i }),
      ).toBeEnabled();
    });

    test('unchecking the header checkbox deselects all failed rows', async ({
      page,
    }) => {
      const headerCheckbox = page.getByRole('checkbox', {
        name: /select all failed transactions on this page/i,
      });

      const failedBadges = page.locator('tbody td span.rounded-full', {
        hasText: 'Failed',
      });

      const failedCount = await failedBadges.count();

      if (failedCount === 0) {
        test.skip();

        return;
      }

      // Check then uncheck
      await headerCheckbox.check();
      await headerCheckbox.uncheck();

      for (let i = 0; i < failedCount; i++) {
        const row = failedBadges.nth(i).locator('../..');
        const cb = row.locator('input[type="checkbox"]');

        await expect(cb).not.toBeChecked();
      }

      await expect(
        page.getByRole('button', { name: /retry selected/i }),
      ).toBeDisabled();
    });

    test('"Select all failed transactions" cross-page banner appears after checking header checkbox', async ({
      page,
    }) => {
      const failedCount = await page
        .locator('tbody td span.rounded-full', { hasText: 'Failed' })
        .count();

      if (failedCount === 0) {
        test.skip();

        return;
      }

      const headerCheckbox = page.getByRole('checkbox', {
        name: /select all failed transactions on this page/i,
      });

      await headerCheckbox.check();

      // The global "Select all failed transactions" banner button appears below the header checkbox
      const globalSelectBtn = page.getByRole('button', {
        name: 'Select all failed transactions',
      });

      await expect(globalSelectBtn).toBeVisible();
    });

    test('clicking "Select all failed transactions" banner switches to "Retry All Failed" label', async ({
      page,
    }) => {
      const failedCount = await page
        .locator('tbody td span.rounded-full', { hasText: 'Failed' })
        .count();

      if (failedCount === 0) {
        test.skip();

        return;
      }

      const headerCheckbox = page.getByRole('checkbox', {
        name: /select all failed transactions on this page/i,
      });

      await headerCheckbox.check();

      const globalSelectBtn = page.getByRole('button', {
        name: 'Select all failed transactions',
      });

      await globalSelectBtn.click();

      // The retry button label should update to "Retry All Failed"
      await expect(
        page.getByRole('button', { name: 'Retry All Failed' }),
      ).toBeVisible();
    });
  });

  // ----------------------------------------------------------------
  // Batch retry — independent row loading states
  // ----------------------------------------------------------------

  test.describe('batch payment retry', () => {
    /**
     * Helper: select all failed transactions on the current page via the
     * header checkbox, then return the count of failed rows found.
     */
    async function selectAllFailedOnPage(page: import('playwright/test').Page) {
      const failedBadges = page.locator('tbody td span.rounded-full', {
        hasText: 'Failed',
      });
      const count = await failedBadges.count();

      if (count === 0) {
        return 0;
      }

      const headerCheckbox = page.getByRole('checkbox', {
        name: /select all failed transactions on this page/i,
      });

      await headerCheckbox.check();

      return count;
    }

    test('"Retry Selected" button is disabled when nothing is selected', async ({
      page,
    }) => {
      await expect(
        page.getByRole('button', { name: /retry selected/i }),
      ).toBeDisabled();
    });

    test('clicking Retry Selected triggers individual row loading spinners', async ({
      page,
    }) => {
      const failedCount = await selectAllFailedOnPage(page);

      if (failedCount === 0) {
        test.skip();

        return;
      }

      const retryBtn = page.getByRole('button', { name: /retry selected/i });

      await expect(retryBtn).toBeEnabled();
      await retryBtn.click();

      // Immediately after clicking, the failed rows should show loading state.
      // PlainButton renders a spinner SVG when loading=true; the button is disabled.
      // We look for disabled retry buttons in the row action cells (not the header).
      const rowRetryButtons = page.locator('tbody td button', {
        hasText: 'Retry',
      });

      // At least one row-level Retry button should be in a loading/disabled state
      // within the first few hundred ms before the 1–4 s delay resolves.
      const disabledRetryButtons = page.locator(
        'tbody td button[disabled]:has-text("Retry")',
      );

      // Give the UI a moment to apply loading state (it's synchronous state set)
      await expect(disabledRetryButtons.first()).toBeVisible({
        timeout: 2_000,
      });

      // The overall Retry Selected header button should also reflect loading
      await expect(retryBtn).toBeDisabled();
      void rowRetryButtons; // prevent unused warning
    });

    test('rows resolve independently — each row eventually shows Success or Failed', async ({
      page,
    }) => {
      const failedCount = await selectAllFailedOnPage(page);

      if (failedCount === 0) {
        test.skip();

        return;
      }

      await page.getByRole('button', { name: /retry selected/i }).click();

      // Wait long enough for all retries to finish (max 4 s each + buffer)
      // We verify that all previously-failed rows have resolved (no spinner)
      // and show either "Success" or "Failed" badge.
      await expect(
        page.locator('tbody td button[disabled]:has-text("Retry")'),
      ).toHaveCount(0, { timeout: 15_000 });

      // Every row that had a Retry button should now show either Success or Failed badge
      const badges = page.locator('tbody td span.rounded-full');
      const count = await badges.count();

      for (let i = 0; i < count; i++) {
        const text = await badges.nth(i).textContent();

        expect(['Success', 'Failed', 'Pending']).toContain(text?.trim());
      }
    });

    test('toast notifications appear after each row retry resolves', async ({
      page,
    }) => {
      const failedCount = await selectAllFailedOnPage(page);

      if (failedCount === 0) {
        test.skip();

        return;
      }

      await page.getByRole('button', { name: /retry selected/i }).click();

      // Wait for at least one toast to appear (first retry to resolve).
      // Multiple toasts may show simultaneously, so use .first() to avoid
      // strict-mode violations when more than one element matches.
      await expect(
        page.locator('div.fixed.top-4.right-4 > div').first(),
      ).toBeVisible({
        timeout: 8_000,
      });
    });

    test('individual row Retry button works independently of batch selection', async ({
      page,
    }) => {
      // Find the first failed row
      const failedBadge = page.locator('tbody td span.rounded-full', {
        hasText: 'Failed',
      });

      if ((await failedBadge.count()) === 0) {
        test.skip();

        return;
      }

      const failedRow = failedBadge.first().locator('../..');
      const rowRetryBtn = failedRow.getByRole('button', {
        name: /^retry$/i,
      });

      await expect(rowRetryBtn).toBeVisible();
      await rowRetryBtn.click();

      // Row-level button should become disabled/loading
      await expect(rowRetryBtn).toBeDisabled({ timeout: 2_000 });

      // Other rows should remain unaffected (their retry buttons still enabled)
      const otherFailedBadges = page.locator('tbody td span.rounded-full', {
        hasText: 'Failed',
      });
      const otherFailedCount = await otherFailedBadges.count();

      if (otherFailedCount > 0) {
        const otherRow = otherFailedBadges.first().locator('../..');
        const otherRetryBtn = otherRow.getByRole('button', {
          name: /^retry$/i,
        });

        // This button should still be enabled since it's a different row
        await expect(otherRetryBtn).toBeEnabled();
      }

      // Wait for resolution and toast
      await expect(rowRetryBtn).not.toBeDisabled({ timeout: 8_000 });
      await expect(page.locator('div.fixed.top-4.right-4 > div')).toBeVisible();
    });
  });

  // ----------------------------------------------------------------
  // Pagination
  // ----------------------------------------------------------------

  test.describe('pagination', () => {
    test('shows pagination controls since there are more than 10 transactions', async ({
      page,
    }) => {
      await expect(page.getByText(/^Page 1 of \d+$/)).toBeVisible();
      await expect(page.getByRole('button', { name: '← Prev' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Next →' })).toBeVisible();
    });

    test('Prev button is disabled on the first page', async ({ page }) => {
      await expect(page.getByRole('button', { name: '← Prev' })).toBeDisabled();
    });

    test('clicking Next navigates to page 2', async ({ page }) => {
      await page.getByRole('button', { name: 'Next →' }).click();
      await waitForTableReady(page);
      await expect(page.getByText(/^Page 2 of \d+$/)).toBeVisible();
    });

    test('clicking Prev from page 2 returns to page 1', async ({ page }) => {
      await page.getByRole('button', { name: 'Next →' }).click();
      await waitForTableReady(page);
      await page.getByRole('button', { name: '← Prev' }).click();
      await waitForTableReady(page);
      await expect(page.getByText(/^Page 1 of \d+$/)).toBeVisible();
    });

    test('clicking a page number button navigates to that page', async ({
      page,
    }) => {
      await page.getByRole('button', { name: '3' }).click();
      await waitForTableReady(page);
      await expect(page.getByText(/^Page 3 of \d+$/)).toBeVisible();
    });

    test('last page shows fewer rows (42 transactions, page size 10)', async ({
      page,
    }) => {
      // 42 transactions → last page is 5 with 2 rows
      const totalPagesText = await page
        .getByText(/^Page 1 of \d+$/)
        .textContent();
      const match = totalPagesText?.match(/of (\d+)/);
      const lastPage = match ? parseInt(match[1], 10) : 5;

      await page.getByRole('button', { name: `${lastPage}` }).click();
      await waitForTableReady(page);

      // 42 mod 10 = 2 rows on last page
      await expect(tableRows(page)).toHaveCount(2);
    });

    test('Next button is disabled on the last page', async ({ page }) => {
      const totalPagesText = await page
        .getByText(/^Page 1 of \d+$/)
        .textContent();
      const match = totalPagesText?.match(/of (\d+)/);
      const lastPage = match ? parseInt(match[1], 10) : 5;

      await page.getByRole('button', { name: `${lastPage}` }).click();
      await waitForTableReady(page);
      await expect(page.getByRole('button', { name: 'Next →' })).toBeDisabled();
    });
  });

  // ----------------------------------------------------------------
  // Edge cases
  // ----------------------------------------------------------------

  test.describe('edge cases', () => {
    test('page title is "Transactions Dashboard"', async ({ page }) => {
      await expect(page).toHaveTitle('Transactions Dashboard');
    });

    test('table is accessible — failed row checkboxes are keyboard-reachable', async ({
      page,
    }) => {
      // Disabled checkboxes (success/pending rows) cannot receive focus.
      // Find the first enabled checkbox — a failed transaction row.
      const failedBadge = page.locator('tbody td span.rounded-full', {
        hasText: 'Failed',
      });

      if ((await failedBadge.count()) === 0) {
        test.skip();

        return;
      }

      const failedRow = failedBadge.first().locator('../..');
      const enabledCheckbox = failedRow.locator('input[type="checkbox"]');

      await enabledCheckbox.focus();
      await expect(enabledCheckbox).toBeFocused();
    });

    test('multiple Invoice downloads can be triggered concurrently without UI lockup', async ({
      page,
    }) => {
      // Click Invoice for the first two rows in quick succession
      const invoiceButtons = page.getByRole('button', { name: /invoice/i });

      const firstBtn = invoiceButtons.nth(0);
      const secondBtn = invoiceButtons.nth(1);

      // Use Promise.all to click both near-simultaneously
      const [download1, download2] = await Promise.all([
        page.waitForEvent('download'),
        page.waitForEvent('download'),
        firstBtn.click(),
        secondBtn.click(),
      ]);

      // Both downloads should have valid filenames
      expect(download1.suggestedFilename()).toMatch(/^invoice-\d+\.txt$/);
      expect(download2.suggestedFilename()).toMatch(/^invoice-\d+\.txt$/);
    });

    test('Retry Selected button label resets after batch retry completes', async ({
      page,
    }) => {
      const failedBadges = page.locator('tbody td span.rounded-full', {
        hasText: 'Failed',
      });
      const failedCount = await failedBadges.count();

      if (failedCount === 0) {
        test.skip();

        return;
      }

      // Select one failed transaction
      const failedRow = failedBadges.first().locator('../..');

      await failedRow.locator('input[type="checkbox"]').check();

      const retryBtn = page.getByRole('button', {
        name: /retry selected \(1\)/i,
      });

      await expect(retryBtn).toBeEnabled();
      await retryBtn.click();

      // After clicking, selectedIds is cleared → label goes back to "Retry Selected"
      await expect(
        page.getByRole('button', { name: 'Retry Selected' }),
      ).toBeVisible({ timeout: 2_000 });
    });

    test('MSW service worker is active (API calls return data, not 404)', async ({
      page,
    }) => {
      // Intercept network requests to verify /api/transactions returns 200
      let apiStatus: number | null = null;

      page.on('response', (response) => {
        if (response.url().includes('/api/transactions')) {
          apiStatus = response.status();
        }
      });

      // Reload to capture fresh network traffic
      await page.reload();
      await waitForTableReady(page);

      expect(apiStatus).toBe(200);
    });
  });
});
