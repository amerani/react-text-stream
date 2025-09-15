import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock EventSource for testing
class MockEventSource {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  onopen: (() => void) | null = null;
  readyState: number = 1;
  CONNECTING = 0;
  OPEN = 1;
  CLOSED = 2;

  constructor(url: string) {
    this.url = url;
    // Simulate connection opening
    setTimeout(() => {
      if (this.onopen) {
        this.onopen();
      }
    }, 0);
  }

  close() {
    this.readyState = this.CLOSED;
  }

  // Helper methods for testing
  simulateMessage(data: any) {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data)
      });
      this.onmessage(event);
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror();
    }
  }
}

// Replace global EventSource with our mock
(global as any).EventSource = MockEventSource;

// Mock fetch for any potential network requests
global.fetch = vi.fn();

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
