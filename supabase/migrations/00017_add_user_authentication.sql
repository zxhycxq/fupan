-- 创建用户资料表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE,
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 auth.uid() 函数（如果不存在）
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )::uuid;
$$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 创建触发器函数：当用户验证手机号后自动创建 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- 插入用户资料，同步手机号
  INSERT INTO public.profiles (id, phone)
  VALUES (
    NEW.id,
    NEW.phone
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 创建触发器：仅在 confirmed_at 从 NULL 变为 NOT NULL 时触发
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户可以查看和更新自己的资料
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
TO authenticated 
USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING ((SELECT auth.uid()) = id);

-- 为现有表添加 user_id 字段
ALTER TABLE exam_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);
ALTER TABLE module_scores ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);
ALTER TABLE exam_config ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);

-- user_settings 表已有 user_id 字段，修改为 UUID 类型并添加外键
DO $$
BEGIN
  -- 检查列类型
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_settings' 
    AND column_name = 'user_id' 
    AND data_type = 'text'
  ) THEN
    -- 删除旧数据（因为类型不兼容）
    DELETE FROM user_settings;
    -- 删除默认值
    ALTER TABLE user_settings ALTER COLUMN user_id DROP DEFAULT;
    -- 修改列类型
    ALTER TABLE user_settings ALTER COLUMN user_id TYPE UUID USING NULL;
    -- 添加外键约束
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id);
  END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_exam_records_user_id ON exam_records(user_id);
CREATE INDEX IF NOT EXISTS idx_module_scores_user_id ON module_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_config_user_id ON exam_config(user_id);

-- 为现有表启用 RLS
ALTER TABLE exam_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_config ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己的数据
CREATE POLICY "Users can access their own exam_records" 
ON exam_records FOR ALL 
TO authenticated 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can access their own module_scores" 
ON module_scores FOR ALL 
TO authenticated 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can access their own user_settings" 
ON user_settings FOR ALL 
TO authenticated 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can access their own exam_config" 
ON exam_config FOR ALL 
TO authenticated 
USING ((SELECT auth.uid()) = user_id);

-- 创建特殊用户并绑定现有数据的函数
-- 注意：这个函数需要在应用层调用，不能在迁移中直接执行
-- 因为需要先有 auth.users 记录
CREATE OR REPLACE FUNCTION bind_existing_data_to_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 更新所有现有数据的 user_id
  UPDATE exam_records SET user_id = target_user_id WHERE user_id IS NULL;
  UPDATE module_scores SET user_id = target_user_id WHERE user_id IS NULL;
  UPDATE user_settings SET user_id = target_user_id WHERE user_id IS NULL;
  UPDATE exam_config SET user_id = target_user_id WHERE user_id IS NULL;
END;
$$;
