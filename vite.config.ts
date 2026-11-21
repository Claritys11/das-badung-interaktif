import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Multi-page: dev harness (index) + halaman standalone untuk iframe.
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.trycloudflare.com', 'jawe.clarityz.my.id'], // 👈 Menambahkan izin untuk host Cloudflare
  },
  build: {
    rollupOptions: {
      input: {
        harness: resolve(import.meta.dirname, 'index.html'),
        slideshow: resolve(import.meta.dirname, 'embed/slideshow.html'),
        peta: resolve(import.meta.dirname, 'embed/peta.html'),
        timeline: resolve(import.meta.dirname, 'embed/timeline.html'),
        disabilitas: resolve(import.meta.dirname, 'embed/disabilitas.html'),
        sejarah: resolve(import.meta.dirname, 'embed/sejarah.html'),
        kesiapan: resolve(import.meta.dirname, 'embed/kesiapan.html'),
      },
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
