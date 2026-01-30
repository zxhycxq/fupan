const axios = require('axios');
const config = require('../config/config');

// 全局变量存储token和过期时间
let accessToken = '';
let tokenExpireTime = 0;

/**
 * 从百度AI平台获取访问令牌
 * 访问令牌有效期为30天(2592000秒)
 * 在过期前1天(86400秒)刷新
 */
async function getBDToken() {
  const now = Date.now();
  
  // 检查是否有有效令牌(未过期且超过1天后才过期)
  if (accessToken && (now + 86400000) < tokenExpireTime) { // 86400000毫秒 = 1天
    console.log('使用现有的有效令牌');
    return accessToken;
  }
  
  console.log('获取新的访问令牌...');
  
  try {
    const { apiKey, secretKey, tokenUrl } = config.baidu;
    
    if (!apiKey || !secretKey) {
      throw new Error('必须在环境变量中设置BAIDU_API_KEY和BAIDU_SECRET_KEY');
    }
    
    const response = await axios.post(
      tokenUrl,
      null,
      {
        params: {
          grant_type: 'client_credentials',
          client_id: apiKey,
          client_secret: secretKey,
        },
      }
    );
    
    if (response.data.access_token) {
      accessToken = response.data.access_token;
      // 设置过期时间(expires_in以秒为单位，转换为毫秒)
      // 减去1天(86400秒)提前刷新
      tokenExpireTime = now + (response.data.expires_in - 86400) * 1000;
      
      console.log('成功获取新的访问令牌');
      // console.log('令牌过期时间:', new Date(tokenExpireTime));
      
      return accessToken;
    } else {
      throw new Error(response.data.error_description || '获取访问令牌失败');
    }
  } catch (error) {
    console.error('获取访问令牌错误:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
      console.error('响应状态:', error.response.status);
    }
    throw error;
  }
}

/**
 * 调用百度OCR API识别图像中的文本
 * @param {Object} request - OCR请求对象，包含图像和语言设置
 * @returns {Promise<string>} 识别的文本
 */
async function recognizeText(request) {
  try {
    // Get valid access token
    const token = await getBDToken();
    
    // 构建OCR API的表单数据
    const formData = new URLSearchParams();
    formData.append('image', request.image);
    formData.append('language_type', request.language_type || 'CHN_ENG');
    formData.append('detect_direction', 'true');
    formData.append('probability', 'true');
    formData.append('paragraph', 'true');
    formData.append('recognize_granularity', 'big');
    formData.append('vertexes_location', 'true');
    
    // 调用百度OCR API
    const response = await axios.post(
      `${config.baidu.ocrUrl}?access_token=${token}`,
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    // 处理结果
    const result = response.data;
    
    // 检查API是否返回错误
    if (result.error_code) {
      throw new Error(`OCR API错误: ${result.error_code} - ${result.error_msg}`);
    }
    
    // console.log('=== OCR识别完成 ===');
    // console.log('识别结果:', JSON.stringify(result, null, 2));
        
    // 直接返回百度AI的原始响应数据，不进行任何处理
    // 前端代码按照官方格式处理
    return result;
  } catch (error) {
    console.error('OCR识别失败:', error);
    throw error;
  }
}

module.exports = {
  getBDToken,
  recognizeText
};