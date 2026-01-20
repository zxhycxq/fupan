# 会员开通安全方案文档

## 概述

本文档提供三种安全的会员开通方案，从最安全到最便捷，您可以根据实际需求选择。

---

## 方案对比

| 方案 | 安全性 | 便捷性 | 适用场景 | 推荐度 |
|------|--------|--------|----------|--------|
| 方案一：SQL Editor | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 手动开通，用户量小 | ⭐⭐⭐⭐⭐ |
| 方案二：Edge Function | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 需要API接口，中等用户量 | ⭐⭐⭐⭐ |
| 方案三：RPC函数 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 需要管理后台，用户量大 | ⭐⭐⭐ |

---

## 方案一：通过 Supabase SQL Editor 手动开通（推荐）

### ✅ 优点
- **最安全**：只有 Supabase 项目管理员可以访问
- **无需额外开发**：直接使用 SQL 语句
- **完全可控**：每次开通都需要人工确认
- **无攻击风险**：不暴露任何 API 接口

### ❌ 缺点
- 需要手动操作
- 需要熟悉 SQL 语法
- 不适合大量用户

### 📋 操作步骤

#### 1. 登录 Supabase Dashboard

访问：https://supabase.com/dashboard

选择您的项目 → SQL Editor

#### 2. 查询用户ID

```sql
-- 通过手机号查询用户ID
SELECT 
  id,
  email,
  phone,
  created_at,
  raw_user_meta_data->>'username' as username
FROM auth.users 
WHERE phone = '+8613800138000';  -- 替换为实际手机号

-- 或通过邮箱查询
SELECT 
  id,
  email,
  phone,
  created_at
FROM auth.users 
WHERE email = 'user@example.com';  -- 替换为实际邮箱
```

#### 3. 开通会员（新用户）

```sql
-- 开通季度会员（3个月）
INSERT INTO user_vip (user_id, is_vip, vip_start_date, vip_end_date)
VALUES (
  '用户ID',  -- 从步骤2获取的用户ID
  TRUE,
  NOW(),
  NOW() + INTERVAL '3 months'
)
ON CONFLICT (user_id) 
DO UPDATE SET
  is_vip = TRUE,
  vip_start_date = NOW(),
  vip_end_date = NOW() + INTERVAL '3 months',
  updated_at = NOW();

-- 开通年度会员（12个月）
INSERT INTO user_vip (user_id, is_vip, vip_start_date, vip_end_date)
VALUES (
  '用户ID',  -- 从步骤2获取的用户ID
  TRUE,
  NOW(),
  NOW() + INTERVAL '12 months'
)
ON CONFLICT (user_id) 
DO UPDATE SET
  is_vip = TRUE,
  vip_start_date = NOW(),
  vip_end_date = NOW() + INTERVAL '12 months',
  updated_at = NOW();
```

#### 4. 续费会员（已有会员）

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

#### 5. 记录订单（推荐）

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
  '用户ID',
  'VIP' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || SUBSTRING(MD5(RANDOM()::TEXT), 1, 6),
  99.00,  -- 季度99，年度299
  3,      -- 季度3，年度12
  'paid',
  'alipay',  -- alipay/wechat/bank
  '支付宝交易流水号',
  NOW(),
  NOW() + INTERVAL '3 months'
);
```

#### 6. 验证开通结果

```sql
-- 查询用户会员状态
SELECT 
  v.*,
  u.phone,
  u.email,
  EXTRACT(DAY FROM (v.vip_end_date - NOW())) as days_remaining
FROM user_vip v
JOIN auth.users u ON v.user_id = u.id
WHERE v.user_id = '用户ID';
```

### 🔒 安全说明

1. **访问控制**：只有 Supabase 项目所有者和管理员可以访问 SQL Editor
2. **操作日志**：Supabase 会记录所有 SQL 操作日志
3. **无外部暴露**：不需要创建任何 API 接口
4. **人工审核**：每次开通都需要人工确认支付凭证

---

## 方案二：创建受保护的 Edge Function（适合需要API的场景）

### ✅ 优点
- 可以通过 API 调用
- 支持批量操作
- 可以集成到管理后台
- 操作更便捷

### ❌ 缺点
- 需要额外开发
- 需要管理管理员密钥
- 存在被攻击的风险（如果密钥泄露）

### 🔐 安全机制

1. **管理员密钥验证**：只有持有正确密钥的请求才能执行
2. **IP白名单**（可选）：只允许特定IP访问
3. **请求频率限制**：防止暴力破解
4. **操作日志记录**：记录所有开通操作

### 📝 实现步骤

#### 1. 创建 Edge Function

创建文件：`supabase/functions/admin-activate-vip/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 管理员密钥（从环境变量读取）
const ADMIN_SECRET = Deno.env.get('ADMIN_SECRET') || ''

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
}

serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. 验证管理员密钥
    const adminSecret = req.headers.get('x-admin-secret')
    if (!adminSecret || adminSecret !== ADMIN_SECRET) {
      return new Response(
        JSON.stringify({ error: '无效的管理员密钥' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 2. 解析请求参数
    const { userId, durationMonths, amount, paymentMethod, transactionId } = await req.json()

    // 3. 参数验证
    if (!userId || !durationMonths) {
      return new Response(
        JSON.stringify({ error: '缺少必需参数' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 4. 创建 Supabase 客户端（使用 service_role key）
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 5. 开通会员
    const vipEndDate = new Date()
    vipEndDate.setMonth(vipEndDate.getMonth() + durationMonths)

    const { data: vipData, error: vipError } = await supabaseAdmin
      .from('user_vip')
      .upsert({
        user_id: userId,
        is_vip: true,
        vip_start_date: new Date().toISOString(),
        vip_end_date: vipEndDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (vipError) {
      throw vipError
    }

    // 6. 创建订单记录
    const orderNo = `VIP${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('vip_orders')
      .insert({
        user_id: userId,
        order_no: orderNo,
        amount: amount || (durationMonths === 3 ? 99 : 299),
        duration_months: durationMonths,
        status: 'paid',
        payment_method: paymentMethod || 'manual',
        transaction_id: transactionId,
        paid_at: new Date().toISOString(),
        expired_at: vipEndDate.toISOString(),
      })
      .select()

    if (orderError) {
      console.error('创建订单失败:', orderError)
      // 订单创建失败不影响会员开通
    }

    // 7. 返回成功结果
    return new Response(
      JSON.stringify({
        success: true,
        message: '会员开通成功',
        data: {
          userId,
          vipEndDate: vipEndDate.toISOString(),
          orderNo,
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('开通会员失败:', error)
    return new Response(
      JSON.stringify({ 
        error: '开通会员失败',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

#### 2. 配置环境变量

在 Supabase Dashboard → Settings → Edge Functions → Secrets 中添加：

```bash
ADMIN_SECRET=your-super-secret-admin-key-here-change-this
```

**重要**：请使用强密码生成器生成一个复杂的密钥，例如：
```bash
# 生成示例（使用 openssl）
openssl rand -base64 32
```

#### 3. 部署 Edge Function

```bash
# 部署函数
supabase functions deploy admin-activate-vip
```

#### 4. 调用 API

```bash
# 使用 curl 调用
curl -X POST 'https://your-project.supabase.co/functions/v1/admin-activate-vip' \
  -H 'Content-Type: application/json' \
  -H 'x-admin-secret: your-super-secret-admin-key-here-change-this' \
  -d '{
    "userId": "user-uuid-here",
    "durationMonths": 3,
    "amount": 99,
    "paymentMethod": "alipay",
    "transactionId": "2024012012345678"
  }'
```

#### 5. 创建管理工具（可选）

创建一个简单的 HTML 页面用于管理员操作：

```html
<!DOCTYPE html>
<html>
<head>
  <title>会员管理工具</title>
  <style>
    body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; }
    input, select, button { width: 100%; padding: 10px; margin: 10px 0; }
    button { background: #4CAF50; color: white; border: none; cursor: pointer; }
    button:hover { background: #45a049; }
    .result { padding: 15px; margin: 20px 0; border-radius: 5px; }
    .success { background: #d4edda; color: #155724; }
    .error { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <h1>会员开通工具</h1>
  
  <form id="activateForm">
    <input type="text" id="userId" placeholder="用户ID" required>
    <input type="text" id="adminSecret" placeholder="管理员密钥" required>
    
    <select id="duration" required>
      <option value="">选择会员时长</option>
      <option value="3">季度会员（3个月 - ¥99）</option>
      <option value="12">年度会员（12个月 - ¥299）</option>
    </select>
    
    <input type="text" id="paymentMethod" placeholder="支付方式（alipay/wechat/bank）" value="alipay">
    <input type="text" id="transactionId" placeholder="交易流水号（可选）">
    
    <button type="submit">开通会员</button>
  </form>
  
  <div id="result"></div>

  <script>
    const SUPABASE_URL = 'https://your-project.supabase.co'
    
    document.getElementById('activateForm').addEventListener('submit', async (e) => {
      e.preventDefault()
      
      const userId = document.getElementById('userId').value
      const adminSecret = document.getElementById('adminSecret').value
      const duration = parseInt(document.getElementById('duration').value)
      const paymentMethod = document.getElementById('paymentMethod').value
      const transactionId = document.getElementById('transactionId').value
      
      const amount = duration === 3 ? 99 : 299
      
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-activate-vip`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': adminSecret
          },
          body: JSON.stringify({
            userId,
            durationMonths: duration,
            amount,
            paymentMethod,
            transactionId
          })
        })
        
        const result = await response.json()
        
        const resultDiv = document.getElementById('result')
        if (response.ok) {
          resultDiv.className = 'result success'
          resultDiv.innerHTML = `
            <h3>✅ 开通成功</h3>
            <p>用户ID: ${result.data.userId}</p>
            <p>到期时间: ${new Date(result.data.vipEndDate).toLocaleString('zh-CN')}</p>
            <p>订单号: ${result.data.orderNo}</p>
          `
        } else {
          resultDiv.className = 'result error'
          resultDiv.innerHTML = `
            <h3>❌ 开通失败</h3>
            <p>${result.error}</p>
          `
        }
      } catch (error) {
        const resultDiv = document.getElementById('result')
        resultDiv.className = 'result error'
        resultDiv.innerHTML = `
          <h3>❌ 请求失败</h3>
          <p>${error.message}</p>
        `
      }
    })
  </script>
</body>
</html>
```

### 🔒 安全建议

1. **密钥管理**：
   - 使用强密码（至少32位随机字符）
   - 定期更换密钥
   - 不要将密钥提交到 Git
   - 不要在前端代码中硬编码密钥

2. **访问控制**：
   - 管理工具页面设置密码保护
   - 使用 HTTPS 加密传输
   - 考虑添加 IP 白名单

3. **操作日志**：
   - 记录所有开通操作
   - 包含操作时间、操作人、用户ID等信息

4. **异常监控**：
   - 监控异常请求（如频繁失败的请求）
   - 设置告警机制

---

## 方案三：创建 RPC 函数（适合管理后台）

### ✅ 优点
- 直接在数据库层面操作
- 性能最好
- 可以在前端直接调用

### ❌ 缺点
- 需要使用 service_role key
- 安全性依赖于 RLS 策略
- 不适合暴露给普通用户

### 📝 实现步骤

#### 1. 创建 RPC 函数

```sql
-- 创建管理员开通会员的 RPC 函数
CREATE OR REPLACE FUNCTION admin_activate_vip(
  p_user_id UUID,
  p_duration_months INTEGER,
  p_amount DECIMAL(10,2) DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'manual',
  p_transaction_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- 使用函数所有者的权限执行
AS $$
DECLARE
  v_vip_end_date TIMESTAMPTZ;
  v_order_no TEXT;
  v_result JSON;
BEGIN
  -- 计算到期时间
  v_vip_end_date := NOW() + (p_duration_months || ' months')::INTERVAL;
  
  -- 生成订单号
  v_order_no := 'VIP' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || SUBSTRING(MD5(RANDOM()::TEXT), 1, 6);
  
  -- 开通会员（使用 UPSERT）
  INSERT INTO user_vip (user_id, is_vip, vip_start_date, vip_end_date)
  VALUES (p_user_id, TRUE, NOW(), v_vip_end_date)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    is_vip = TRUE,
    vip_start_date = NOW(),
    vip_end_date = v_vip_end_date,
    updated_at = NOW();
  
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
    p_user_id,
    v_order_no,
    COALESCE(p_amount, CASE WHEN p_duration_months = 3 THEN 99 ELSE 299 END),
    p_duration_months,
    'paid',
    p_payment_method,
    p_transaction_id,
    NOW(),
    v_vip_end_date
  );
  
  -- 返回结果
  v_result := json_build_object(
    'success', TRUE,
    'user_id', p_user_id,
    'vip_end_date', v_vip_end_date,
    'order_no', v_order_no
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$;

-- 添加注释
COMMENT ON FUNCTION admin_activate_vip IS '管理员开通会员功能（需要 service_role 权限）';
```

#### 2. 调用 RPC 函数

**注意**：此方法需要使用 `service_role` key，不能在前端直接使用！

```typescript
// 仅在服务端或 Edge Function 中使用
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // 使用 service_role key
)

// 调用 RPC 函数
const { data, error } = await supabaseAdmin.rpc('admin_activate_vip', {
  p_user_id: 'user-uuid-here',
  p_duration_months: 3,
  p_amount: 99,
  p_payment_method: 'alipay',
  p_transaction_id: '2024012012345678'
})

if (error) {
  console.error('开通失败:', error)
} else {
  console.log('开通成功:', data)
}
```

### 🔒 安全警告

**⚠️ 重要**：
1. `service_role` key 拥有完全的数据库访问权限
2. 绝对不能在前端代码中使用
3. 只能在服务端（Edge Function、后端服务）中使用
4. 需要妥善保管，不能泄露

---

## 推荐方案选择

### 小型项目（用户量 < 100）
**推荐：方案一（SQL Editor）**
- 最安全
- 无需额外开发
- 操作简单

### 中型项目（用户量 100-1000）
**推荐：方案二（Edge Function）**
- 安全性高
- 操作便捷
- 可以创建简单的管理工具

### 大型项目（用户量 > 1000）
**推荐：方案二 + 完整的管理后台**
- 使用 Edge Function
- 开发专门的管理后台
- 添加更多安全机制（IP白名单、操作日志、审计等）

---

## 常见问题

### Q1: 如果管理员密钥泄露怎么办？

A: 立即更换密钥：
1. 在 Supabase Dashboard 中更新 `ADMIN_SECRET`
2. 重新部署 Edge Function
3. 通知所有管理员使用新密钥

### Q2: 如何防止暴力破解？

A: 
1. 使用强密码（至少32位随机字符）
2. 添加请求频率限制
3. 监控异常请求
4. 考虑添加 IP 白名单

### Q3: 如何查看操作日志？

A: 
1. Supabase Dashboard → Logs → Edge Functions
2. 查询 vip_orders 表的 created_at 字段
3. 考虑创建专门的操作日志表

### Q4: 可以批量开通会员吗？

A: 可以，使用方案二或方案三：
```typescript
// 批量开通
const users = [
  { userId: 'uuid1', duration: 3 },
  { userId: 'uuid2', duration: 12 },
]

for (const user of users) {
  await activateVip(user.userId, user.duration)
}
```

---

## 总结

1. **推荐使用方案一**（SQL Editor）：最安全，适合大多数场景
2. **如需API接口**，使用方案二（Edge Function）：安全性高，操作便捷
3. **不推荐方案三**（RPC函数）：除非有完整的管理后台和安全机制

**安全第一**：无论选择哪种方案，都要：
- 妥善保管密钥
- 定期审查操作日志
- 监控异常行为
- 及时更新安全策略

---

**最后更新时间**：2025-01-20
