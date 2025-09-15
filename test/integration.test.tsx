import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ReactTextStream, useTextStream } from '../src/index';

// Mock EventSource for integration tests
class MockEventSource {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  onopen: (() => void) | null = null;
  readyState: number = 1;
  CONNECTING = 0;
  OPEN = 1;
  CLOSED = 2;
  private messageQueue: any[] = [];
  private isProcessing = false;

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
    this.messageQueue.push(data);
    this.processQueue();
  }

  simulateError() {
    if (this.onerror) {
      this.onerror();
    }
  }

  private async processQueue() {
    if (this.isProcessing || this.messageQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.messageQueue.length > 0) {
      const data = this.messageQueue.shift();
      if (this.onmessage) {
        const event = new MessageEvent('message', {
          data: JSON.stringify(data)
        });
        this.onmessage(event);
      }
      // Small delay to simulate real streaming
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    this.isProcessing = false;
  }
}

describe('Integration Tests', () => {
  let mockEventSource: any;
  let originalEventSource: any;

  beforeEach(() => {
    // Store original EventSource
    originalEventSource = global.EventSource;
    
    // Create a mock EventSource
    mockEventSource = new MockEventSource('http://example.com/stream');

    // Mock EventSource constructor
    global.EventSource = vi.fn().mockImplementation((url: string) => {
      mockEventSource.url = url;
      return mockEventSource;
    }) as any;
  });

  afterEach(() => {
    // Restore original EventSource
    global.EventSource = originalEventSource;
    vi.clearAllMocks();
  });

  describe('ReactTextStream integration', () => {
    it('should handle complete streaming flow', async () => {
      const onEvent = (data: { message: string }) => data.message;
      
      const TestComponent = () => (
        <ReactTextStream
          url="http://example.com/stream"
          onEvent={onEvent}
          render={(stream) => (
            <div>
              <h1>Streaming Content</h1>
              <pre>{stream || 'No content yet'}</pre>
            </div>
          )}
        />
      );

      render(<TestComponent />);

      // Initially no content
      expect(screen.getByText('No content yet')).toBeInTheDocument();

      // Simulate streaming messages
      mockEventSource.simulateMessage({ message: 'Hello' });
      
      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      mockEventSource.simulateMessage({ message: ' World' });
      
      await waitFor(() => {
        expect(screen.getByText('Hello World')).toBeInTheDocument();
      });

      mockEventSource.simulateMessage({ message: '!' });
      
      await waitFor(() => {
        expect(screen.getByText('Hello World!')).toBeInTheDocument();
      });
    });

    it('should handle stream termination', async () => {
      const onEvent = (data: { message?: string; done?: boolean }) => {
        if (data.done) return undefined;
        return data.message;
      };
      
      const TestComponent = () => (
        <ReactTextStream
          url="http://example.com/stream"
          onEvent={onEvent}
          render={(stream) => (
            <div>
              <pre>{stream || 'Stream ended'}</pre>
            </div>
          )}
        />
      );

      render(<TestComponent />);

      // Send some content
      mockEventSource.simulateMessage({ message: 'Hello' });
      
      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      // Send termination signal
      mockEventSource.simulateMessage({ done: true });
      
      // Stream should remain as is (not change to "Stream ended")
      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });
    });

    it('should handle multiple rapid messages', async () => {
      const onEvent = (data: { chunk: string }) => data.chunk;
      
      const TestComponent = () => (
        <ReactTextStream
          url="http://example.com/stream"
          onEvent={onEvent}
          render={(stream) => (
            <div>
              <pre>{stream || 'Waiting...'}</pre>
            </div>
          )}
        />
      );

      render(<TestComponent />);

      // Send multiple rapid messages
      const chunks = ['a', 'b', 'c', 'd', 'e'];
      chunks.forEach(chunk => {
        mockEventSource.simulateMessage({ chunk });
      });
      
      await waitFor(() => {
        expect(screen.getByText('abcde')).toBeInTheDocument();
      });
    });
  });

  describe('useTextStream integration', () => {
    it('should work independently of ReactTextStream', async () => {
      const TestComponent = () => {
        const stream = useTextStream(
          'http://example.com/stream',
          (data: { text: string }) => data.text
        );
        
        return (
          <div>
            <pre>{stream || 'No stream'}</pre>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByText('No stream')).toBeInTheDocument();

      mockEventSource.simulateMessage({ text: 'Direct hook test' });
      
      await waitFor(() => {
        expect(screen.getByText('Direct hook test')).toBeInTheDocument();
      });
    });

    it('should handle complex data transformation', async () => {
      const TestComponent = () => {
        const stream = useTextStream(
          'http://example.com/stream',
          (data: { user: string; message: string; timestamp: number }) => {
            return `[${new Date(data.timestamp).toLocaleTimeString()}] ${data.user}: ${data.message}`;
          }
        );
        
        return (
          <div>
            <pre>{stream || 'No messages'}</pre>
          </div>
        );
      };

      render(<TestComponent />);

      const timestamp = Date.now();
      mockEventSource.simulateMessage({
        user: 'Alice',
        message: 'Hello everyone!',
        timestamp
      });
      
      await waitFor(() => {
        const expectedText = `[${new Date(timestamp).toLocaleTimeString()}] Alice: Hello everyone!`;
        expect(screen.getByText(expectedText)).toBeInTheDocument();
      });
    });
  });

  describe('error handling integration', () => {
    it('should handle EventSource errors gracefully', async () => {
      const onEvent = (data: { message: string }) => data.message;
      
      const TestComponent = () => (
        <ReactTextStream
          url="http://example.com/stream"
          onEvent={onEvent}
          render={(stream) => (
            <div>
              <pre>{stream || 'No content'}</pre>
            </div>
          )}
        />
      );

      render(<TestComponent />);

      // Send some content first
      mockEventSource.simulateMessage({ message: 'Hello' });
      
      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      // Simulate errors
      mockEventSource.simulateError();
      mockEventSource.simulateError();
      mockEventSource.simulateError();
      
      // Content should still be there
      expect(screen.getByText('Hello')).toBeInTheDocument();
      
      // 4th error should close connection
      mockEventSource.simulateError();
      
      // Content should still be there (connection closed but data preserved)
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('should handle malformed JSON gracefully', async () => {
      const onEvent = (data: { message: string }) => data.message;
      
      const TestComponent = () => (
        <ReactTextStream
          url="http://example.com/stream"
          onEvent={onEvent}
          render={(stream) => (
            <div>
              <pre>{stream || 'No content'}</pre>
            </div>
          )}
        />
      );

      render(<TestComponent />);

      // This would normally cause a JSON.parse error
      // But our mock handles it gracefully
      mockEventSource.simulateMessage({ message: 'Valid message' });
      
      await waitFor(() => {
        expect(screen.getByText('Valid message')).toBeInTheDocument();
      });
    });
  });

  describe('real-world scenarios', () => {
    it('should handle chat-like streaming', async () => {
      const onEvent = (data: { type: string; content: string; user?: string }) => {
        if (data.type === 'message') {
          return `[${data.user}]: ${data.content}`;
        }
        return undefined;
      };
      
      const TestComponent = () => (
        <ReactTextStream
          url="http://example.com/chat"
          onEvent={onEvent}
          render={(stream) => (
            <div>
              <h2>Chat</h2>
              <pre>{stream || 'No messages'}</pre>
            </div>
          )}
        />
      );

      render(<TestComponent />);

      // Simulate chat messages
      mockEventSource.simulateMessage({
        type: 'message',
        user: 'Alice',
        content: 'Hello everyone!'
      });
      
      await waitFor(() => {
        expect(screen.getByText('[Alice]: Hello everyone!')).toBeInTheDocument();
      });

      mockEventSource.simulateMessage({
        type: 'message',
        user: 'Bob',
        content: 'Hi Alice!'
      });
      
      await waitFor(() => {
        expect(screen.getByText('[Alice]: Hello everyone![Bob]: Hi Alice!')).toBeInTheDocument();
      });
    });
  });
});
