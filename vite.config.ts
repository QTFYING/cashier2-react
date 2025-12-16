import react from '@vitejs/plugin-react';
import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vite';
import { viteMockServe } from 'vite-plugin-mock';

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
