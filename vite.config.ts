import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TypescriptA2S',
      formats: ['es', 'cjs'],
      fileName: (format: string) => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: [
        'node:dgram',
        'node:buffer',
        'node:timers',
        'node:events',
        'node:zlib',
        'dgram',
        'events',
        'zlib',
        'buffer',
        'timers',
      ],
      output: {
        globals: {
          'node:dgram': 'dgram',
          'node:buffer': 'buffer',
          'node:timers': 'timers',
          'node:events': 'events',
          'node:zlib': 'zlib',
          dgram: 'dgram',
          events: 'events',
          zlib: 'zlib',
          buffer: 'buffer',
          timers: 'timers',
        },
      },
    },
    target: 'node18',
    sourcemap: true,
    ssr: true,
  },
  define: {
    global: 'globalThis',
  },
  test: {
    environment: 'node',
  },
});
