
-- 添加 username 唯一性约束
ALTER TABLE profiles
ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- 创建昵称黑名单检查函数
CREATE OR REPLACE FUNCTION is_username_blacklisted(username_input text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  blacklist text[] := ARRAY[
    'admin', 'root', 'user', 'test', 'guest', 'system', 'administrator',
    'superuser', 'moderator', 'mod', 'owner', 'support', 'help',
    '123456', '111111', '000000', 'password', 'qwerty', 'abc123',
    'default', 'null', 'undefined', 'anonymous', 'unknown'
  ];
BEGIN
  RETURN LOWER(username_input) = ANY(blacklist);
END;
$$;

-- 创建昵称格式验证函数
CREATE OR REPLACE FUNCTION is_username_valid_format(username_input text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- 检查长度（3-20位）
  IF LENGTH(username_input) < 3 OR LENGTH(username_input) > 20 THEN
    RETURN FALSE;
  END IF;
  
  -- 检查字符（只允许字母、数字、下划线）
  IF username_input !~ '^[a-zA-Z0-9_]+$' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 创建昵称可用性检查函数（综合检查）
CREATE OR REPLACE FUNCTION check_username_availability(
  username_input text,
  current_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
  is_taken boolean;
BEGIN
  -- 检查格式
  IF NOT is_username_valid_format(username_input) THEN
    result := jsonb_build_object(
      'available', false,
      'reason', 'invalid_format',
      'message', '用户名只能包含字母、数字和下划线，长度为3-20位'
    );
    RETURN result;
  END IF;
  
  -- 检查黑名单
  IF is_username_blacklisted(username_input) THEN
    result := jsonb_build_object(
      'available', false,
      'reason', 'blacklisted',
      'message', '该用户名不可用，请选择其他用户名'
    );
    RETURN result;
  END IF;
  
  -- 检查是否已被占用（排除当前用户）
  IF current_user_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM profiles 
      WHERE username = username_input 
      AND id != current_user_id
    ) INTO is_taken;
  ELSE
    SELECT EXISTS(
      SELECT 1 FROM profiles 
      WHERE username = username_input
    ) INTO is_taken;
  END IF;
  
  IF is_taken THEN
    result := jsonb_build_object(
      'available', false,
      'reason', 'taken',
      'message', '该用户名已被占用'
    );
    RETURN result;
  END IF;
  
  -- 用户名可用
  result := jsonb_build_object(
    'available', true,
    'reason', 'available',
    'message', '该用户名可用'
  );
  RETURN result;
END;
$$;
