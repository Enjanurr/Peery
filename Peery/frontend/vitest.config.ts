import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    // The backend only allows CORS from http://localhost:5173, so jsdom must use that origin.
    environmentOptions: { jsdom: { url: 'http://localhost:5173' } },
    include: ['src/**/*.integration.test.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});