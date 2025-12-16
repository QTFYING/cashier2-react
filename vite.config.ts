import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteMockServe } from 'vite-plugin-mock';
import UnoCSS from 'unocss/vite';

// https://vite.dev/config/
export default defineConfig({
  cacheDir: '.vite-cache',
  plugins: [
    react(),
    UnoCSS(),
    viteMockServe({
      mockPath: 'mock',
      enable: true,
    }),
  ],
});
