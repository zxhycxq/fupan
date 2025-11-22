/*
# 创建用户设置表

## 1. 新表
- `user_settings`
  - `id` (uuid, 主键, 默认: gen_random_uuid())
  - `user_id` (text, 用户标识, 默认: 'default')
  - `module_name` (text, 模块名称, 非空)
  - `target_accuracy` (numeric, 目标正确率, 0-100)
  - `created_at` (timestamptz, 创建时间, 默认: now())
  - `updated_at` (timestamptz, 更新时间, 默认: now())

## 2. 约束
- 唯一约束: (user_id, module_name) - 每个用户每个模块只能有一个目标设置
- 检查约束: target_accuracy 必须在 0-100 之间

## 3. 索引
- 在 user_id 上创建索引,提高查询性能

## 4. 说明
- user_id 默认为 'default',支持未来多用户扩展
- module_name 对应6大模块名称
- target_accuracy 存储用户设置的目标正确率(百分比)
*/

-- 创建用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT 'default',
  module_name text NOT NULL,
  target_accuracy numeric NOT NULL CHECK (target_accuracy >= 0 AND target_accuracy <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module_name)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- 添加注释
COMMENT ON TABLE user_settings IS '用户目标设置表';
COMMENT ON COLUMN user_settings.user_id IS '用户标识';
COMMENT ON COLUMN user_settings.module_name IS '模块名称';
COMMENT ON COLUMN user_settings.target_accuracy IS '目标正确率(0-100)';

-- 插入默认目标设置(6大模块,默认目标80%)
INSERT INTO user_settings (user_id, module_name, target_accuracy) VALUES
  ('default', '政治理论', 80),
  ('default', '常识判断', 80),
  ('default', '言语理解与表达', 80),
  ('default', '数量关系', 80),
  ('default', '判断推理', 80),
  ('default', '资料分析', 80)
ON CONFLICT (user_id, module_name) DO NOTHING;
