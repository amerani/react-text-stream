import { useState, useSyncExternalStore, useEffect, useMemo } from 'react';
import { EventStore } from './EventStore';

function useEventStream<P>(url: string, parser: (event: P) => string) {
    const eventStore = useMemo(() => EventStore<P,string>(url, parser), [url]);

    const [stream, setStream] = useState('');   
    
    const sseChunk = useSyncExternalStore(eventStore.subscribe, eventStore.getSnapshot);

    useEffect(() => {
        if (sseChunk !== undefined) {
            setStream((curStream) => {
                return curStream.concat(' ', sseChunk);
            })
        }
    }, [sseChunk]);

    return stream;
}

export default useEventStream;