import { useState, useSyncExternalStore, useEffect, useMemo } from 'react';
import { EventStore } from './EventStore';

function useEventStream<P>(url: string, parser: (event: P) => string) {
    const eventStore = useMemo(() => EventStore<P,string>(url, parser), [url]);

    const [stream, setStream] = useState('');   
    
    const sseChunk = useSyncExternalStore(eventStore.subscribe, eventStore.getSnapshot);

    useEffect(() => {
        if (sseChunk !== undefined) {
            setStream((curStream) => {
                if (curStream.length % 500 === 0) {
                    return curStream + '\n' + sseChunk;
                }
                return curStream + ' ' + sseChunk;
            })
        }
    }, [sseChunk]);

    return stream;
}

export default useEventStream;