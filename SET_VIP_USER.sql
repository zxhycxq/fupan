-- 设置15538838360为VIP用户
-- 执行此脚本前，请确保该用户已注册
-- 注意：实际手机号在数据库中是 8615538838360（带国家码）

-- 1. 设置VIP用户
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- 查找手机号为8615538838360的用户
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE phone = '8615538838360'
  LIMIT 1;

  -- 如果找到用户，则设置为VIP
  IF target_user_id IS NOT NULL THEN
    -- 删除该用户的旧VIP记录（如果存在）
    DELETE FROM user_vip WHERE user_id = target_user_id;
    
    -- 插入新的VIP记录（有效期1年）
    INSERT INTO user_vip (
      user_id,
      is_vip,
      vip_start_date,
      vip_end_date
    ) VALUES (
      target_user_id,
      true,
      NOW(),
      NOW() + INTERVAL '1 year'
    );
    
    RAISE NOTICE '成功设置用户 8615538838360 为VIP会员，有效期至 %', NOW() + INTERVAL '1 year';
  ELSE
    RAISE NOTICE '未找到手机号为 8615538838360 的用户，请先注册';
  END IF;
END $$;

-- 2. 验证VIP状态
SELECT 
  u.phone,
  u.email,
  uv.is_vip,
  uv.vip_start_date,
  uv.vip_end_date,
  CASE 
    WHEN uv.is_vip AND uv.vip_end_date > NOW() THEN 'VIP会员'
    ELSE '免费用户'
  END as status
FROM auth.users u
LEFT JOIN user_vip uv ON u.id = uv.user_id
WHERE u.phone = '8615538838360';

-- 3. 如果需要取消VIP（测试用）
-- DELETE FROM user_vip WHERE user_id IN (
--   SELECT id FROM auth.users WHERE phone = '8615538838360'
-- );
