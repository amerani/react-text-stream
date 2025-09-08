import React, { useCallback } from 'react'
import * as ReactDOM from 'react-dom/client'
import { ReactEventStream, useEventStream } from './dist/ReactEventStream'
import './terminal-styles.css'

const HookEventStream: React.ComponentType = () => {
    const stream:any = useEventStream(
        'http://localhost:3001/sse', 
        useCallback((event: { type: string, word: string }): string|undefined => {
            switch (event.type) {
                case 'chunk':
                    return `${event.word} `;
                case 'completed':
                    return undefined;
                default:
                    return '';
            }
        }, []),
    )!;

    return (
        <div className="terminal-window">
            {stream?.length > 0 ? String(stream) : (
                <span className="terminal-generating">Generating...</span>
            )}
        </div>
    )
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
    <div className="terminal-page">
        <section className="terminal-section">
            <h1 className="terminal-header">ReactEventStream Component</h1>
            <ReactEventStream 
                url="http://localhost:3001/sse" 
                onEvent={(event) => event.type === 'completed' ? undefined : `${event.word ?? ''} `}
                render={(stream) => (
                    <div className="terminal-window">
                        {stream}
                    </div>
                )}
            />
        </section>
        <section className="terminal-section">
            <h1 className="terminal-header">useEventStream() Hook</h1>
            <HookEventStream />
        </section>
    </div>
)