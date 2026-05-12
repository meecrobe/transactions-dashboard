import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { RetryButton } from '../RetryButton';

describe('RetryButton — axe violations', () => {
  it('has no axe violations in idle state', async () => {
    const { container } = render(
      <RetryButton onClick={vi.fn()} loading={false}>
        Retry Selected
      </RetryButton>,
    );
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has no axe violations when disabled', async () => {
    const { container } = render(
      <RetryButton onClick={vi.fn()} loading={false} disabled>
        Retry Selected
      </RetryButton>,
    );
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has no axe violations when loading (spinner + aria-busy)', async () => {
    const { container } = render(
      <RetryButton onClick={vi.fn()} loading={true}>
        Retry Selected (3)
      </RetryButton>,
    );
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});

describe('RetryButton — aria-busy', () => {
  it('sets aria-busy="true" when loading', () => {
    render(
      <RetryButton onClick={vi.fn()} loading={true}>
        Retry Selected
      </RetryButton>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('sets aria-busy="false" when not loading', () => {
    render(
      <RetryButton onClick={vi.fn()} loading={false}>
        Retry Selected
      </RetryButton>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'false');
  });
});

describe('RetryButton — spinner SVG aria-hidden', () => {
  it('spinner SVG has aria-hidden="true" so the button label is not polluted', () => {
    render(
      <RetryButton onClick={vi.fn()} loading={true}>
        Retry Selected
      </RetryButton>,
    );
    const btn = screen.getByRole('button');
    const svg = btn.querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('RetryButton — disabled semantics', () => {
  it('button is natively disabled when loading, not just styled', () => {
    render(
      <RetryButton onClick={vi.fn()} loading={true}>
        Retry Selected
      </RetryButton>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('button is natively disabled when disabled prop is set', () => {
    render(
      <RetryButton onClick={vi.fn()} loading={false} disabled>
        Retry Selected
      </RetryButton>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('RetryButton — accessible name', () => {
  it('accessible name matches children text in idle state', () => {
    render(
      <RetryButton onClick={vi.fn()} loading={false}>
        Retry Selected (2)
      </RetryButton>,
    );
    expect(
      screen.getByRole('button', { name: 'Retry Selected (2)' }),
    ).toBeInTheDocument();
  });

  it('accessible name matches children text even while loading', () => {
    render(
      <RetryButton onClick={vi.fn()} loading={true}>
        Retry All Failed
      </RetryButton>,
    );
    // Text "Retry All Failed" is still rendered in the DOM alongside the spinner
    expect(
      screen.getByRole('button', { name: /retry all failed/i }),
    ).toBeInTheDocument();
  });
});
