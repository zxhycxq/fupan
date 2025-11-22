/*
# 添加考试备注、日期和报告链接字段

## 说明
为exam_records表添加三个新字段:
1. notes: 考试备注,用于记录错误原因、注意事项等(最多500字)
2. exam_date: 考试日期,用户可以自行设置,但不能超过当前日期
3. report_url: 考试报告链接地址,用户可以添加外部考试报告链接

## 新增字段
- `notes` (text): 考试备注,可选,最多500字
- `exam_date` (date): 考试日期,可选,默认为创建日期
- `report_url` (text): 考试报告链接,可选

## 约束
- exam_date不能晚于当前日期
- notes长度不超过500字符

## 索引
- 在exam_date上创建索引以提高按日期查询的性能
*/

-- 添加notes字段(考试备注)
ALTER TABLE exam_records 
ADD COLUMN IF NOT EXISTS notes text;

-- 添加exam_date字段(考试日期)
ALTER TABLE exam_records 
ADD COLUMN IF NOT EXISTS exam_date date DEFAULT CURRENT_DATE;

-- 添加report_url字段(考试报告链接)
ALTER TABLE exam_records 
ADD COLUMN IF NOT EXISTS report_url text;

-- 删除可能存在的旧约束
ALTER TABLE exam_records 
DROP CONSTRAINT IF EXISTS exam_date_not_future;

ALTER TABLE exam_records 
DROP CONSTRAINT IF EXISTS notes_length_limit;

-- 添加约束: exam_date不能晚于当前日期
ALTER TABLE exam_records 
ADD CONSTRAINT exam_date_not_future 
CHECK (exam_date <= CURRENT_DATE);

-- 添加约束: notes长度不超过500字符
ALTER TABLE exam_records 
ADD CONSTRAINT notes_length_limit 
CHECK (length(notes) <= 500);

-- 创建索引以提高按日期查询的性能
CREATE INDEX IF NOT EXISTS idx_exam_records_exam_date 
ON exam_records(exam_date DESC);

-- 为现有记录设置exam_date为created_at的日期部分
UPDATE exam_records 
SET exam_date = created_at::date 
WHERE exam_date IS NULL;
