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

  optimizeDeps: {
    // 告诉 Vite 不要预构建这些包，把它们当做源码处理
    exclude: ['@my-cashier/core', '@my-cashier/types'],
  },
  server: {
    fs: {
      // 允许 Vite 访问项目根目录之外的文件 (因为 link 到了 ../../github)
      allow: ['../..'],
    },
  },
});
