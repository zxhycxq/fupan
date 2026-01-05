-- 添加 include_in_stats 字段到 exam_records 表
ALTER TABLE exam_records 
ADD COLUMN IF NOT EXISTS include_in_stats BOOLEAN DEFAULT true;

-- 为现有记录设置默认值
UPDATE exam_records 
SET include_in_stats = true 
WHERE include_in_stats IS NULL;