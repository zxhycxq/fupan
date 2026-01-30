const express = require('express');
const router = express.Router();
const { validateOcrRequest } = require('../middleware/validation');
const { recognizeText, getBDToken } = require('../utils/ocrService');
const { ocrApiLimiter, checkPayloadSize, validateContentType, sanitizeInput } = require('../middleware/security');

// 获取访问令牌的路由
// 此路由供内部使用，前端不应直接调用
router.get('/token', ocrApiLimiter, async (req, res) => {
  try {
    const token = await getBDToken();
    res.json({
      success: true,
      token: token,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('获取令牌错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取访问令牌失败'
    });
  }
});

// OCR识别路由
// 此路由接收前端请求，内部处理token获取和过期判断
router.post('/recognize', 
  ocrApiLimiter, 
  checkPayloadSize, 
  validateContentType, 
  sanitizeInput, 
  validateOcrRequest, 
  async (req, res) => {
    try {
      const { image, language_type } = req.body;
      
      // 调用OCR识别函数
      // 此函数内部会处理token的获取和过期判断
      const result = await recognizeText({ 
        image, 
        language_type: language_type || 'CHN_ENG' 
      });
      
      // 直接返回百度AI的原始响应数据
      // 前端代码按照官方格式处理
      res.json(result);
    } catch (error) {
      console.error('OCR识别错误:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'OCR识别失败'
      });
    }
  });

module.exports = router;