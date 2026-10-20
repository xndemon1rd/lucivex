import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Development only: the Express backend checks the Origin header, so the dev
// proxy adds the origin the backend already accepts (see DEV_API_ORIGIN).
// Production builds never use this proxy.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.DEV_API_TARGET || 'http://localhost:3000';
  const origin = env.DEV_API_ORIGIN || 'https://watchanimeworld.one';

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Origin', origin);
              proxyReq.setHeader('Referer', origin + '/');
            });
          },
        },
      },
    },
    preview: { host: '0.0.0.0', port: 4173 },
    build: { target: 'es2020', sourcemap: false },
  };
});
