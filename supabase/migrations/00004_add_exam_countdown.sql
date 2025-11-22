/*
# 添加考试倒计时配置

## 说明
为user_settings表添加考试倒计时相关字段

## 新增字段
- exam_type: 考试类型(国考/省考)
- exam_date: 考试日期

## 注意事项
- exam_type可以为空,表示未设置
- exam_date可以为空,表示未设置
*/

-- 添加考试类型字段
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS exam_type TEXT;

-- 添加考试日期字段
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS exam_date DATE;

-- 添加注释
COMMENT ON COLUMN user_settings.exam_type IS '考试类型(国考/省考)';
COMMENT ON COLUMN user_settings.exam_date IS '考试日期';
