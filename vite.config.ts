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
    css: {
        modules: {
            localsConvention: 'camelCase',
            globalModulePaths: [new RegExp(resolve(__dirname, 'src/global.d.ts'))],
        }
    },
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'react-event-stream',
            fileName: 'ReactEventStream',
            cssFileName: 'ReactEventStream.styles',
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