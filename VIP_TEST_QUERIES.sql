-- VIP 功能测试 SQL 脚本
-- 用于在 Supabase SQL Editor 中测试 VIP 功能

-- ============================================
-- 1. 检查 vip_type 字段是否添加成功
-- ============================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_vip' 
  AND column_name = 'vip_type';

-- 预期结果：应该看到 vip_type 字段，类型为 text


-- ============================================
-- 2. 查看当前所有VIP用户
-- ============================================
SELECT 
  user_id,
  is_vip,
  vip_type,
  vip_start_date,
  vip_end_date,
  CASE 
    WHEN vip_end_date IS NULL THEN NULL
    WHEN vip_end_date < NOW() THEN 0
    ELSE EXTRACT(DAY FROM (vip_end_date - NOW()))::INTEGER
  END as days_remaining
FROM user_vip
WHERE is_vip = TRUE
ORDER BY vip_end_date DESC;


-- ============================================
-- 3. 测试开通季度VIP（替换 YOUR_USER_ID）
-- ============================================
-- 注意：将 'YOUR_USER_ID' 替换为实际的用户ID
/*
SELECT admin_activate_vip(
  'YOUR_USER_ID'::UUID,
  3  -- 3个月季度会员
);
*/


-- ============================================
-- 4. 测试开通年度VIP（替换 YOUR_USER_ID）
-- ============================================
-- 注意：将 'YOUR_USER_ID' 替换为实际的用户ID
/*
SELECT admin_activate_vip(
  'YOUR_USER_ID'::UUID,
  12  -- 12个月年度会员
);
*/


-- ============================================
-- 5. 测试续费VIP（替换 YOUR_USER_ID）
-- ============================================
-- 注意：将 'YOUR_USER_ID' 替换为实际的用户ID
/*
SELECT admin_renew_vip(
  'YOUR_USER_ID'::UUID,
  3  -- 续费3个月
);
*/


-- ============================================
-- 6. 查看特定用户的VIP状态（替换 YOUR_USER_ID）
-- ============================================
-- 注意：将 'YOUR_USER_ID' 替换为实际的用户ID
/*
SELECT 
  user_id,
  is_vip,
  vip_type,
  TO_CHAR(vip_start_date, 'YYYY-MM-DD HH24:MI:SS') as start_date,
  TO_CHAR(vip_end_date, 'YYYY-MM-DD HH24:MI:SS') as end_date,
  CASE 
    WHEN vip_end_date IS NULL THEN NULL
    WHEN vip_end_date < NOW() THEN 0
    ELSE EXTRACT(DAY FROM (vip_end_date - NOW()))::INTEGER
  END as days_remaining,
  CASE 
    WHEN vip_end_date IS NULL THEN FALSE
    WHEN vip_end_date < NOW() THEN TRUE
    ELSE FALSE
  END as is_expired
FROM user_vip
WHERE user_id = 'YOUR_USER_ID'::UUID;
*/


-- ============================================
-- 7. 查看特定用户的考试记录数量（替换 YOUR_USER_ID）
-- ============================================
-- 注意：将 'YOUR_USER_ID' 替换为实际的用户ID
/*
SELECT 
  user_id,
  COUNT(*) as record_count,
  CASE 
    WHEN (SELECT is_vip FROM user_vip WHERE user_id = 'YOUR_USER_ID'::UUID) THEN '无限制'
    WHEN COUNT(*) >= 3 THEN '已达上限'
    ELSE CONCAT(COUNT(*), '/3')
  END as status
FROM exam_records
WHERE user_id = 'YOUR_USER_ID'::UUID
GROUP BY user_id;
*/


-- ============================================
-- 8. 手动设置VIP类型（如果之前开通的VIP没有类型）
-- ============================================
-- 注意：将 'YOUR_USER_ID' 替换为实际的用户ID
/*
UPDATE user_vip
SET vip_type = 'quarter'  -- 或 'year'
WHERE user_id = 'YOUR_USER_ID'::UUID
  AND is_vip = TRUE
  AND vip_type IS NULL;
*/


-- ============================================
-- 9. 手动取消VIP（用于测试）
-- ============================================
-- 注意：将 'YOUR_USER_ID' 替换为实际的用户ID
/*
UPDATE user_vip
SET 
  is_vip = FALSE,
  vip_type = NULL,
  vip_end_date = NOW()
WHERE user_id = 'YOUR_USER_ID'::UUID;
*/


-- ============================================
-- 10. 查看所有用户的VIP和记录统计
-- ============================================
SELECT 
  uv.user_id,
  uv.is_vip,
  uv.vip_type,
  COUNT(er.id) as record_count,
  CASE 
    WHEN uv.is_vip THEN '无限制'
    WHEN COUNT(er.id) >= 3 THEN '已达上限'
    ELSE CONCAT(COUNT(er.id), '/3')
  END as status,
  CASE 
    WHEN uv.vip_end_date IS NULL THEN NULL
    WHEN uv.vip_end_date < NOW() THEN 0
    ELSE EXTRACT(DAY FROM (uv.vip_end_date - NOW()))::INTEGER
  END as days_remaining
FROM user_vip uv
LEFT JOIN exam_records er ON uv.user_id = er.user_id
GROUP BY uv.user_id, uv.is_vip, uv.vip_type, uv.vip_end_date
ORDER BY uv.is_vip DESC, record_count DESC;


-- ============================================
-- 测试说明
-- ============================================
/*
1. 首先运行查询1，确认 vip_type 字段已添加
2. 运行查询2，查看当前所有VIP用户
3. 使用查询3或4开通测试VIP（记得替换 YOUR_USER_ID）
4. 使用查询6查看VIP状态是否正确
5. 使用查询7查看考试记录数量
6. 使用查询10查看所有用户的统计信息

注意事项：
- 所有包含 YOUR_USER_ID 的查询都需要替换为实际的用户ID
- 可以在 auth.users 表中查找用户ID
- 测试完成后可以使用查询9取消VIP
*/


-- ============================================
-- 获取当前登录用户的ID（在前端使用）
-- ============================================
-- 在前端代码中使用：
-- const { data: { user } } = await supabase.auth.getUser()
-- const userId = user?.id
