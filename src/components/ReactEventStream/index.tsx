import React, { useRef, useSyncExternalStore, useState, useCallback } from 'react';
import styles from './style.module.css';

interface EventData {
    type: 'message' | 'open' | 'error' | 'close';
    data?: string;
    timestamp: Date;
    error?: string;
}

interface EventSourceState {
    status: 'Connecting...' | 'Connected' | 'Error' | 'Closed';
    retryCount: number;
}

const ReactEventStream: React.ComponentType = () => {
    const [events, setEvents] = useState<EventData[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<EventSourceState>({
        status: 'Connecting...',
        retryCount: 0
    });

    const eventSourceRef = useRef<EventSource | null>(null);
    if (eventSourceRef.current === null) {
        console.log('Creating new EventSource');
        eventSourceRef.current = new EventSource('http://localhost:3001/sse');
    }

    const subscribeCallback = useCallback(() => {
        return eventSourceRef.current?.readyState;
    }, [eventSourceRef.current.readyState]);

    const addEvent = useCallback((event: EventData) => {
        setEvents(prev => [...prev, event].slice(-50)); // Keep last 50 events
    }, []);

    const subscribe = useCallback(_subscribe, [eventSourceRef.current.readyState]);
 
    const eventSourceState = useSyncExternalStore(subscribe, subscribeCallback);

    function _subscribe(callback: () => void) {
        console.log('subscribe');
        
        const handleMessage = (event: MessageEvent) => {
            addEvent({
                type: 'message',
                data: event.data,
                timestamp: new Date()
            });
            callback();
        };

        const handleOpen = () => {
            addEvent({
                type: 'open',
                timestamp: new Date()
            });
            setConnectionStatus({
                status: 'Connected',
                retryCount: 0
            });
            callback();
        };

        const handleError = (event: Event) => {
            console.log('handleError', event);
            const errorMessage = event instanceof ErrorEvent ? event.message : 'Unknown error occurred';
            const errorDetails = event instanceof ErrorEvent ? {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            } : { event: event.toString() };
            
            addEvent({
                type: 'error',
                error: errorMessage,
                data: JSON.stringify(errorDetails, null, 2),
                timestamp: new Date()
            });
            setConnectionStatus((prev) => {
                if (prev.retryCount >= 3) {
                    eventSourceRef.current?.close();
                }
                return {
                    status: 'Error',
                    retryCount: prev.retryCount + 1
                };
            });
            callback();
        };

        const handleClose = () => {
            console.log('handleClose - closing event stream');
            addEvent({
                type: 'close',
                timestamp: new Date()
            });
            setConnectionStatus({
                status: 'Closed',
                retryCount: 0
            });
            
            // Close the event source and clean up
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
            
            callback();
        };

        eventSourceRef.current?.addEventListener('message', handleMessage);
        eventSourceRef.current?.addEventListener('open', handleOpen);
        eventSourceRef.current?.addEventListener('error', handleError);
        eventSourceRef.current?.addEventListener('close', handleClose);
        
        return () => {
            eventSourceRef.current?.removeEventListener('message', handleMessage);
            eventSourceRef.current?.removeEventListener('open', handleOpen);
            eventSourceRef.current?.removeEventListener('error', handleError);
            eventSourceRef.current?.removeEventListener('close', handleClose);
        }
    }


    return (
        <div className={styles.eventStream}>
            <div className={styles.eventStreamStatus}>
                <h3>Connection Status: {connectionStatus.status}</h3>
                <p>Retry Count: {connectionStatus.retryCount}</p>
                <p>Ready State: {eventSourceState}</p>
            </div>
            <div className={styles.eventStreamEvents}>
                <h3>Event Stream ({events.length} events)</h3>
                <div className={styles.eventsList}>
                    {events.map((event, index) => (
                        <div key={index} className={`${styles.eventItem} ${styles[event.type]}`}>
                            <div className={styles.eventHeader}>
                                <span className={styles.eventType}>{event.type.toUpperCase()}</span>
                                <span className={styles.eventTimestamp}>
                                    {event.timestamp.toLocaleTimeString()}
                                </span>
                            </div>
                            {event.data && (
                                <div className={styles.eventData}>
                                    {event.data}
                                </div>
                            )}
                            {event.error && (
                                <div className={styles.eventError}>
                                    {event.error}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ReactEventStream;