/*
# 添加星级、考试名称和索引项字段

## 1. 表结构变更

### exam_records 表
- 添加 `rating` (decimal) - 星级评分，支持半星，范围 0-5
- 添加 `exam_name` (text) - 考试名称，替代原来的期数概念
- 添加 `index_number` (integer, unique) - 索引项，用于排序，不能重复

## 2. 数据迁移
- 将现有的 exam_number 迁移到 exam_name（格式：第X期）
- 将现有的 exam_number 迁移到 index_number
- 设置默认 rating 为 0

## 3. 约束
- index_number 必须唯一
- rating 范围 0-5，支持 0.5 的增量
- exam_name 不能为空

## 4. 索引
- 为 index_number 创建唯一索引
- 为 rating 创建索引以支持按星级筛选
*/

-- 添加新字段
ALTER TABLE exam_records 
ADD COLUMN IF NOT EXISTS rating decimal(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS exam_name text,
ADD COLUMN IF NOT EXISTS index_number integer;

-- 迁移现有数据：将 exam_number 转换为 exam_name 和 index_number
UPDATE exam_records 
SET 
  exam_name = COALESCE(exam_name, '第' || exam_number || '期'),
  index_number = COALESCE(index_number, exam_number)
WHERE exam_name IS NULL OR index_number IS NULL;

-- 设置 exam_name 为非空
ALTER TABLE exam_records 
ALTER COLUMN exam_name SET NOT NULL;

-- 设置 index_number 为非空
ALTER TABLE exam_records 
ALTER COLUMN index_number SET NOT NULL;

-- 为 index_number 创建唯一约束
ALTER TABLE exam_records 
ADD CONSTRAINT exam_records_index_number_unique UNIQUE (index_number);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_exam_records_rating ON exam_records(rating);
CREATE INDEX IF NOT EXISTS idx_exam_records_index_number ON exam_records(index_number);

-- 添加注释
COMMENT ON COLUMN exam_records.rating IS '星级评分，支持半星，范围 0-5';
COMMENT ON COLUMN exam_records.exam_name IS '考试名称';
COMMENT ON COLUMN exam_records.index_number IS '索引项，用于排序，必须唯一';
