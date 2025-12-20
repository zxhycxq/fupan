/*
# 修复v301版本兼容性问题

## 问题说明
1. user_settings表的user_id字段类型错误（应该是text，不是uuid）
2. exam_records表的user_id字段应该删除（v301版本没有这个字段）
3. module_scores表的user_id字段应该删除（v301版本没有这个字段）
4. profiles表不应该存在（v301版本没有用户系统）

## 修复内容
1. 修改user_settings表的user_id字段为text类型
2. 删除exam_records表的user_id字段
3. 删除module_scores表的user_id字段
4. 删除profiles表
5. 恢复默认设置数据

## 注意事项
- 这是为了完全兼容v301版本
- 所有用户相关的字段都会被删除
- 适用于个人使用的场景
*/

-- 1. 删除所有外键约束
ALTER TABLE exam_records DROP CONSTRAINT IF EXISTS fk_exam_records_user_id;
ALTER TABLE module_scores DROP CONSTRAINT IF EXISTS fk_module_scores_user_id;
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS fk_user_settings_user_id;
ALTER TABLE exam_config DROP CONSTRAINT IF EXISTS fk_exam_config_user_id;

-- 2. 删除exam_records表的user_id字段
ALTER TABLE exam_records DROP COLUMN IF EXISTS user_id;

-- 3. 删除module_scores表的user_id字段
ALTER TABLE module_scores DROP COLUMN IF EXISTS user_id;

-- 4. 删除exam_config表的user_id字段和唯一约束
ALTER TABLE exam_config DROP CONSTRAINT IF EXISTS exam_config_user_id_key;
ALTER TABLE exam_config DROP COLUMN IF EXISTS user_id;

-- 5. 删除profiles表（如果存在）
DROP TABLE IF EXISTS profiles CASCADE;

-- 6. 修改user_settings表
-- 删除现有数据（因为类型不兼容）
TRUNCATE TABLE user_settings;

-- 修改user_id字段类型为text
ALTER TABLE user_settings ALTER COLUMN user_id TYPE text;
ALTER TABLE user_settings ALTER COLUMN user_id SET DEFAULT 'default';
ALTER TABLE user_settings ALTER COLUMN user_id SET NOT NULL;

-- 插入默认设置
INSERT INTO user_settings (user_id, module_name, target_accuracy) VALUES
  ('default', '政治理论', 80),
  ('default', '常识判断', 80),
  ('default', '言语理解与表达', 80),
  ('default', '数量关系', 80),
  ('default', '判断推理', 80),
  ('default', '资料分析', 80)
ON CONFLICT (user_id, module_name) DO NOTHING;

-- 6. 确保exam_config表只有一行数据
-- 先删除所有数据
TRUNCATE TABLE exam_config;

-- 插入默认配置
INSERT INTO exam_config (id, exam_type, exam_name, exam_date, grade_label_theme)
VALUES (
  gen_random_uuid(),
  '国考',
  '2025年国家公务员考试',
  NULL,
  'default'
);
