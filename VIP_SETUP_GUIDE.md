# 会员系统配置和部署指南

## 概述

本系统实现了基于手动开通的会员管理功能，包括：
- 用户端会员购买流程
- 管理员手动开通会员
- 会员状态查询和展示
- 会员到期提醒

## 一、前端配置

### 1. 环境变量配置

在 `.env.production` 文件中添加以下配置：

```bash
# 支付方式：feishu（飞书表单）或 article（支付文章）
VITE_PAYMENT_TYPE=article

# 飞书表单链接（如果使用飞书表单支付）
VITE_FEISHU_FORM_URL=https://example.feishu.cn/share/base/form/shrcn...

# 支付文章链接（如果使用支付文章）
VITE_PAYMENT_ARTICLE_URL=https://your-domain.com/payment-guide
```

### 2. 修改会员套餐价格（可选）

编辑 `src/components/common/VipPaymentModal.tsx` 文件：

```typescript
const VIP_PACKAGES = [
  {
    id: 'quarter',
    name: '季度会员',
    duration: '3个月',
    price: '¥99',  // 修改价格
    features: [...],
  },
  {
    id: 'year',
    name: '年度会员',
    duration: '12个月',
    price: '¥299',  // 修改价格
    originalPrice: '¥396',
    discount: '立省¥97',
    features: [...],
    recommended: true,
  },
];
```

## 二、数据库配置

### 1. 数据库表结构

系统已自动创建以下表：

#### user_vip 表（用户会员信息）
```sql
CREATE TABLE user_vip (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  is_vip BOOLEAN DEFAULT FALSE,
  vip_start_date TIMESTAMPTZ,
  vip_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### vip_orders 表（会员订单记录）
```sql
CREATE TABLE vip_orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  order_no TEXT UNIQUE,
  amount DECIMAL(10,2),
  duration_months INTEGER,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ
);
```

### 2. RLS 策略

系统已自动配置以下 RLS 策略：
- 用户可以查看自己的会员信息和订单
- 用户可以创建自己的订单记录
- 只有管理员（通过 service_role）可以更新会员信息

## 三、管理员操作指南

### 1. 查询用户信息

```sql
-- 通过手机号查询用户ID
SELECT id, email, phone, created_at 
FROM auth.users 
WHERE phone = '+8613800138000';  -- 替换为实际手机号
```

### 2. 开通会员（新用户）

```sql
-- 开通季度会员（3个月）
INSERT INTO user_vip (user_id, is_vip, vip_start_date, vip_end_date)
VALUES (
  'user-uuid-here',  -- 替换为实际用户ID
  TRUE,
  NOW(),
  NOW() + INTERVAL '3 months'
);

-- 开通年度会员（12个月）
INSERT INTO user_vip (user_id, is_vip, vip_start_date, vip_end_date)
VALUES (
  'user-uuid-here',  -- 替换为实际用户ID
  TRUE,
  NOW(),
  NOW() + INTERVAL '12 months'
);
```

### 3. 续费会员（已有会员）

```sql
-- 续费3个月（从当前到期时间延长）
UPDATE user_vip 
SET 
  is_vip = TRUE,
  vip_end_date = GREATEST(vip_end_date, NOW()) + INTERVAL '3 months',
  updated_at = NOW()
WHERE user_id = 'user-uuid-here';

-- 续费12个月
UPDATE user_vip 
SET 
  is_vip = TRUE,
  vip_end_date = GREATEST(vip_end_date, NOW()) + INTERVAL '12 months',
  updated_at = NOW()
WHERE user_id = 'user-uuid-here';
```

### 4. 记录订单信息（推荐）

```sql
-- 创建订单记录
INSERT INTO vip_orders (
  user_id,
  order_no,
  amount,
  duration_months,
  status,
  payment_method,
  transaction_id,
  paid_at,
  expired_at
) VALUES (
  'user-uuid-here',           -- 用户ID
  'VIP' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || SUBSTRING(MD5(RANDOM()::TEXT), 1, 6),  -- 订单号
  99.00,                      -- 金额（季度99，年度299）
  3,                          -- 时长（月）
  'paid',                     -- 状态
  'alipay',                   -- 支付方式（alipay/wechat/bank）
  'transaction-id-here',      -- 交易流水号
  NOW(),                      -- 支付时间
  NOW() + INTERVAL '3 months' -- 到期时间
);
```

### 5. 查询即将到期的会员

```sql
-- 查询7天内到期的会员
SELECT 
  u.id,
  u.email,
  u.phone,
  v.vip_end_date,
  EXTRACT(DAY FROM (v.vip_end_date - NOW())) as days_remaining
FROM auth.users u
JOIN user_vip v ON u.id = v.user_id
WHERE v.is_vip = TRUE
  AND v.vip_end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY v.vip_end_date;
```

## 四、用户端使用流程

### 1. 查看会员状态

用户登录后，在个人中心页面可以看到：
- 当前会员状态（普通用户/VIP会员）
- VIP到期时间（如果是会员）
- 剩余天数提醒

### 2. 购买会员

1. 点击"去付款"按钮
2. 选择会员套餐（季度/年度）
3. 点击"去付款"跳转到支付页面
4. 完成支付后，保存支付凭证
5. 联系客服提供支付凭证和用户信息
6. 等待管理员开通（24小时内）

### 3. 续费会员

会员到期前，用户可以：
1. 在个人中心看到到期提醒
2. 点击"续费会员"按钮
3. 按照购买流程完成续费

## 五、支付页面配置

### 方式一：飞书表单

1. 在飞书中创建表单，包含以下字段：
   - 用户手机号
   - 会员套餐（季度/年度）
   - 支付方式
   - 支付凭证（图片上传）
   - 备注

2. 获取表单分享链接

3. 在 `.env.production` 中配置：
   ```bash
   VITE_PAYMENT_TYPE=feishu
   VITE_FEISHU_FORM_URL=https://your-feishu-form-url
   ```

### 方式二：支付文章

1. 创建一篇支付说明文章，包含：
   - 会员套餐介绍
   - 支付方式（支付宝/微信/银行转账）
   - 支付二维码或账号信息
   - 联系客服方式

2. 发布文章并获取链接

3. 在 `.env.production` 中配置：
   ```bash
   VITE_PAYMENT_TYPE=article
   VITE_PAYMENT_ARTICLE_URL=https://your-payment-article-url
   ```

## 六、常见问题

### Q1: 用户反馈会员未生效？

A: 检查步骤：
1. 查询 user_vip 表中的记录
2. 确认 is_vip 为 TRUE
3. 确认 vip_end_date 大于当前时间
4. 让用户刷新页面或重新登录

### Q2: 如何处理退款？

A: 
1. 取消用户会员状态
2. 更新订单状态为 'refunded'
3. 线下退款给用户

```sql
-- 取消会员
UPDATE user_vip SET is_vip = FALSE WHERE user_id = 'user-uuid-here';

-- 更新订单状态
UPDATE vip_orders SET status = 'refunded' WHERE order_no = 'order-no-here';
```

### Q3: 如何批量导入会员？

A: 使用 SQL 批量插入：

```sql
-- 批量开通会员
INSERT INTO user_vip (user_id, is_vip, vip_start_date, vip_end_date)
SELECT 
  id,
  TRUE,
  NOW(),
  NOW() + INTERVAL '3 months'
FROM auth.users
WHERE phone IN ('+8613800138000', '+8613800138001', '+8613800138002');
```

## 七、安全建议

1. **限制 SQL Editor 访问**：只有管理员可以访问 Supabase SQL Editor
2. **记录操作日志**：在订单表中记录所有操作
3. **定期备份数据**：定期备份 user_vip 和 vip_orders 表
4. **验证支付凭证**：确保支付凭证真实有效再开通会员
5. **设置提醒**：为即将到期的会员设置提醒

## 八、未来优化方向

1. **自动化开通**：对接支付接口，实现自动开通
2. **管理后台**：开发专门的管理后台页面
3. **邮件通知**：自动发送会员开通和到期提醒邮件
4. **发票管理**：支持开具电子发票
5. **会员等级**：支持多种会员等级和权益

## 九、技术支持

如有问题，请参考：
- [VIP_MANAGEMENT.md](./VIP_MANAGEMENT.md) - 详细的管理员操作指南
- Supabase 官方文档：https://supabase.com/docs
- 项目 GitHub Issues

---

**最后更新时间**：2025-01-20
