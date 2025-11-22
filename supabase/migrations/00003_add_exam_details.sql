/*
# 添加考试详细信息字段

## 1. 修改exam_records表
添加以下字段:
- `difficulty` (numeric, 难度系数, 0-5)
- `beat_percentage` (numeric, 击败考生百分比, 0-100)

## 2. 说明
- difficulty: 考试难度系数,从截图中识别
- average_score: 已存在,平均分
- beat_percentage: 击败的考生百分比
*/

-- 添加难度字段
ALTER TABLE exam_records 
ADD COLUMN IF NOT EXISTS difficulty numeric CHECK (difficulty >= 0 AND difficulty <= 5);

-- 添加击败百分比字段
ALTER TABLE exam_records 
ADD COLUMN IF NOT EXISTS beat_percentage numeric CHECK (beat_percentage >= 0 AND beat_percentage <= 100);

-- 添加注释
COMMENT ON COLUMN exam_records.difficulty IS '考试难度系数(0-5)';
COMMENT ON COLUMN exam_records.beat_percentage IS '击败考生百分比(0-100)';
