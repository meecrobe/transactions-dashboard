import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { PlainButton } from '../PlainButton';

describe('PlainButton — axe violations', () => {
  it('has no axe violations in idle state', async () => {
    const { container } = render(
      <PlainButton onClick={vi.fn()}>Download Invoice</PlainButton>,
    );
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has no axe violations when disabled', async () => {
    const { container } = render(
      <PlainButton onClick={vi.fn()} disabled>
        Download Invoice
      </PlainButton>,
    );
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has no axe violations when loading (spinner shown)', async () => {
    const { container } = render(
      <PlainButton onClick={vi.fn()} icon="download" loading>
        Invoice
      </PlainButton>,
    );
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has no axe violations with a retry icon in idle state', async () => {
    const { container } = render(
      <PlainButton onClick={vi.fn()} icon="retry">
        Retry
      </PlainButton>,
    );
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});

describe('PlainButton — accessible name', () => {
  it('button has an accessible name derived from its text child', () => {
    render(<PlainButton onClick={vi.fn()}>Download Invoice</PlainButton>);
    expect(
      screen.getByRole('button', { name: 'Download Invoice' }),
    ).toBeInTheDocument();
  });

  it('button retains its accessible name when loading (spinner supplements, not replaces, text)', () => {
    render(
      <PlainButton onClick={vi.fn()} icon="download" loading>
        Invoice
      </PlainButton>,
    );
    // The text "Invoice" is still in the DOM inside a <span>
    expect(
      screen.getByRole('button', { name: /invoice/i }),
    ).toBeInTheDocument();
  });
});

describe('PlainButton — spinner ARIA role', () => {
  it('spinner has role="status" when loading is true', () => {
    render(
      <PlainButton onClick={vi.fn()} icon="retry" loading>
        Retry
      </PlainButton>,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('no role="status" element is rendered when loading is false', () => {
    render(
      <PlainButton onClick={vi.fn()} icon="retry">
        Retry
      </PlainButton>,
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
