import { defineConfig } from 'vite';

/** GitHub Pages project site: https://<user>.github.io/jesus-life/ */
export default defineConfig(({ mode }) => ({
  root: '.',
  publicDir: 'public',
  base: mode === 'production' ? '/jesus-life/' : '/',
  server: { port: 5180, host: '0.0.0.0' },
  build: { outDir: 'dist' },
}));