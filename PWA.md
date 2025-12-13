# PWA 功能说明

## 什么是 PWA？

PWA（Progressive Web App，渐进式网页应用）是一种可以像原生应用一样使用的网页应用。它具有以下特点：

- 📱 **可安装**：可以添加到主屏幕，像原生应用一样启动
- 🚀 **快速加载**：通过缓存策略实现快速加载
- 📡 **离线可用**：即使没有网络也能访问部分功能
- 🔔 **推送通知**：支持消息推送（需要额外配置）
- 📲 **全屏体验**：独立窗口运行，无浏览器地址栏

## 功能特性

### 1. 应用安装

用户可以通过以下方式安装应用：

#### 桌面浏览器（Chrome/Edge）
1. 访问应用网站
2. 点击地址栏右侧的"安装"图标
3. 或者点击浏览器菜单 → "安装应用"
4. 确认安装后，应用会添加到桌面

#### 移动浏览器（Chrome/Safari）
1. 访问应用网站
2. 点击浏览器菜单（三个点）
3. 选择"添加到主屏幕"
4. 确认后，应用图标会出现在主屏幕

#### 应用内提示
- 首次访问时会显示安装提示卡片
- 点击"立即安装"可快速安装
- 点击"暂不安装"会在7天后再次提示

### 2. 离线缓存

应用使用 Service Worker 实现智能缓存：

- **静态资源缓存**：HTML、CSS、JS、图片等自动缓存
- **字体缓存**：Google Fonts 等外部字体缓存1年
- **运行时缓存**：动态内容智能缓存

### 3. 自动更新

- 应用会自动检测新版本
- 发现更新后自动下载
- 下次启动时使用新版本
- 无需手动更新

## 技术实现

### 使用的技术栈

- **vite-plugin-pwa**：Vite 的 PWA 插件
- **Workbox**：Google 的 Service Worker 工具库
- **Web App Manifest**：应用元数据配置

### 配置文件

#### vite.config.ts

```typescript
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: '考试成绩分析系统',
    short_name: '成绩分析',
    description: '专业的模拟考试成绩分析工具',
    theme_color: '#1890ff',
    background_color: '#ffffff',
    display: 'standalone',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
    runtimeCaching: [
      // 字体缓存策略
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
        },
      },
    ],
  },
})
```

### 自定义图标

当前使用的是占位符图标，建议替换为真实图标：

#### 方法1：使用内置生成器
1. 启动开发服务器：`pnpm dev`
2. 访问：`http://localhost:5173/generate-icons.html`
3. 点击"下载图标"按钮
4. 将下载的图标替换到 `public/` 目录

#### 方法2：使用在线工具
1. 访问 [RealFaviconGenerator](https://realfavicongenerator.net/)
2. 上传你的图标（建议至少 512x512 像素）
3. 生成完整的图标集
4. 下载并替换到 `public/` 目录

#### 方法3：手动创建
需要以下尺寸的图标：
- `pwa-192x192.png`：192x192 像素
- `pwa-512x512.png`：512x512 像素
- `apple-touch-icon.png`：180x180 像素（可选，用于 iOS）

## 开发和测试

### 开发环境

PWA 功能在开发环境中已启用：

```bash
pnpm dev
```

访问 `http://localhost:5173` 即可测试 PWA 功能。

### 生产构建

```bash
pnpm build
```

构建后会生成：
- `dist/manifest.webmanifest`：应用清单
- `dist/sw.js`：Service Worker
- `dist/workbox-*.js`：Workbox 运行时

### 本地预览

```bash
pnpm preview
```

### 测试 PWA 功能

#### Chrome DevTools
1. 打开 Chrome DevTools（F12）
2. 切换到 "Application" 标签
3. 查看以下内容：
   - **Manifest**：检查应用清单配置
   - **Service Workers**：查看 SW 状态和缓存
   - **Storage**：查看缓存的资源

#### Lighthouse
1. 打开 Chrome DevTools
2. 切换到 "Lighthouse" 标签
3. 选择 "Progressive Web App"
4. 点击 "Generate report"
5. 查看 PWA 评分和建议

## 浏览器支持

### 完全支持
- ✅ Chrome 67+
- ✅ Edge 79+
- ✅ Firefox 44+
- ✅ Safari 11.1+（部分功能）
- ✅ Opera 54+

### 部分支持
- ⚠️ Safari：不支持安装提示，需手动添加到主屏幕
- ⚠️ Firefox：不支持自动安装提示

### 不支持
- ❌ IE 11 及更早版本

## 常见问题

### 1. 为什么看不到安装提示？

可能的原因：
- 应用已经安装
- 浏览器不支持 PWA
- 在过去7天内关闭过提示
- 使用的是 Safari（需手动添加）

### 2. 如何卸载 PWA？

#### Windows/Linux
1. 打开应用
2. 点击右上角菜单（三个点）
3. 选择"卸载"

#### macOS
1. 在应用程序文件夹中找到应用
2. 拖到废纸篓

#### Android
1. 长按应用图标
2. 选择"卸载"或拖到卸载区域

#### iOS
1. 长按应用图标
2. 选择"删除应用"

### 3. 如何清除缓存？

#### 浏览器中
1. 打开 Chrome DevTools
2. Application → Storage
3. 点击 "Clear site data"

#### 已安装的应用
1. 卸载应用
2. 重新安装

### 4. 离线功能有限制吗？

是的，离线功能有以下限制：
- 只能访问已缓存的页面
- 无法提交需要网络的表单
- 无法加载新的外部资源
- 数据分析功能可能受限

## 最佳实践

### 1. 定期更新缓存策略

根据应用特点调整缓存策略：
- 静态资源：使用 CacheFirst
- 动态内容：使用 NetworkFirst
- API 请求：使用 StaleWhileRevalidate

### 2. 优化图标

- 使用 PNG 格式
- 确保图标清晰可辨
- 使用品牌色作为背景
- 添加 maskable 图标支持

### 3. 测试多种场景

- 在线首次访问
- 离线访问
- 更新后的行为
- 不同设备和浏览器

### 4. 监控性能

使用 Lighthouse 定期检查：
- PWA 评分
- 性能指标
- 可访问性
- SEO 优化

## 更多资源

- [PWA 官方文档](https://web.dev/progressive-web-apps/)
- [Workbox 文档](https://developers.google.com/web/tools/workbox)
- [vite-plugin-pwa 文档](https://vite-pwa-org.netlify.app/)
- [Web App Manifest](https://developer.mozilla.org/zh-CN/docs/Web/Manifest)
