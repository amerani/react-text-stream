import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ReactTextStream from '../src/components/ReactTextStream';
import useTextStream from '../src/hooks/useTextStream';

// Mock useTextStream hook
vi.mock('../src/hooks/useTextStream', () => ({
  default: vi.fn()
}));

describe('ReactTextStream', () => {
  const mockUseTextStream = useTextStream as any;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render with initial undefined stream', () => {
      mockUseTextStream.mockReturnValue(undefined);
      
      const renderFn = vi.fn().mockReturnValue(<div>No stream yet</div>);
      
      render(
        <ReactTextStream
          url="http://example.com/stream"
          onEvent={vi.fn()}
          render={renderFn}
        />
      );
      
      expect(renderFn).toHaveBeenCalledWith(undefined);
      expect(screen.getByText('No stream yet')).toBeInTheDocument();
    });

    it('should render with initial empty stream', () => {
      mockUseTextStream.mockReturnValue('');
      
      const renderFn = vi.fn().mockReturnValue(<div>Empty stream</div>);
      
      render(
        <ReactTextStream
          url="http://example.com/stream"
          onEvent={vi.fn()}
          render={renderFn}
        />
      );
      
      expect(renderFn).toHaveBeenCalledWith('');
      expect(screen.getByText('Empty stream')).toBeInTheDocument();
    });

    it('should render with stream content', () => {
      const streamContent = 'Hello, world!';
      mockUseTextStream.mockReturnValue(streamContent);
      
      const renderFn = vi.fn().mockReturnValue(<div>{streamContent}</div>);
      
      render(
        <ReactTextStream
          url="http://example.com/stream"
          onEvent={vi.fn()}
          render={renderFn}
        />
      );
      
      expect(renderFn).toHaveBeenCalledWith(streamContent);
      expect(screen.getByText(streamContent)).toBeInTheDocument();
    });
  });

  describe('props handling', () => {
    it('should pass url and onEvent to useTextStream', () => {
      const url = 'http://example.com/stream';
      const onEvent = vi.fn();
      
      mockUseTextStream.mockReturnValue('test stream');
      
      render(
        <ReactTextStream
          url={url}
          onEvent={onEvent}
          render={vi.fn()}
        />
      );
      
      expect(mockUseTextStream).toHaveBeenCalledWith(url, onEvent);
    });

    it('should handle different URL formats', () => {
      const urls = [
        'http://example.com/stream',
        'https://api.example.com/events',
        'ws://localhost:3000/stream',
        'wss://secure.example.com/events'
      ];
      
      mockUseTextStream.mockReturnValue('test');
      
      urls.forEach(url => {
        const { unmount } = render(
          <ReactTextStream
            url={url}
            onEvent={vi.fn()}
            render={vi.fn()}
          />
        );
        
        expect(mockUseTextStream).toHaveBeenCalledWith(url, expect.any(Function));
        unmount();
      });
    });

    it('should handle different onEvent functions', () => {
      const onEvent1 = vi.fn().mockReturnValue('processed1');
      const onEvent2 = vi.fn().mockReturnValue('processed2');
      const onEvent3 = (data: any) => data.message;
      
      mockUseTextStream.mockReturnValue('test');
      
      const onEvents = [onEvent1, onEvent2, onEvent3];
      
      onEvents.forEach((onEvent, index) => {
        const { unmount } = render(
          <ReactTextStream
            url="http://example.com/stream"
            onEvent={onEvent}
            render={vi.fn()}
          />
        );
        
        expect(mockUseTextStream).toHaveBeenCalledWith('http://example.com/stream', onEvent);
        unmount();
      });
    });
  });

  describe('render function', () => {
    it('should call render function with current stream', () => {
      const streamContent = 'Streaming content...';
      mockUseTextStream.mockReturnValue(streamContent);
      
      const renderFn = vi.fn().mockReturnValue(<div>Rendered content</div>);
      
      render(
        <ReactTextStream
          url="http://example.com/stream"
          onEvent={vi.fn()}
          render={renderFn}
        />
      );
      
      expect(renderFn).toHaveBeenCalledWith(streamContent);
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it('should re-render when stream changes', () => {
      let streamContent = 'Initial content';
      mockUseTextStream.mockReturnValue(streamContent);
      
      const renderFn = vi.fn().mockImplementation((stream) => <div>{stream}</div>);
      
      const { rerender } = render(
        <ReactTextStream
          url="http://example.com/stream"
          onEvent={vi.fn()}
          render={renderFn}
        />
      );
      
      expect(renderFn).toHaveBeenCalledWith('Initial content');
      expect(renderFn).toHaveBeenCalledTimes(1);
      
      // Simulate stream change
      streamContent = 'Updated content';
      mockUseTextStream.mockReturnValue(streamContent);
      
      rerender(
        <ReactTextStream
          url="http://example.com/stream"
          onEvent={vi.fn()}
          render={renderFn}
        />
      );
      
      expect(renderFn).toHaveBeenCalledWith('Updated content');
      expect(renderFn).toHaveBeenCalledTimes(2);
    });

    it('should handle render function returning different types', () => {
      mockUseTextStream.mockReturnValue('test stream');
      
      // Test string return
      const stringRender = vi.fn().mockReturnValue('String content');
      const { unmount: unmount1 } = render(
        <ReactTextStream
          url="http://example.com/stream"
          onEvent={vi.fn()}
          render={stringRender}
        />
      );
      
      expect(stringRender).toHaveBeenCalledWith('test stream');
      unmount1();
      
      // Test number return
      const numberRender = vi.fn().mockReturnValue(42);
      const { unmount: unmount2 } = render(
        <ReactTextStream
          url="http://example.com/stream"
          onEvent={vi.fn()}
          render={numberRender}
        />
      );
      
      expect(numberRender).toHaveBeenCalledWith('test stream');
      unmount2();
      
      // Test null return
      const nullRender = vi.fn().mockReturnValue(null);
      const { unmount: unmount3 } = render(
        <ReactTextStream
          url="http://example.com/stream"
          onEvent={vi.fn()}
          render={nullRender}
        />
      );
      
      expect(nullRender).toHaveBeenCalledWith('test stream');
      unmount3();
    });
  });

  describe('TypeScript generics', () => {
    it('should work with typed event data', () => {
      interface TestEvent {
        id: number;
        message: string;
        timestamp: number;
      }
      
      const onEvent = (event: TestEvent) => event.message;
      mockUseTextStream.mockReturnValue('typed message');
      
      const renderFn = vi.fn().mockReturnValue(<div>Typed content</div>);
      
      render(
        <ReactTextStream<TestEvent>
          url="http://example.com/stream"
          onEvent={onEvent}
          render={renderFn}
        />
      );
      
      expect(mockUseTextStream).toHaveBeenCalledWith('http://example.com/stream', onEvent);
    });

    it('should work with different event types', () => {
      // String event
      const stringOnEvent = (event: string) => event.toUpperCase();
      mockUseTextStream.mockReturnValue('UPPERCASE');
      
      const { unmount: unmount1 } = render(
        <ReactTextStream<string>
          url="http://example.com/stream"
          onEvent={stringOnEvent}
          render={vi.fn()}
        />
      );
      
      expect(mockUseTextStream).toHaveBeenCalledWith('http://example.com/stream', stringOnEvent);
      unmount1();
      
      // Number event
      const numberOnEvent = (event: number) => event.toString();
      mockUseTextStream.mockReturnValue('42');
      
      const { unmount: unmount2 } = render(
        <ReactTextStream<number>
          url="http://example.com/stream"
          onEvent={numberOnEvent}
          render={vi.fn()}
        />
      );
      
      expect(mockUseTextStream).toHaveBeenCalledWith('http://example.com/stream', numberOnEvent);
      unmount2();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined stream gracefully', () => {
      mockUseTextStream.mockReturnValue(undefined);
      
      const renderFn = vi.fn().mockImplementation((stream) => (
        <div>Stream: {stream || 'undefined'}</div>
      ));
      
      render(
        <ReactTextStream
          url="http://example.com/stream"
          onEvent={vi.fn()}
          render={renderFn}
        />
      );
      
      expect(renderFn).toHaveBeenCalledWith(undefined);
      expect(screen.getByText('Stream: undefined')).toBeInTheDocument();
    });

    it('should handle very long streams', () => {
      const longStream = 'a'.repeat(10000);
      mockUseTextStream.mockReturnValue(longStream);
      
      const renderFn = vi.fn().mockImplementation((stream) => (
        <div>Length: {stream?.length}</div>
      ));
      
      render(
        <ReactTextStream
          url="http://example.com/stream"
          onEvent={vi.fn()}
          render={renderFn}
        />
      );
      
      expect(renderFn).toHaveBeenCalledWith(longStream);
      expect(screen.getByText('Length: 10000')).toBeInTheDocument();
    });

    it('should handle render function throwing errors', () => {
      mockUseTextStream.mockReturnValue('test stream');
      
      const errorRender = vi.fn().mockImplementation(() => {
        throw new Error('Render error');
      });
      
      // Should not crash the component
      expect(() => {
        render(
          <ReactTextStream
            url="http://example.com/stream"
            onEvent={vi.fn()}
            render={errorRender}
          />
        );
      }).toThrow('Render error');
    });
  });
});
