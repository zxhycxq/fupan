/*
# 添加排序字段

## 说明
为 exam_records 表添加 sort_order 字段，用于用户自定义排序。

## 变更内容
1. 添加 sort_order 列（整数类型，可为空）
2. 为现有记录设置默认排序值（按创建时间排序）
3. 添加索引以提高查询性能

## 注意事项
- sort_order 字段可为空，允许用户选择是否自定义排序
- 默认按创建时间排序，sort_order 为空时使用 created_at
*/

-- 添加 sort_order 列
ALTER TABLE exam_records 
ADD COLUMN sort_order INTEGER;

-- 为现有记录设置默认排序值（按创建时间排序）
WITH ranked_records AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM exam_records
)
UPDATE exam_records
SET sort_order = ranked_records.rn
FROM ranked_records
WHERE exam_records.id = ranked_records.id;

-- 添加索引以提高查询性能
CREATE INDEX idx_exam_records_sort_order ON exam_records(sort_order);

-- 添加注释
COMMENT ON COLUMN exam_records.sort_order IS '用户自定义排序顺序';
