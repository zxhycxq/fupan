const rateLimit = require('express-rate-limit');
const config = require('../config/config');

// 增强的速率限制中间件
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: config.rateLimit.message,
  standardHeaders: true, // 在`RateLimit-*`头部返回速率限制信息
  legacyHeaders: false, // 禁用`X-RateLimit-*`头部
});

// 专门针对OCR API的额外速率限制(更严格的限制)
const ocrApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 20, // 限制每个IP在窗口时间内最多20次OCR请求
  message: '来自此IP的OCR请求过多，请稍后再试。',
  standardHeaders: true,
  legacyHeaders: false,
});

// 检查请求大小的中间件
const checkPayloadSize = (req, res, next) => {
  const contentLength = req.get('Content-Length');
  
  if (contentLength && parseInt(contentLength) > config.ocr.maxFileSize) {
    return res.status(413).json({
      success: false,
      error: '请求负载过大',
      message: `最大允许大小为 ${config.ocr.maxFileSize} 字节`
    });
  }
  
  next();
};

// 验证OCR请求内容类型的中间件
const validateContentType = (req, res, next) => {
  const contentType = req.get('Content-Type');
  
  // 对于OCR请求，我们期望JSON内容
  if (!contentType.includes('application/json')) {
    return res.status(400).json({
      success: false,
      error: '无效的内容类型',
      message: '期望 application/json'
    });
  }
  
  next();
};

// 清理输入的中间件
const sanitizeInput = (req, res, next) => {
  if (req.body && req.body.image) {
    // 基本验证确保图像是base64字符串
    const base64Regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;
    
    // 如果存在则移除数据URL前缀(例如，data:image/jpeg;base64,)
    let imageString = req.body.image;
    if (imageString.startsWith('data:')) {
      imageString = imageString.split(',')[1];
    }
    
    if (!base64Regex.test(imageString)) {
      return res.status(400).json({
        success: false,
        error: '无效的图像格式',
        message: '图像必须是有效的base64编码字符串'
      });
    }
  }
  
  next();
};

module.exports = {
  apiLimiter,
  ocrApiLimiter,
  checkPayloadSize,
  validateContentType,
  sanitizeInput
};