/*
# 禁用RLS以兼容v301版本

## 变更说明
v301版本不支持用户认证系统，需要禁用RLS并移除user_id相关策略

## 变更内容
1. 禁用exam_records表的RLS
2. 删除所有RLS策略
3. 将user_id字段设置为可空
4. 禁用module_scores表的RLS

## 注意事项
- 这是为了兼容v301版本的临时方案
- 所有用户都可以访问所有数据
- 适用于个人使用的场景
*/

-- 禁用exam_records表的RLS
ALTER TABLE exam_records DISABLE ROW LEVEL SECURITY;

-- 删除exam_records表的所有策略
DROP POLICY IF EXISTS "管理员可以查看所有考试记录" ON exam_records;
DROP POLICY IF EXISTS "用户可以查看自己的考试记录" ON exam_records;
DROP POLICY IF EXISTS "用户可以插入自己的考试记录" ON exam_records;
DROP POLICY IF EXISTS "用户可以更新自己的考试记录" ON exam_records;
DROP POLICY IF EXISTS "用户可以删除自己的考试记录" ON exam_records;

-- 将user_id字段设置为可空
ALTER TABLE exam_records ALTER COLUMN user_id DROP NOT NULL;

-- 禁用module_scores表的RLS
ALTER TABLE module_scores DISABLE ROW LEVEL SECURITY;

-- 删除module_scores表的所有策略
DROP POLICY IF EXISTS "管理员可以查看所有模块分数" ON module_scores;
DROP POLICY IF EXISTS "管理员可以查看所有模块得分" ON module_scores;
DROP POLICY IF EXISTS "用户可以查看自己的模块分数" ON module_scores;
DROP POLICY IF EXISTS "用户可以查看自己的模块得分" ON module_scores;
DROP POLICY IF EXISTS "用户可以插入自己的模块分数" ON module_scores;
DROP POLICY IF EXISTS "用户可以插入自己的模块得分" ON module_scores;
DROP POLICY IF EXISTS "用户可以更新自己的模块分数" ON module_scores;
DROP POLICY IF EXISTS "用户可以更新自己的模块得分" ON module_scores;
DROP POLICY IF EXISTS "用户可以删除自己的模块分数" ON module_scores;
DROP POLICY IF EXISTS "用户可以删除自己的模块得分" ON module_scores;

-- 禁用profiles表的RLS（如果存在）
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 删除profiles表的所有策略
DROP POLICY IF EXISTS "管理员可以完全访问所有用户档案" ON profiles;
DROP POLICY IF EXISTS "用户可以查看自己的档案" ON profiles;
DROP POLICY IF EXISTS "用户可以更新自己的档案" ON profiles;
DROP POLICY IF EXISTS "用户可以查看自己的信息" ON profiles;
DROP POLICY IF EXISTS "用户可以更新自己的信息" ON profiles;

-- 删除辅助函数（使用CASCADE删除所有依赖）
DROP FUNCTION IF EXISTS uid() CASCADE;
DROP FUNCTION IF EXISTS is_admin(uuid) CASCADE;
