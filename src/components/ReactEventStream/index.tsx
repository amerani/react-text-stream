import React, { useCallback } from 'react';
import styles from './style.module.css';
import useEventStream from '../../useEventStream';


interface ReactEventStreamProps<T> {
    url: string;
    onEvent: (event: T) => string|undefined;
    render: (stream: string) => React.ReactNode;
}

const ReactEventStream: React.FC<ReactEventStreamProps<any>> = ({ url, onEvent, render }) => {
    const stream = useEventStream<any>(
        url, 
        useCallback((event): string|undefined => {    
            return onEvent(event);
        }, []),
    )!;

    return (
        <div className={styles.eventStream}>
            {stream?.length > 0 ? render(stream) : 'Generating...'}
        </div>
    )
}

export default ReactEventStream;