/**
 * 调试路由注册情况
 * 运行此脚本可以查看Express应用中注册的路由
 */
const express = require('express');
const fs = require('fs').promises;

async function debugRoutes() {
  console.log('🔍 开始调试路由注册...');
  
  try {
    // 创建一个临时的Express应用来检查路由
    const app = express();
    
    // 模拟加载路由
    const ocrRoutes = require('../routes/ocr');
    const authRoutes = require('../routes/auth');
    
    console.log('\n📋 路由模块加载状态:');
    console.log(`- ocrRoutes: ${ocrRoutes ? '已加载' : '未加载'}`);
    console.log(`- authRoutes: ${authRoutes ? '已加载' : '未加载'}`);
    
    // 检查ocrRoutes的内容
    console.log('\n📄 ocrRoutes内容:');
    console.log('router.methods:', Object.keys(ocrRoutes.stack || {}).join(', '));
    
    // 手动检查路由栈
    if (ocrRoutes.stack) {
      console.log('\n🔧 ocrRoutes路由栈:');
      ocrRoutes.stack.forEach((layer, index) => {
        if (layer.route) {
          const methods = Object.keys(layer.route.methods).filter(m => layer.route.methods[m]);
          console.log(`[${index}] ${methods.join(',')} ${layer.route.path}`);
        }
      });
    }
    
    // 检查完整的应用路由
    console.log('\n🌐 完整应用路由:');
    app.use('/api/ocr', ocrRoutes);
    app.use('/api/auth', authRoutes);
    
    // 检查应用的路由栈
    if (app._router && app._router.stack) {
      console.log('\n📦 应用路由栈:');
      app._router.stack.forEach((layer, index) => {
        if (layer.route) {
          const methods = Object.keys(layer.route.methods).filter(m => layer.route.methods[m]);
          console.log(`[${index}] ${methods.join(',')} ${layer.route.path}`);
        } else if (layer.name === 'router') {
          console.log(`[${index}] router (${layer.handle.name})`);
        }
      });
    }
    
    console.log('\n✅ 路由调试完成');
    
  } catch (error) {
    console.error('❌ 路由调试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 如果直接运行此文件，则执行调试
if (require.main === module) {
  debugRoutes();
}

module.exports = debugRoutes;