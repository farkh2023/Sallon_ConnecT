import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node.js v26 has an experimental localStorage that is undefined without
// --localstorage-file, overriding jsdom's implementation. Polyfill it here.
if (typeof localStorage === 'undefined' || localStorage === null) {
  const _store: Record<string, string> = {};
  Object.defineProperty(globalThis, 'localStorage', {
    writable: true,
    configurable: true,
    value: {
      get length() { return Object.keys(_store).length; },
      key: (_i: number) => null,
      getItem: (k: string) => _store[k] ?? null,
      setItem: (k: string, v: string) => { _store[k] = String(v); },
      removeItem: (k: string) => { delete _store[k]; },
      clear: () => { for (const k of Object.keys(_store)) delete _store[k]; },
    },
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

window.HTMLElement.prototype.scrollIntoView = vi.fn();

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
