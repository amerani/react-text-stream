import React from 'react';
import styles from './style.module.css';
import useEventStream from '../../useEventStream';

const ReactEventStream: React.ComponentType = () => {
    const stream = useEventStream('http://localhost:3001/sse');

    return (
        <div className={styles.eventStream}>
            <div className={styles.eventStreamEvents}>
                {stream.length > 0 ? stream : 'Generating...'}
            </div>
        </div>
    )
}

export default ReactEventStream;