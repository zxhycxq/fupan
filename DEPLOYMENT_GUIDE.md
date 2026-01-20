# 考试成绩分析系统 - 部署指南

## 目录
- [系统架构](#系统架构)
- [前置要求](#前置要求)
- [Supabase 后端部署](#supabase-后端部署)
- [前端部署](#前端部署)
- [环境变量配置](#环境变量配置)
- [常见问题](#常见问题)

---

## 系统架构

本系统采用前后端分离架构：
- **前端**: React + TypeScript + Vite
- **后端**: Supabase (PostgreSQL + Edge Functions)
- **存储**: Supabase Storage (图片存储)
- **支付**: 微信支付集成

---

## 前置要求

### 1. 账号准备
- [Supabase 账号](https://supabase.com/) - 免费版即可开始
- 域名（可选，用于自定义域名）
- 微信支付商户号（如需支付功能）

### 2. 本地工具
```bash
# Node.js (推荐 v18+)
node --version

# pnpm 包管理器
npm install -g pnpm

# Supabase CLI
npm install -g supabase
```

---

## Supabase 后端部署

### 步骤 1: 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://app.supabase.com/)
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: exam-analysis-system
   - **Database Password**: 设置强密码（请妥善保管）
   - **Region**: 选择离用户最近的区域（建议：Singapore 或 Tokyo）
4. 等待项目创建完成（约 2-3 分钟）

### 步骤 2: 获取项目凭证

创建完成后，在项目设置中获取以下信息：

1. 进入 **Settings** → **API**
2. 记录以下信息：
   ```
   Project URL: https://xxxxx.supabase.co
   anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（仅后端使用）
   ```

### 步骤 3: 初始化数据库

#### 方式一：使用 Supabase Dashboard（推荐）

1. 进入 **SQL Editor**
2. 创建新查询，复制粘贴以下 SQL：

```sql
-- ============================================
-- 考试成绩分析系统 - 数据库初始化脚本
-- ============================================

-- 1. 创建用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  target_accuracy INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_name)
);

-- 2. 创建考试配置表
CREATE TABLE IF NOT EXISTS exam_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  exam_type TEXT,
  exam_name TEXT,
  exam_date TEXT,
  grade_label_theme TEXT DEFAULT 'theme4',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建考试记录表
CREATE TABLE IF NOT EXISTS exam_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_number INTEGER NOT NULL,
  total_score DECIMAL(5,2) NOT NULL,
  total_time INTEGER,
  exam_date TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建模块得分表
CREATE TABLE IF NOT EXISTS module_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exam_records(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  parent_module TEXT,
  score DECIMAL(5,2),
  total_questions INTEGER,
  correct_questions INTEGER,
  time_spent INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 创建 VIP 订单表
CREATE TABLE IF NOT EXISTS vip_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_no TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  duration_months INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ
);

-- 6. 创建用户 VIP 信息表
CREATE TABLE IF NOT EXISTS user_vip (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_vip BOOLEAN DEFAULT FALSE,
  vip_start_date TIMESTAMPTZ,
  vip_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 创建索引以提升查询性能
-- ============================================

CREATE INDEX IF NOT EXISTS idx_exam_records_user_id ON exam_records(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_records_exam_date ON exam_records(exam_date);
CREATE INDEX IF NOT EXISTS idx_module_scores_exam_id ON module_scores(exam_id);
CREATE INDEX IF NOT EXISTS idx_vip_orders_user_id ON vip_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_orders_order_no ON vip_orders(order_no);

-- ============================================
-- 启用行级安全策略 (RLS)
-- ============================================

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vip ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 创建 RLS 策略
-- ============================================

-- user_settings 策略
CREATE POLICY "用户只能查看自己的设置" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能插入自己的设置" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的设置" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的设置" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- exam_config 策略
CREATE POLICY "用户只能查看自己的考试配置" ON exam_config
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能插入自己的考试配置" ON exam_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的考试配置" ON exam_config
  FOR UPDATE USING (auth.uid() = user_id);

-- exam_records 策略
CREATE POLICY "用户只能查看自己的考试记录" ON exam_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能插入自己的考试记录" ON exam_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的考试记录" ON exam_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的考试记录" ON exam_records
  FOR DELETE USING (auth.uid() = user_id);

-- module_scores 策略
CREATE POLICY "用户只能查看自己的模块得分" ON module_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_records
      WHERE exam_records.id = module_scores.exam_id
      AND exam_records.user_id = auth.uid()
    )
  );

CREATE POLICY "用户只能插入自己的模块得分" ON module_scores
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_records
      WHERE exam_records.id = module_scores.exam_id
      AND exam_records.user_id = auth.uid()
    )
  );

-- vip_orders 策略
CREATE POLICY "用户只能查看自己的订单" ON vip_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的订单" ON vip_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_vip 策略
CREATE POLICY "用户只能查看自己的VIP信息" ON user_vip
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能插入自己的VIP信息" ON user_vip
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的VIP信息" ON user_vip
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 创建触发器函数
-- ============================================

-- 自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加触发器
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_config_updated_at
  BEFORE UPDATE ON exam_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_records_updated_at
  BEFORE UPDATE ON exam_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_vip_updated_at
  BEFORE UPDATE ON user_vip
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 插入示例数据（可选）
-- ============================================

-- 注意：实际部署时，这部分数据会在用户注册后自动创建
-- 这里仅作为数据结构参考

-- 示例：6大模块的默认目标正确率
-- INSERT INTO user_settings (user_id, module_name, target_accuracy) VALUES
-- ('用户UUID', '政治理论', 80),
-- ('用户UUID', '常识判断', 80),
-- ('用户UUID', '言语理解与表达', 80),
-- ('用户UUID', '数量关系', 80),
-- ('用户UUID', '判断推理', 80),
-- ('用户UUID', '资料分析', 80);

-- ============================================
-- 完成提示
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '数据库初始化完成！';
  RAISE NOTICE '请继续配置 Storage 和 Edge Functions';
END $$;
```

3. 点击 **Run** 执行 SQL
4. 确认所有表创建成功

#### 方式二：使用 Supabase CLI

```bash
# 1. 登录 Supabase
supabase login

# 2. 链接到远程项目
supabase link --project-ref your-project-ref

# 3. 推送数据库迁移
supabase db push

# 4. 查看数据库状态
supabase db diff
```

### 步骤 4: 配置 Storage（图片存储）

1. 进入 **Storage** → **Create a new bucket**
2. 创建 bucket：
   - **Name**: `exam-images`
   - **Public bucket**: ✅ 勾选（允许公开访问）
3. 配置存储策略：

```sql
-- 在 SQL Editor 中执行

-- 允许认证用户上传图片
CREATE POLICY "认证用户可以上传图片"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'exam-images');

-- 允许认证用户查看自己的图片
CREATE POLICY "用户可以查看自己的图片"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'exam-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 允许认证用户删除自己的图片
CREATE POLICY "用户可以删除自己的图片"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'exam-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 允许公开访问所有图片（用于展示）
CREATE POLICY "公开访问图片"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'exam-images');
```

### 步骤 5: 部署 Edge Functions（可选）

如果您的项目使用了 Edge Functions（如支付回调处理），需要部署：

```bash
# 1. 进入项目目录
cd /workspace/app-7q11e4xackch

# 2. 部署所有 Edge Functions
supabase functions deploy

# 或者部署单个函数
supabase functions deploy payment-callback

# 3. 设置环境变量（如果需要）
supabase secrets set WECHAT_PAY_KEY=your_wechat_pay_key
supabase secrets set WECHAT_PAY_MCHID=your_merchant_id
```

### 步骤 6: 配置认证

1. 进入 **Authentication** → **Providers**
2. 启用邮箱登录：
   - **Email**: ✅ 启用
   - **Confirm email**: 根据需求选择（建议开启）
3. 配置邮件模板（可选）：
   - 进入 **Email Templates**
   - 自定义注册确认邮件、密码重置邮件等

### 步骤 7: 配置 CORS（跨域）

1. 进入 **Settings** → **API**
2. 在 **CORS** 部分添加允许的域名：
   ```
   https://your-domain.com
   http://localhost:5173  # 本地开发
   ```

---

## 前端部署

### 方式一：Vercel 部署（推荐）

1. **准备工作**
   ```bash
   # 确保代码已推送到 GitHub
   git push origin master
   ```

2. **部署到 Vercel**
   - 访问 [Vercel](https://vercel.com/)
   - 点击 "Import Project"
   - 选择您的 GitHub 仓库
   - 配置构建设置：
     ```
     Framework Preset: Vite
     Build Command: pnpm run build
     Output Directory: dist
     Install Command: pnpm install
     ```

3. **配置环境变量**
   在 Vercel 项目设置中添加：
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_APP_ID=your_app_id
   VITE_API_ENV=production
   ```

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成（约 2-3 分钟）
   - 获取部署 URL：`https://your-project.vercel.app`

### 方式二：Netlify 部署

1. **准备工作**
   ```bash
   # 创建 netlify.toml 配置文件
   cat > netlify.toml << EOF
   [build]
     command = "pnpm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   EOF
   ```

2. **部署到 Netlify**
   - 访问 [Netlify](https://www.netlify.com/)
   - 点击 "Add new site" → "Import an existing project"
   - 选择 GitHub 仓库
   - 配置构建设置（自动检测）

3. **配置环境变量**
   在 Netlify 项目设置中添加环境变量（同 Vercel）

### 方式三：自建服务器部署

#### 使用 Nginx

1. **构建项目**
   ```bash
   # 在本地构建
   pnpm run build
   
   # 构建产物在 dist 目录
   ```

2. **上传到服务器**
   ```bash
   # 使用 scp 上传
   scp -r dist/* user@your-server:/var/www/exam-analysis
   ```

3. **配置 Nginx**
   ```nginx
   # /etc/nginx/sites-available/exam-analysis
   
   server {
       listen 80;
       server_name your-domain.com;
       
       root /var/www/exam-analysis;
       index index.html;
       
       # Gzip 压缩
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
       
       # 处理 SPA 路由
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # 缓存静态资源
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

4. **启用站点并重启 Nginx**
   ```bash
   sudo ln -s /etc/nginx/sites-available/exam-analysis /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **配置 HTTPS（推荐）**
   ```bash
   # 使用 Let's Encrypt
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## 环境变量配置

### 开发环境 (.env.development)

```env
# Supabase 配置
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 应用配置
VITE_APP_ID=your_app_id
VITE_API_ENV=development

# 微信支付配置（可选）
VITE_WECHAT_PAY_APPID=wx1234567890
```

### 生产环境 (.env.production)

```env
# Supabase 配置
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 应用配置
VITE_APP_ID=your_app_id
VITE_API_ENV=production

# 微信支付配置
VITE_WECHAT_PAY_APPID=wx1234567890
```

### 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | ✅ |
| `VITE_APP_ID` | 应用 ID | ✅ |
| `VITE_API_ENV` | 环境标识 | ✅ |
| `VITE_WECHAT_PAY_APPID` | 微信支付 AppID | ❌ |

---

## 常见问题

### 1. 数据库连接失败

**问题**: 前端无法连接到 Supabase

**解决方案**:
- 检查 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 是否正确
- 确认 Supabase 项目状态正常
- 检查浏览器控制台是否有 CORS 错误
- 确认 Supabase 项目的 CORS 配置包含您的域名

### 2. 图片上传失败

**问题**: 用户无法上传考试截图

**解决方案**:
- 确认 Storage bucket `exam-images` 已创建
- 检查 Storage 策略是否正确配置
- 确认用户已登录（需要认证）
- 检查图片大小是否超过限制（默认 50MB）

### 3. RLS 策略导致查询失败

**问题**: 查询数据时返回空结果

**解决方案**:
- 确认用户已登录
- 检查 RLS 策略是否正确
- 在 SQL Editor 中测试查询：
  ```sql
  -- 测试当前用户权限
  SELECT auth.uid();
  
  -- 测试查询
  SELECT * FROM exam_records WHERE user_id = auth.uid();
  ```

### 4. Edge Functions 部署失败

**问题**: Edge Functions 无法部署或调用失败

**解决方案**:
- 确认 Supabase CLI 已登录：`supabase login`
- 检查函数代码是否有语法错误
- 查看函数日志：`supabase functions logs function-name`
- 确认环境变量已设置：`supabase secrets list`

### 5. 构建失败

**问题**: `pnpm run build` 失败

**解决方案**:
- 清理缓存：`pnpm store prune`
- 重新安装依赖：`rm -rf node_modules && pnpm install`
- 检查 TypeScript 错误：`pnpm run lint`
- 确认 Node.js 版本：`node --version`（推荐 v18+）

### 6. 性能优化

**建议**:
- 启用 Gzip 压缩
- 配置 CDN（如 Cloudflare）
- 使用 Supabase 的 Connection Pooling
- 为频繁查询的字段添加索引
- 使用 Supabase 的 Realtime 功能减少轮询

---

## 监控与维护

### 1. Supabase 监控

- **Dashboard**: 查看 API 请求量、数据库大小、存储使用量
- **Logs**: 查看数据库查询日志、Edge Functions 日志
- **Performance**: 监控慢查询、优化索引

### 2. 前端监控

- 使用 Vercel Analytics 或 Google Analytics
- 监控错误日志（推荐使用 Sentry）
- 定期检查性能指标（Lighthouse）

### 3. 备份策略

- Supabase 自动每日备份（免费版保留 7 天）
- 定期导出重要数据
- 使用 `pg_dump` 手动备份数据库

```bash
# 导出数据库
supabase db dump -f backup.sql

# 恢复数据库
supabase db reset --db-url "postgresql://..."
```

---

## 扩展阅读

- [Supabase 官方文档](https://supabase.com/docs)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [PostgreSQL 性能优化](https://www.postgresql.org/docs/current/performance-tips.html)
- [微信支付开发文档](https://pay.weixin.qq.com/wiki/doc/api/index.html)

---

## 技术支持

如有问题，请：
1. 查看本文档的常见问题部分
2. 查看项目 README.md
3. 提交 GitHub Issue
4. 联系技术支持团队

---

**最后更新**: 2025-11-22
**版本**: v1.0.0
