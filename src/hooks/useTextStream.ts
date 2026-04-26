import { useState, useSyncExternalStore, useEffect, useMemo } from 'react';
import { EventStore } from '../EventStore';
import { HttpEventStreamStore } from '../HttpEventStreamStore';

export type UseTextStreamOptions<P, D = unknown> = {
  url: string;
  onEvent: (event: P) => string | undefined;
  store?: 'sse' | 'http';
  data?: D;
  fetchInit?: Omit<RequestInit, 'method' | 'body'>;
};

function useTextStream<P>(url: string, onEvent: (event: P) => string | undefined): string | undefined;
function useTextStream<P, D = unknown>(options: UseTextStreamOptions<P, D>): string | undefined;
function useTextStream<P, D = unknown>(
  urlOrOptions: string | UseTextStreamOptions<P, D>,
  onEventArg?: (event: P) => string | undefined,
) {
  const options: UseTextStreamOptions<P, D> =
    typeof urlOrOptions === 'string'
      ? { url: urlOrOptions, onEvent: onEventArg as (event: P) => string | undefined, store: 'sse' }
      : urlOrOptions;

  const storeType = options.store ?? 'sse';
  const url = options.url;
  const onEvent = options.onEvent;
  const data = options.data as D;
  const fetchInit = options.fetchInit;

  const eventStore = useMemo(() => {
    if (storeType === 'http') {
      return HttpEventStreamStore<P, string, D>(url, undefined, onEvent, fetchInit);
    }

    // Preserve prior behavior for SSE: a stable store keyed by URL.
    return EventStore<P, string>(url, onEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, storeType === 'http' ? [storeType, url, onEvent, fetchInit] : [storeType, url]);

  useEffect(() => {
    if (storeType !== 'http') return;
    (eventStore as ReturnType<typeof HttpEventStreamStore<P, string, D>>).setData(data);
  }, [storeType, eventStore, data]);

  const [stream, setStream] = useState<string>();

  const chunk = useSyncExternalStore(eventStore.subscribe, eventStore.getSnapshot);

  useEffect(() => {
    if (chunk !== undefined) {
      setStream((curStream) => {
        if (!curStream) return chunk;
        return curStream.concat(chunk);
      });
    }
  }, [chunk]);

  return stream;
}

export default useTextStream;