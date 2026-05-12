import '@testing-library/jest-dom';
import { expect } from 'vitest';

// vitest-axe/matchers ships toHaveNoViolations as a plain JS function.
// Its .d.ts uses `export type`, which prevents a value-position import in TS.
// The dual copies of @vitest/expect in node_modules also produce incompatible
// MatcherState types. Using require() bypasses both issues at the cost of one
// ts-ignore directive.
// The runtime shape is correct: { toHaveNoViolations: Function }.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vitestAxeMatchers = require('vitest-axe/matchers');

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — dual @vitest/expect versions cause type mismatch; runtime is correct
expect.extend(vitestAxeMatchers);
