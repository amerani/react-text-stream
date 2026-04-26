# Contributing

Thanks for contributing!

## Prerequisites

- Node.js (this repo’s demo uses Vite; Node 20.19+ recommended)
- npm

## Install

From the repo root:

```bash
npm install
```

## Useful npm scripts (recommended)

Run these from the repo root (they’re defined in the root `package.json`):

```bash
# one command: install demo deps, build, then run server+client in parallel
npm run demo

# if you only need pieces
npm run demo:install
npm run demo:server
npm run demo:client

# library build + tests
npm run build
npm run test
npm run test:ci
npm run test:coverage
npm run test:ui
```

## Running the demo (manual verification)

The demo is split into two apps:

- `demo/server`: Express server that exposes streaming endpoints
- `demo/client`: Vite + React client that consumes the streams

### 1) Start the server

```bash
cd demo/server
npm install
npm run dev
```

By default it runs on `http://localhost:3001`.

Endpoints:

- `GET /sse`: Server-Sent Events stream
- `POST /http-stream`: HTTP POST that responds with `text/event-stream`
- `GET /health`: health check

### 2) Start the client

In a second terminal:

```bash
cd demo/client
npm install
npm run dev
```

The page will open automatically. It renders:

- `ReactTextStream` component using SSE
- `useTextStream(url, onEvent)` using SSE
- `useTextStream({ store: "http", data, ... })` using HTTP POST + event-stream

### 3) What to verify

- **SSE path**: streaming words appear and ends with a “completed” event
- **HTTP POST path**: streaming words appear; changing the “HTTP message” input changes the request body sent to the server
- **Reconnect button**: restarts the stream

## Local build

From the repo root:

```bash
npm run build
```

