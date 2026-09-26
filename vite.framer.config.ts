import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Build library ESM untuk dipakai sebagai Framer Code Component (lihat framer/ & README).
export default defineConfig({
  plugins: [react()],
  // Jangan bawa key dari .env ke bundle publik ini; Framer mengirim key lewat prop.
  define: { 'import.meta.env.VITE_MAPTILER_KEY': JSON.stringify('') },
  publicDir: false,
  build: {
    outDir: 'dist/framer',
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: true,
    lib: {
      entry: resolve(import.meta.dirname, 'src/framer-entry.ts'),
      formats: ['es'],
      fileName: () => 'das-badung.js',
      cssFileName: 'das-badung',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'],
    },
  },
});
