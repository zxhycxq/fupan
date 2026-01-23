-- 查看exam_records表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'exam_records' 
  AND column_name IN ('question_count', 'duration_seconds')
ORDER BY ordinal_position;

-- 查看user_milestones表数据
SELECT milestone_type, milestone_date, score 
FROM user_milestones 
ORDER BY milestone_date 
LIMIT 5;

-- 查看exam_records表的统计数据
SELECT 
  COUNT(*) as total_exams,
  SUM(question_count) as total_questions,
  SUM(duration_seconds) as total_seconds,
  ROUND(SUM(duration_seconds) / 3600.0, 1) as total_hours
FROM exam_records
WHERE deleted_at IS NULL;
