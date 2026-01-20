# 会员管理系统说明文档

## 系统概述

本系统采用**手动开通会员**的方式，用户付费后由管理员手动开通会员权限。

## 工作流程

### 1. 用户端流程

1. 用户注册登录后，在个人中心查看会员状态
2. 点击"去付款"按钮，选择会员套餐（季度/年度）
3. 跳转到支付页面（飞书表单或支付文章）
4. 完成支付后，保存支付凭证
5. 联系客服提供支付凭证和用户信息
6. 等待管理员开通会员（24小时内）

### 2. 管理员端流程

1. 收到用户支付凭证和信息
2. 核实支付信息
3. 使用 Supabase SQL Editor 执行开通会员 SQL
4. 通知用户会员已开通

## 数据库表结构

### user_vip 表（用户会员信息）

```sql
CREATE TABLE IF NOT EXISTS user_vip (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_vip BOOLEAN DEFAULT FALSE,
  vip_start_date TIMESTAMPTZ,
  vip_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### vip_orders 表（会员订单记录）

```sql
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
```

## 管理员操作指南

### 1. 查询用户信息

```sql
-- 通过手机号查询用户ID
SELECT id, email, phone, created_at 
FROM auth.users 
WHERE phone = '+8613800138000';  -- 替换为实际手机号

-- 查询用户当前会员状态
SELECT * FROM user_vip WHERE user_id = 'user-uuid-here';
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

### 4. 记录订单信息（可选）

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

### 5. 取消会员

```sql
-- 取消会员（保留记录）
UPDATE user_vip 
SET 
  is_vip = FALSE,
  updated_at = NOW()
WHERE user_id = 'user-uuid-here';
```

### 6. 批量查询即将到期的会员

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

## 前端配置

### 修改支付链接

编辑 `src/components/common/VipPaymentModal.tsx` 文件：

```typescript
// 支付链接配置
const PAYMENT_CONFIG = {
  // 飞书表单链接
  feishuFormUrl: 'https://your-feishu-form-url',
  
  // 或者支付文章链接
  paymentArticleUrl: 'https://your-payment-article-url',
  
  // 当前使用的支付方式：'feishu' 或 'article'
  paymentType: 'article' as 'feishu' | 'article',
};
```

### 修改会员套餐价格

在同一文件中修改 `VIP_PACKAGES` 配置：

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

## 常见问题

### Q1: 如何查找用户ID？

A: 通过手机号查询：
```sql
SELECT id FROM auth.users WHERE phone = '+8613800138000';
```

### Q2: 如何验证会员是否开通成功？

A: 查询用户会员状态：
```sql
SELECT * FROM user_vip WHERE user_id = 'user-uuid-here';
```

### Q3: 用户反馈会员未生效怎么办？

A: 
1. 检查 user_vip 表中的记录
2. 确认 is_vip 为 TRUE
3. 确认 vip_end_date 大于当前时间
4. 让用户刷新页面或重新登录

### Q4: 如何处理退款？

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

## 安全建议

1. **限制 SQL Editor 访问权限**：只有管理员可以访问 Supabase SQL Editor
2. **记录操作日志**：建议在订单表中记录所有操作
3. **定期备份数据**：定期备份 user_vip 和 vip_orders 表
4. **验证支付凭证**：确保支付凭证真实有效再开通会员
5. **设置提醒**：为即将到期的会员设置提醒

## 未来优化方向

1. **自动化开通**：对接支付接口，实现自动开通
2. **管理后台**：开发专门的管理后台页面
3. **邮件通知**：自动发送会员开通和到期提醒邮件
4. **发票管理**：支持开具电子发票
5. **会员等级**：支持多种会员等级和权益
