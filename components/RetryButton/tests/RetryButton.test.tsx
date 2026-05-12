import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RetryButton } from '../RetryButton';

describe('RetryButton', () => {
  it('renders children', () => {
    render(
      <RetryButton onClick={vi.fn()} loading={false}>
        Retry
      </RetryButton>,
    );
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();

    render(
      <RetryButton onClick={handleClick} loading={false}>
        Retry
      </RetryButton>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('is disabled and shows spinner when loading', () => {
    render(
      <RetryButton onClick={vi.fn()} loading={true}>
        Retry
      </RetryButton>,
    );
    const btn = screen.getByRole('button');

    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn.querySelector('svg')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <RetryButton onClick={vi.fn()} loading={false} disabled>
        Retry
      </RetryButton>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not fire onClick when disabled', async () => {
    const handleClick = vi.fn();

    render(
      <RetryButton onClick={handleClick} loading={false} disabled>
        Retry
      </RetryButton>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
