/*
# 添加备注字段

1. 新增字段
  - `improvements` (text) - 有进步的地方
  - `mistakes` (text) - 出错的地方

2. 说明
  - 替代原有的单一 notes 字段
  - 两个字段都允许为空
  - 存储为文本格式
*/

-- 添加新字段
ALTER TABLE exam_records 
ADD COLUMN IF NOT EXISTS improvements text,
ADD COLUMN IF NOT EXISTS mistakes text;

-- 添加注释
COMMENT ON COLUMN exam_records.improvements IS '有进步的地方';
COMMENT ON COLUMN exam_records.mistakes IS '出错的地方';
