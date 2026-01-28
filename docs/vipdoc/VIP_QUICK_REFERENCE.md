# 会员开通快速参考指南

## 🚀 快速开始（推荐方式）

### 方式一：使用 Supabase SQL Editor（最安全）

1. **登录 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 选择项目 → SQL Editor

2. **查询用户ID**
   ```sql
   SELECT id, phone, email FROM auth.users WHERE phone = '+8613800138000';
   ```

3. **开通会员**
   ```sql
   -- 季度会员（3个月，¥99）
   INSERT INTO user_vip (user_id, is_vip, vip_start_date, vip_end_date)
   VALUES ('用户ID', TRUE, NOW(), NOW() + INTERVAL '3 months')
   ON CONFLICT (user_id) DO UPDATE SET
     is_vip = TRUE, vip_start_date = NOW(), 
     vip_end_date = NOW() + INTERVAL '3 months', updated_at = NOW();

   -- 年度会员（12个月，¥299）
   INSERT INTO user_vip (user_id, is_vip, vip_start_date, vip_end_date)
   VALUES ('用户ID', TRUE, NOW(), NOW() + INTERVAL '12 months')
   ON CONFLICT (user_id) DO UPDATE SET
     is_vip = TRUE, vip_start_date = NOW(), 
     vip_end_date = NOW() + INTERVAL '12 months', updated_at = NOW();
   ```

4. **记录订单（推荐）**
   ```sql
   INSERT INTO vip_orders (user_id, order_no, amount, duration_months, status, payment_method, paid_at, expired_at)
   VALUES (
     '用户ID',
     'VIP' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || SUBSTRING(MD5(RANDOM()::TEXT), 1, 6),
     99.00,  -- 季度99，年度299
     3,      -- 季度3，年度12
     'paid',
     'alipay',
     NOW(),
     NOW() + INTERVAL '3 months'
   );
   ```

---

### 方式二：使用管理工具（需要部署 Edge Function）

#### 步骤1：部署 Edge Function

```bash
# 1. 设置管理员密钥
# 在 Supabase Dashboard → Settings → Edge Functions → Secrets 中添加：
# ADMIN_SECRET=your-super-secret-key-here

# 2. 部署函数
supabase functions deploy admin-activate-vip
```

#### 步骤2：配置管理工具

1. 打开 `admin-vip-tool.html` 文件
2. 修改 `SUPABASE_URL` 为您的项目URL：
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co'
   ```
3. 保存文件

#### 步骤3：使用管理工具

1. 在浏览器中打开 `admin-vip-tool.html`
2. 输入用户ID（从 Supabase 查询获取）
3. 输入管理员密钥（从环境变量获取）
4. 选择会员时长和支付方式
5. 点击"开通会员"按钮

---

## 📋 常用 SQL 命令

### 查询用户信息

```sql
-- 通过手机号查询
SELECT id, phone, email, created_at 
FROM auth.users 
WHERE phone = '+8613800138000';

-- 通过邮箱查询
SELECT id, phone, email, created_at 
FROM auth.users 
WHERE email = 'user@example.com';

-- 模糊查询
SELECT id, phone, email, created_at 
FROM auth.users 
WHERE phone LIKE '%138%' OR email LIKE '%example%';
```

### 查询会员状态

```sql
-- 查询单个用户会员状态
SELECT 
  v.*,
  u.phone,
  u.email,
  EXTRACT(DAY FROM (v.vip_end_date - NOW())) as days_remaining
FROM user_vip v
JOIN auth.users u ON v.user_id = u.id
WHERE v.user_id = '用户ID';

-- 查询所有VIP会员
SELECT 
  v.*,
  u.phone,
  u.email,
  EXTRACT(DAY FROM (v.vip_end_date - NOW())) as days_remaining
FROM user_vip v
JOIN auth.users u ON v.user_id = u.id
WHERE v.is_vip = TRUE AND v.vip_end_date > NOW()
ORDER BY v.vip_end_date;

-- 查询即将到期的会员（7天内）
SELECT 
  v.*,
  u.phone,
  u.email,
  EXTRACT(DAY FROM (v.vip_end_date - NOW())) as days_remaining
FROM user_vip v
JOIN auth.users u ON v.user_id = u.id
WHERE v.is_vip = TRUE
  AND v.vip_end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY v.vip_end_date;
```

### 续费会员

```sql
-- 续费3个月（从当前到期时间延长）
UPDATE user_vip 
SET 
  is_vip = TRUE,
  vip_end_date = GREATEST(vip_end_date, NOW()) + INTERVAL '3 months',
  updated_at = NOW()
WHERE user_id = '用户ID';

-- 续费12个月
UPDATE user_vip 
SET 
  is_vip = TRUE,
  vip_end_date = GREATEST(vip_end_date, NOW()) + INTERVAL '12 months',
  updated_at = NOW()
WHERE user_id = '用户ID';
```

### 取消会员

```sql
-- 取消会员（不删除记录）
UPDATE user_vip 
SET 
  is_vip = FALSE,
  updated_at = NOW()
WHERE user_id = '用户ID';
```

### 查询订单记录

```sql
-- 查询用户所有订单
SELECT * FROM vip_orders 
WHERE user_id = '用户ID' 
ORDER BY created_at DESC;

-- 查询本月订单统计
SELECT 
  COUNT(*) as total_orders,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_order_value
FROM vip_orders
WHERE status = 'paid' 
  AND paid_at >= DATE_TRUNC('month', NOW());

-- 查询今日新增会员
SELECT COUNT(*) FROM user_vip 
WHERE vip_start_date >= CURRENT_DATE;
```

### 批量操作

```sql
-- 批量开通会员（通过手机号列表）
INSERT INTO user_vip (user_id, is_vip, vip_start_date, vip_end_date)
SELECT 
  id,
  TRUE,
  NOW(),
  NOW() + INTERVAL '3 months'
FROM auth.users
WHERE phone IN ('+8613800138000', '+8613800138001', '+8613800138002')
ON CONFLICT (user_id) DO UPDATE SET
  is_vip = TRUE,
  vip_start_date = NOW(),
  vip_end_date = NOW() + INTERVAL '3 months',
  updated_at = NOW();
```

---

## 🔐 安全提醒

### ⚠️ 重要安全规则

1. **保护管理员密钥**
   - 使用强密码（至少32位随机字符）
   - 不要在代码中硬编码
   - 不要提交到 Git
   - 定期更换密钥

2. **限制访问权限**
   - 只有项目管理员可以访问 SQL Editor
   - 管理工具页面设置密码保护
   - 考虑添加 IP 白名单

3. **操作前确认**
   - 确认用户身份和支付凭证
   - 核对支付金额和会员时长
   - 记录操作日志

4. **定期审查**
   - 定期检查会员开通记录
   - 监控异常操作
   - 审查订单数据

---

## 📞 常见问题

### Q: 如何生成强密码？

A: 使用以下命令生成：
```bash
# 使用 openssl
openssl rand -base64 32

# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Q: 用户反馈会员未生效？

A: 检查步骤：
1. 查询 user_vip 表确认记录存在
2. 确认 is_vip = TRUE
3. 确认 vip_end_date > NOW()
4. 让用户刷新页面或重新登录

### Q: 如何处理退款？

A: 
```sql
-- 1. 取消会员
UPDATE user_vip SET is_vip = FALSE WHERE user_id = '用户ID';

-- 2. 更新订单状态
UPDATE vip_orders SET status = 'refunded' WHERE order_no = '订单号';

-- 3. 线下退款给用户
```

### Q: 如何查看操作日志？

A: 
- Supabase Dashboard → Logs → SQL Editor
- 查询 vip_orders 表的 created_at 字段
- 如需详细日志，可创建专门的操作日志表

---

## 📚 相关文档

- [VIP_ACTIVATION_SECURITY.md](VIP_ACTIVATION_SECURITY.md) - 完整的安全方案文档
- [VIP_MANAGEMENT.md](VIP_MANAGEMENT.md) - 管理员操作指南
- [VIP_SETUP_GUIDE.md](VIP_SETUP_GUIDE.md) - 配置和部署指南
- [VIP_TODO.md](../../VIP_TODO.md) - 任务清单和使用说明

---

## 🎯 推荐工作流程

### 日常开通流程

1. **收到用户支付信息**
   - 用户手机号/邮箱
   - 支付凭证截图
   - 购买套餐（季度/年度）

2. **验证支付信息**
   - 核对支付金额
   - 确认支付凭证真实性
   - 记录交易流水号

3. **查询用户ID**
   ```sql
   SELECT id FROM auth.users WHERE phone = '+8613800138000';
   ```

4. **开通会员**
   - 使用 SQL Editor 或管理工具
   - 记录订单信息
   - 确认开通成功

5. **通知用户**
   - 会员已开通
   - 到期时间
   - 享受的权益

### 批量开通流程

1. **准备用户列表**
   - 整理用户手机号/邮箱
   - 确认支付信息
   - 统计会员时长

2. **批量查询用户ID**
   ```sql
   SELECT id, phone FROM auth.users 
   WHERE phone IN ('手机号1', '手机号2', '手机号3');
   ```

3. **批量开通**
   ```sql
   INSERT INTO user_vip (user_id, is_vip, vip_start_date, vip_end_date)
   SELECT id, TRUE, NOW(), NOW() + INTERVAL '3 months'
   FROM auth.users
   WHERE phone IN ('手机号1', '手机号2', '手机号3')
   ON CONFLICT (user_id) DO UPDATE SET ...;
   ```

4. **批量通知**
   - 发送开通成功通知
   - 提供客服联系方式

---

**最后更新时间**：2025-01-20
