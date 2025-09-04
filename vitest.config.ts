import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'vite.config.ts',
        'vitest.config.ts',
      ],
    },
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules/', 'dist/'],
  },
});
