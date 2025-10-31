import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@chrono/motion', replacement: path.resolve(__dirname, '../src') },
      { find: '@chrono/tokens', replacement: path.resolve(__dirname, '../../tokens/src') },
      { find: '@chrono/line-net', replacement: path.resolve(__dirname, '../../line-net/src') },
    ],
  },
  server: {
    port: 5175,
  },
});
