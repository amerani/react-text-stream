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
                    return `${event.word} $$ `;
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
        <ReactEventStream />
        <HookEventStream />
    </>
)