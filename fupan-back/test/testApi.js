/**
 * 测试后端API是否正常工作
 * 请注意：此测试需要先启动后端服务（node server.js）
 */
const axios = require('axios');

async function testApi() {
  console.log('🧪 开始测试后端API...');

  try {
    // 测试健康检查端点
    console.log('\n🔍 测试健康检查端点...');
    const healthResponse = await axios.get('http://localhost:8080/')
    console.log('✅ 健康检查成功:', healthResponse.status);
    console.log('📊 响应数据:', healthResponse.data);

    // 测试OCR token端点（预期会失败，因为没有配置API密钥）
    console.log('\n🔍 测试OCR token端点...');
    try {
      const tokenResponse = await axios.get('http://localhost:8080/api/ocr/token');
      console.log('✅ OCR token端点可达:', tokenResponse.status);
      console.log('🔑 Token响应:', tokenResponse.data);
    } catch (tokenError) {
      if (tokenError.response && (tokenError.response.status === 500 || tokenError.response.data)) {
        console.log('⚠️ OCR token端点可达但未配置API密钥:', tokenError.response.status);
        console.log('📝 错误详情:', tokenError.response.data);
      } else {
        console.log('❌ OCR token端点不可达:', tokenError.message);
      }
    }

    // 测试OCR recognize端点（预期会返回验证错误，因为我们没有发送正确的数据）
    console.log('\n🔍 测试OCR recognize端点验证...');
    try {
      const recognizeResponse = await axios.post('http://localhost:8080/api/ocr/recognize', {});
      console.log('❌ OCR recognize应该返回验证错误，但返回了:', recognizeResponse.status);
    } catch (recognizeError) {
      if (recognizeError.response && recognizeError.response.status === 400) {
        console.log('✅ OCR recognize端点验证正常工作 (返回400验证错误):', recognizeError.response.status);
        console.log('📝 验证错误:', recognizeError.response.data);
      } else {
        console.log('⚠️ OCR recognize端点响应:', recognizeError.response?.status || '未知错误');
        console.log('📝 错误详情:', recognizeError.message);
      }
    }

    // 测试不存在的路由
    console.log('\n🔍 测试不存在的路由...');
    try {
      await axios.get('http://localhost:8080/api/nonexistent');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ 404路由处理正常工作:', error.response.status);
      } else {
        console.log('❌ 404路由处理异常:', error.message);
      }
    }

    console.log('\n🎉 API测试完成！');
    
  } catch (error) {
    console.error('💥 测试过程中发生错误:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ 无法连接到后端服务，请确保后端服务正在运行 (node server.js)');
    }
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testApi();
}

module.exports = testApi;