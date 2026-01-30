/*
================================================================================
考试成绩分析系统 - 完整数据库设置脚本
================================================================================

版本: v1.0.0
创建日期: 2026-01-30
说明: 这是一个合并后的完整 SQL 脚本，包含所有必需的表结构、索引、触发器和函数。

使用方法:
1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 复制粘贴本脚本的全部内容
4. 点击 Run 执行

注意事项:
- 本脚本会创建所有必需的表和配置
- RLS 策略默认禁用（开发环境），生产环境请启用（见文档）
- 执行前请确保数据库为空，或备份现有数据

================================================================================
*/

-- ============================================================================
-- 第一部分：创建表结构
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. profiles 表 - 用户资料表
-- ----------------------------------------------------------------------------
-- 说明：存储用户的基本信息和 VIP 状态
-- 关联：auth.users (Supabase Auth 系统)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,                          -- 用户名（唯一）
  phone TEXT UNIQUE,                             -- 手机号（唯一）
  is_vip BOOLEAN DEFAULT FALSE,                  -- 是否为 VIP
  vip_expires_at TIMESTAMPTZ,                    -- VIP 到期时间
  created_at TIMESTAMPTZ DEFAULT NOW(),          -- 创建时间
  updated_at TIMESTAMPTZ DEFAULT NOW(),          -- 更新时间

  -- 约束
  CONSTRAINT valid_username CHECK (username IS NULL OR length(username) >= 2),
  CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~ '^\d{11}$')
);

-- 添加注释
COMMENT ON TABLE profiles IS '用户资料表';
COMMENT ON COLUMN profiles.id IS '用户ID，关联 auth.users';
COMMENT ON COLUMN profiles.username IS '用户名，用于显示和登录';
COMMENT ON COLUMN profiles.phone IS '手机号，用于登录和验证';
COMMENT ON COLUMN profiles.is_vip IS 'VIP 标识';
COMMENT ON COLUMN profiles.vip_expires_at IS 'VIP 到期时间';

-- ----------------------------------------------------------------------------
-- 2. exam_records 表 - 考试记录表
-- ----------------------------------------------------------------------------
-- 说明：存储每次考试的基本信息和总成绩
-- 关联：profiles (user_id)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS exam_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exam_number INTEGER NOT NULL,                  -- 考试期数（保留用于向后兼容）
  exam_name TEXT NOT NULL,                       -- 考试名称
  exam_type TEXT DEFAULT '国考模考',              -- 考试类型
  index_number INTEGER NOT NULL,                 -- 索引号（排序用）
  rating NUMERIC(2,1) DEFAULT 0,                 -- 星级评分（0-5）
  total_score NUMERIC(5,2) NOT NULL,             -- 总分
  max_score NUMERIC(5,2),                        -- 最高分
  average_score NUMERIC(5,2),                    -- 平均分
  pass_rate NUMERIC(5,2),                        -- 通过率
  difficulty NUMERIC(3,1),                       -- 难度
  beat_percentage NUMERIC(5,2),                  -- 击败百分比
  time_used INTEGER,                             -- 用时（秒）
  question_count INTEGER,                        -- 题目数量
  duration_seconds INTEGER,                      -- 考试时长（秒）
  image_url TEXT,                                -- 成绩截图 URL
  improvements TEXT,                             -- 改进点
  mistakes TEXT,                                 -- 错题记录
  include_in_analysis BOOLEAN DEFAULT TRUE,      -- 是否包含在分析中
  is_deleted BOOLEAN DEFAULT FALSE,              -- 软删除标记
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 约束
  CONSTRAINT unique_user_index UNIQUE(user_id, index_number),
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT valid_score CHECK (total_score >= 0),
  CONSTRAINT valid_exam_type CHECK (exam_type IN ('国考真题', '国考模考', '省考真题', '省考模考', '其他'))
);

-- 添加注释
COMMENT ON TABLE exam_records IS '考试记录表';
COMMENT ON COLUMN exam_records.exam_name IS '考试名称，如"第5期考试"';
COMMENT ON COLUMN exam_records.exam_type IS '考试类型：国考真题、国考模考、省考真题、省考模考、其他';
COMMENT ON COLUMN exam_records.index_number IS '索引号，用于排序，必须唯一（每个用户）';
COMMENT ON COLUMN exam_records.rating IS '星级评分，支持半星（0-5）';
COMMENT ON COLUMN exam_records.include_in_analysis IS '是否包含在趋势分析中';
COMMENT ON COLUMN exam_records.is_deleted IS '软删除标记';

-- ----------------------------------------------------------------------------
-- 3. module_scores 表 - 模块成绩表
-- ----------------------------------------------------------------------------
-- 说明：存储每次考试各模块的详细成绩
-- 关联：exam_records (exam_record_id)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS module_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_record_id UUID NOT NULL REFERENCES exam_records(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,                     -- 模块名称
  parent_module TEXT,                            -- 父模块名称（用于二级模块）
  total_questions INTEGER NOT NULL,              -- 总题数
  correct_answers INTEGER NOT NULL,              -- 答对数
  accuracy_rate NUMERIC(5,2),                    -- 正确率（自动计算）
  time_used INTEGER,                             -- 用时（秒）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 约束
  CONSTRAINT valid_questions CHECK (total_questions > 0),
  CONSTRAINT valid_correct CHECK (correct_answers >= 0 AND correct_answers <= total_questions)
);

-- 添加注释
COMMENT ON TABLE module_scores IS '模块成绩表';
COMMENT ON COLUMN module_scores.module_name IS '模块名称，如"政治理论"、"马克思主义"';
COMMENT ON COLUMN module_scores.parent_module IS '父模块名称，NULL 表示一级模块';
COMMENT ON COLUMN module_scores.accuracy_rate IS '正确率，由触发器自动计算';

-- ----------------------------------------------------------------------------
-- 4. user_settings 表 - 用户设置表
-- ----------------------------------------------------------------------------
-- 说明：存储用户的个性化设置
-- 关联：profiles (user_id)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,                     -- 设置键
  setting_value TEXT NOT NULL,                   -- 设置值
  setting_type TEXT DEFAULT 'string',            -- 设置类型
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 约束
  CONSTRAINT unique_user_setting UNIQUE(user_id, setting_key),
  CONSTRAINT valid_setting_type CHECK (setting_type IN ('string', 'number', 'boolean', 'date', 'json'))
);

-- 添加注释
COMMENT ON TABLE user_settings IS '用户设置表';
COMMENT ON COLUMN user_settings.setting_key IS '设置键，如 theme、exam_target_score';
COMMENT ON COLUMN user_settings.setting_value IS '设置值';
COMMENT ON COLUMN user_settings.setting_type IS '设置类型：string、number、boolean、date、json';

-- ----------------------------------------------------------------------------
-- 5. orders 表 - 订单表
-- ----------------------------------------------------------------------------
-- 说明：存储 VIP 会员订单信息
-- 关联：profiles (user_id)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT UNIQUE NOT NULL,                 -- 订单号
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,                       -- 收货人姓名
  user_phone TEXT NOT NULL,                      -- 收货人手机号
  user_address TEXT NOT NULL,                    -- 收货地址
  status TEXT DEFAULT 'pending',                 -- 订单状态
  total_amount NUMERIC(10,2) NOT NULL,           -- 订单总金额
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 约束
  CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  CONSTRAINT valid_amount CHECK (total_amount > 0)
);

-- 添加注释
COMMENT ON TABLE orders IS '订单表';
COMMENT ON COLUMN orders.order_no IS '订单号，唯一';
COMMENT ON COLUMN orders.status IS '订单状态：pending（待支付）、paid（已支付）、cancelled（已取消）、refunded（已退款）';
COMMENT ON COLUMN orders.total_amount IS '订单总金额';

-- ----------------------------------------------------------------------------
-- 6. order_items 表 - 订单明细表
-- ----------------------------------------------------------------------------
-- 说明：存储订单中的商品明细
-- 关联：orders (order_id)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  sku_code TEXT NOT NULL,                        -- 商品 SKU 编码
  quantity INTEGER NOT NULL DEFAULT 1,           -- 数量
  unit_price NUMERIC(10,2) NOT NULL,             -- 单价
  total_price NUMERIC(10,2) NOT NULL,            -- 小计
  sku_snapshot JSONB NOT NULL,                   -- 商品快照
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 约束
  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_unit_price CHECK (unit_price > 0),
  CONSTRAINT valid_total_price CHECK (total_price > 0)
);

-- 添加注释
COMMENT ON TABLE order_items IS '订单明细表';
COMMENT ON COLUMN order_items.sku_code IS '商品 SKU 编码，如 VIP_QUARTER、VIP_ANNUAL';
COMMENT ON COLUMN order_items.sku_snapshot IS '商品快照（JSON），包含 name、duration_months、description';

-- ----------------------------------------------------------------------------
-- 表名：vip_applications
-- 说明：VIP 申请记录表（商家经营码支付方式）
-- 关联：auth.users (user_id), profiles (user_phone)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS vip_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_phone TEXT NOT NULL,                      -- 用户手机号
  plan_type TEXT NOT NULL,                       -- 套餐类型：monthly/quarterly/annual
  amount DECIMAL(10,2) NOT NULL,                 -- 支付金额
  status TEXT NOT NULL DEFAULT 'pending',        -- 状态：pending/approved/rejected
  form_url TEXT,                                 -- 外部表单链接（用户提交的支付信息）
  approved_at TIMESTAMPTZ,                       -- 审核通过时间
  approved_by UUID REFERENCES auth.users(id),    -- 审核人
  rejected_at TIMESTAMPTZ,                       -- 拒绝时间
  rejected_by UUID REFERENCES auth.users(id),    -- 拒绝人
  reject_reason TEXT,                            -- 拒绝原因
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 约束
  CONSTRAINT valid_plan_type CHECK (plan_type IN ('monthly', 'quarterly', 'annual')),
  CONSTRAINT valid_amount CHECK (amount > 0),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- 添加注释
COMMENT ON TABLE vip_applications IS 'VIP 申请记录表（商家经营码支付方式）';
COMMENT ON COLUMN vip_applications.plan_type IS '套餐类型：monthly=月度，quarterly=季度，annual=年度';
COMMENT ON COLUMN vip_applications.status IS '申请状态：pending=待审核，approved=已通过，rejected=已拒绝';
COMMENT ON COLUMN vip_applications.form_url IS '外部表单链接（腾讯问卷/金数据等）';

-- ============================================================================
-- 第二部分：创建索引
-- ============================================================================

-- profiles 表索引
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_vip ON profiles(is_vip, vip_expires_at);

-- exam_records 表索引
CREATE INDEX IF NOT EXISTS idx_exam_records_user ON exam_records(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_records_index ON exam_records(user_id, index_number);
CREATE INDEX IF NOT EXISTS idx_exam_records_created ON exam_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_records_analysis ON exam_records(user_id, include_in_analysis, is_deleted);
CREATE INDEX IF NOT EXISTS idx_exam_records_exam_number ON exam_records(exam_number);

-- module_scores 表索引
CREATE INDEX IF NOT EXISTS idx_module_scores_exam ON module_scores(exam_record_id);
CREATE INDEX IF NOT EXISTS idx_module_scores_module ON module_scores(module_name);
CREATE INDEX IF NOT EXISTS idx_module_scores_parent ON module_scores(parent_module);

-- user_settings 表索引
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings(user_id, setting_key);

-- orders 表索引
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- order_items 表索引
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_sku ON order_items(sku_code);

-- vip_applications 表索引
CREATE INDEX IF NOT EXISTS idx_vip_applications_user ON vip_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_applications_phone ON vip_applications(user_phone);
CREATE INDEX IF NOT EXISTS idx_vip_applications_status ON vip_applications(status);
CREATE INDEX IF NOT EXISTS idx_vip_applications_created ON vip_applications(created_at DESC);

-- ============================================================================
-- 第三部分：创建触发器和函数
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. 更新时间戳触发器函数
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为各表创建更新时间戳触发器
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_records_updated_at
  BEFORE UPDATE ON exam_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_scores_updated_at
  BEFORE UPDATE ON module_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vip_applications_updated_at
  BEFORE UPDATE ON vip_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 2. 自动计算正确率触发器函数
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION calculate_accuracy_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_questions > 0 THEN
    NEW.accuracy_rate := (NEW.correct_answers::NUMERIC / NEW.total_questions::NUMERIC) * 100;
  ELSE
    NEW.accuracy_rate := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_accuracy
  BEFORE INSERT OR UPDATE ON module_scores
  FOR EACH ROW
  EXECUTE FUNCTION calculate_accuracy_rate();

-- ----------------------------------------------------------------------------
-- 3. 自动创建用户资料触发器函数
-- ----------------------------------------------------------------------------
-- 说明：当新用户注册时，自动在 profiles 表中创建记录

--CREATE OR REPLACE FUNCTION handle_new_user()
--RETURNS TRIGGER AS $$
--BEGIN
--  INSERT INTO public.profiles (id, username, phone, is_vip, vip_expires_at)
--  VALUES (
--    NEW.id,
--    NEW.raw_user_meta_data->>'username',
--    NEW.phone,
--    FALSE,
--    NULL
--  );
--  RETURN NEW;
--END;
--$$ LANGUAGE plpgsql SECURITY DEFINER;
--
---- 创建触发器（如果 auth.users 表存在）
--DO $$
--BEGIN
--  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
--    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--    CREATE TRIGGER on_auth_user_created
--      AFTER INSERT ON auth.users
--      FOR EACH ROW
--      EXECUTE FUNCTION handle_new_user();
--  END IF;
--END $$;

-- 自定义触发器：插入public.users后自动创建profiles
CREATE OR REPLACE FUNCTION handle_custom_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, is_vip, vip_expires_at)
  VALUES (
    NEW.id,          -- 自建users表的用户ID
    NEW.phone,       -- 自建users表的手机号
    FALSE,           -- 默认非VIP
    NULL             -- VIP到期时间为空
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：监听public.users新增
DROP TRIGGER IF EXISTS on_custom_user_created ON public.users;
CREATE TRIGGER on_custom_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_custom_new_user();
-- ============================================================================
-- 第四部分：RLS 策略（默认禁用）
-- ============================================================================

-- 注意：以下 RLS 策略默认禁用，适用于开发环境
-- 生产环境部署时，请取消注释并启用 RLS 策略

/*
-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- profiles 表策略
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- exam_records 表策略
CREATE POLICY "Users can view own exam records"
  ON exam_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exam records"
  ON exam_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exam records"
  ON exam_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exam records"
  ON exam_records FOR DELETE
  USING (auth.uid() = user_id);

-- module_scores 表策略
CREATE POLICY "Users can view own module scores"
  ON module_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exam_records
      WHERE exam_records.id = module_scores.exam_record_id
      AND exam_records.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own module scores"
  ON module_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_records
      WHERE exam_records.id = module_scores.exam_record_id
      AND exam_records.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own module scores"
  ON module_scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM exam_records
      WHERE exam_records.id = module_scores.exam_record_id
      AND exam_records.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own module scores"
  ON module_scores FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM exam_records
      WHERE exam_records.id = module_scores.exam_record_id
      AND exam_records.user_id = auth.uid()
    )
  );

-- user_settings 表策略
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- orders 表策略
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- order_items 表策略
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- vip_applications 表策略
-- 启用 RLS
ALTER TABLE vip_applications ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的申请记录
CREATE POLICY "Users can view own vip applications"
  ON vip_applications FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以创建申请记录
CREATE POLICY "Users can create vip applications"
  ON vip_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 管理员可以查看所有申请记录
CREATE POLICY "Admins can view all vip applications"
  ON vip_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 管理员可以更新申请状态
CREATE POLICY "Admins can update vip applications"
  ON vip_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
*/

-- ============================================================================
-- 第五部分：初始数据（可选）
-- ============================================================================

-- 注意：以下初始数据仅用于测试，生产环境请删除或修改

/*
-- 插入示例用户设置
INSERT INTO user_settings (user_id, setting_key, setting_value, setting_type)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'theme', 'light', 'string'),
  ('00000000-0000-0000-0000-000000000000', 'exam_target_score', '80', 'number'),
  ('00000000-0000-0000-0000-000000000000', 'countdown_date', '2024-12-31', 'date'),
  ('00000000-0000-0000-0000-000000000000', 'countdown_label', '国考', 'string')
ON CONFLICT (user_id, setting_key) DO NOTHING;
*/

-- ============================================================================
-- 第六部分：验证脚本
-- ============================================================================

-- 查看所有表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 查看所有索引
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 查看所有触发器
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 完成
-- ============================================================================

-- 输出成功消息
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '数据库设置完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '已创建以下表：';
  RAISE NOTICE '  - profiles (用户资料表)';
  RAISE NOTICE '  - exam_records (考试记录表)';
  RAISE NOTICE '  - module_scores (模块成绩表)';
  RAISE NOTICE '  - user_settings (用户设置表)';
  RAISE NOTICE '  - orders (订单表)';
  RAISE NOTICE '  - order_items (订单明细表)';
  RAISE NOTICE '';
  RAISE NOTICE '已创建所有必需的索引和触发器';
  RAISE NOTICE '';
  RAISE NOTICE '注意：RLS 策略默认禁用';
  RAISE NOTICE '生产环境请启用 RLS 策略（见文档）';
  RAISE NOTICE '========================================';
END $$;
