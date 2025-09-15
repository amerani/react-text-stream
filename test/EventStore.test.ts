import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventStore } from '../src/EventStore';

describe('EventStore', () => {
  let mockEventSource: any;
  let originalEventSource: any;

  beforeEach(() => {
    // Store original EventSource
    originalEventSource = global.EventSource;
    
    // Create a mock EventSource
    mockEventSource = {
      url: '',
      onmessage: null,
      onerror: null,
      onopen: null,
      readyState: 1,
      CONNECTING: 0,
      OPEN: 1,
      CLOSED: 2,
      close: vi.fn(),
      simulateMessage: function(data: any) {
        if (this.onmessage) {
          const event = new MessageEvent('message', {
            data: JSON.stringify(data)
          });
          this.onmessage(event);
        }
      },
      simulateError: function() {
        if (this.onerror) {
          this.onerror();
        }
      }
    };

    // Mock EventSource constructor
    global.EventSource = vi.fn().mockImplementation((url: string) => {
      mockEventSource.url = url;
      // Simulate connection opening
      setTimeout(() => {
        if (mockEventSource.onopen) {
          mockEventSource.onopen();
        }
      }, 0);
      return mockEventSource;
    });
    
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original EventSource
    global.EventSource = originalEventSource;
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create EventSource with correct URL', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      
      EventStore(url, onEvent);
      
      expect(global.EventSource).toHaveBeenCalledWith(url);
    });

    it('should return subscribe and getSnapshot functions', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      
      const store = EventStore(url, onEvent);
      
      expect(store).toHaveProperty('subscribe');
      expect(store).toHaveProperty('getSnapshot');
      expect(typeof store.subscribe).toBe('function');
      expect(typeof store.getSnapshot).toBe('function');
    });
  });

  describe('subscription management', () => {
    it('should allow subscribing and unsubscribing listeners', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      const store = EventStore(url, onEvent);
      
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Simulate a message to trigger listener
      onEvent.mockReturnValue('test data');
      mockEventSource.simulateMessage({ test: 'data' });
      
      expect(listener).toHaveBeenCalled();
      
      // Unsubscribe and verify listener is not called again
      unsubscribe();
      listener.mockClear();
      mockEventSource.simulateMessage({ test: 'data2' });
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      const store = EventStore(url, onEvent);
      
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      store.subscribe(listener1);
      store.subscribe(listener2);
      
      onEvent.mockReturnValue('test data');
      mockEventSource.simulateMessage({ test: 'data' });
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('data handling', () => {
    it('should process incoming messages and update data', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn().mockReturnValue('processed data');
      const store = EventStore(url, onEvent);
      
      const listener = vi.fn();
      store.subscribe(listener);
      
      mockEventSource.simulateMessage({ raw: 'data' });
      
      expect(onEvent).toHaveBeenCalledWith({ raw: 'data' });
      expect(store.getSnapshot()).toBe('processed data');
      expect(listener).toHaveBeenCalled();
    });

    it('should handle undefined return from onEvent', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn().mockReturnValue(undefined);
      const store = EventStore(url, onEvent);
      
      const listener = vi.fn();
      store.subscribe(listener);
      
      mockEventSource.simulateMessage({ raw: 'data' });
      
      expect(onEvent).toHaveBeenCalledWith({ raw: 'data' });
      expect(store.getSnapshot()).toBeUndefined();
      expect(mockEventSource.close).toHaveBeenCalled();
    });

    it('should handle falsy but not undefined return from onEvent', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn().mockReturnValue('');
      const store = EventStore(url, onEvent);
      
      const listener = vi.fn();
      store.subscribe(listener);
      
      mockEventSource.simulateMessage({ raw: 'data' });
      
      expect(onEvent).toHaveBeenCalledWith({ raw: 'data' });
      expect(store.getSnapshot()).toBe('');
      expect(listener).toHaveBeenCalled();
    });

    it('should handle null return from onEvent', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn().mockReturnValue(null);
      const store = EventStore(url, onEvent);
      
      const listener = vi.fn();
      store.subscribe(listener);
      
      mockEventSource.simulateMessage({ raw: 'data' });
      
      expect(onEvent).toHaveBeenCalledWith({ raw: 'data' });
      expect(store.getSnapshot()).toBe(null);
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('getSnapshot', () => {
    it('should return undefined initially', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      const store = EventStore(url, onEvent);
      
      expect(store.getSnapshot()).toBeUndefined();
    });

    it('should return current data after processing message', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn().mockReturnValue('test data');
      const store = EventStore(url, onEvent);
      
      mockEventSource.simulateMessage({ test: 'data' });
      
      expect(store.getSnapshot()).toBe('test data');
    });

    it('should return latest data after multiple messages', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn()
        .mockReturnValueOnce('first data')
        .mockReturnValueOnce('second data');
      const store = EventStore(url, onEvent);
      
      mockEventSource.simulateMessage({ test: 'data1' });
      expect(store.getSnapshot()).toBe('first data');
      
      mockEventSource.simulateMessage({ test: 'data2' });
      expect(store.getSnapshot()).toBe('second data');
    });
  });

  describe('JSON parsing', () => {
    it('should handle valid JSON data', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn().mockReturnValue('processed');
      const store = EventStore(url, onEvent);
      
      const testData = { message: 'hello', count: 42 };
      mockEventSource.simulateMessage(testData);
      
      expect(onEvent).toHaveBeenCalledWith(testData);
    });

    it('should handle complex JSON data', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn().mockReturnValue('processed');
      const store = EventStore(url, onEvent);
      
      const complexData = {
        user: { id: 1, name: 'John' },
        items: [{ id: 1, value: 'test' }],
        metadata: { timestamp: Date.now() }
      };
      
      mockEventSource.simulateMessage(complexData);
      
      expect(onEvent).toHaveBeenCalledWith(complexData);
    });
  });
});
