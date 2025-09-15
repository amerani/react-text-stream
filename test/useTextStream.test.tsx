import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useTextStream from '../src/hooks/useTextStream';
import { EventStore } from '../src/EventStore';

// Mock EventStore
vi.mock('../src/EventStore', () => ({
  EventStore: vi.fn()
}));

describe('useTextStream', () => {
  let mockEventStore: any;
  let mockSubscribe: any;
  let mockGetSnapshot: any;
  let mockUnsubscribe: any;

  beforeEach(() => {
    mockUnsubscribe = vi.fn();
    mockSubscribe = vi.fn().mockReturnValue(mockUnsubscribe);
    mockGetSnapshot = vi.fn();
    
    mockEventStore = {
      subscribe: mockSubscribe,
      getSnapshot: mockGetSnapshot
    };

    (EventStore as any).mockReturnValue(mockEventStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create EventStore with correct parameters', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      
      renderHook(() => useTextStream(url, onEvent));
      
      expect(EventStore).toHaveBeenCalledWith(url, onEvent);
    });

    it('should subscribe to EventStore on mount', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      
      renderHook(() => useTextStream(url, onEvent));
      
      expect(mockSubscribe).toHaveBeenCalled();
    });

    it('should unsubscribe from EventStore on unmount', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      
      const { unmount } = renderHook(() => useTextStream(url, onEvent));
      
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should return undefined initially', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      mockGetSnapshot.mockReturnValue(undefined);
      
      const { result } = renderHook(() => useTextStream(url, onEvent));
      
      expect(result.current).toBeUndefined();
    });
  });

  describe('stream accumulation', () => {
    it('should return first chunk when stream is empty', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      mockGetSnapshot.mockReturnValue('first chunk');
      
      const { result } = renderHook(() => useTextStream(url, onEvent));
      
      act(() => {
        // Simulate EventStore notifying of new data
        const callback = mockSubscribe.mock.calls[0][0];
        callback();
      });
      
      expect(result.current).toBe('first chunk');
    });

    it('should concatenate new chunks to existing stream', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      
      const { result } = renderHook(() => useTextStream(url, onEvent));
      
      // First chunk
      mockGetSnapshot.mockReturnValue('hello');
      act(() => {
        const callback = mockSubscribe.mock.calls[0][0];
        callback();
      });
      
      expect(result.current).toBe('hello');
      
      // Second chunk
      mockGetSnapshot.mockReturnValue(' world');
      act(() => {
        const callback = mockSubscribe.mock.calls[0][0];
        callback();
      });
      
      expect(result.current).toBe('hello world');
      
      // Third chunk
      mockGetSnapshot.mockReturnValue('!');
      act(() => {
        const callback = mockSubscribe.mock.calls[0][0];
        callback();
      });
      
      expect(result.current).toBe('hello world!');
    });

    it('should handle undefined chunks gracefully', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      
      const { result } = renderHook(() => useTextStream(url, onEvent));
      
      // First chunk
      mockGetSnapshot.mockReturnValue('hello');
      act(() => {
        const callback = mockSubscribe.mock.calls[0][0];
        callback();
      });
      
      expect(result.current).toBe('hello');
      
      // Undefined chunk should not change the stream
      mockGetSnapshot.mockReturnValue(undefined);
      act(() => {
        const callback = mockSubscribe.mock.calls[0][0];
        callback();
      });
      
      expect(result.current).toBe('hello');
    });

    it('should handle empty string chunks', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      
      const { result } = renderHook(() => useTextStream(url, onEvent));
      
      // First chunk
      mockGetSnapshot.mockReturnValue('hello');
      act(() => {
        const callback = mockSubscribe.mock.calls[0][0];
        callback();
      });
      
      expect(result.current).toBe('hello');
      
      // Empty string chunk
      mockGetSnapshot.mockReturnValue('');
      act(() => {
        const callback = mockSubscribe.mock.calls[0][0];
        callback();
      });
      
      expect(result.current).toBe('hello');
    });
  });

  describe('memoization', () => {
    it('should recreate EventStore when URL changes', () => {
      const onEvent = vi.fn();
      let url = 'http://example.com/stream1';
      
      const { rerender } = renderHook(
        ({ url }) => useTextStream(url, onEvent),
        { initialProps: { url } }
      );
      
      expect(EventStore).toHaveBeenCalledWith('http://example.com/stream1', onEvent);
      expect(EventStore).toHaveBeenCalledTimes(1);
      
      // Change URL
      url = 'http://example.com/stream2';
      rerender({ url });
      
      expect(EventStore).toHaveBeenCalledWith('http://example.com/stream2', onEvent);
      expect(EventStore).toHaveBeenCalledTimes(2);
    });

    it('should not recreate EventStore when URL and onEvent remain the same', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      
      const { rerender } = renderHook(() => useTextStream(url, onEvent));
      
      expect(EventStore).toHaveBeenCalledTimes(1);
      
      // Rerender with same props
      rerender();
      
      expect(EventStore).toHaveBeenCalledTimes(1);
    });
  });

  describe('useSyncExternalStore integration', () => {
    it('should use useSyncExternalStore for reactive updates', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      
      renderHook(() => useTextStream(url, onEvent));
      
      // Verify that subscribe was called (useSyncExternalStore behavior)
      expect(mockSubscribe).toHaveBeenCalled();
      
      // Verify that getSnapshot was called (useSyncExternalStore behavior)
      expect(mockGetSnapshot).toHaveBeenCalled();
    });

    it('should handle multiple rapid updates', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      
      const { result } = renderHook(() => useTextStream(url, onEvent));
      
      // Simulate rapid updates
      const callback = mockSubscribe.mock.calls[0][0];
      
      mockGetSnapshot.mockReturnValue('a');
      act(() => callback());
      
      mockGetSnapshot.mockReturnValue('b');
      act(() => callback());
      
      mockGetSnapshot.mockReturnValue('c');
      act(() => callback());
      
      expect(result.current).toBe('abc');
    });
  });

  describe('edge cases', () => {
    it('should handle very long streams', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      
      const { result } = renderHook(() => useTextStream(url, onEvent));
      
      // Simulate many small chunks
      const callback = mockSubscribe.mock.calls[0][0];
      let expectedStream = '';
      
      for (let i = 0; i < 100; i++) {
        const chunk = `chunk${i}`;
        expectedStream += chunk;
        mockGetSnapshot.mockReturnValue(chunk);
        act(() => callback());
      }
      
      expect(result.current).toBe(expectedStream);
    });

    it('should handle null chunks', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      
      const { result } = renderHook(() => useTextStream(url, onEvent));
      
      const callback = mockSubscribe.mock.calls[0][0];
      
      // First chunk
      mockGetSnapshot.mockReturnValue('hello');
      act(() => callback());
      
      expect(result.current).toBe('hello');
      
      // Null chunk
      mockGetSnapshot.mockReturnValue(null);
      act(() => callback());
      
      expect(result.current).toBe('hellonull');
    });
  });
});
