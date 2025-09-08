import { useState, useSyncExternalStore, useEffect, useMemo } from 'react';
import { EventStore } from './EventStore';

function useEventStream<P>(url: string, onEvent: (event: P) => string|undefined) {
    const eventStore = useMemo(() => EventStore<P,string>(url, onEvent), [url]);

    const [stream, setStream] = useState<string>();   
    
    const sseChunk = useSyncExternalStore(eventStore.subscribe, eventStore.getSnapshot);

    useEffect(() => {
        if (sseChunk !== undefined) {
            setStream((curStream) => {
                if (!curStream) {
                    return sseChunk;
                }
                return curStream?.concat(sseChunk);
            })
        }
    }, [sseChunk]);

    return stream;
}

export default useEventStream;