import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dbRoutes from './routes/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ===================== API 路由 =====================
app.use('/api', dbRoutes);

// 健康检查
app.get('/api/healthz', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===================== 静态文件服务（生产模式） =====================
const distPath = path.resolve(__dirname, '../../dist');
app.use(express.static(distPath, {
  maxAge: '1y',
  setHeaders(res, filePath) {
    // index.html 不缓存
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    // Vite 产物（带 hash）强缓存
    if (filePath.includes('/assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// SPA 路由回退 — 所有非 API 请求返回 index.html
app.get('*', (_req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 FormBuilder API 服务已启动: http://localhost:${PORT}`);
  console.log(`📁 静态文件目录: ${distPath}`);
});

export default app;
