import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

// import { miaodaDevPlugin } from "miaoda-sc-plugin";

// https://vite.dev/config/
export default defineConfig({
    server: {
        proxy: {
            '/api/ocr': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                rewrite: (path) => {
                    // 保持完整路径，让后端Express的路由中间件处理前缀
                    // 后端通过 app.use('/api/ocr', ocrRoutes) 处理 /api/ocr/* 路径
                    return path;
                },
            },
            // Keep existing proxy for other APIs if needed
            '/api/miaoda': {
                target: 'https://aip.baidubce.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            }
        }
    },
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: 'named',
        namedExport: 'ReactComponent',
      },
    }),
    // miaodaDevPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
