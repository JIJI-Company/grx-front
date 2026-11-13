import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Dev: forward /api/* to the NestJS backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Dev only: 운영 서버의 공개 API를 읽기만 한다 (/castle-preview가 실제 데이터로 디자인을 확인할 때 사용)
      '/prod-api': {
        target: 'https://grx-back-production-d31b.up.railway.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/prod-api/, '/api'),
      },
    },
  },
});
