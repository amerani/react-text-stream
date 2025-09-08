import React from 'react';
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
    const stream = useEventStream('http://localhost:3001/sse', (event: EventData) => event.word);

    return (
        <div className={styles.eventStream}>
            {stream.length > 0 ? stream : 'Generating...'}
        </div>
    )
}

export default ReactEventStream;