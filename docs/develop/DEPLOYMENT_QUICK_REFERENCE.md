# 🚀 快速部署参考卡片

## 📋 部署前检查清单

```
□ Node.js v18+ 已安装
□ pnpm 已安装
□ Supabase 账号已创建
□ 域名已准备（可选）
□ 微信支付商户号（可选）
```

---

## 🗄️ Supabase 后端部署（5 步）

### 1️⃣ 创建项目
```
访问: https://app.supabase.com/
点击: New Project
记录: Project URL + API Keys
```

### 2️⃣ 初始化数据库
```bash
# 方式一：自动化脚本（推荐）
./deploy-supabase.sh

# 方式二：手动执行
# 在 SQL Editor 中执行 DEPLOYMENT_GUIDE.md 中的 SQL 脚本
```

### 3️⃣ 配置 Storage
```
进入: Storage → Create bucket
名称: exam-images
公开: ✅ 勾选
策略: 执行 DEPLOYMENT_GUIDE.md 中的 Storage 策略 SQL
```

### 4️⃣ 配置认证
```
进入: Authentication → Providers
启用: Email
配置: 邮件模板（可选）
```

### 5️⃣ 配置 CORS
```
进入: Settings → API → CORS
添加: https://your-domain.com
添加: http://localhost:5173
```

---

## 🌐 前端部署（3 步）

### 1️⃣ 配置环境变量
```bash
# 创建 .env.production
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_APP_ID=your_app_id
VITE_API_ENV=production
```

### 2️⃣ 选择部署方式

#### 🔷 Vercel（推荐）
```bash
./deploy.sh
# 选择: 1. Vercel 部署
```

#### 🔶 Netlify
```bash
./deploy.sh
# 选择: 2. Netlify 部署
```

#### 🔸 自建服务器
```bash
# 构建
pnpm run build

# 上传
scp -r dist/* user@server:/var/www/your-site/

# 配置 Nginx（参考完整指南）
```

### 3️⃣ 验证部署
```
□ 访问部署 URL
□ 测试用户注册/登录
□ 测试图片上传
□ 测试数据保存
```

---

## 🔧 常见问题速查

| 问题 | 快速解决 |
|------|----------|
| 🔴 数据库连接失败 | 检查 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` |
| 🔴 图片上传失败 | 确认 Storage bucket `exam-images` 已创建并配置策略 |
| 🔴 CORS 错误 | 在 Supabase Settings → API 中添加前端域名 |
| 🔴 认证失败 | 检查 Authentication → Providers 中 Email 已启用 |
| 🔴 查询返回空 | 检查 RLS 策略，确认用户已登录 |

---

## 📞 获取帮助

```
1. 查看完整指南: DEPLOYMENT_GUIDE.md
2. 查看故障排查: docs/TROUBLESHOOTING.md
3. 提交 Issue: GitHub Issues
4. 联系支持: 技术支持团队
```

---

## 🎯 部署命令速查

```bash
# Supabase 后端部署
./deploy-supabase.sh

# 前端部署
./deploy.sh

# 手动构建
pnpm run build

# 本地测试
pnpm run dev

# 代码检查
pnpm run lint

# Supabase CLI 命令
supabase login              # 登录
supabase link               # 链接项目
supabase db push            # 推送数据库
supabase functions deploy   # 部署函数
supabase status             # 查看状态
```

---

## 📊 部署时间估算

| 步骤 | 预计时间 |
|------|----------|
| Supabase 项目创建 | 2-3 分钟 |
| 数据库初始化 | 1-2 分钟 |
| Storage 配置 | 1 分钟 |
| 前端构建 | 1-2 分钟 |
| Vercel 部署 | 2-3 分钟 |
| **总计** | **约 10-15 分钟** |

---

## ✅ 部署成功标志

```
✓ Supabase 项目状态正常
✓ 数据库表已创建（6 个表）
✓ Storage bucket 已配置
✓ RLS 策略已启用
✓ 前端可访问
✓ 用户可注册/登录
✓ 图片可上传
✓ 数据可保存和查询
```

---

**最后更新**: 2025-11-22  
**版本**: v1.0.0  
**适用于**: 考试成绩分析系统
