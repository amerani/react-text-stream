import { useState, useSyncExternalStore, useEffect, useMemo } from 'react';
import { EventStore } from './EventStore';

function useEventStream(url: string) {
    const eventStore = useMemo(() => EventStore(url), [url]);
    const [stream, setStream] = useState<string>('');   
    const sseChunk = useSyncExternalStore(eventStore.subscribe, eventStore.getSnapshot);

    useEffect(() => {
        if (sseChunk.length > 0) {
            setStream((curStream) => {
                if (curStream.length % 500 === 0) {
                    return curStream + '\n' + sseChunk;
                }
                return curStream + ' ' + sseChunk;
            });
        }
    }, [sseChunk]);

    return stream;
}

export default useEventStream;