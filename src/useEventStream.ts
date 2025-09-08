import { useState, useSyncExternalStore, useEffect, useMemo } from 'react';
import { EventStore } from './EventStore';

interface Streamable {
    concat(other: Streamable): Streamable;
    length: number;
}

function useEventStream<P>(url: string, parser: (event: P) => Streamable) {
    const eventStore = useMemo(() => EventStore<P,Streamable>(url, parser), [url]);

    const [stream, setStream] = useState<Streamable>();   
    
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