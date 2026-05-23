// ALTERAÇÕES:
// 1. Proxy movido de client/package.json → vite.config.js
//    Motivo: o campo "proxy" em package.json é uma convenção do Create React App (CRA),
//    não do Vite. O Vite ignora esse campo — o proxy nunca funcionou corretamente.
// 2. VITE_API_URL lida via import.meta.env para saber se roda em produção
//    Em dev: proxy local /api → localhost:5000
//    Em produção (Vercel): o frontend usa a URL absoluta do backend via VITE_API_URL

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    server: {
      // Proxy ativo APENAS em desenvolvimento local
      // Em produção, o Axios usa VITE_API_URL (URL absoluta do backend)
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
