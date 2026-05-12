import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PlainButton } from '../PlainButton';

describe('PlainButton', () => {
  describe('rendering', () => {
    it('renders children as text inside a button', () => {
      render(<PlainButton onClick={vi.fn()}>Download Invoice</PlainButton>);
      expect(
        screen.getByRole('button', { name: 'Download Invoice' }),
      ).toBeInTheDocument();
    });

    it('renders children inside a span element', () => {
      render(<PlainButton onClick={vi.fn()}>Click me</PlainButton>);
      const span = screen.getByText('Click me');

      expect(span.tagName).toBe('SPAN');
    });

    it('renders as a button with type="button"', () => {
      render(<PlainButton onClick={vi.fn()}>Submit</PlainButton>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('renders without an icon when icon prop is omitted', () => {
      render(<PlainButton onClick={vi.fn()}>No icon</PlainButton>);
      const button = screen.getByRole('button');

      expect(button.querySelector('svg')).not.toBeInTheDocument();
    });

    it('renders an Icon when icon prop is provided', () => {
      render(
        <PlainButton onClick={vi.fn()} icon="retry">
          Retry
        </PlainButton>,
      );
      const button = screen.getByRole('button', { name: 'Retry' });

      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('renders the download icon when icon="download"', () => {
      render(
        <PlainButton onClick={vi.fn()} icon="download">
          Download
        </PlainButton>,
      );
      const button = screen.getByRole('button', { name: 'Download' });

      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('disabled and loading state', () => {
    it('is enabled by default', () => {
      render(<PlainButton onClick={vi.fn()}>Click</PlainButton>);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('is disabled when loading is true', () => {
      render(
        <PlainButton onClick={vi.fn()} loading={true}>
          Click
        </PlainButton>,
      );
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is not disabled when loading is false', () => {
      render(
        <PlainButton onClick={vi.fn()} loading={false}>
          Click
        </PlainButton>,
      );
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('is disabled when disabled is true', () => {
      render(
        <PlainButton onClick={vi.fn()} disabled={true}>
          Click
        </PlainButton>,
      );
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('click interactions', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn();

      render(<PlainButton onClick={handleClick}>Click me</PlainButton>);
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('does not call onClick when the button is disabled due to loading', async () => {
      const handleClick = vi.fn();

      render(
        <PlainButton onClick={handleClick} loading={true}>
          Click me
        </PlainButton>,
      );
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('calls onClick multiple times on multiple clicks', async () => {
      const handleClick = vi.fn();

      render(<PlainButton onClick={handleClick}>Click me</PlainButton>);
      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('accessibility', () => {
    it('is reachable via keyboard Tab', async () => {
      render(<PlainButton onClick={vi.fn()}>Accessible</PlainButton>);
      await userEvent.tab();
      expect(screen.getByRole('button')).toHaveFocus();
    });

    it('fires onClick when activated with Enter key', async () => {
      const handleClick = vi.fn();

      render(<PlainButton onClick={handleClick}>Enter</PlainButton>);
      await userEvent.tab();
      await userEvent.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('fires onClick when activated with Space key', async () => {
      const handleClick = vi.fn();

      render(<PlainButton onClick={handleClick}>Space</PlainButton>);
      await userEvent.tab();
      await userEvent.keyboard(' ');
      expect(handleClick).toHaveBeenCalledOnce();
    });
  });
});
