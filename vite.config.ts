import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Baca VITE_API_URL agar dev-proxy /api mengarah ke backend yang sama.
  // Kosong = tanpa proxy (pakai backend satu domain / mock lokal).
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = (env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server:
      apiTarget === ''
        ? undefined
        : {
            proxy: {
              '/api': {
                target: apiTarget,
                changeOrigin: true,
              },
            },
          },
  };
});
