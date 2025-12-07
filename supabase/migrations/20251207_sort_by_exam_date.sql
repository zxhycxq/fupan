/*
# 按考试日期重新排序考试记录

## 说明
根据考试日期对现有的考试记录进行重新排序，更新sort_order字段。

## 排序规则
1. 有考试日期的记录按日期升序排列（最早的在前面，最新的在后面）
2. 没有考试日期的记录排在最后
3. 日期相同的记录保持原有的sort_order顺序

## 影响
- 更新所有exam_records表中记录的sort_order字段
- 不影响其他字段的数据
*/

-- 创建临时表来存储新的排序
CREATE TEMP TABLE temp_sorted_records AS
SELECT 
  id,
  ROW_NUMBER() OVER (
    ORDER BY 
      CASE 
        WHEN exam_date IS NULL THEN 1 
        ELSE 0 
      END,
      exam_date ASC NULLS LAST,
      sort_order ASC
  ) as new_sort_order
FROM exam_records;

-- 更新原表的sort_order
UPDATE exam_records
SET sort_order = temp_sorted_records.new_sort_order
FROM temp_sorted_records
WHERE exam_records.id = temp_sorted_records.id;

-- 清理临时表
DROP TABLE temp_sorted_records;
