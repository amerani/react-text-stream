export function EventStore<P,R>(url: string, parser: (event: P) => R|undefined) {
    let retryCount = 0;
    let currentData: R|undefined;
    const listeners = new Set();

    function subscribe(callback: () => void) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    }

    function getSnapshot() {
      return currentData;
    }

    const eventSource = new EventSource(url)

    eventSource.onmessage = (event: MessageEvent) => {
      const newData = JSON.parse(event.data) as P;
      const parsedData = parser(newData);
      if (parsedData) {
        currentData = parsedData;  
        listeners.forEach((listener: any) => listener());
      }
    };

    eventSource.onerror = () => {
      retryCount++;
      if (retryCount >= 3) {
        retryCount = 0;
        eventSource.close();
      }
    };

    return {
      subscribe,
      getSnapshot,
    }
}