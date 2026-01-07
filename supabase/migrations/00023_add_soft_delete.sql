-- 添加软删除功能
-- 1. 添加 deleted_at 字段到 user_profiles 表
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. 创建软删除函数
CREATE OR REPLACE FUNCTION soft_delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- 获取当前用户ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION '用户未登录';
  END IF;
  
  -- 软删除用户资料
  UPDATE user_profiles
  SET deleted_at = NOW()
  WHERE id = current_user_id AND deleted_at IS NULL;
  
  -- 软删除考试记录（添加 deleted_at 字段）
  -- 注意：这里不直接删除，而是标记为已删除
  -- 如果 exam_records 表没有 deleted_at 字段，需要先添加
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_records' AND column_name = 'deleted_at'
  ) THEN
    UPDATE exam_records
    SET deleted_at = NOW()
    WHERE user_id = current_user_id AND deleted_at IS NULL;
  END IF;
  
  -- 软删除模块得分（添加 deleted_at 字段）
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'module_scores' AND column_name = 'deleted_at'
  ) THEN
    UPDATE module_scores
    SET deleted_at = NOW()
    WHERE user_id = current_user_id AND deleted_at IS NULL;
  END IF;
  
  -- 软删除用户设置
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_settings' AND column_name = 'deleted_at'
  ) THEN
    UPDATE user_settings
    SET deleted_at = NOW()
    WHERE user_id = current_user_id AND deleted_at IS NULL;
  END IF;
  
  -- 软删除考试配置
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_config' AND column_name = 'deleted_at'
  ) THEN
    UPDATE exam_config
    SET deleted_at = NOW()
    WHERE user_id = current_user_id AND deleted_at IS NULL;
  END IF;
END;
$$;

-- 3. 添加 deleted_at 字段到相关表
ALTER TABLE exam_records 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE module_scores 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE exam_config 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 4. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted_at ON user_profiles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_exam_records_deleted_at ON exam_records(deleted_at);
CREATE INDEX IF NOT EXISTS idx_module_scores_deleted_at ON module_scores(deleted_at);
CREATE INDEX IF NOT EXISTS idx_user_settings_deleted_at ON user_settings(deleted_at);
CREATE INDEX IF NOT EXISTS idx_exam_config_deleted_at ON exam_config(deleted_at);

-- 5. 修改 RLS 策略，排除已删除的数据
-- user_profiles 表
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = id AND deleted_at IS NULL);

-- exam_records 表
DROP POLICY IF EXISTS "Users can view own exam records" ON exam_records;
CREATE POLICY "Users can view own exam records" ON exam_records
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can insert own exam records" ON exam_records;
CREATE POLICY "Users can insert own exam records" ON exam_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can update own exam records" ON exam_records;
CREATE POLICY "Users can update own exam records" ON exam_records
  FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can delete own exam records" ON exam_records;
CREATE POLICY "Users can delete own exam records" ON exam_records
  FOR DELETE
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- module_scores 表
DROP POLICY IF EXISTS "Users can view own module scores" ON module_scores;
CREATE POLICY "Users can view own module scores" ON module_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exam_records 
      WHERE exam_records.id = module_scores.exam_record_id 
      AND exam_records.user_id = auth.uid()
      AND exam_records.deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Users can insert own module scores" ON module_scores;
CREATE POLICY "Users can insert own module scores" ON module_scores
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_records 
      WHERE exam_records.id = module_scores.exam_record_id 
      AND exam_records.user_id = auth.uid()
      AND exam_records.deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Users can update own module scores" ON module_scores;
CREATE POLICY "Users can update own module scores" ON module_scores
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM exam_records 
      WHERE exam_records.id = module_scores.exam_record_id 
      AND exam_records.user_id = auth.uid()
      AND exam_records.deleted_at IS NULL
    )
    AND deleted_at IS NULL
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_records 
      WHERE exam_records.id = module_scores.exam_record_id 
      AND exam_records.user_id = auth.uid()
      AND exam_records.deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Users can delete own module scores" ON module_scores;
CREATE POLICY "Users can delete own module scores" ON module_scores
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM exam_records 
      WHERE exam_records.id = module_scores.exam_record_id 
      AND exam_records.user_id = auth.uid()
      AND exam_records.deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- user_settings 表
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;
CREATE POLICY "Users can delete own settings" ON user_settings
  FOR DELETE
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- exam_config 表
DROP POLICY IF EXISTS "Users can view own exam config" ON exam_config;
CREATE POLICY "Users can view own exam config" ON exam_config
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can insert own exam config" ON exam_config;
CREATE POLICY "Users can insert own exam config" ON exam_config
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can update own exam config" ON exam_config;
CREATE POLICY "Users can update own exam config" ON exam_config
  FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can delete own exam config" ON exam_config;
CREATE POLICY "Users can delete own exam config" ON exam_config
  FOR DELETE
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- 6. 添加注释
COMMENT ON COLUMN user_profiles.deleted_at IS '软删除时间戳，NULL表示未删除';
COMMENT ON COLUMN exam_records.deleted_at IS '软删除时间戳，NULL表示未删除';
COMMENT ON COLUMN module_scores.deleted_at IS '软删除时间戳，NULL表示未删除';
COMMENT ON COLUMN user_settings.deleted_at IS '软删除时间戳，NULL表示未删除';
COMMENT ON COLUMN exam_config.deleted_at IS '软删除时间戳，NULL表示未删除';
COMMENT ON FUNCTION soft_delete_user_account() IS '软删除用户账号及所有相关数据';
