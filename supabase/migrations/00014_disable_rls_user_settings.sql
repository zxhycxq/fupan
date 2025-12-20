
/*
# 禁用user_settings表的RLS

## 说明
- v301版本不需要用户认证系统
- 禁用user_settings表的RLS以允许所有操作
- 确保'default'用户可以正常保存和读取设置

## 变更
- 禁用user_settings表的行级安全策略
*/

-- 禁用user_settings表的RLS
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
