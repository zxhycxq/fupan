-- 设置15538838360为VIP用户
-- 执行此脚本前，请确保该用户已注册

-- 1. 查找用户ID
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- 查找手机号为15538838360的用户
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE phone = '15538838360'
  LIMIT 1;

  -- 如果找到用户，则设置为VIP
  IF target_user_id IS NOT NULL THEN
    -- 删除该用户的旧VIP记录（如果存在）
    DELETE FROM vip_memberships WHERE user_id = target_user_id;
    
    -- 插入新的VIP记录（有效期1年）
    INSERT INTO vip_memberships (
      user_id,
      start_date,
      end_date,
      is_active
    ) VALUES (
      target_user_id,
      NOW(),
      NOW() + INTERVAL '1 year',
      true
    );
    
    RAISE NOTICE '成功设置用户 15538838360 为VIP会员，有效期至 %', NOW() + INTERVAL '1 year';
  ELSE
    RAISE NOTICE '未找到手机号为 15538838360 的用户，请先注册';
  END IF;
END $$;

-- 2. 验证VIP状态
SELECT 
  u.phone,
  u.email,
  vm.start_date,
  vm.end_date,
  vm.is_active,
  CASE 
    WHEN vm.is_active AND vm.end_date > NOW() THEN 'VIP会员'
    ELSE '免费用户'
  END as status
FROM auth.users u
LEFT JOIN vip_memberships vm ON u.id = vm.user_id
WHERE u.phone = '15538838360';

-- 3. 如果需要取消VIP（测试用）
-- DELETE FROM vip_memberships WHERE user_id IN (
--   SELECT id FROM auth.users WHERE phone = '15538838360'
-- );
