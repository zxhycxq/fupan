-- 创建订单状态枚举
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');

-- 创建 SKU 表（会员套餐）
CREATE TABLE public.sku (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    duration_months INT NOT NULL DEFAULT 12, -- 会员时长（月）
    features JSONB NOT NULL DEFAULT '[]'::jsonb, -- 功能列表
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建订单表
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    user_phone TEXT, -- 如果未登录，使用手机号
    user_name TEXT NOT NULL, -- 收货人姓名
    user_address TEXT NOT NULL, -- 收货地址
    status order_status NOT NULL DEFAULT 'pending'::order_status,
    wechat_pay_url TEXT,
    total_amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INT NOT NULL DEFAULT 1 -- 乐观锁版本号
);

-- 创建订单明细表
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    sku_code TEXT NOT NULL REFERENCES public.sku(sku_code),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(12,2) NOT NULL,
    sku_snapshot JSONB NOT NULL, -- SKU 快照
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入会员套餐数据
INSERT INTO public.sku (sku_code, name, price, duration_months, features, is_active) VALUES
('VIP_FREE', '免费版', 0.00, 0, '[
  {"text": "共计3次考试成绩记录", "included": true},
  {"text": "基础数据可视化", "included": true},
  {"text": "考试日历", "included": true},
  {"text": "模考计时等各种小工具", "included": true},
  {"text": "错题本功能", "included": true},
  {"text": "历史趋势追踪", "included": false},
  {"text": "新功能尝鲜", "included": false},
  {"text": "优先客服支持", "included": false}
]'::jsonb, true),
('VIP_BASIC', '基础版', 9.00, 12, '[
  {"text": "所有免费版权益", "included": true},
  {"text": "上传考试成绩记录不限次数", "included": true},
  {"text": "完整数据可视化", "included": true},
  {"text": "历次考试数据 Excel 格式导出", "included": true},
  {"text": "更多主题等的设置", "included": true},
  {"text": "新功能优先使用", "included": true},
  {"text": "优先客服支持", "included": true}
]'::jsonb, true);

-- 创建索引
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_user_phone ON public.orders(user_phone);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_order_no ON public.orders(order_no);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- 启用 RLS
ALTER TABLE public.sku ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- SKU 表策略：所有人可读，只有管理员可写
CREATE POLICY "Anyone can view active SKUs" ON public.sku
    FOR SELECT USING (is_active = true);

-- 订单表策略：用户只能查看自己的订单
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (auth.uid() IS NULL AND user_phone IS NOT NULL)
    );

-- 订单明细表策略：用户只能查看自己订单的明细
CREATE POLICY "Users can view their own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND (orders.user_id = auth.uid() OR (auth.uid() IS NULL AND orders.user_phone IS NOT NULL))
        )
    );