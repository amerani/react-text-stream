import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

let reqSeq = 0;
function nextReqId(prefix: string) {
  reqSeq = (reqSeq + 1) % Number.MAX_SAFE_INTEGER;
  return `${prefix}-${Date.now().toString(36)}-${reqSeq}`;
}

function nowMs() {
  return Date.now();
}

export function createDemoServerApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  function getLoremWords(): string[] {
    // Read on-demand so importing this module in tests doesn't require the file.
    const loremFilePath = path.join(__dirname, '../../lorem.txt');
    try {
      const loremText = fs.readFileSync(loremFilePath, 'utf8');
      return loremText.split(/\s+/).filter((word) => word.length > 0).slice(0, 100);
    } catch {
      // Fallback: a short deterministic sample.
      return 'lorem ipsum dolor sit amet consectetur adipiscing elit'.split(/\s+/);
    }
  }

// SSE endpoint
  app.get('/sse', (req, res) => {
  const reqId = nextReqId('sse');
  const startedAt = nowMs();
  console.log(`[${reqId}] SSE request`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    ua: req.get('user-agent'),
  });

  const words = getLoremWords();
  console.log(`[${reqId}] SSE words loaded`, { totalWords: words.length });

  // Set SSE headers
  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });
  res.flushHeaders?.();
  console.log(`[${reqId}] SSE headers flushed`);

  // Send initial connection event
  res.write('data: {"type": "connected", "message": "SSE connection established"}\n\n');
  console.log(`[${reqId}] SSE connected event sent`);

  let wordIndex = 0;
  const sendInterval = setInterval(() => {
    if (wordIndex >= words.length) {
      // Send completion event and close connection
      const completionChunk = {
        type: 'completed',
        message: 'All words have been sent',
        totalWords: words.length,
        timestamp: new Date().toISOString()
      };
      
      res.write(`data: ${JSON.stringify(completionChunk)}\n\n`);
      console.log(`[${reqId}] SSE completed`, {
        sentWords: words.length,
        elapsedMs: nowMs() - startedAt,
      });
      
      clearInterval(sendInterval);
      res.end();
      return;
    }

    const word = words[wordIndex];
    const chunk = {
      type: 'chunk',
      word: word,
      wordLength: word.length,
      index: wordIndex,
      totalWords: words.length,
      timestamp: new Date().toISOString()
    };

    // Send the chunk as SSE data
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    
    wordIndex++;

    // Log progress occasionally to avoid noise.
    if (wordIndex === 1 || wordIndex % 25 === 0 || wordIndex === words.length) {
      console.log(`[${reqId}] SSE progress`, {
        sent: wordIndex,
        total: words.length,
        lastWord: word,
      });
    }
  }, 100); // Send a word every 100ms

  // Handle client disconnect
  res.on('close', () => {
    console.log(`[${reqId}] SSE connection closed`, {
      sent: wordIndex,
      total: words.length,
      elapsedMs: nowMs() - startedAt,
    });
    clearInterval(sendInterval);
  });

  res.on('error', (error) => {
    console.error(`[${reqId}] SSE connection error`, error);
    clearInterval(sendInterval);
  });
  });

// HTTP POST -> SSE response endpoint
  app.post('/http-stream', (req, res) => {
  const { message } = (req.body ?? {}) as { message?: string };
  const reqId = nextReqId('http');
  const startedAt = nowMs();
  console.log(`[${reqId}] HTTP stream request`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    ua: req.get('user-agent'),
    contentType: req.get('content-type'),
    contentLength: req.get('content-length'),
    messageChars: (message ?? '').length,
    messagePreview: (message ?? '').slice(0, 120),
  });

  const input = (message ?? '').trim();
  const inputWords = input.length > 0 ? input.split(/\s+/).filter(Boolean) : [];
  console.log(`[${reqId}] HTTP stream parsed input`, { totalWords: inputWords.length });

  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
  });
  res.flushHeaders?.();
  console.log(`[${reqId}] HTTP stream headers flushed`);

  res.write(
    `data: ${JSON.stringify({
      type: 'connected',
      message: 'HTTP stream established',
      requestMessage: message ?? '',
    })}\n\n`,
  );
  console.log(`[${reqId}] HTTP connected event sent`);

  let wordIndex = 0;
  const sendInterval = setInterval(() => {
    if (wordIndex >= inputWords.length) {
      const completionChunk = {
        type: 'completed',
        message: 'All words have been sent',
        totalWords: inputWords.length,
        timestamp: new Date().toISOString(),
      };

      res.write(`data: ${JSON.stringify(completionChunk)}\n\n`);
      console.log(`[${reqId}] HTTP stream completed`, {
        sentWords: inputWords.length,
        elapsedMs: nowMs() - startedAt,
      });

      clearInterval(sendInterval);
      res.end();
      return;
    }

    const word = inputWords[wordIndex];
    const chunk = {
      type: 'chunk',
      word: word,
      wordLength: word.length,
      index: wordIndex,
      totalWords: inputWords.length,
      timestamp: new Date().toISOString(),
    };

    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    wordIndex++;

    if (wordIndex === 1 || wordIndex % 10 === 0 || wordIndex === inputWords.length) {
      console.log(`[${reqId}] HTTP stream progress`, {
        sent: wordIndex,
        total: inputWords.length,
        lastWord: word,
      });
    }
  }, 100);

  res.on('close', () => {
    console.log(`[${reqId}] HTTP stream connection closed`, {
      sent: wordIndex,
      total: inputWords.length,
      elapsedMs: nowMs() - startedAt,
    });
    clearInterval(sendInterval);
  });

  res.on('error', (error) => {
    console.error(`[${reqId}] HTTP stream connection error`, error);
    clearInterval(sendInterval);
  });
  });

// Health check endpoint
  app.get('/health', (req, res) => {
  const words = getLoremWords();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    totalWords: words.length,
    textLength: null,
  });
  });

// Root endpoint with instructions
  app.get('/', (req, res) => {
  const words = getLoremWords();
  res.json({
    message: 'SSE Test Server',
    endpoints: {
      '/sse': 'Server-Sent Events stream with lorem ipsum words',
      '/http-stream': 'HTTP POST that responds with an event-stream',
      '/health': 'Health check endpoint'
    },
    stats: {
      totalWords: words.length,
      textLength: null,
    }
  });
  });

  return app;
}

const PORT = process.env.PORT || 3001;
if (!process.env.VITEST) {
  const app = createDemoServerApp();
  app.listen(PORT, () => {
    console.log(`SSE Test Server running on http://localhost:${PORT}`);
    console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}
