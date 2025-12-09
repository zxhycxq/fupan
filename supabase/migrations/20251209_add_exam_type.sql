/*
# 添加考试类型字段

## 1. 表结构变更
- 在 `exam_records` 表中添加 `exam_type` 字段
  - 类型：text
  - 默认值：'国考模考'
  - 可选值：'国考真题', '国考模考', '省考真题', '省考模考', '其他'
  - 非必填项

## 2. 注意事项
- 使用 CHECK 约束确保只能选择预定义的值
- 为现有记录设置默认值
*/

-- 添加考试类型字段
ALTER TABLE exam_records 
ADD COLUMN IF NOT EXISTS exam_type text DEFAULT '国考模考';

-- 添加 CHECK 约束，确保只能选择预定义的值
ALTER TABLE exam_records
ADD CONSTRAINT exam_type_check 
CHECK (exam_type IN ('国考真题', '国考模考', '省考真题', '省考模考', '其他'));

-- 为现有记录设置默认值（如果字段为空）
UPDATE exam_records 
SET exam_type = '国考模考' 
WHERE exam_type IS NULL;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_exam_records_exam_type ON exam_records(exam_type);
