# SSE Test Server

This directory contains a test server that implements Server-Sent Events (SSE) to stream lorem ipsum text data to clients.

## Files

- `server/` - Express TypeScript server with SSE endpoint
- `lorem.txt` - 10KB lorem ipsum text file used as data source
- `client.html` - Simple HTML client to test the SSE connection

## Server Features

- **Express TypeScript server** running on port 3001
- **SSE endpoint** at `/sse` that streams lorem ipsum words
- **Word-length chunks** - each SSE event contains one word with its length
- **Continuous streaming** - loops through the text indefinitely
- **Health check** endpoint at `/health`
- **CORS enabled** for cross-origin requests

## Quick Start

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```
   Or build and run:
   ```bash
   npm run build
   npm start
   ```

3. **Test the SSE endpoint:**
   - Open `client.html` in a browser
   - Or connect directly to `http://localhost:3001/sse`

## API Endpoints

- `GET /` - Server info and stats
- `GET /health` - Health check with text statistics
- `GET /sse` - Server-Sent Events stream

## SSE Data Format

Each SSE event contains JSON data with the following structure:

```json
{
  "type": "chunk",
  "word": "lorem",
  "wordLength": 5,
  "index": 0,
  "totalWords": 1513,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Server Configuration

- **Port:** 3001 (configurable via PORT environment variable)
- **Word interval:** 100ms between words
- **Text source:** 10KB lorem ipsum (1,513 words)
- **Stream behavior:** Continuous loop through all words

## Testing

The included `client.html` provides a simple web interface to:
- Connect/disconnect from the SSE stream
- View real-time word statistics
- Display streaming words
- Monitor connection status

Open `client.html` in a browser after starting the server to test the SSE functionality.
