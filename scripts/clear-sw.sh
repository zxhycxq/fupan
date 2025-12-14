#!/bin/bash

# 清理Service Worker脚本
# 用于快速清理开发环境中的Service Worker和缓存

echo "🔧 开始清理Service Worker和缓存..."
echo ""

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
  echo "❌ 错误：请在项目根目录运行此脚本"
  exit 1
fi

# 1. 删除dev-dist目录（开发环境的Service Worker文件）
if [ -d "dev-dist" ]; then
  echo "📁 删除dev-dist目录..."
  rm -rf dev-dist
  echo "✅ dev-dist目录已删除"
else
  echo "ℹ️  dev-dist目录不存在"
fi

# 2. 删除dist目录（生产构建的Service Worker文件）
if [ -d "dist" ]; then
  echo "📁 删除dist目录..."
  rm -rf dist
  echo "✅ dist目录已删除"
else
  echo "ℹ️  dist目录不存在"
fi

# 3. 清理node_modules/.vite缓存
if [ -d "node_modules/.vite" ]; then
  echo "📁 清理Vite缓存..."
  rm -rf node_modules/.vite
  echo "✅ Vite缓存已清理"
else
  echo "ℹ️  Vite缓存不存在"
fi

echo ""
echo "✅ 清理完成！"
echo ""
echo "📋 后续步骤："
echo "1. 重启开发服务器：npm run dev"
echo "2. 打开浏览器访问：http://localhost:5173/unregister-sw.html"
echo "3. 点击'完全清理'按钮"
echo "4. 关闭清理页面，重新打开应用"
echo ""
echo "💡 提示："
echo "- 如果问题仍然存在，请手动清理浏览器缓存"
echo "- Chrome: F12 > Application > Clear storage > Clear site data"
echo "- Firefox: F12 > Storage > Clear All"
echo ""
