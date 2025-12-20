/*
# 禁用exam_config表的RLS

为了兼容v301版本（无登录功能），禁用exam_config表的行级安全策略。

## 修改内容
- 禁用exam_config表的RLS
- 删除所有相关的RLS策略

## 原因
v301版本不使用登录功能，所有用户共享同一个配置，不需要RLS保护。
*/

-- 禁用exam_config表的RLS
ALTER TABLE exam_config DISABLE ROW LEVEL SECURITY;

-- 删除所有相关的策略（如果存在）
DROP POLICY IF EXISTS "Allow public read access" ON exam_config;
DROP POLICY IF EXISTS "Allow public write access" ON exam_config;