export function EventStore(url: string) {
    let retryCount = 0;
    let currentData: any = '';
    const listeners = new Set();

    function subscribe(callback: () => void) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    }

    function getSnapshot() {
      return currentData;
    }

    const eventSource = new EventSource(url)

    eventSource.onmessage = (event: any) => {
      const newData = JSON.parse(event.data);
      if (newData.type === 'chunk') {
        currentData = newData.word;  
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