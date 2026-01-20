-- 创建用户会员信息表
CREATE TABLE IF NOT EXISTS user_vip (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  is_vip BOOLEAN DEFAULT FALSE NOT NULL,
  vip_start_date TIMESTAMPTZ,
  vip_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 创建会员订单表
CREATE TABLE IF NOT EXISTS vip_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_no TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  duration_months INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  paid_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_vip_user_id ON user_vip(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vip_end_date ON user_vip(vip_end_date);
CREATE INDEX IF NOT EXISTS idx_vip_orders_user_id ON vip_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_orders_order_no ON vip_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_vip_orders_status ON vip_orders(status);

-- 启用 RLS
ALTER TABLE user_vip ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_orders ENABLE ROW LEVEL SECURITY;

-- user_vip 表的 RLS 策略
-- 用户可以查看自己的会员信息
CREATE POLICY "用户可以查看自己的会员信息"
  ON user_vip
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以插入自己的会员信息（首次创建）
CREATE POLICY "用户可以插入自己的会员信息"
  ON user_vip
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 管理员可以更新会员信息（通过 service_role 执行）
-- 普通用户不能更新会员信息

-- vip_orders 表的 RLS 策略
-- 用户可以查看自己的订单
CREATE POLICY "用户可以查看自己的订单"
  ON vip_orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以创建自己的订单
CREATE POLICY "用户可以创建自己的订单"
  ON vip_orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 添加注释
COMMENT ON TABLE user_vip IS '用户会员信息表';
COMMENT ON TABLE vip_orders IS '会员订单记录表';
COMMENT ON COLUMN user_vip.is_vip IS '是否为VIP会员';
COMMENT ON COLUMN user_vip.vip_start_date IS 'VIP开始时间';
COMMENT ON COLUMN user_vip.vip_end_date IS 'VIP到期时间';
COMMENT ON COLUMN vip_orders.order_no IS '订单号';
COMMENT ON COLUMN vip_orders.amount IS '订单金额';
COMMENT ON COLUMN vip_orders.duration_months IS '会员时长（月）';
COMMENT ON COLUMN vip_orders.status IS '订单状态：pending-待支付, paid-已支付, refunded-已退款';
COMMENT ON COLUMN vip_orders.payment_method IS '支付方式：alipay-支付宝, wechat-微信, bank-银行转账';
COMMENT ON COLUMN vip_orders.transaction_id IS '交易流水号';