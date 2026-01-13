import react from '@vitejs/plugin-react';
import path from 'path';
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
  resolve: {
    alias: {
      '@my-cashier/core': path.resolve(__dirname, 'libs/cashier/packages/core/src/index.ts'),
      '@my-cashier/types': path.resolve(__dirname, 'libs/cashier/packages/types/src/index.ts'),
      '@my-cashier/utils': path.resolve(__dirname, 'libs/cashier/packages/utils/src/index.ts'),
    },
  },
});
