// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import http from 'node:http';
import { createDemoServerApp } from '../demo/server/src/index';

function parseSseDataFrames(buffer: string): { frames: string[]; rest: string } {
  const frames: string[] = [];
  let rest = buffer;
  while (true) {
    const idx = rest.indexOf('\n\n');
    if (idx === -1) break;
    frames.push(rest.slice(0, idx));
    rest = rest.slice(idx + 2);
  }
  return { frames, rest };
}

function sseFrameToJsonPayloads(frame: string): unknown[] {
  const lines = frame.split(/\r?\n/);
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith('data:')) dataLines.push(line.slice('data:'.length).trimStart());
  }
  if (dataLines.length === 0) return [];
  const dataStr = dataLines.join('\n');
  return [JSON.parse(dataStr)];
}

describe('demo server /http-stream', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createDemoServerApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address();
    if (addr === null || typeof addr === 'string') throw new Error('Expected numeric listen address');
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('streams whitespace-delimited words from input and completes', async () => {
    const message = ' hello   world\nthis\tis   a   test ';
    const expectedWords = ['hello', 'world', 'this', 'is', 'a', 'test'];

    const receivedWords: string[] = [];
    let sawCompleted = false;
    let sawConnected = false;

    // Hard timeout to avoid hanging CI
    const deadline = Date.now() + 9000;
    await new Promise<void>((resolve, reject) => {
      const { hostname, port } = new URL(baseUrl);
      const body = JSON.stringify({ message });

      const req = http.request(
        {
          hostname,
          port: Number(port),
          path: '/http-stream',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        (res) => {
          try {
            expect(res.statusCode).toBe(200);
            expect(String(res.headers['content-type'] ?? '')).toContain('text/event-stream');
          } catch (e) {
            reject(e);
            return;
          }

          let buffer = '';
          res.setEncoding('utf8');

          const timer = setInterval(() => {
            if (Date.now() > deadline) {
              clearInterval(timer);
              req.destroy(new Error('Timed out waiting for SSE completion'));
            }
          }, 25);

          res.on('data', (chunk: string) => {
            buffer += chunk.replace(/\r\n/g, '\n');

            const parsed = parseSseDataFrames(buffer);
            buffer = parsed.rest;

            for (const frame of parsed.frames) {
              for (const payload of sseFrameToJsonPayloads(frame)) {
                const evt = payload as any;
                if (evt?.type === 'connected') {
                  sawConnected = true;
                  continue;
                }
                if (evt?.type === 'chunk') {
                  receivedWords.push(String(evt.word ?? ''));
                  continue;
                }
                if (evt?.type === 'completed') {
                  sawCompleted = true;
                }
              }
            }

            if (sawCompleted) {
              clearInterval(timer);
              res.destroy();
              resolve();
            }
          });

          res.on('error', (err) => {
            clearInterval(timer);
            reject(err);
          });

          res.on('close', () => {
            clearInterval(timer);
            if (!sawCompleted) reject(new Error('Connection closed before completed event'));
          });
        },
      );

      req.on('error', reject);
      req.write(body);
      req.end();
    });

    expect(sawConnected).toBe(true);
    expect(receivedWords).toEqual(expectedWords);
    expect(sawCompleted).toBe(true);
  }, 10000);
});

