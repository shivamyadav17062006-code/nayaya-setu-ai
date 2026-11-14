import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function frontendHealthPlugin() {
  return {
    name: 'frontend-health-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/health' || req.url === '/health/') {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              status: 'ok',
              service: 'nyayasaathi-frontend',
              port: 3000,
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), frontendHealthPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
