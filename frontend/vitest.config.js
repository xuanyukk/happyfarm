import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}', 'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    testTimeout: 10000,
    threads: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js', 'src/**/*.vue'],
      exclude: ['src/main.js', 'src/router.js', '**/*.spec.js', '**/*.test.js']
    },
    setupFiles: ['./__tests__/setup.js']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
