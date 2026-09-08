import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxy = {
  '/api': {
    target: 'http://localhost:4000',
    changeOrigin: true
  },
  '/socket.io': {
    target: 'http://localhost:4000',
    changeOrigin: true,
    ws: true
  }
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy
  },
  preview: {
    port: 4173,
    proxy
  }
});
