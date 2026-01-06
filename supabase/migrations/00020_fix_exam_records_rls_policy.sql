
-- 删除旧的策略
DROP POLICY IF EXISTS "Users can access their own exam_records" ON exam_records;

-- 创建新的策略，明确指定 with_check
CREATE POLICY "Users can access their own exam_records"
ON exam_records
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 同样修复其他表的策略
DROP POLICY IF EXISTS "Users can access their own module_scores" ON module_scores;

CREATE POLICY "Users can access their own module_scores"
ON module_scores
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM exam_records
    WHERE exam_records.id = module_scores.exam_record_id
    AND exam_records.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM exam_records
    WHERE exam_records.id = module_scores.exam_record_id
    AND exam_records.user_id = auth.uid()
  )
);

-- 修复 user_settings 表的策略
DROP POLICY IF EXISTS "Users can access their own settings" ON user_settings;

CREATE POLICY "Users can access their own settings"
ON user_settings
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 修复 exam_config 表的策略
DROP POLICY IF EXISTS "Users can access their own exam_config" ON exam_config;

CREATE POLICY "Users can access their own exam_config"
ON exam_config
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
