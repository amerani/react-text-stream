import { useState } from 'react'
import * as ReactDOM from 'react-dom/client'
import { ReactTextStream, useTextStream } from 'react-text-stream'
import './index.css'

const config = {
  url: 'http://localhost:3001/sse',
  httpUrl: 'http://localhost:3001/http-stream',
  onEvent: (event: { type: string; word: string }) =>
    event.type === 'completed' ? undefined : `${event.word ?? ''} `,
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(<App />)

function App() {
  const [eventType, setEventType] = useState('')
  const [id, setId] = useState(Number.MAX_SAFE_INTEGER)
  const onEvent = (event: { type: string; word: string }) => {
    setEventType(event.type)
    return config.onEvent(event)
  }
  const reconnect = () => setId((id) => id - 1)
  return (
    <div className="terminal-page">
      <header>
        <button type="button" onClick={reconnect}>
          <b>Click to Reconnect</b>
          <br />
          ({eventType === 'chunk' ? 'streaming' : eventType})
        </button>
      </header>
      <Streams onEvent={onEvent} key={id} />
    </div>
  )
}

function Streams({ onEvent }: { onEvent: (event: { type: string; word: string }) => string | undefined }) {
  return (
    <>
      <section className="terminal-section">
        <h1 className="terminal-header">ReactTextStream Component</h1>
        <ReactTextStream
          url={config.url}
          onEvent={onEvent}
          render={(stream) => <div className="terminal-window">{stream}</div>}
        />
      </section>
      <section className="terminal-section">
        <h1 className="terminal-header">useTextStream() Hook</h1>
        <HookTextStream />
      </section>
      <section className="terminal-section">
        <h1 className="terminal-header">useTextStream() Hook (HTTP POST + event-stream)</h1>
        <HookHttpTextStream />
      </section>
    </>
  )
}

function HookTextStream() {
  const stream = useTextStream(config.url, config.onEvent)
  return (
    <div className="terminal-window">
      {stream && stream.length > 0 ? String(stream) : (
        <span className="terminal-generating">Generating...</span>
      )}
    </div>
  )
}

function HookHttpTextStream() {
  const [message, setMessage] = useState('hello from client')
  const [submittedMessage, setSubmittedMessage] = useState<string | undefined>(undefined)
  const stream = useTextStream({
    url: config.httpUrl,
    store: 'http',
    data: submittedMessage === undefined ? undefined : { message: submittedMessage },
    onEvent: config.onEvent,
  })
  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <label>
          HTTP message:{' '}
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ width: 320 }}
          />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <button type="button" onClick={() => setSubmittedMessage(message)}>
          Start HTTP stream
        </button>
        <button type="button" onClick={() => setSubmittedMessage(undefined)} style={{ marginLeft: 8 }}>
          Reset
        </button>
      </div>
      <div className="terminal-window">
        {stream && stream.length > 0 ? String(stream) : (
          <span className="terminal-generating">
            {submittedMessage === undefined ? 'Waiting for input…' : 'Generating...'}
          </span>
        )}
      </div>
    </>
  )
}
