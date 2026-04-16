import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        // Better long-term caching: split a few stable vendor chunks.
        // Keep React + router together to avoid circular chunk deps at runtime.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n';
          }
          if (id.includes('axios')) {
            return 'axios';
          }
          // antd + React phải cùng chunk để tránh lỗi createContext undefined
          return 'vendor';
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});

