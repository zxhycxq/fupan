# Supabase 数据库部署完整指南

## 📋 目录

1. [概述](#概述)
2. [数据库架构说明](#数据库架构说明)
3. [Migration 文件说明](#migration-文件说明)
4. [首次部署流程](#首次部署流程)
5. [更换 Supabase 项目部署](#更换-supabase-项目部署)
6. [数据库表结构详解](#数据库表结构详解)
7. [常见问题解答](#常见问题解答)
8. [数据库维护建议](#数据库维护建议)

---

## 概述

### 什么是 Migration？

Migration（迁移）是数据库版本控制的一种方式，每个 migration 文件代表一次数据库结构的变更。就像 Git 管理代码版本一样，migration 管理数据库版本。

### 为什么有这么多 Migration 文件？

在开发过程中，每次对数据库结构的修改都会生成一个新的 migration 文件。这是正常的开发流程，因为：

1. **可追溯性**：每个文件记录了一次具体的变更
2. **可回滚性**：如果出现问题，可以回退到之前的版本
3. **团队协作**：其他开发者可以看到数据库的演变历史

### 部署时如何处理？

**重要提示**：部署到新的 Supabase 项目时，您**不需要**逐个执行所有 migration 文件。我们会提供一个**合并后的完整 SQL 脚本**，一次性创建所有表和配置。

---

## 数据库架构说明

### 核心表结构

```
考试成绩分析系统数据库
├── 用户相关
│   ├── profiles (用户资料表)
│   └── user_settings (用户设置表)
├── 考试相关
│   ├── exam_records (考试记录表)
│   └── module_scores (模块成绩表)
└── 订单相关
    ├── orders (订单表)
    └── order_items (订单明细表)
```

### 表关系图

```
profiles (用户)
    ↓ (1对多)
exam_records (考试记录)
    ↓ (1对多)
module_scores (模块成绩)

profiles (用户)
    ↓ (1对多)
orders (订单)
    ↓ (1对多)
order_items (订单明细)

profiles (用户)
    ↓ (1对多)
user_settings (用户设置)
```

---

## Migration 文件说明

### 当前 Migration 文件列表

根据您的截图，项目中有以下 migration 文件（按时间顺序）：

| 文件名 | 说明 | 是否必需 |
|--------|------|----------|
| `00001_create_exam_records.sql` | 创建考试记录表 | ✅ 必需 |
| `00002_create_settings.sql` | 创建用户设置表 | ✅ 必需 |
| `00003_add_exam_name.sql` | 添加考试名称字段 | ✅ 必需 |
| `00004_add_exam_type.sql` | 添加考试类型字段 | ✅ 必需 |
| `00005_add_notes.sql` | 添加笔记字段 | ✅ 必需 |
| `00006_add_sort_order.sql` | 添加排序字段 | ✅ 必需 |
| `00007_add_rating.sql` | 添加星级评分字段 | ✅ 必需 |
| `00008_add_notes_fields.sql` | 添加笔记详细字段 | ✅ 必需 |
| `00014_disable_rls_*.sql` | 禁用 RLS 策略（开发用） | ⚠️ 生产环境需修改 |
| `00015_add_include_*.sql` | 添加包含字段 | ✅ 必需 |
| `00017_add_user_auth.sql` | 添加用户认证 | ✅ 必需 |
| `00018_create_public_profiles.sql` | 创建公开用户资料表 | ✅ 必需 |
| `00019_add_username.sql` | 添加用户名字段 | ✅ 必需 |
| `00020_fix_exam_records.sql` | 修复考试记录表 | ✅ 必需 |
| `00021_cleanup_duplicates.sql` | 清理重复数据 | ⚠️ 可选（仅开发环境） |
| `00022_extend_session.sql` | 延长会话时间 | ✅ 必需 |
| `00023_add_soft_delete.sql` | 添加软删除功能 | ✅ 必需 |
| `00024_create_payment.sql` | 创建支付相关表 | ✅ 必需 |

### 文件命名规则

```
[序号]_[操作类型]_[描述].sql

示例：
00001_create_exam_records.sql
  ↑      ↑         ↑
序号   操作类型   描述
```

**操作类型说明**：
- `create_*`：创建新表或新功能
- `add_*`：添加字段或功能
- `fix_*`：修复问题
- `cleanup_*`：清理数据
- `extend_*`：扩展功能
- `disable_*`：禁用功能

---

## 首次部署流程

### 方式一：使用合并后的完整 SQL 脚本（推荐）

#### 步骤 1：准备 Supabase 项目

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 创建新项目或选择现有项目
3. 记录以下信息：
    - Project URL（项目 URL）
    - API Key（anon public key）
    - Database Password（数据库密码）

#### 步骤 2：执行完整 SQL 脚本

我们提供了一个合并后的完整 SQL 脚本，包含所有必需的表结构和配置。

**在 Supabase Dashboard 中执行**：

1. 进入项目的 **SQL Editor**
2. 点击 **New Query**
3. 复制粘贴下面的完整 SQL 脚本
4. 点击 **Run** 执行

**完整 SQL 脚本位置**：
```
/workspace/app-7q11e4xackch/supabase/COMPLETE_DATABASE_SETUP.sql
```

（我们会在下一步创建这个文件）

#### 步骤 3：配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
# Supabase 配置
VITE_SUPABASE_URL=你的项目URL
VITE_SUPABASE_ANON_KEY=你的anon_key

# 应用配置
VITE_APP_ID=app-7q11e4xackch
VITE_API_ENV=production
```

#### 步骤 4：验证部署

运行以下 SQL 查询验证表是否创建成功：

```sql
-- 查看所有表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 应该看到以下表：
-- - exam_records
-- - module_scores
-- - orders
-- - order_items
-- - profiles
-- - user_settings
```

#### 步骤 5：启动应用

```bash
npm install
npm run dev
```

---

### 方式二：使用 Migration 文件（开发环境）

如果您想保留完整的 migration 历史（用于开发或学习），可以使用 Supabase CLI：

#### 步骤 1：安装 Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (使用 Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

#### 步骤 2：登录 Supabase

```bash
supabase login
```

#### 步骤 3：关联项目

```bash
supabase link --project-ref your-project-ref
```

#### 步骤 4：推送 Migrations

```bash
supabase db push
```

这会自动执行 `supabase/migrations/` 目录下的所有 SQL 文件。

---

## 更换 Supabase 项目部署

### 场景：从开发环境迁移到生产环境

#### 步骤 1：导出现有数据（可选）

如果需要保留现有数据：

```bash
# 导出数据
supabase db dump --data-only > data_backup.sql
```

#### 步骤 2：在新项目中执行完整 SQL 脚本

参考 [首次部署流程 - 方式一](#方式一使用合并后的完整-sql-脚本推荐)

#### 步骤 3：导入数据（可选）

如果在步骤 1 中导出了数据：

```sql
-- 在新项目的 SQL Editor 中执行
-- 粘贴 data_backup.sql 的内容
```

#### 步骤 4：更新环境变量

更新 `.env.local` 文件中的 Supabase 配置：

```env
VITE_SUPABASE_URL=新项目的URL
VITE_SUPABASE_ANON_KEY=新项目的anon_key
```

#### 步骤 5：测试验证

1. 启动应用：`npm run dev`
2. 测试用户注册/登录
3. 测试考试记录上传
4. 测试数据查询和展示

---

## 数据库表结构详解

### 1. profiles（用户资料表）

**用途**：存储用户的基本信息和 VIP 状态

```sql
CREATE TABLE profiles (
                          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
                          username TEXT UNIQUE,                    -- 用户名（唯一）
                          phone TEXT UNIQUE,                       -- 手机号（唯一）
                          is_vip BOOLEAN DEFAULT FALSE,            -- 是否为 VIP
                          vip_expires_at TIMESTAMPTZ,              -- VIP 到期时间
                          created_at TIMESTAMPTZ DEFAULT NOW(),    -- 创建时间
                          updated_at TIMESTAMPTZ DEFAULT NOW()     -- 更新时间
);
```

**关键字段说明**：
- `id`：用户 ID，关联 Supabase Auth 系统
- `username`：用户名，用于显示和登录
- `phone`：手机号，用于登录和验证
- `is_vip`：VIP 标识，控制高级功能权限
- `vip_expires_at`：VIP 到期时间，用于自动降级

**索引**：
```sql
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_vip ON profiles(is_vip, vip_expires_at);
```

---

### 2. exam_records（考试记录表）

**用途**：存储每次考试的基本信息和总成绩

```sql
CREATE TABLE exam_records (
                              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                              user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                              exam_name TEXT NOT NULL,                 -- 考试名称
                              exam_type TEXT DEFAULT '国考模考',        -- 考试类型
                              index_number INTEGER NOT NULL,           -- 索引号（排序用）
                              rating NUMERIC(2,1) DEFAULT 0,           -- 星级评分（0-5）
                              total_score NUMERIC(5,2) NOT NULL,       -- 总分
                              max_score NUMERIC(5,2),                  -- 最高分
                              average_score NUMERIC(5,2),              -- 平均分
                              pass_rate NUMERIC(5,2),                  -- 通过率
                              difficulty NUMERIC(3,1),                 -- 难度
                              beat_percentage NUMERIC(5,2),            -- 击败百分比
                              time_used INTEGER,                       -- 用时（秒）
                              question_count INTEGER,                  -- 题目数量
                              duration_seconds INTEGER,                -- 考试时长（秒）
                              image_url TEXT,                          -- 成绩截图 URL
                              improvements TEXT,                       -- 改进点
                              mistakes TEXT,                           -- 错题记录
                              include_in_analysis BOOLEAN DEFAULT TRUE,-- 是否包含在分析中
                              is_deleted BOOLEAN DEFAULT FALSE,        -- 软删除标记
                              created_at TIMESTAMPTZ DEFAULT NOW(),
                              updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- 约束
                              CONSTRAINT unique_user_index UNIQUE(user_id, index_number),
                              CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
                              CONSTRAINT valid_score CHECK (total_score >= 0)
);
```

**关键字段说明**：
- `exam_name`：考试名称，如"第5期考试"、"国考真题2024"
- `exam_type`：考试类型，可选值：国考真题、国考模考、省考真题、省考模考、其他
- `index_number`：索引号，用于排序，必须唯一（每个用户）
- `rating`：星级评分，支持半星（0-5）
- `include_in_analysis`：是否包含在趋势分析中（用户可以排除某些考试）
- `is_deleted`：软删除标记（删除的记录不会真正删除，只是标记）

**索引**：
```sql
CREATE INDEX idx_exam_records_user ON exam_records(user_id);
CREATE INDEX idx_exam_records_index ON exam_records(user_id, index_number);
CREATE INDEX idx_exam_records_created ON exam_records(created_at DESC);
CREATE INDEX idx_exam_records_analysis ON exam_records(user_id, include_in_analysis, is_deleted);
```

---

### 3. module_scores（模块成绩表）

**用途**：存储每次考试各模块的详细成绩

```sql
CREATE TABLE module_scores (
                               id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                               exam_record_id UUID REFERENCES exam_records(id) ON DELETE CASCADE,
                               module_name TEXT NOT NULL,               -- 模块名称
                               parent_module TEXT,                      -- 父模块名称（用于二级模块）
                               total_questions INTEGER NOT NULL,        -- 总题数
                               correct_answers INTEGER NOT NULL,        -- 答对数
                               accuracy_rate NUMERIC(5,2),              -- 正确率（自动计算）
                               time_used INTEGER,                       -- 用时（秒）
                               created_at TIMESTAMPTZ DEFAULT NOW(),
                               updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- 约束
                               CONSTRAINT valid_questions CHECK (total_questions > 0),
                               CONSTRAINT valid_correct CHECK (correct_answers >= 0 AND correct_answers <= total_questions)
);
```

**模块层级结构**：

```
一级模块（parent_module = NULL）
├── 政治理论
│   ├── 马克思主义（parent_module = '政治理论'）
│   ├── 理论与政策
│   └── 时政热点
├── 常识判断
│   ├── 经济常识
│   ├── 科技常识
│   ├── 人文常识
│   ├── 地理国情
│   └── 法律常识
├── 言语理解与表达
│   ├── 逻辑填空
│   ├── 片段阅读
│   └── 语句表达
├── 数量关系
│   └── 数学运算
├── 判断推理
│   ├── 图形推理
│   ├── 定义判断
│   ├── 类比推理
│   └── 逻辑判断
└── 资料分析
    ├── 文字资料
    ├── 综合资料
    ├── 简单计算
    ├── 其期与现期
    ├── 增长率
    ├── 增长量
    ├── 比重问题
    └── 平均数问题
```

**关键字段说明**：
- `module_name`：模块名称，如"政治理论"、"马克思主义"
- `parent_module`：父模块名称，NULL 表示一级模块
- `accuracy_rate`：正确率，由触发器自动计算

**索引**：
```sql
CREATE INDEX idx_module_scores_exam ON module_scores(exam_record_id);
CREATE INDEX idx_module_scores_module ON module_scores(module_name);
CREATE INDEX idx_module_scores_parent ON module_scores(parent_module);
```

**自动计算触发器**：
```sql
-- 自动计算正确率
CREATE OR REPLACE FUNCTION calculate_accuracy_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_questions > 0 THEN
    NEW.accuracy_rate := (NEW.correct_answers::NUMERIC / NEW.total_questions::NUMERIC) * 100;
ELSE
    NEW.accuracy_rate := 0;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_accuracy
    BEFORE INSERT OR UPDATE ON module_scores
                         FOR EACH ROW
                         EXECUTE FUNCTION calculate_accuracy_rate();
```

---

### 4. user_settings（用户设置表）

**用途**：存储用户的个性化设置

```sql
CREATE TABLE user_settings (
                               id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                               user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                               setting_key TEXT NOT NULL,               -- 设置键
                               setting_value TEXT NOT NULL,             -- 设置值
                               setting_type TEXT DEFAULT 'string',      -- 设置类型
                               created_at TIMESTAMPTZ DEFAULT NOW(),
                               updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- 约束
                               CONSTRAINT unique_user_setting UNIQUE(user_id, setting_key)
);
```

**常用设置项**：

| setting_key | setting_value | setting_type | 说明 |
|-------------|---------------|--------------|------|
| `theme` | `light` / `dark` | `string` | 主题模式 |
| `exam_target_score` | `80` | `number` | 目标分数 |
| `countdown_date` | `2024-12-31` | `date` | 倒计时日期 |
| `countdown_label` | `国考` | `string` | 倒计时标签 |
| `show_tips` | `true` / `false` | `boolean` | 是否显示提示 |

**索引**：
```sql
CREATE INDEX idx_user_settings_user ON user_settings(user_id);
CREATE INDEX idx_user_settings_key ON user_settings(user_id, setting_key);
```

---

### 5. orders（订单表）

**用途**：存储 VIP 会员订单信息

```sql
CREATE TABLE orders (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        order_no TEXT UNIQUE NOT NULL,           -- 订单号
                        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                        user_name TEXT NOT NULL,                 -- 收货人姓名
                        user_phone TEXT NOT NULL,                -- 收货人手机号
                        user_address TEXT NOT NULL,              -- 收货地址
                        status TEXT DEFAULT 'pending',           -- 订单状态
                        total_amount NUMERIC(10,2) NOT NULL,     -- 订单总金额
                        wechat_pay_url TEXT,                     -- 微信支付二维码 URL
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- 约束
                        CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
                        CONSTRAINT valid_amount CHECK (total_amount > 0)
);
```

**订单状态说明**：
- `pending`：待支付
- `paid`：已支付
- `cancelled`：已取消
- `refunded`：已退款

**索引**：
```sql
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_no ON orders(order_no);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

---

### 6. order_items（订单明细表）

**用途**：存储订单中的商品明细

```sql
CREATE TABLE order_items (
                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                             order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
                             sku_code TEXT NOT NULL,                  -- 商品 SKU 编码
                             quantity INTEGER NOT NULL DEFAULT 1,     -- 数量
                             unit_price NUMERIC(10,2) NOT NULL,       -- 单价
                             total_price NUMERIC(10,2) NOT NULL,      -- 小计
                             sku_snapshot JSONB NOT NULL,             -- 商品快照
                             created_at TIMESTAMPTZ DEFAULT NOW(),

    -- 约束
                             CONSTRAINT valid_quantity CHECK (quantity > 0),
                             CONSTRAINT valid_unit_price CHECK (unit_price > 0),
                             CONSTRAINT valid_total_price CHECK (total_price > 0)
);
```

**SKU 编码规则**：
- `VIP_QUARTER`：季度 VIP（3个月）
- `VIP_ANNUAL`：年度 VIP（12个月）

**sku_snapshot 结构**：
```json
{
  "name": "季度VIP会员",
  "duration_months": 3,
  "description": "享受3个月VIP特权"
}
```

**索引**：
```sql
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_sku ON order_items(sku_code);
```

---

## 常见问题解答

### Q1：为什么有这么多 migration 文件？

**A**：这是正常的开发流程。在开发过程中，每次对数据库结构的修改都会生成一个新的 migration 文件。这样做的好处是：

1. **可追溯**：可以看到数据库的演变历史
2. **可回滚**：如果出现问题，可以回退到之前的版本
3. **团队协作**：其他开发者可以同步数据库变更

**部署时不需要逐个执行**，我们提供了合并后的完整 SQL 脚本。

---

### Q2：部署时必须执行所有 migration 文件吗？

**A**：**不需要**。部署到新的 Supabase 项目时，只需要执行我们提供的**完整 SQL 脚本**（`COMPLETE_DATABASE_SETUP.sql`），它包含了所有必需的表结构和配置。

---

### Q3：如何判断哪些 migration 文件是必需的？

**A**：参考 [Migration 文件说明](#migration-文件说明) 表格中的"是否必需"列。标记为 ✅ 的是必需的，标记为 ⚠️ 的是可选的或需要修改的。

---

### Q4：什么是 RLS（Row Level Security）？

**A**：RLS 是 Supabase 的行级安全策略，用于控制用户只能访问自己的数据。

**示例**：
```sql
-- 用户只能查看自己的考试记录
CREATE POLICY "Users can view own exam records"
ON exam_records
FOR SELECT
               USING (auth.uid() = user_id);
```

**当前状态**：开发环境中禁用了 RLS（`00014_disable_rls_*.sql`），生产环境需要启用。

---

### Q5：如何启用 RLS 策略？

**A**：在生产环境部署时，需要启用 RLS 并创建安全策略。参考 [数据库维护建议 - 启用 RLS 策略](#启用-rls-策略)。

---

### Q6：如何备份数据库？

**A**：

**方式一：使用 Supabase Dashboard**
1. 进入项目的 **Database** → **Backups**
2. 点击 **Create Backup**

**方式二：使用 Supabase CLI**
```bash
# 备份结构和数据
supabase db dump > backup.sql

# 仅备份数据
supabase db dump --data-only > data_backup.sql
```

---

### Q7：如何恢复数据库？

**A**：

```bash
# 使用 Supabase CLI
supabase db reset
supabase db push
```

或在 SQL Editor 中执行备份的 SQL 文件。

---

### Q8：如何查看当前数据库版本？

**A**：

```sql
-- 查看已执行的 migrations
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

---

### Q9：如何添加新的表或字段？

**A**：

**方式一：直接在 SQL Editor 中执行**（推荐用于生产环境）
```sql
-- 添加新字段
ALTER TABLE exam_records
    ADD COLUMN new_field TEXT;
```

**方式二：创建新的 migration 文件**（推荐用于开发环境）
```bash
# 创建新的 migration
supabase migration new add_new_field

# 编辑生成的文件
# supabase/migrations/[timestamp]_add_new_field.sql

# 推送到数据库
supabase db push
```

---

### Q10：如何删除不需要的 migration 文件？

**A**：

**警告**：不要直接删除已经执行过的 migration 文件！

如果需要清理 migration 历史：

1. **导出当前数据库结构**
   ```bash
   supabase db dump --schema-only > current_schema.sql
   ```

2. **创建新的 migration**
   ```bash
   supabase migration new complete_schema
   ```

3. **将导出的结构复制到新 migration 中**

4. **删除旧的 migration 文件**（仅在确认新 migration 正确后）

---

## 数据库维护建议

### 定期备份

**建议频率**：
- 开发环境：每周备份一次
- 生产环境：每天自动备份（Supabase 提供）

**备份脚本**：
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR

# 备份数据库
supabase db dump > "$BACKUP_DIR/backup_$DATE.sql"

# 压缩备份文件
gzip "$BACKUP_DIR/backup_$DATE.sql"

echo "Backup completed: backup_$DATE.sql.gz"
```

---

### 监控数据库性能

**关键指标**：
- 查询响应时间
- 数据库连接数
- 存储空间使用率

**在 Supabase Dashboard 中查看**：
- **Database** → **Performance**

---

### 优化查询性能

**常用优化技巧**：

1. **添加索引**
   ```sql
   -- 为常用查询字段添加索引
   CREATE INDEX idx_exam_records_user_created 
   ON exam_records(user_id, created_at DESC);
   ```

2. **使用 EXPLAIN 分析查询**
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM exam_records
   WHERE user_id = 'xxx'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. **避免 SELECT ***
   ```sql
   -- ❌ 不推荐
   SELECT * FROM exam_records;
   
   -- ✅ 推荐
   SELECT id, exam_name, total_score, created_at
   FROM exam_records;
   ```

---

### 清理无用数据

**软删除数据清理**：
```sql
-- 永久删除超过 30 天的软删除记录
DELETE FROM exam_records
WHERE is_deleted = TRUE
  AND updated_at < NOW() - INTERVAL '30 days';
```

**过期 VIP 用户清理**：
```sql
-- 自动降级过期 VIP 用户
UPDATE profiles
SET is_vip = FALSE
WHERE is_vip = TRUE
  AND vip_expires_at < NOW();
```

**建议**：创建定时任务（Supabase Edge Functions）自动执行清理。

---

### 启用 RLS 策略

**生产环境必须启用 RLS**，确保数据安全。

**完整 RLS 策略示例**：

```sql
-- 1. 启用 RLS
ALTER TABLE exam_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 2. 考试记录策略
-- 用户只能查看自己的考试记录
CREATE POLICY "Users can view own exam records"
ON exam_records
FOR SELECT
               USING (auth.uid() = user_id);

-- 用户只能插入自己的考试记录
CREATE POLICY "Users can insert own exam records"
ON exam_records
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的考试记录
CREATE POLICY "Users can update own exam records"
ON exam_records
FOR UPDATE
                      USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 用户只能删除自己的考试记录
CREATE POLICY "Users can delete own exam records"
ON exam_records
FOR DELETE
USING (auth.uid() = user_id);

-- 3. 模块成绩策略
-- 用户只能查看自己考试的模块成绩
CREATE POLICY "Users can view own module scores"
ON module_scores
FOR SELECT
               USING (
               EXISTS (
               SELECT 1 FROM exam_records
               WHERE exam_records.id = module_scores.exam_record_id
               AND exam_records.user_id = auth.uid()
               )
               );

-- 用户只能插入自己考试的模块成绩
CREATE POLICY "Users can insert own module scores"
ON module_scores
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM exam_records
    WHERE exam_records.id = module_scores.exam_record_id
    AND exam_records.user_id = auth.uid()
  )
);

-- 用户只能更新自己考试的模块成绩
CREATE POLICY "Users can update own module scores"
ON module_scores
FOR UPDATE
                      USING (
                      EXISTS (
                      SELECT 1 FROM exam_records
                      WHERE exam_records.id = module_scores.exam_record_id
                      AND exam_records.user_id = auth.uid()
                      )
                      );

-- 用户只能删除自己考试的模块成绩
CREATE POLICY "Users can delete own module scores"
ON module_scores
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM exam_records
    WHERE exam_records.id = module_records.exam_record_id
    AND exam_records.user_id = auth.uid()
  )
);

-- 4. 订单策略
-- 用户只能查看自己的订单
CREATE POLICY "Users can view own orders"
ON orders
FOR SELECT
               USING (auth.uid() = user_id);

-- 用户只能创建自己的订单
CREATE POLICY "Users can create own orders"
ON orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. 订单明细策略
-- 用户只能查看自己订单的明细
CREATE POLICY "Users can view own order items"
ON order_items
FOR SELECT
                      USING (
                      EXISTS (
                      SELECT 1 FROM orders
                      WHERE orders.id = order_items.order_id
                      AND orders.user_id = auth.uid()
                      )
                      );

-- 6. 用户设置策略
-- 用户只能查看自己的设置
CREATE POLICY "Users can view own settings"
ON user_settings
FOR SELECT
               USING (auth.uid() = user_id);

-- 用户只能插入自己的设置
CREATE POLICY "Users can insert own settings"
ON user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的设置
CREATE POLICY "Users can update own settings"
ON user_settings
FOR UPDATE
                      USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 用户只能删除自己的设置
CREATE POLICY "Users can delete own settings"
ON user_settings
FOR DELETE
USING (auth.uid() = user_id);
```

---

### 数据库版本管理

**建议工作流**：

1. **开发环境**：使用 migration 文件管理变更
2. **测试环境**：执行完整 SQL 脚本 + 测试数据
3. **生产环境**：执行完整 SQL 脚本 + 启用 RLS

**版本号规则**：
```
v1.0.0 - 初始版本
v1.1.0 - 添加新功能（新表或新字段）
v1.0.1 - 修复问题（数据修正或索引优化）
```

---

## 附录

### 完整 SQL 脚本模板

我们会在下一步创建 `COMPLETE_DATABASE_SETUP.sql` 文件，包含：

1. 创建所有表
2. 创建所有索引
3. 创建所有触发器
4. 创建所有函数
5. 配置 RLS 策略（可选）
6. 插入初始数据（可选）

### 常用 SQL 命令速查

```sql
-- 查看所有表
\dt

-- 查看表结构
\d table_name

-- 查看索引
\di

-- 查看触发器
SELECT * FROM information_schema.triggers;

-- 查看函数
\df

-- 查看 RLS 策略
SELECT * FROM pg_policies;

-- 查看表大小
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 总结

### 快速部署检查清单

- [ ] 创建 Supabase 项目
- [ ] 执行完整 SQL 脚本（`COMPLETE_DATABASE_SETUP.sql`）
- [ ] 配置环境变量（`.env.local`）
- [ ] 验证表结构（运行测试查询）
- [ ] 启用 RLS 策略（生产环境）
- [ ] 测试用户注册/登录
- [ ] 测试数据上传和查询
- [ ] 配置定期备份

### 需要帮助？

如果在部署过程中遇到问题，请检查：

1. **Supabase Dashboard** → **Logs**：查看错误日志
3. **SQL Editor**：手动执行测试查询
