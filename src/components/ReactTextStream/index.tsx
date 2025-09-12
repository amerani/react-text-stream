import React from 'react';
import useTextStream from '../../hooks/useTextStream';

interface ReactTextStreamProps<T> {
    url: string;
    onEvent: (event: T) => string|undefined;
    render: (stream: string) => React.ReactNode;
}

function ReactTextStream<T>({ 
    url, 
    onEvent, 
    render 
}: ReactTextStreamProps<T>) {
    const stream = useTextStream<T>(
        url, 
        onEvent
    )!;

    return render(stream);
}

export default ReactTextStream;