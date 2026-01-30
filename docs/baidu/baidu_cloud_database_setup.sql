-- ============================================================================
-- 百度云数据库完整初始化脚本
-- 版本: 1.0
-- 创建日期: 2025-01-30
-- 说明: 用于百度云 RDS PostgreSQL 的完整数据库初始化
-- ============================================================================

-- 第一部分：创建扩展
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 第二部分：创建用户相关表
-- ============================================================================

-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  nickname VARCHAR(50),
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  is_vip BOOLEAN NOT NULL DEFAULT FALSE,
  vip_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  
  CONSTRAINT users_role_check 
    CHECK (role IN ('user', 'admin'))
);

-- 用户会话表
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  refresh_token TEXT UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 短信验证码表
CREATE TABLE sms_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  session_id UUID NOT NULL,
  purpose VARCHAR(20) NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT sms_verification_codes_purpose_check 
    CHECK (purpose IN ('login', 'register', 'reset_password'))
);

-- 用户资料表（可选）
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  location VARCHAR(100),
  website VARCHAR(200),
  birthday DATE,
  gender VARCHAR(10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT user_profiles_gender_check 
    CHECK (gender IN ('male', 'female', 'other'))
);

-- 第三部分：创建业务表
-- ============================================================================

-- 考试记录表
CREATE TABLE exam_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_number INTEGER NOT NULL,
  total_score DECIMAL(5,2) NOT NULL,
  total_time INTEGER NOT NULL,
  exam_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 模块得分表
CREATE TABLE module_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_record_id UUID NOT NULL REFERENCES exam_records(id) ON DELETE CASCADE,
  module_name VARCHAR(50) NOT NULL,
  parent_module VARCHAR(50),
  score DECIMAL(5,2) NOT NULL,
  total_questions INTEGER,
  correct_questions INTEGER,
  time_spent INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 用户设置表
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  setting_key VARCHAR(50) NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type VARCHAR(20) NOT NULL DEFAULT 'string',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, setting_key),
  CONSTRAINT user_settings_setting_type_check 
    CHECK (setting_type IN ('string', 'number', 'boolean', 'json'))
);

-- VIP申请记录表
CREATE TABLE vip_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_phone VARCHAR(20) NOT NULL,
  payment_screenshot_url TEXT NOT NULL,
  transaction_number VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT vip_applications_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- 第四部分：创建索引
-- ============================================================================

-- users 表索引
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_vip ON users(is_vip);

-- user_sessions 表索引
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- sms_verification_codes 表索引
CREATE INDEX idx_sms_codes_phone ON sms_verification_codes(phone);
CREATE INDEX idx_sms_codes_session_id ON sms_verification_codes(session_id);
CREATE INDEX idx_sms_codes_expires_at ON sms_verification_codes(expires_at);

-- exam_records 表索引
CREATE INDEX idx_exam_records_user_id ON exam_records(user_id);
CREATE INDEX idx_exam_records_exam_date ON exam_records(exam_date);
CREATE INDEX idx_exam_records_created_at ON exam_records(created_at);

-- module_scores 表索引
CREATE INDEX idx_module_scores_exam_record_id ON module_scores(exam_record_id);
CREATE INDEX idx_module_scores_module_name ON module_scores(module_name);

-- user_settings 表索引
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- vip_applications 表索引
CREATE INDEX idx_vip_applications_user_id ON vip_applications(user_id);
CREATE INDEX idx_vip_applications_phone ON vip_applications(user_phone);
CREATE INDEX idx_vip_applications_status ON vip_applications(status);
CREATE INDEX idx_vip_applications_created_at ON vip_applications(created_at);

-- 第五部分：创建触发器
-- ============================================================================

-- 通用的 updated_at 更新函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为各表创建触发器
CREATE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_user_sessions_updated_at
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_exam_records_updated_at
  BEFORE UPDATE ON exam_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_module_scores_updated_at
  BEFORE UPDATE ON module_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_vip_applications_updated_at
  BEFORE UPDATE ON vip_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 第六部分：添加注释
-- ============================================================================

-- users 表注释
COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.id IS '用户ID';
COMMENT ON COLUMN users.phone IS '手机号';
COMMENT ON COLUMN users.nickname IS '昵称';
COMMENT ON COLUMN users.avatar_url IS '头像URL';
COMMENT ON COLUMN users.role IS '角色：user-普通用户, admin-管理员';
COMMENT ON COLUMN users.is_vip IS '是否VIP';
COMMENT ON COLUMN users.vip_expires_at IS 'VIP过期时间';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.updated_at IS '更新时间';
COMMENT ON COLUMN users.last_login_at IS '最后登录时间';

-- user_sessions 表注释
COMMENT ON TABLE user_sessions IS '用户会话表';
COMMENT ON COLUMN user_sessions.id IS '会话ID';
COMMENT ON COLUMN user_sessions.user_id IS '用户ID';
COMMENT ON COLUMN user_sessions.token IS '访问令牌（JWT）';
COMMENT ON COLUMN user_sessions.refresh_token IS '刷新令牌';
COMMENT ON COLUMN user_sessions.expires_at IS '过期时间';
COMMENT ON COLUMN user_sessions.ip_address IS 'IP地址';
COMMENT ON COLUMN user_sessions.user_agent IS '用户代理';

-- sms_verification_codes 表注释
COMMENT ON TABLE sms_verification_codes IS '短信验证码表';
COMMENT ON COLUMN sms_verification_codes.id IS '验证码ID';
COMMENT ON COLUMN sms_verification_codes.phone IS '手机号';
COMMENT ON COLUMN sms_verification_codes.code IS '验证码';
COMMENT ON COLUMN sms_verification_codes.session_id IS '会话ID';
COMMENT ON COLUMN sms_verification_codes.purpose IS '用途：login-登录, register-注册, reset_password-重置密码';
COMMENT ON COLUMN sms_verification_codes.is_used IS '是否已使用';
COMMENT ON COLUMN sms_verification_codes.expires_at IS '过期时间';

-- user_profiles 表注释
COMMENT ON TABLE user_profiles IS '用户资料表';
COMMENT ON COLUMN user_profiles.user_id IS '用户ID';
COMMENT ON COLUMN user_profiles.bio IS '个人简介';
COMMENT ON COLUMN user_profiles.location IS '所在地';
COMMENT ON COLUMN user_profiles.website IS '个人网站';
COMMENT ON COLUMN user_profiles.birthday IS '生日';
COMMENT ON COLUMN user_profiles.gender IS '性别';

-- exam_records 表注释
COMMENT ON TABLE exam_records IS '考试记录表';
COMMENT ON COLUMN exam_records.id IS '考试记录ID';
COMMENT ON COLUMN exam_records.user_id IS '用户ID';
COMMENT ON COLUMN exam_records.exam_number IS '考试期数';
COMMENT ON COLUMN exam_records.total_score IS '总分';
COMMENT ON COLUMN exam_records.total_time IS '总用时（分钟）';
COMMENT ON COLUMN exam_records.exam_date IS '考试日期';

-- module_scores 表注释
COMMENT ON TABLE module_scores IS '模块得分表';
COMMENT ON COLUMN module_scores.id IS '模块得分ID';
COMMENT ON COLUMN module_scores.exam_record_id IS '考试记录ID';
COMMENT ON COLUMN module_scores.module_name IS '模块名称';
COMMENT ON COLUMN module_scores.parent_module IS '父模块名称';
COMMENT ON COLUMN module_scores.score IS '得分';
COMMENT ON COLUMN module_scores.total_questions IS '总题数';
COMMENT ON COLUMN module_scores.correct_questions IS '正确题数';
COMMENT ON COLUMN module_scores.time_spent IS '用时（分钟）';

-- user_settings 表注释
COMMENT ON TABLE user_settings IS '用户设置表';
COMMENT ON COLUMN user_settings.id IS '设置ID';
COMMENT ON COLUMN user_settings.user_id IS '用户ID';
COMMENT ON COLUMN user_settings.setting_key IS '设置键';
COMMENT ON COLUMN user_settings.setting_value IS '设置值';
COMMENT ON COLUMN user_settings.setting_type IS '设置类型';

-- vip_applications 表注释
COMMENT ON TABLE vip_applications IS 'VIP申请记录表';
COMMENT ON COLUMN vip_applications.id IS '申请ID';
COMMENT ON COLUMN vip_applications.user_id IS '用户ID';
COMMENT ON COLUMN vip_applications.user_phone IS '用户手机号';
COMMENT ON COLUMN vip_applications.payment_screenshot_url IS '支付截图URL';
COMMENT ON COLUMN vip_applications.transaction_number IS '流水号';
COMMENT ON COLUMN vip_applications.status IS '申请状态';
COMMENT ON COLUMN vip_applications.admin_note IS '管理员备注';
COMMENT ON COLUMN vip_applications.reviewed_by IS '审核人ID';
COMMENT ON COLUMN vip_applications.reviewed_at IS '审核时间';

-- 第七部分：创建初始管理员账号（可选）
-- ============================================================================

-- 插入默认管理员（手机号：13800138000）
INSERT INTO users (phone, nickname, role, is_vip, created_at, updated_at)
VALUES ('13800138000', '系统管理员', 'admin', TRUE, NOW(), NOW())
ON CONFLICT (phone) DO NOTHING;

-- 第八部分：验证
-- ============================================================================

-- 查看所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 查看所有索引
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- 查看所有触发器
SELECT tgname, tgrelid::regclass AS table_name 
FROM pg_trigger 
WHERE tgisinternal = FALSE 
ORDER BY table_name, tgname;

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '数据库初始化完成！';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '已创建的表：';
  RAISE NOTICE '  - users (用户表)';
  RAISE NOTICE '  - user_sessions (用户会话表)';
  RAISE NOTICE '  - sms_verification_codes (短信验证码表)';
  RAISE NOTICE '  - user_profiles (用户资料表)';
  RAISE NOTICE '  - exam_records (考试记录表)';
  RAISE NOTICE '  - module_scores (模块得分表)';
  RAISE NOTICE '  - user_settings (用户设置表)';
  RAISE NOTICE '  - vip_applications (VIP申请记录表)';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '默认管理员账号：';
  RAISE NOTICE '  手机号：13800138000';
  RAISE NOTICE '  角色：admin';
  RAISE NOTICE '  VIP：是';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '下一步：';
  RAISE NOTICE '  1. 配置后端环境变量';
  RAISE NOTICE '  2. 部署后端服务';
  RAISE NOTICE '  3. 部署前端应用';
  RAISE NOTICE '  4. 测试功能';
  RAISE NOTICE '============================================================================';
END $$;