-- VIP 功能测试账户创建脚本
-- 注意：此脚本仅用于测试，不会影响现有用户数据

-- ============================================
-- 测试账户信息
-- ============================================
-- 免费用户测试账号：
--   邮箱：test_free@example.com
--   密码：Test123456!
--
-- VIP用户测试账号：
--   邮箱：test_vip@example.com
--   密码：Test123456!
-- ============================================

-- 1. 创建免费用户测试账号
-- 注意：需要在 Supabase Auth 中手动创建，或使用注册功能
-- 这里只是记录账号信息，实际创建需要通过 Auth API

-- 2. 创建VIP用户测试账号
-- 注意：需要在 Supabase Auth 中手动创建，或使用注册功能

-- ============================================
-- 为测试VIP账号开通VIP（季度）
-- ============================================
-- 使用方法：
-- 1. 先在 Supabase Auth 中创建用户 test_vip@example.com
-- 2. 获取该用户的 UUID
-- 3. 执行以下SQL（替换 YOUR_VIP_USER_ID）

-- 示例：开通季度VIP（3个月）
-- SELECT admin_activate_vip(
--   'YOUR_VIP_USER_ID'::UUID,
--   3
-- );

-- 示例：开通年度VIP（12个月）
-- SELECT admin_activate_vip(
--   'YOUR_VIP_USER_ID'::UUID,
--   12
-- );

-- ============================================
-- 查询测试账号信息
-- ============================================

-- 查询所有测试账号
SELECT 
  u.id,
  u.email,
  u.created_at,
  CASE 
    WHEN uv.is_vip THEN 'VIP'
    ELSE '免费用户'
  END as user_type,
  uv.vip_type,
  uv.vip_start_date,
  uv.vip_end_date,
  EXTRACT(DAY FROM (uv.vip_end_date - NOW()))::INTEGER as days_remaining
FROM auth.users u
LEFT JOIN user_vip uv ON u.id = uv.user_id
WHERE u.email LIKE 'test_%@example.com'
ORDER BY u.created_at DESC;

-- ============================================
-- 为测试账号创建考试记录
-- ============================================

-- 为免费用户创建2条测试记录（用于测试3条限制）
-- 注意：需要替换 YOUR_FREE_USER_ID
/*
INSERT INTO exam_records (
  user_id,
  exam_name,
  exam_type,
  total_score,
  time_used,
  exam_date,
  include_in_stats
) VALUES
  (
    'YOUR_FREE_USER_ID'::UUID,
    '测试考试记录1',
    '国考模考',
    75.5,
    7200,
    CURRENT_DATE - INTERVAL '7 days',
    true
  ),
  (
    'YOUR_FREE_USER_ID'::UUID,
    '测试考试记录2',
    '省考模考',
    82.0,
    6800,
    CURRENT_DATE - INTERVAL '3 days',
    true
  );
*/

-- 为VIP用户创建5条测试记录（用于测试无限制）
-- 注意：需要替换 YOUR_VIP_USER_ID
/*
INSERT INTO exam_records (
  user_id,
  exam_name,
  exam_type,
  total_score,
  time_used,
  exam_date,
  include_in_stats
) VALUES
  (
    'YOUR_VIP_USER_ID'::UUID,
    'VIP测试考试记录1',
    '国考模考',
    85.5,
    7200,
    CURRENT_DATE - INTERVAL '10 days',
    true
  ),
  (
    'YOUR_VIP_USER_ID'::UUID,
    'VIP测试考试记录2',
    '省考模考',
    88.0,
    6800,
    CURRENT_DATE - INTERVAL '7 days',
    true
  ),
  (
    'YOUR_VIP_USER_ID'::UUID,
    'VIP测试考试记录3',
    '事业单位',
    90.5,
    7500,
    CURRENT_DATE - INTERVAL '5 days',
    true
  ),
  (
    'YOUR_VIP_USER_ID'::UUID,
    'VIP测试考试记录4',
    '国考模考',
    87.0,
    7000,
    CURRENT_DATE - INTERVAL '3 days',
    true
  ),
  (
    'YOUR_VIP_USER_ID'::UUID,
    'VIP测试考试记录5',
    '省考模考',
    92.5,
    6500,
    CURRENT_DATE - INTERVAL '1 day',
    true
  );
*/

-- ============================================
-- 查询测试账号的考试记录数量
-- ============================================

-- 查询所有测试账号的记录数
SELECT 
  u.email,
  COUNT(er.id) as record_count,
  CASE 
    WHEN uv.is_vip THEN 'VIP（无限制）'
    ELSE CONCAT('免费用户（', COUNT(er.id), '/3）')
  END as status
FROM auth.users u
LEFT JOIN user_vip uv ON u.id = uv.user_id
LEFT JOIN exam_records er ON u.id = er.user_id
WHERE u.email LIKE 'test_%@example.com'
GROUP BY u.id, u.email, uv.is_vip
ORDER BY u.email;

-- ============================================
-- 清理测试数据（谨慎使用）
-- ============================================

-- 删除测试账号的考试记录
-- 注意：这会删除所有测试账号的考试记录
/*
DELETE FROM exam_records
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test_%@example.com'
);
*/

-- 删除测试账号的VIP记录
-- 注意：这会删除所有测试账号的VIP状态
/*
DELETE FROM user_vip
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test_%@example.com'
);
*/

-- 删除测试账号
-- 注意：这需要在 Supabase Dashboard 的 Auth 页面手动删除
-- 或使用 Supabase Admin API

-- ============================================
-- 快速测试脚本
-- ============================================

-- 1. 检查VIP功能是否正常
SELECT 
  u.email,
  uv.is_vip,
  uv.vip_type,
  uv.vip_end_date,
  CASE 
    WHEN uv.is_vip AND uv.vip_end_date > NOW() THEN '✅ VIP有效'
    WHEN uv.is_vip AND uv.vip_end_date <= NOW() THEN '❌ VIP已过期'
    ELSE '⚪ 免费用户'
  END as vip_status
FROM auth.users u
LEFT JOIN user_vip uv ON u.id = uv.user_id
WHERE u.email LIKE 'test_%@example.com';

-- 2. 检查考试记录限制
SELECT 
  u.email,
  COUNT(er.id) as current_records,
  CASE 
    WHEN uv.is_vip THEN '∞'
    ELSE '3'
  END as max_records,
  CASE 
    WHEN uv.is_vip THEN '✅ 可以创建'
    WHEN COUNT(er.id) < 3 THEN '✅ 可以创建'
    ELSE '❌ 已达上限'
  END as can_create
FROM auth.users u
LEFT JOIN user_vip uv ON u.id = uv.user_id
LEFT JOIN exam_records er ON u.id = er.user_id
WHERE u.email LIKE 'test_%@example.com'
GROUP BY u.id, u.email, uv.is_vip;

-- ============================================
-- 测试账号创建步骤（手动操作）
-- ============================================

/*
步骤1：在 Supabase Dashboard 创建测试账号
1. 进入 Supabase Dashboard
2. 点击 Authentication -> Users
3. 点击 "Add user" 按钮
4. 创建两个账号：
   - test_free@example.com (密码: Test123456!)
   - test_vip@example.com (密码: Test123456!)

步骤2：为VIP测试账号开通VIP
1. 复制 test_vip@example.com 的 UUID
2. 在 SQL Editor 执行：
   SELECT admin_activate_vip('YOUR_VIP_USER_ID'::UUID, 3);

步骤3：为免费账号创建2条测试记录
1. 复制 test_free@example.com 的 UUID
2. 取消注释上面的 INSERT 语句并替换 YOUR_FREE_USER_ID
3. 执行 INSERT 语句

步骤4：验证测试账号
1. 执行上面的"快速测试脚本"
2. 确认VIP状态和记录数正确

步骤5：登录测试
1. 使用 test_free@example.com 登录，测试免费用户功能
2. 使用 test_vip@example.com 登录，测试VIP用户功能
*/
