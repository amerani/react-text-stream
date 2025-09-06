import type { UserConfig } from 'vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    server: {
        open: true,
        port: 3000,
        host: '127.0.0.1',
    },
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'react-event-stream',
            fileName: 'ReactEventStream',
            formats: ['es', 'cjs', 'umd'],
        },
        rollupOptions: {
            external: ['react', 'react-dom'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                },
            },
        },
    }
}) satisfies UserConfig