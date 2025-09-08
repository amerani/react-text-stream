import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Read the lorem ipsum file
const loremFilePath = path.join(__dirname, '../../lorem.txt');
let loremText: string;

try {
  loremText = fs.readFileSync(loremFilePath, 'utf8');
  console.log(`Loaded lorem ipsum text: ${loremText.length} characters`);
} catch (error) {
  console.error('Error reading lorem ipsum file:', error);
  process.exit(1);
}

// Split text into words
const words = loremText.split(/\s+/).filter(word => word.length > 0).slice(0, 100);

// SSE endpoint
app.get('/sse', (req, res) => {
  console.log('New SSE connection established');

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection event
  res.write('data: {"type": "connected", "message": "SSE connection established"}\n\n');

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
      console.log(`Stream completed: sent all ${words.length} words`);
      
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

    // Log progress every 100 words
    if (wordIndex % 100 === 0) {
      console.log(`Sent ${wordIndex} words, current word: "${word}" (${word.length} chars)`);
    }
  }, 100); // Send a word every 100ms

  // Handle client disconnect
  req.on('close', () => {
    console.log('SSE connection closed');
    clearInterval(sendInterval);
  });

  req.on('error', (error) => {
    console.error('SSE connection error:', error);
    clearInterval(sendInterval);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    totalWords: words.length,
    textLength: loremText.length
  });
});

// Root endpoint with instructions
app.get('/', (req, res) => {
  res.json({
    message: 'SSE Test Server',
    endpoints: {
      '/sse': 'Server-Sent Events stream with lorem ipsum words',
      '/health': 'Health check endpoint'
    },
    stats: {
      totalWords: words.length,
      textLength: loremText.length
    }
  });
});

app.listen(PORT, () => {
  console.log(`SSE Test Server running on http://localhost:${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Total words to stream: ${words.length}`);
});
