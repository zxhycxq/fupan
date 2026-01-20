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
  -- 验证参数
  IF p_user_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', '用户ID不能为空'
    );
  END IF;

  IF p_duration_months NOT IN (3, 12) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', '会员时长只能是3或12个月'
    );
  END IF;

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
    'order_no', v_order_no,
    'duration_months', p_duration_months
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

-- 创建续费会员的 RPC 函数
CREATE OR REPLACE FUNCTION admin_renew_vip(
  p_user_id UUID,
  p_duration_months INTEGER,
  p_amount DECIMAL(10,2) DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'manual',
  p_transaction_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_end_date TIMESTAMPTZ;
  v_new_end_date TIMESTAMPTZ;
  v_order_no TEXT;
  v_result JSON;
BEGIN
  -- 验证参数
  IF p_user_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', '用户ID不能为空'
    );
  END IF;

  IF p_duration_months NOT IN (3, 12) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', '会员时长只能是3或12个月'
    );
  END IF;

  -- 获取当前到期时间
  SELECT vip_end_date INTO v_current_end_date
  FROM user_vip
  WHERE user_id = p_user_id;

  -- 计算新的到期时间（从当前到期时间或现在，取较大值）
  v_new_end_date := GREATEST(COALESCE(v_current_end_date, NOW()), NOW()) + (p_duration_months || ' months')::INTERVAL;
  
  -- 生成订单号
  v_order_no := 'VIP' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || SUBSTRING(MD5(RANDOM()::TEXT), 1, 6);
  
  -- 续费会员
  UPDATE user_vip 
  SET 
    is_vip = TRUE,
    vip_end_date = v_new_end_date,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 如果用户不存在，则创建
  IF NOT FOUND THEN
    INSERT INTO user_vip (user_id, is_vip, vip_start_date, vip_end_date)
    VALUES (p_user_id, TRUE, NOW(), v_new_end_date);
  END IF;
  
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
    v_new_end_date
  );
  
  -- 返回结果
  v_result := json_build_object(
    'success', TRUE,
    'user_id', p_user_id,
    'vip_end_date', v_new_end_date,
    'order_no', v_order_no,
    'duration_months', p_duration_months
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
COMMENT ON FUNCTION admin_renew_vip IS '管理员续费会员功能（需要 service_role 权限）';