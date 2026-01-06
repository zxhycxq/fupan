
-- 删除旧的重复策略
DROP POLICY IF EXISTS "Users can access their own user_settings" ON user_settings;

-- 确保只保留正确的策略
-- 如果策略不存在，创建它
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_settings' 
    AND policyname = 'Users can access their own settings'
  ) THEN
    CREATE POLICY "Users can access their own settings"
    ON user_settings
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
