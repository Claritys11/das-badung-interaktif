import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Multi-page: dev harness (index) + dua halaman standalone untuk iframe.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        harness: resolve(import.meta.dirname, 'index.html'),
        slideshow: resolve(import.meta.dirname, 'embed/slideshow.html'),
        peta: resolve(import.meta.dirname, 'embed/peta.html'),
        timeline: resolve(import.meta.dirname, 'embed/timeline.html'),
      },
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
