import React from 'react';
import useTextStream from '../../hooks/useTextStream';

interface ReactTextStreamProps<T> {
    url: string;
    onEvent: (event: T) => string|undefined;
    render: (stream: string) => React.ReactNode;
    store?: 'sse' | 'http';
    data?: unknown;
    fetchInit?: Omit<RequestInit, 'method' | 'body'>;
}

function ReactTextStream<T>({ 
    url, 
    onEvent, 
    render,
    store,
    data,
    fetchInit,
}: ReactTextStreamProps<T>) {
    const stream =
        store !== undefined || data !== undefined || fetchInit !== undefined
            ? useTextStream<T>({ url, onEvent, store, data, fetchInit })!
            : useTextStream<T>(url, onEvent)!;

    return render(stream);
}

export default ReactTextStream;