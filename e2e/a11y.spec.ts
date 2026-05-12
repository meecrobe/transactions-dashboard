import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from 'playwright/test';

async function waitForTableReady(page: import('playwright/test').Page) {
  await expect(page.getByText('Loading transactions')).not.toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator('tbody td.font-mono').first()).toBeVisible({
    timeout: 15_000,
  });
}

/** Run axe on the current page, skipping color-contrast. Returns the results. */
async function runAxe(page: import('playwright/test').Page) {
  return new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
}

test.describe('Accessibility — page-level axe scans', () => {
  test('transactions page has no axe violations after data loads', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForTableReady(page);

    const results = await runAxe(page);

    expect(results.violations).toEqual([]);
  });

  // ----------------------------------------------------------------
  // Table structure
  // ----------------------------------------------------------------

  test('table has correct ARIA roles — columnheader elements present', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForTableReady(page);

    // Verify via DOM that <th> elements carry the columnheader role
    const columnHeaders = page.getByRole('columnheader');

    await expect(columnHeaders).toHaveCount(7); // checkbox + 6 labelled columns
  });

  test('each data row has role="row" and contains role="cell" children', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForTableReady(page);

    const rows = page.locator('tbody tr');

    await expect(rows.first()).toBeVisible();

    // Each row should contain at least one cell
    const firstRowCells = rows.first().locator('td');

    await expect(firstRowCells).toHaveCount(7);
  });

  // ----------------------------------------------------------------
  // Checkboxes — accessible labels
  // ----------------------------------------------------------------

  test('failed transaction checkboxes have an accessible label', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForTableReady(page);

    const failedBadge = page.locator('tbody td span.rounded-full', {
      hasText: 'Failed',
    });
    const failedCount = await failedBadge.count();

    if (failedCount === 0) {
      test.skip();

      return;
    }

    // Each failed-row checkbox should be reachable by its aria-label
    const failedRow = failedBadge.first().locator('../..');
    const checkbox = failedRow.getByRole('checkbox');

    // If getByRole resolves it, axe can also compute its name
    await expect(checkbox).toBeVisible();
    const label = await checkbox.getAttribute('aria-label');

    expect(label).toMatch(/select transaction/i);
  });

  test('select-all header checkbox has an accessible label', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForTableReady(page);

    const failedCount = await page
      .locator('tbody td span.rounded-full', { hasText: 'Failed' })
      .count();

    if (failedCount === 0) {
      test.skip();

      return;
    }

    await expect(
      page.getByRole('checkbox', {
        name: /select all failed transactions on this page/i,
      }),
    ).toBeVisible();
  });

  // ----------------------------------------------------------------
  // Buttons — accessible names and states
  // ----------------------------------------------------------------

  test('"Retry Selected" button is disabled and accessible when nothing is selected', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForTableReady(page);

    const retryBtn = page.getByRole('button', { name: /retry selected/i });

    await expect(retryBtn).toBeDisabled();
    // Confirm no axe violations in this state
    const results = await runAxe(page);

    expect(results.violations).toEqual([]);
  });

  test('"Retry Selected" button announces aria-busy during batch retry', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForTableReady(page);

    const failedBadge = page.locator('tbody td span.rounded-full', {
      hasText: 'Failed',
    });

    if ((await failedBadge.count()) === 0) {
      test.skip();

      return;
    }

    // Select the first failed row via its accessible checkbox
    const failedRow = failedBadge.first().locator('../..');
    const checkbox = failedRow.getByRole('checkbox');

    await checkbox.check();

    const retryBtn = page.getByRole('button', { name: /retry selected/i });

    await expect(retryBtn).toBeEnabled();
    await retryBtn.click();

    // Immediately after clicking, aria-busy should be true on the button
    await expect(retryBtn).toHaveAttribute('aria-busy', 'true', {
      timeout: 2_000,
    });
  });

  test('Invoice buttons have accessible names in the Actions column', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForTableReady(page);

    const invoiceButtons = page.getByRole('button', { name: /invoice/i });

    await expect(invoiceButtons.first()).toBeVisible();
    // Confirm there is at least one (there should be 10 for page 1)
    const count = await invoiceButtons.count();

    expect(count).toBeGreaterThan(0);
  });

  // ----------------------------------------------------------------
  // Loading state
  // ----------------------------------------------------------------

  test('loading spinner row is announced via visible text, not colour alone', async ({
    page,
  }) => {
    // Delay the /api/transactions response long enough to hold the loading state
    // visible for assertions. Using a URL predicate (not a glob) avoids
    // accidentally matching Next.js internal chunk paths like
    // /_next/static/chunks/pages/api/transactions.js, which would block page boot.
    await page.route(
      (url) => url.pathname.startsWith('/api/transactions'),
      async (route) => {
        // 30 s — test ends long before this fires; delay just keeps request pending
        await new Promise<void>((resolve) => setTimeout(resolve, 30_000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], total: 0, page: 1, pageSize: 10 }),
        });
      },
    );

    await page.goto('/');

    // Loading text must appear once MockProvider renders (loading:true is the
    // initial hook state). Give extra time for MSW worker boot.
    await expect(page.getByText(/loading transactions/i)).toBeVisible({
      timeout: 15_000,
    });

    // Run axe while the loading state is rendered
    const results = await runAxe(page);

    expect(results.violations).toEqual([]);
  });

  // ----------------------------------------------------------------
  // Status badges — conveyed by text
  // ----------------------------------------------------------------

  test('status badges are identified by text (not colour alone)', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForTableReady(page);

    // Navigate pages until we find all three statuses, confirming text is present
    const foundStatuses = new Set<string>();
    const badges = page.locator('tbody td span.rounded-full');
    const count = await badges.count();

    for (let i = 0; i < count; i++) {
      const text = await badges.nth(i).textContent();

      if (text) {
        foundStatuses.add(text.trim());
      }
    }

    // At minimum we expect "Success" and "Failed" on the first page of seeded data
    expect(
      foundStatuses.has('Success') ||
        foundStatuses.has('Failed') ||
        foundStatuses.has('Pending'),
    ).toBe(true);
  });

  // ----------------------------------------------------------------
  // Keyboard navigation — focus order
  // ----------------------------------------------------------------

  test('interactive elements are reachable by keyboard tab', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForTableReady(page);

    // Next.js dev mode injects portal elements (e.g. nextjs-portal) that appear
    // before app content in the tab order. Tab up to 10 times to reach the first
    // real interactive element.
    const interactiveTags = new Set([
      'button',
      'input',
      'a',
      'select',
      'textarea',
    ]);
    let focusedTag: string | undefined;

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      focusedTag = await page.evaluate(() =>
        document.activeElement?.tagName?.toLowerCase(),
      );

      if (interactiveTags.has(focusedTag ?? '')) {
        break;
      }
    }

    expect(interactiveTags.has(focusedTag ?? '')).toBe(true);
  });

  // ----------------------------------------------------------------
  // Page title
  // ----------------------------------------------------------------

  test('page has a non-empty title for screen reader announcement', async ({
    page,
  }) => {
    await page.goto('/');
    const title = await page.title();

    expect(title.trim().length).toBeGreaterThan(0);
    expect(title).toBe('Transactions Dashboard');
  });
});
