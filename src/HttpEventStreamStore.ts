type Listener = () => void;

function toBodyInit(data: unknown): { body?: BodyInit; headers?: Record<string, string> } {
  if (data === undefined) return {};

  // If caller already provided a BodyInit-ish value, pass through.
  if (
    typeof data === 'string' ||
    data instanceof Blob ||
    data instanceof ArrayBuffer ||
    data instanceof FormData ||
    data instanceof URLSearchParams ||
    data instanceof ReadableStream
  ) {
    return { body: data as BodyInit };
  }

  return {
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  };
}

function parseSseEventDataFrames(sseFrame: string): string[] {
  // SSE frames are separated by "\n\n". Within a frame, there can be multiple
  // "data:" lines that should be concatenated with "\n".
  const lines = sseFrame.split(/\r?\n/);
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith('data:')) dataLines.push(line.slice('data:'.length).trimStart());
  }
  if (dataLines.length === 0) return [];
  return [dataLines.join('\n')];
}

export function HttpEventStreamStore<P, R, D = unknown>(
  url: string,
  data: D | undefined,
  onEvent: (event: P) => R | undefined,
  fetchInit?: Omit<RequestInit, 'method' | 'body'>,
) {
  let retryCount = 0;
  let currentData: R | undefined;
  const listeners = new Set<Listener>();

  let controller: AbortController | undefined;
  let stopped = false;
  let currentInput: D | undefined = data;

  function notify() {
    listeners.forEach((l) => l());
  }

  function abortCurrentRequest() {
    controller?.abort();
    controller = undefined;
  }

  async function start() {
    // Defer network work until we both have an input payload and a consumer.
    if (controller || stopped) return;
    if (listeners.size === 0) return;
    if (currentInput === undefined) return;

    controller = new AbortController();
    const { body, headers } = toBodyInit(currentInput);

    try {
      const res = await fetch(url, {
        ...fetchInit,
        method: 'POST',
        body,
        headers: {
          Accept: 'text/event-stream',
          ...(headers ?? {}),
          ...(fetchInit?.headers ?? {}),
        },
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      if (!res.body) throw new Error('Response body is not readable');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE frames.
        while (true) {
          const idx = buffer.indexOf('\n\n');
          if (idx === -1) break;

          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          for (const dataStr of parseSseEventDataFrames(frame)) {
            const newData = JSON.parse(dataStr) as P;
            const parsedData = onEvent(newData);
            if (parsedData === undefined) {
              currentData = undefined;
              retryCount = 0;
              stop();
              return;
            }

            currentData = parsedData;
            notify();
          }
        }
      }
    } catch (err) {
      if (controller?.signal.aborted) return;

      retryCount++;
      if (retryCount >= 3) {
        retryCount = 0;
        stop();
        return;
      }

      // allow a subsequent start() attempt
      controller = undefined;
      if (!stopped) start();
    }
  }

  function stop() {
    stopped = true;
    abortCurrentRequest();
  }

  function subscribe(callback: Listener) {
    listeners.add(callback);
    start();
    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) stop();
    };
  }

  function getSnapshot() {
    return currentData;
  }

  function setData(nextData: D | undefined) {
    currentInput = nextData;

    // If we already have an active request, restart with the new input.
    if (controller) {
      abortCurrentRequest();
    }

    // Clear out previous output when input is cleared.
    if (currentInput === undefined) {
      currentData = undefined;
      retryCount = 0;
      notify();
      return;
    }

    start();
  }

  return {
    subscribe,
    getSnapshot,
    setData,
  };
}

