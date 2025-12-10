/*
# 创建考试配置表并添加等级称谓主题配置

## 1. 新表
- `exam_config` 表
  - `id` (uuid, 主键, 默认: gen_random_uuid())
  - `user_id` (text, 用户标识, 默认: 'default', 唯一)
  - `exam_type` (text, 考试类型: 国考/省考)
  - `exam_date` (date, 考试日期)
  - `grade_label_theme` (text, 等级称谓主题, 默认: 'theme4')
  - `created_at` (timestamptz, 创建时间, 默认: now())
  - `updated_at` (timestamptz, 更新时间, 默认: now())

## 2. 说明
- exam_config 表用于存储用户的考试配置信息
- grade_label_theme 用于存储用户选择的等级称谓主题
- 可选值：
  - 'theme1': 易经系列 - 潜龙勿用、见龙在田、终日乾乾、或跃在渊、飞龙在天
  - 'theme2': 修行系列 - 启蒙之境、登堂之境、入室之境、精研之境、大成之境
  - 'theme3': 成长系列 - 萌芽初醒、新苗成长、含苞待放、花开锦绣、硕果满枝
  - 'theme4': 成就系列 - 默默无闻、小有所成、初露锋芒、卓然不群、名满天下
*/

-- 创建考试配置表
CREATE TABLE IF NOT EXISTS exam_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT 'default' UNIQUE,
  exam_type text,
  exam_date date,
  grade_label_theme text DEFAULT 'theme4',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 添加注释
COMMENT ON TABLE exam_config IS '考试配置表';
COMMENT ON COLUMN exam_config.user_id IS '用户标识';
COMMENT ON COLUMN exam_config.exam_type IS '考试类型(国考/省考)';
COMMENT ON COLUMN exam_config.exam_date IS '考试日期';
COMMENT ON COLUMN exam_config.grade_label_theme IS '等级称谓主题(theme1-theme4)';

-- 插入默认配置
INSERT INTO exam_config (user_id, grade_label_theme) 
VALUES ('default', 'theme4')
ON CONFLICT (user_id) DO NOTHING;

