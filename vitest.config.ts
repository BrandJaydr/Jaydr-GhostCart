import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Vitest configuration for unit and integration tests
// Docs: https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for React component tests
    environment: 'jsdom',
    // Automatically import testing utilities
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    // Exclude E2E tests (run via Playwright)
    exclude: ['node_modules/**', '.next/**', 'e2e/**'],
    // Coverage thresholds — tighten as the codebase grows
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'e2e/',
        '**/*.config.*',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
