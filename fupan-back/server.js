const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet());

// 速率限制以防止滥用
const { apiLimiter, ocrApiLimiter } = require('./middleware/security');
app.use(apiLimiter);

// Enable CORS for frontend integration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // In production, set to your frontend URL
  credentials: true
}));

// Parse JSON bodies
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 导入路由
const ocrRoutes = require('./routes/ocr');
const authRoutes = require('./routes/auth');

// 路由
app.use('/api/ocr', ocrRoutes);
app.use('/api/auth', authRoutes);

// 健康检查端点
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Fupan后端服务器正在运行',
    version: '1.0.0',
    services: ['OCR', '身份验证', '验证码']
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: '发生错误！',
    message: process.env.NODE_ENV === 'development' ? err.message : '内部服务器错误'
  });
});

// 404处理器
app.use('*', (req, res) => {
  res.status(404).json({
    error: '路由未找到'
  });
});

app.listen(PORT, () => {
  console.log(`Fupan backend server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;