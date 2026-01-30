/**
 * Fupan后端服务启动脚本
 * 
 * 此脚本用于启动OCR识别和其他API服务
 * 
 * 使用方法:
 *   node start.js [选项]
 * 
 * 选项:
 *   --port <端口号>    指定服务端口 (默认: 3001)
 *   --env <环境>      指定运行环境 (默认: development)
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// 检查是否已安装依赖
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.error('❌ 错误: 未找到 node_modules 目录');
  console.error('请先运行: npm install');
  process.exit(1);
}

// 检查 .env 文件是否存在
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.warn('⚠️  警告: 未找到 .env 文件');
  console.warn('请复制 .env.example 创建 .env 并配置必要的环境变量');
  console.log('运行: copy .env.example .env');
  console.log('然后在 .env 中设置 BAIDU_API_KEY 和 BAIDU_SECRET_KEY');
}

// 解析命令行参数
const args = process.argv.slice(2);
let port = process.env.PORT || 3001;
let env = 'development';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    port = parseInt(args[i + 1]);
    i++; // 跳过下一个参数
  } else if (args[i] === '--env' && args[i + 1]) {
    env = args[i + 1];
    i++; // 跳过下一个参数
  }
}

console.log('🚀 启动 Fupan 后端服务...');
console.log(`📊 端口: ${port}`);
console.log(`⚙️  环境: ${env}`);

// 设置环境变量
process.env.PORT = port;
process.env.NODE_ENV = env;

// 启动服务器
const serverProcess = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: process.env
});

serverProcess.on('error', (err) => {
  console.error('❌ 启动服务器时发生错误:', err.message);
});

serverProcess.on('close', (code) => {
  console.log(`\n📦 服务器进程已退出，退出码: ${code}`);
  console.log('💡 提示: 使用 Ctrl+C 停止服务器');
});