/*
# 创建考试成绩分析系统数据库表

## 1. 新建表

### exam_records - 考试记录表
- `id` (uuid, primary key) - 记录ID
- `exam_number` (integer, not null) - 考试期数
- `total_score` (decimal, not null) - 总分
- `max_score` (decimal) - 最高分
- `average_score` (decimal) - 平均分
- `pass_rate` (decimal) - 已击败考生百分比
- `time_used` (integer) - 用时(分钟)
- `image_url` (text) - 上传的图片URL
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

### module_scores - 模块得分表
- `id` (uuid, primary key) - 记录ID
- `exam_record_id` (uuid, foreign key) - 关联考试记录ID
- `module_name` (text, not null) - 模块名称
- `parent_module` (text, nullable) - 父模块名称(用于层级结构)
- `total_questions` (integer) - 总题数
- `correct_answers` (integer) - 答对题数
- `wrong_answers` (integer) - 答错题数
- `unanswered` (integer) - 未答题数
- `accuracy_rate` (decimal) - 正确率
- `time_used` (integer) - 用时(秒)
- `created_at` (timestamptz, default: now())

## 2. 安全策略
- 不启用RLS,允许所有用户访问(个人使用工具)
- 创建索引以提高查询性能

## 3. 注意事项
- 使用UUID作为主键
- 使用外键约束保证数据完整性
- 添加时间戳字段用于追踪记录
*/

-- 创建考试记录表
CREATE TABLE IF NOT EXISTS exam_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_number integer NOT NULL,
  total_score decimal(5,2) NOT NULL,
  max_score decimal(5,2),
  average_score decimal(5,2),
  pass_rate decimal(5,2),
  time_used integer,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建模块得分表
CREATE TABLE IF NOT EXISTS module_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_record_id uuid NOT NULL REFERENCES exam_records(id) ON DELETE CASCADE,
  module_name text NOT NULL,
  parent_module text,
  total_questions integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  wrong_answers integer DEFAULT 0,
  unanswered integer DEFAULT 0,
  accuracy_rate decimal(5,2),
  time_used integer,
  created_at timestamptz DEFAULT now()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_exam_records_exam_number ON exam_records(exam_number);
CREATE INDEX IF NOT EXISTS idx_exam_records_created_at ON exam_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_module_scores_exam_record_id ON module_scores(exam_record_id);
CREATE INDEX IF NOT EXISTS idx_module_scores_module_name ON module_scores(module_name);
CREATE INDEX IF NOT EXISTS idx_module_scores_parent_module ON module_scores(parent_module);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为exam_records表创建触发器
CREATE TRIGGER update_exam_records_updated_at
  BEFORE UPDATE ON exam_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();