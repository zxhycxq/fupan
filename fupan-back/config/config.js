require('dotenv').config();

module.exports = {
  // 服务器配置
  port: process.env.PORT || 8080,
  env: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || '*',

  // 百度AI配置
  baidu: {
    apiKey: process.env.BAIDU_API_KEY,
    secretKey: process.env.BAIDU_SECRET_KEY,
    tokenUrl: 'https://aip.baidubce.com/oauth/2.0/token',
    ocrUrl: 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic',//高精度
    // ocrUrl: 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic',//普通版本
  },

  // 安全配置
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: process.env.RATE_LIMIT_MAX || 100, // 限制每个IP在窗口时间内最多100个请求
    message: '来自此IP的请求过多，请稍后再试。'
  },

  // OCR配置
  ocr: {
    maxFileSize: 4 * 1024 * 1024, // 4MB，以字节为单位
    supportedLanguages: ['CHN_ENG', 'ENG', 'JAP', 'KOR', 'FRE', 'SPA', 'POR', 'GER', 'ITA', 'RUS'],
    defaultLanguage: 'CHN_ENG'
  }
};
