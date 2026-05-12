import type { AxeResults } from 'axe-core';

declare module '@vitest/expect' {
  interface Assertion {
    toHaveNoViolations(): void;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): void;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}

// Suppress unused-import warning — AxeResults is referenced via the shim above
export type { AxeResults };
