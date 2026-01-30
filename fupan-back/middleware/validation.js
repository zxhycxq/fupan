const { validationResult, body } = require('express-validator');

// 验证OCR请求
const validateOcrRequest = [
  body('image')
    .notEmpty()
    .withMessage('图像数据是必需的')
    .isLength({ max: 4000000 }) // 最大4MB相当于base64编码(4MB * 4/3)
    .withMessage('图像尺寸太大'),
  body('language_type')
    .optional()
    .isIn(['CHN_ENG', 'ENG', 'JAP', 'KOR', 'FRE', 'SPA', 'POR', 'GER', 'ITA', 'RUS'])
    .withMessage('无效的语言类型'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: '验证失败',
        details: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateOcrRequest
};