-- 延长用户会话时间到15天
-- 注意：这个配置需要在 Supabase Dashboard 的 Authentication > Settings 中设置
-- JWT expiry: 1296000 秒 (15天)
-- Refresh token expiry: 1296000 秒 (15天)

-- 这个迁移文件主要用于记录配置变更
-- 实际配置需要通过 Supabase Dashboard 或 API 进行

-- 添加注释说明
COMMENT ON SCHEMA auth IS 'Supabase Auth: JWT expiry set to 15 days (1296000 seconds)';
