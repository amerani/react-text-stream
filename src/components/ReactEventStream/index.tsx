import React, { useCallback } from 'react';
import styles from './style.module.css';
import useEventStream from '../../useEventStream';

interface EventData {
  type: string;
  word: string;
  wordLength: number;
  index: number;
  totalWords: number;
  timestamp: string;
}
const ReactEventStream: React.ComponentType = () => {
    const stream = useEventStream(
        'http://localhost:3001/sse', 
        useCallback((event: EventData): string|undefined => {
            switch (event.type) {
                case 'chunk':
                    return `${event.word} `;
                case 'completed':
                    return undefined;
                default:
                    return '';
            }
        }, []),
    )!;

    return (
        <div className={styles.eventStream}>
            {stream?.length > 0 ? String(stream) : 'Generating...'}
        </div>
    )
}

export default ReactEventStream;