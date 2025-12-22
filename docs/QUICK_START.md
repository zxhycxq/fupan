# 快速开始指南

## 目录

- [环境要求](#环境要求)
- [快速部署](#快速部署)
- [配置OCR服务](#配置ocr服务)
- [数据库初始化](#数据库初始化)
- [常用命令](#常用命令)

---

## 环境要求

### 开发环境

- Node.js >= 18.0.0
- npm >= 9.0.0 或 pnpm >= 8.0.0
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 生产环境

- 腾讯云服务器（CVM或轻量应用服务器）
- Nginx >= 1.18
- SSL证书（推荐）

---

## 快速部署

### 1. 克隆项目

```bash
git clone <your-repository-url>
cd app-7q11e4xackch
```

### 2. 安装依赖

```bash
npm install
# 或
pnpm install
```

### 3. 配置环境变量

创建 `.env` 文件：

```env
# Supabase配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 应用ID
VITE_APP_ID=app-7q11e4xackch

# API环境
VITE_API_ENV=production
```

### 4. 启动开发服务器

```bash
npm run dev
# 或
pnpm dev
```

访问 `http://localhost:5173`

### 5. 构建生产版本

```bash
npm run build
# 或
pnpm build
```

构建产物位于 `dist/` 目录。

---

## 配置OCR服务

### 方式一：使用百度OCR（当前实现）

#### 1. 注册百度智能云

1. 访问 https://cloud.baidu.com/
2. 注册并完成实名认证
3. 开通 **通用文字识别（高精度版）** 服务

#### 2. 创建应用

1. 进入 [文字识别控制台](https://console.bce.baidu.com/ai/#/ai/ocr/overview/index)
2. 点击"创建应用"
3. 填写应用名称和描述
4. 获取 API Key 和 Secret Key

#### 3. 配置API代理

由于前端直接调用百度API存在跨域问题，需要配置服务器端代理。

**当前实现**: 使用秒哒平台的API代理服务

**API地址**: `/api/miaoda/runtime/apicenter/source/proxy/6KmAKxK9aE29irAwt32QRk`

**如需自建代理**，参考以下Nginx配置：

```nginx
location /api/baidu/ocr/ {
    proxy_pass https://aip.baidubce.com/rest/2.0/ocr/v1/;
    proxy_set_header Host aip.baidubce.com;
    
    # 添加CORS头
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
    add_header Access-Control-Allow-Headers 'Content-Type, Authorization';
    
    if ($request_method = 'OPTIONS') {
        return 204;
    }
}
```

### 方式二：迁移到腾讯云OCR

详细步骤请参考 [OCR_INTEGRATION.md](./OCR_INTEGRATION.md) 文档。

**简要步骤**:

1. 注册腾讯云账号
2. 开通 **通用印刷体识别（高精度版）** 服务
3. 获取 SecretId 和 SecretKey
4. 安装腾讯云SDK：`npm install tencentcloud-sdk-nodejs`
5. 创建 `src/services/tencentOcr.ts` 文件
6. 修改 `src/services/imageRecognition.ts` 文件
7. 更新环境变量
8. 测试识别效果

---

## 数据库初始化

### 1. 创建Supabase项目

1. 访问 https://supabase.com/
2. 注册并登录
3. 点击 "New Project"
4. 填写项目信息
5. 等待项目创建完成

### 2. 获取连接信息

1. 进入项目控制台
2. 点击左侧菜单的 "Settings" → "API"
3. 复制以下信息：
   - Project URL
   - anon public key

### 3. 执行数据库迁移

在Supabase控制台的SQL编辑器中，依次执行以下文件：

```bash
# 按顺序执行
1. supabase/migrations/00001_create_exam_tables.sql
2. supabase/migrations/00002_add_exam_notes.sql
3. supabase/migrations/00003_add_difficulty_beat_percentage.sql
4. supabase/migrations/00004_add_exam_countdown.sql
5. supabase/migrations/00005_add_user_settings.sql
6. supabase/migrations/00006_add_sort_order.sql
7. supabase/migrations/00007_add_exam_config.sql
8. supabase/migrations/00008_add_exam_improvements_mistakes.sql
9. supabase/migrations/00009_add_exam_date_report_url.sql
10. supabase/migrations/00010_add_exam_name.sql
11. supabase/migrations/00011_add_index_number.sql
12. supabase/migrations/00012_add_rating.sql
13. supabase/migrations/00013_disable_rls_exam_config.sql
14. supabase/migrations/00014_disable_rls_user_settings.sql
15. supabase/migrations/20251209_add_exam_type.sql
```

### 4. 验证数据库

在SQL编辑器中执行：

```sql
-- 检查表是否创建成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 应该看到以下表：
-- exam_records
-- module_scores
-- user_settings
-- exam_config
```

---

## 常用命令

### 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

### 部署命令

```bash
# 构建并上传到服务器
npm run build
scp -r dist/* user@your-server:/var/www/exam-analysis/dist/

# 重启Nginx
ssh user@your-server "sudo systemctl reload nginx"
```

### 数据库命令

```bash
# 备份数据库
pg_dump -h your-db-host -U postgres -d your-db-name > backup.sql

# 恢复数据库
psql -h your-db-host -U postgres -d your-db-name < backup.sql
```

---

## 快速测试

### 1. 测试OCR识别

```typescript
// 在浏览器控制台中执行
import { recognizeText, fileToBase64 } from '@/services/imageRecognition';

// 假设已经选择了文件
const file = document.querySelector('input[type="file"]').files[0];
const base64 = await fileToBase64(file);
const text = await recognizeText({ image: base64 });
console.log('识别结果:', text);
```

### 2. 测试数据解析

```typescript
// 在浏览器控制台中执行
import { parseExamData } from '@/services/dataParser';

const ocrText = `
我的得分: 75.5
政治理论
共20题，答对15题，正确率75%，用时28分
`;

const { examRecord, moduleScores } = parseExamData(ocrText, 1, 7200);
console.log('考试记录:', examRecord);
console.log('模块得分:', moduleScores);
```

### 3. 测试数据库操作

```typescript
// 在浏览器控制台中执行
import { getAllExamRecords } from '@/db/api';

const records = await getAllExamRecords();
console.log('考试记录数量:', records.length);
console.log('考试记录:', records);
```

---

## 故障排查

### 问题1：npm install失败

**解决方案**:
```bash
# 清除缓存
npm cache clean --force

# 删除node_modules和package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 问题2：Vite启动失败

**解决方案**:
```bash
# 检查端口是否被占用
lsof -i :5173

# 使用其他端口
npm run dev -- --port 3000
```

### 问题3：Supabase连接失败

**解决方案**:
1. 检查 `.env` 文件配置
2. 确认Supabase项目状态
3. 检查网络连接
4. 查看浏览器控制台错误信息

### 问题4：OCR识别失败

**解决方案**:
1. 检查图片格式和大小
2. 查看浏览器控制台错误信息
3. 确认API配置正确
4. 检查API调用次数是否超限

---

## 下一步

- 📖 阅读 [部署文档](./DEPLOYMENT.md) 了解详细部署步骤
- 📖 阅读 [OCR集成文档](./OCR_INTEGRATION.md) 了解OCR服务详情
- 📖 阅读 [API参考文档](./API_REFERENCE.md) 了解所有API接口
- 🔧 配置生产环境
- 🚀 部署到服务器
- 📊 开始使用系统

---

## 技术支持

如有问题，请：

1. 查看文档
2. 搜索已知问题
3. 提交Issue
4. 联系技术支持

**联系方式**:
- 项目仓库: [GitHub](https://github.com/your-repo)
- 问题反馈: [Issues](https://github.com/your-repo/issues)
- 邮箱: support@example.com
