import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { builtinModules } from 'module';

export default defineConfig({
  plugins: [react()],
  root: '.',
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer/src'),
      '@main': path.resolve(__dirname, 'src/main'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      external: [...builtinModules, 'electron', ...builtinModules.map((m) => `node:${m}`)],
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
