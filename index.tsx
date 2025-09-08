import React, { useCallback } from 'react'
import * as ReactDOM from 'react-dom/client'
import { ReactEventStream, useEventStream } from './dist/ReactEventStream'
import './dist/ReactEventStream.styles.css'

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
        <div>
            {stream?.length > 0 ? String(stream) : 'Generating...'}
        </div>
    )
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
    <> 
        <section>
            <h1>ReactEventStream Component</h1>
            <ReactEventStream 
                url="http://localhost:3001/sse" 
                onEvent={(event) => event.type === 'completed' ? undefined : `${event.word ?? ''} `}
                render={(stream) => (<div>{stream}</div>)}
            />
        </section>
        <section>
            <h1>useEventStream() Hook</h1>
            <HookEventStream />
        </section>
    </>
)