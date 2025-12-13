import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建一个简单的PNG图标（1x1像素的蓝色图片作为占位符）
// 实际使用时应该替换为真实的图标
const createPlaceholderIcon = (size) => {
  // 这是一个简单的蓝色方块PNG的base64编码
  const bluePNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return Buffer.from(bluePNG, 'base64');
};

const publicDir = path.join(__dirname, '../public');

// 创建图标文件
['192', '512'].forEach(size => {
  const iconPath = path.join(publicDir, `pwa-${size}x${size}.png`);
  const iconData = createPlaceholderIcon(size);
  fs.writeFileSync(iconPath, iconData);
  console.log(`Created ${iconPath}`);
});

console.log('\n请注意：当前使用的是占位符图标。');
console.log('请访问 http://localhost:5173/generate-icons.html 生成真实的PWA图标。');
console.log('或者使用在线工具如 https://realfavicongenerator.net/ 生成完整的图标集。\n');
