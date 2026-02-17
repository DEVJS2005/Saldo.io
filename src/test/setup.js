// import '@testing-library/jest-dom';
import "fake-indexeddb/auto";
import { vi } from 'vitest';

// Mock Recalls if needed
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
