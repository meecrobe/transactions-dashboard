import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Icon } from '../Icon';

describe('Icon', () => {
  describe('source="retry"', () => {
    it('renders an SVG element', () => {
      const { container } = render(<Icon source="retry" />);
      const svg = container.querySelector('svg');

      expect(svg).toBeInTheDocument();
    });

    it('has the correct viewBox attribute', () => {
      const { container } = render(<Icon source="retry" />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveAttribute('viewBox', '0 0 20 20');
    });

    it('has the correct size class names', () => {
      const { container } = render(<Icon source="retry" />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveClass('w-4', 'h-4');
    });

    it('contains path elements with fill="currentColor"', () => {
      const { container } = render(<Icon source="retry" />);
      const paths = container.querySelectorAll('path');

      expect(paths.length).toBeGreaterThan(0);
      paths.forEach((path) => {
        expect(path).toHaveAttribute('fill', 'currentColor');
      });
    });
  });

  describe('source="download"', () => {
    it('renders an SVG element', () => {
      const { container } = render(<Icon source="download" />);
      const svg = container.querySelector('svg');

      expect(svg).toBeInTheDocument();
    });

    it('has the correct viewBox attribute', () => {
      const { container } = render(<Icon source="download" />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveAttribute('viewBox', '0 0 20 20');
    });

    it('has the correct size class names', () => {
      const { container } = render(<Icon source="download" />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveClass('w-4', 'h-4');
    });
  });

  describe('icon differentiation', () => {
    it('retry icon has two path elements', () => {
      const { container } = render(<Icon source="retry" />);
      const paths = container.querySelectorAll('path');

      expect(paths).toHaveLength(2);
    });

    it('download icon has two path elements', () => {
      const { container } = render(<Icon source="download" />);
      const paths = container.querySelectorAll('path');

      expect(paths).toHaveLength(2);
    });

    it('download first path uses fill-rule="evenodd"', () => {
      const { container } = render(<Icon source="download" />);
      const firstPath = container.querySelector('path');

      expect(firstPath).toHaveAttribute('fill-rule', 'evenodd');
    });
  });
});
