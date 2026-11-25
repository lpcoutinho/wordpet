import { defineConfig } from 'vite';

const headers = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

export default defineConfig({
  server: { headers },
  preview: { headers },
  optimizeDeps: { exclude: ['@sqlite.org/sqlite-wasm'] },
});
