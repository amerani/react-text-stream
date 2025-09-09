import React, { useState } from 'react'
import * as ReactDOM from 'react-dom/client'
import { ReactEventStream, useEventStream } from './dist/ReactEventStream'
import './index.css'

const config = {
    url: 'http://localhost:3001/sse',
    onEvent: (event: { type: string, word: string }) => event.type === 'completed' ? undefined : `${event.word ?? ''} `
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);

function App() {
    const [eventType, setEventType] = useState("");
    const [id, setId] = useState(Number.MAX_SAFE_INTEGER);
    const onEvent = (event) => {
        setEventType(event.type);
        return config.onEvent(event);
    }
    const reconnect = () => setId(id => id-1);
    return (
        <div className="terminal-page">
            <header>
                <button onClick={reconnect}>
                    <b>Click to Reconnect</b>
                    <br/>
                    ({eventType === "chunk" ? "streaming": eventType})
                </button>
            </header>            
            <Streams onEvent={onEvent} key={id} />
        </div>   
    )
}

function Streams({ onEvent }) {
    return (
        <>
            <section className="terminal-section">
                <h1 className="terminal-header">ReactEventStream Component</h1>
                <ReactEventStream 
                    url={config.url} 
                    onEvent={onEvent}
                    render={(stream) => <div className="terminal-window">{stream}</div>}
                />
            </section>
            <section className="terminal-section">
                <h1 className="terminal-header">useEventStream() Hook</h1>
                <HookEventStream />
            </section>        
        </>        
    )
}

function HookEventStream() {
    const stream:any = useEventStream(config.url, config.onEvent);
    return (
        <div className="terminal-window">
            {stream?.length > 0 ? String(stream) : (
                <span className="terminal-generating">Generating...</span>
            )}
        </div>
    )
}