# 考试成绩分析系统 - 腾讯云部署文档

## 目录

- [系统概述](#系统概述)
- [技术架构](#技术架构)
- [数据库设计](#数据库设计)
- [OCR识别服务](#ocr识别服务)
- [API接口文档](#api接口文档)
- [部署步骤](#部署步骤)
- [环境变量配置](#环境变量配置)
- [常见问题](#常见问题)

---

### 核心功能

1. **图片上传与OCR识别**
   - 支持上传考试成绩截图
   - 自动识别图片中的文字信息
   - 支持PC端和移动端截图格式

2. **数据解析与存储**
   - 自动解析总分、各模块得分、用时等信息
   - 按层级结构存储大模块和子模块数据
   - 支持多期考试数据管理

3. **数据可视化分析**
   - 成绩趋势分析（折线图）
   - 模块对比分析（柱状图、雷达图）
   - 效率分析（用时统计）
   - 弱势模块识别

4. **个性化设置**
   - 自定义模块目标正确率
   - 考试类型和日期配置
   - 成绩等级标签主题

---

## 技术架构

### 前端技术栈


### 后端技术栈

- **数据库**: Supabase (PostgreSQL)
- **文件存储**: Supabase Storage
- **OCR服务**: 百度通用文字识别（高精度版）API

### 项目结构

```
app-7q11e4xackch/
├── src/
│   ├── components/       # UI组件
│   ├── pages/           # 页面组件
│   ├── services/        # 业务逻辑
│   │   ├── imageRecognition.ts  # OCR识别服务
│   │   └── dataParser.ts        # 数据解析服务
│   ├── db/              # 数据库操作
│   │   ├── supabase.ts  # Supabase客户端
│   │   └── api.ts       # 数据库API
│   ├── types/           # TypeScript类型定义
│   └── config/          # 配置文件
├── supabase/
│   └── migrations/      # 数据库迁移文件
└── docs/               # 文档
```

---

## 数据库设计

### 表结构

#### 1. exam_records - 考试记录表

存储每次考试的基本信息和总体成绩。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | uuid | 记录ID | PRIMARY KEY |
| exam_number | integer | 考试期数 | NOT NULL |
| exam_name | text | 考试名称 | - |
| exam_type | text | 考试类型 | - |
| index_number | integer | 索引项（用于排序） | NOT NULL, UNIQUE |
| rating | decimal(2,1) | 星级评分（0-5） | DEFAULT 0 |
| total_score | decimal(5,2) | 总分 | NOT NULL |
| max_score | decimal(5,2) | 最高分 | - |
| average_score | decimal(5,2) | 平均分 | - |
| difficulty | decimal(3,1) | 难度系数（0-5） | - |
| beat_percentage | decimal(5,2) | 已击败考生百分比 | - |
| pass_rate | decimal(5,2) | 通过率 | - |
| time_used | integer | 用时（秒） | - |
| image_url | text | 上传的图片URL | - |
| improvements | text | 有进步的地方 | - |
| mistakes | text | 出错的地方 | - |
| exam_date | date | 考试日期 | - |
| report_url | text | 考试报告链接 | - |
| sort_order | integer | 排序顺序 | NOT NULL |
| created_at | timestamptz | 创建时间 | DEFAULT now() |
| updated_at | timestamptz | 更新时间 | DEFAULT now() |

**索引**:
- `idx_exam_records_exam_number` - 考试期数索引
- `idx_exam_records_created_at` - 创建时间索引（降序）
- `idx_exam_records_sort_order` - 排序顺序索引

#### 2. module_scores - 模块得分表

存储每个模块和子模块的详细得分信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | uuid | 记录ID | PRIMARY KEY |
| exam_record_id | uuid | 关联考试记录ID | FOREIGN KEY, NOT NULL |
| module_name | text | 模块名称 | NOT NULL |
| parent_module | text | 父模块名称 | - |
| total_questions | integer | 总题数 | DEFAULT 0 |
| correct_answers | integer | 答对题数 | DEFAULT 0 |
| wrong_answers | integer | 答错题数 | DEFAULT 0 |
| unanswered | integer | 未答题数 | DEFAULT 0 |
| accuracy_rate | decimal(5,2) | 正确率 | - |
| time_used | integer | 用时（秒） | - |
| created_at | timestamptz | 创建时间 | DEFAULT now() |

**索引**:
- `idx_module_scores_exam_record_id` - 考试记录ID索引
- `idx_module_scores_module_name` - 模块名称索引
- `idx_module_scores_parent_module` - 父模块索引

**外键约束**:
- `exam_record_id` REFERENCES `exam_records(id)` ON DELETE CASCADE

#### 3. user_settings - 用户设置表

存储用户的个性化设置，如各模块的目标正确率。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | uuid | 记录ID | PRIMARY KEY |
| user_id | text | 用户ID | NOT NULL |
| module_name | text | 模块名称 | NOT NULL |
| target_accuracy | decimal(5,2) | 目标正确率 | NOT NULL |
| created_at | timestamptz | 创建时间 | DEFAULT now() |
| updated_at | timestamptz | 更新时间 | DEFAULT now() |

**唯一约束**:
- `unique_user_module` - (user_id, module_name)

#### 4. exam_config - 考试配置表

存储全局考试配置信息。

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | uuid | 记录ID | PRIMARY KEY |
| exam_type | text | 考试类型 | NOT NULL |
| exam_name | text | 考试名称 | - |
| exam_date | date | 考试日期 | - |
| grade_label_theme | text | 成绩等级标签主题 | DEFAULT 'theme4' |
| created_at | timestamptz | 创建时间 | DEFAULT now() |
| updated_at | timestamptz | 更新时间 | DEFAULT now() |

### 数据关系

```
exam_records (1) ----< (N) module_scores
     |
     |-- 一个考试记录可以有多个模块得分
     |-- 删除考试记录时级联删除相关模块得分

module_scores
     |
     |-- parent_module 字段用于建立层级关系
     |-- parent_module = NULL 表示大模块
     |-- parent_module = '模块名' 表示子模块
```

### 模块层级结构

系统支持两级模块结构：

**大模块**（parent_module = NULL）:
- 政治理论
- 常识判断
- 言语理解与表达
- 数量关系
- 判断推理
- 资料分析

**子模块**（parent_module = '大模块名'）:
- 政治理论
  - 马克思主义
  - 理论与政策
  - 时政热点
- 常识判断
  - 经济常识
  - 科技常识
  - 人文常识
  - 地理国情
  - 法律常识
- 言语理解与表达
  - 逻辑填空
  - 片段阅读
  - 语句表达
- 数量关系
  - 数学运算
  - 多位数问题
  - 平均数问题
  - 工程问题
  - 溶液问题
  - 最值问题
  - 计数模型问题
  - 年龄问题
  - 和差倍比问题
  - 牛吃草问题
  - 周期问题
  - 数列问题
  - 行程问题
  - 几何问题
  - 容斥原理问题
  - 排列组合问题
  - 概率问题
  - 经济利润问题
  - 函数最值问题
  - 钟表问题
  - 不定方程问题
- 判断推理
  - 图形推理
  - 定义判断
  - 类比推理
  - 逻辑判断
- 资料分析
  - 文字资料
  - 综合资料
  - 简单计算
  - 基期与现期
  - 增长率
  - 增长量
  - 比重问题
  - 平均数问题

---

## OCR识别服务

### 服务提供商

**百度智能云 - 通用文字识别（高精度版）**

- API文档: https://cloud.baidu.com/doc/OCR/s/1k3h7y3db
- 
### OCR配置参数

系统使用以下参数优化识别效果：

```typescript
{
  language_type: 'CHN_ENG',           // 中英文混合识别
  detect_direction: true,              // 启用方向检测
  probability: true,                   // 返回置信度
  paragraph: true,                     // 保持段落信息
  recognize_granularity: 'big',        // 大颗粒度（适合长文本）
  vertexes_location: true              // 启用垂直文本检测
}
```

### 图片预处理

为提高识别准确率，系统对上传的图片进行以下预处理：

1. **图片压缩**
   - 最大宽度: 2400px
   - 压缩质量: 95%
   - 格式转换: JPEG

2. **图像增强**
   - 对比度增强: 1.2-1.3倍
   - 锐化处理: 0.5-0.7强度
   - 降噪处理: 3x3邻域平均（针对长截图）

3. **长截图检测**
   - 高宽比 > 2.5 判定为长截图
   - 长截图使用更强的增强参数

### OCR识别流程

```
1. 用户上传图片
   ↓
2. 图片预处理（压缩、增强）
   ↓
3. 转换为Base64编码
   ↓
4. 调用百度OCR API
   ↓
5. 接收识别结果
   ↓
6. 文本预处理（清理、规范化）
   ↓
7. 数据解析（提取成绩信息）
   ↓
8. 保存到数据库
```



## API接口文档


#### 1. 考试记录相关

##### 获取所有考试记录

```typescript
getAllExamRecords(): Promise<ExamRecord[]>
```

**说明**: 获取所有考试记录，按 `sort_order` 升序排列。

**返回值**: 考试记录数组

**示例**:
```typescript
const records = await getAllExamRecords();
console.log('考试记录数量:', records.length);
```

##### 根据ID获取考试记录详情

```typescript
getExamRecordById(id: string): Promise<ExamRecordDetail | null>
```

**参数**:
- `id`: 考试记录ID

**返回值**: 考试记录详情（包含模块得分）或 null

**示例**:
```typescript
const detail = await getExamRecordById('uuid-123');
if (detail) {
  console.log('考试名称:', detail.exam_name);
  console.log('模块数量:', detail.module_scores.length);
}
```

##### 创建考试记录

```typescript
createExamRecord(
  record: Omit<ExamRecord, 'id' | 'created_at' | 'updated_at'>
): Promise<ExamRecord>
```

**参数**:
- `record`: 考试记录对象（不包含id、created_at、updated_at）

**返回值**: 创建的考试记录

**示例**:
```typescript
const newRecord = await createExamRecord({
  exam_number: 1,
  exam_name: '2024年国考模拟考试',
  index_number: 1,
  rating: 4.5,
  total_score: 75.5,
  max_score: 100,
  average_score: 62.1,
  difficulty: 4.9,
  beat_percentage: 48.9,
  time_used: 7200,
  sort_order: 1,
});
```

##### 更新考试记录

```typescript
updateExamRecord(
  id: string,
  updates: Partial<Omit<ExamRecord, 'id' | 'created_at' | 'updated_at'>>
): Promise<ExamRecord>
```

**参数**:
- `id`: 考试记录ID
- `updates`: 要更新的字段

**返回值**: 更新后的考试记录

**示例**:
```typescript
const updated = await updateExamRecord('uuid-123', {
  rating: 5,
  improvements: '言语理解有进步',
  mistakes: '数量关系需要加强',
});
```

##### 删除考试记录

```typescript
deleteExamRecord(id: string): Promise<void>
```

**参数**:
- `id`: 考试记录ID

**说明**: 会级联删除相关的模块得分记录

**示例**:
```typescript
await deleteExamRecord('uuid-123');
```

##### 获取最近N次考试记录

```typescript
getRecentExamRecords(limit: number = 10): Promise<ExamRecord[]>
```

**参数**:
- `limit`: 返回记录数量，默认10

**返回值**: 考试记录数组（按创建时间降序）

**示例**:
```typescript
const recent = await getRecentExamRecords(5);
console.log('最近5次考试:', recent);
```

#### 2. 模块得分相关

##### 创建模块得分记录

```typescript
createModuleScores(
  scores: Omit<ModuleScore, 'id' | 'created_at'>[]
): Promise<ModuleScore[]>
```

**参数**:
- `scores`: 模块得分数组

**返回值**: 创建的模块得分数组

**示例**:
```typescript
const scores = await createModuleScores([
  {
    exam_record_id: 'uuid-123',
    module_name: '政治理论',
    parent_module: null,
    total_questions: 20,
    correct_answers: 15,
    wrong_answers: 5,
    unanswered: 0,
    accuracy_rate: 75,
    time_used: 1680,
  },
  {
    exam_record_id: 'uuid-123',
    module_name: '马克思主义',
    parent_module: '政治理论',
    total_questions: 3,
    correct_answers: 2,
    wrong_answers: 1,
    unanswered: 0,
    accuracy_rate: 67,
    time_used: 180,
  },
]);
```

##### 获取指定考试的所有模块得分

```typescript
getModuleScoresByExamId(examId: string): Promise<ModuleScore[]>
```

**参数**:
- `examId`: 考试记录ID

**返回值**: 模块得分数组

**示例**:
```typescript
const scores = await getModuleScoresByExamId('uuid-123');
console.log('模块数量:', scores.length);
```

##### 更新模块得分

```typescript
updateModuleScore(
  id: string,
  updates: Partial<Omit<ModuleScore, 'id' | 'exam_record_id' | 'created_at'>>
): Promise<void>
```

**参数**:
- `id`: 模块得分ID
- `updates`: 要更新的字段

**示例**:
```typescript
await updateModuleScore('uuid-456', {
  accuracy_rate: 80,
  time_used: 1500,
});
```

##### 获取所有大模块的平均得分

```typescript
getModuleAverageScores(): Promise<{ 
  module_name: string; 
  avg_accuracy: number 
}[]>
```

**返回值**: 模块平均正确率数组

**示例**:
```typescript
const avgScores = await getModuleAverageScores();
avgScores.forEach(item => {
  console.log(`${item.module_name}: ${item.avg_accuracy.toFixed(2)}%`);
});
```

##### 获取模块趋势数据

```typescript
getModuleTrendData(): Promise<{
  exam_numbers: number[];
  exam_names: string[];
  exam_dates: (string | null)[];
  modules: { module_name: string; data: (number | null)[] }[];
}>
```

**返回值**: 模块趋势数据（用于绘制折线图）

**示例**:
```typescript
const trendData = await getModuleTrendData();
console.log('考试期数:', trendData.exam_numbers);
console.log('模块数量:', trendData.modules.length);
```

##### 获取模块用时趋势数据

```typescript
getModuleTimeTrendData(): Promise<{
  exam_numbers: number[];
  exam_names: string[];
  exam_dates: (string | null)[];
  modules: { module_name: string; data: (number | null)[] }[];
}>
```

**返回值**: 模块用时趋势数据（用于绘制折线图）

**说明**: 用时单位为分钟（自动从秒转换）

**示例**:
```typescript
const timeData = await getModuleTimeTrendData();
console.log('考试期数:', timeData.exam_numbers);
console.log('模块数量:', timeData.modules.length);
```

#### 3. 用户设置相关

##### 获取用户设置

```typescript
getUserSettings(userId: string = 'default'): Promise<UserSetting[]>
```

**参数**:
- `userId`: 用户ID，默认 'default'

**返回值**: 用户设置数组

**示例**:
```typescript
const settings = await getUserSettings();
settings.forEach(s => {
  console.log(`${s.module_name}: 目标${s.target_accuracy}%`);
});
```

##### 更新或创建用户设置

```typescript
upsertUserSetting(
  userId: string = 'default',
  moduleName: string,
  targetAccuracy: number
): Promise<void>
```

**参数**:
- `userId`: 用户ID，默认 'default'
- `moduleName`: 模块名称
- `targetAccuracy`: 目标正确率

**示例**:
```typescript
await upsertUserSetting('default', '政治理论', 80);
```

##### 批量更新用户设置

```typescript
batchUpsertUserSettings(
  settings: Array<{ module_name: string; target_accuracy: number }>,
  userId: string = 'default'
): Promise<void>
```

**参数**:
- `settings`: 设置数组
- `userId`: 用户ID，默认 'default'

**示例**:
```typescript
await batchUpsertUserSettings([
  { module_name: '政治理论', target_accuracy: 80 },
  { module_name: '常识判断', target_accuracy: 75 },
  { module_name: '言语理解与表达', target_accuracy: 85 },
]);
```

#### 4. 考试配置相关

##### 获取考试配置

```typescript
getExamConfig(): Promise<{
  exam_type?: string;
  exam_name?: string;
  exam_date?: string;
  grade_label_theme?: string;
} | null>
```

**返回值**: 考试配置对象或 null

**示例**:
```typescript
const config = await getExamConfig();
if (config) {
  console.log('考试类型:', config.exam_type);
  console.log('考试日期:', config.exam_date);
}
```

##### 保存考试配置

```typescript
saveExamConfig(
  examType: string,
  examDate: string,
  gradeLabelTheme: string = 'theme4',
  examName: string = ''
): Promise<void>
```

**参数**:
- `examType`: 考试类型（国考真题、国考模考、省考真题、省考模考、其他）
- `examDate`: 考试日期（YYYY-MM-DD格式）
- `gradeLabelTheme`: 成绩等级标签主题，默认 'theme4'
- `examName`: 考试名称，默认空字符串

**示例**:
```typescript
await saveExamConfig(
  '国考模考',
  '2024-12-15',
  'theme4',
  '2024年国家公务员考试模拟考试'
);
```

---

## 部署步骤

### 1. 准备工作

#### 1.1 注册腾讯云账号


#### 1.3 注册Supabase账号

1. 访问 [Supabase官网](https://supabase.com/)
2. 注册账号
3. 创建新项目
4. 获取项目URL和anon key

### 2. 本地开发环境配置


#### 2.3 配置环境变量

创建 `.env` 文件：

```env
# Supabase配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 应用ID（用于API调用）
VITE_APP_ID=your-app-id

# API环境（可选）
VITE_API_ENV=production
```
#### 3.2 部署到腾讯云服务器

##### 方式一：使用Nginx

1. **安装Nginx**

```bash
sudo apt update
sudo apt install nginx
```

2. **配置Nginx**

创建配置文件 `/etc/nginx/sites-available/exam-analysis`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/exam-analysis/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 启用gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

3. **启用站点**

```bash
sudo ln -s /etc/nginx/sites-available/exam-analysis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. **上传构建产物**

```bash
# 在本地执行
scp -r dist/* user@your-server:/var/www/exam-analysis/dist/
```

##### 方式二：使用Docker

1. **创建Dockerfile**

```dockerfile
FROM nginx:alpine

# 复制构建产物
COPY dist /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

2. **创建nginx.conf**

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
}
```

3. **构建Docker镜像**

```bash
docker build -t exam-analysis:latest .
```

4. **运行容器**

```bash
docker run -d -p 80:80 --name exam-analysis exam-analysis:latest
```

#### 3.3 配置HTTPS（可选但推荐）

使用Let's Encrypt免费SSL证书：

```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

#### 3.4 配置OCR API代理

由于前端直接调用百度OCR API可能存在跨域问题，建议在服务器端配置反向代理。

**Nginx配置示例**:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # ... 其他配置 ...

    # OCR API代理
    location /api/miaoda/runtime/apicenter/source/proxy/ {
        proxy_pass https://aip.baidubce.com/rest/2.0/ocr/v1/;
        proxy_set_header Host aip.baidubce.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # 添加CORS头
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization,X-App-Id';
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
```

**注意**: 实际部署时，需要在服务器端实现完整的OCR API调用逻辑，包括：
1. 接收前端请求
2. 使用API Key和Secret Key获取access_token
3. 调用百度OCR API
4. 返回结果给前端

---

## 环境变量配置

### 前端环境变量

在项目根目录创建 `.env` 文件：

```env
# Supabase配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 应用ID
VITE_APP_ID=your-app-id

# API环境
VITE_API_ENV=production
```

### 环境变量说明

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| VITE_SUPABASE_URL | Supabase项目URL | https://xxxxx.supabase.co |
| VITE_SUPABASE_ANON_KEY | Supabase匿名密钥 | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |
| VITE_APP_ID | 应用ID（用于API调用） | app-7q11e4xackch |
| VITE_API_ENV | API环境（development/production） | production |

### 获取Supabase配置

1. 登录 [Supabase控制台](https://app.supabase.com/)
2. 选择你的项目
3. 点击左侧菜单的 "Settings" → "API"
4. 复制 "Project URL" 和 "anon public" key

---

## 常见问题


### 3. 数据库连接失败

**问题**: 提示"获取考试记录失败"或其他数据库错误

**可能原因**:
- Supabase配置错误
- 网络连接问题
- 数据库表未创建

**解决方案**:
1. 检查 `.env` 文件中的Supabase配置
2. 确认Supabase项目状态正常
3. 检查数据库迁移是否全部执行成功
4. 查看Supabase控制台的日志


### 7. 安全性建议

1. **启用HTTPS**: 使用SSL证书加密传输
2. **API密钥保护**: 不要在前端代码中暴露API密钥
3. **输入验证**: 对用户输入进行严格验证
4. **SQL注入防护**: 使用参数化查询
5. **XSS防护**: 对用户输入进行转义
6. **CSRF防护**: 使用CSRF令牌
7. **定期备份**: 定期备份数据库数据

---
