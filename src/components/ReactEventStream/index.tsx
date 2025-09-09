import React from 'react';
import useEventStream from '../../useEventStream';

interface ReactEventStreamProps<T> {
    url: string;
    onEvent: (event: T) => string|undefined;
    render: (stream: string) => React.ReactNode;
}

function ReactEventStream<T>({ 
    url, 
    onEvent, 
    render 
}: ReactEventStreamProps<T>) {
    const stream = useEventStream<T>(
        url, 
        onEvent
    )!;

    return render(stream);
}

export default ReactEventStream;