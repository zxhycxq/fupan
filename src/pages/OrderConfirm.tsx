import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Button, message, Divider } from 'antd';
import { ShoppingCartOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { createPaymentOrder } from '@/db/api';
import dayjs from 'dayjs';

interface SKU {
  sku_code: string;
  name: string;
  price: number;
  duration_months: number;
  features: Array<{ text: string; included: boolean }>;
}

const skuMap: Record<string, SKU> = {
  free: {
    sku_code: 'VIP_FREE',
    name: '免费版',
    price: 0,
    duration_months: 0,
    features: [],
  },
  basic: {
    sku_code: 'VIP_BASIC',
    name: '基础版',
    price: 9,
    duration_months: 12,
    features: [],
  },
};

export default function OrderConfirm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);

  const planId = searchParams.get('plan') || 'basic';
  const sku = skuMap[planId];

  useEffect(() => {
    if (!sku) {
      message.error('无效的套餐类型');
      navigate('/');
    }
  }, [sku, navigate]);

  if (!sku) {
    return null;
  }

  const subtotal: number = sku.price * quantity;
  const discount: number = 0; // 暂无优惠
  const shipping: number = 0; // 虚拟商品无运费
  const total: number = subtotal - discount + shipping;

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const result = await createPaymentOrder({
        sku_code: sku.sku_code,
        quantity: quantity || 1,
        user_name: values.user_name,
        user_address: values.user_address,
        user_phone: values.user_phone,
      });

      if (result.success) {
        // 跳转到订单详情页面
        navigate(`/order-detail/${result.order_no}`);
      } else {
        message.error(result.error || '创建订单失败');
      }
    } catch (error: any) {
      message.error(error.message || '创建订单失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="shadow-sm">
          {/* 页面标题 */}
          <div className="mb-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCartOutlined />
              确认订单
            </h1>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              quantity: 1,
            }}
          >
            {/* 商品信息 */}
            <div className="mb-4">
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <ShoppingCartOutlined />
                商品信息
              </h2>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-medium">{sku.name}</div>
                    <div className="text-gray-500 text-sm mt-1">
                      有效期：{sku.duration_months > 0 ? `${sku.duration_months}个月` : '永久'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-primary text-lg font-bold">¥{sku.price.toFixed(2)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600">数量：</span>
                  <InputNumber
                    min={1}
                    max={10}
                    value={quantity}
                    onChange={(value) => setQuantity(value || 1)}
                    className="w-20"
                    size="small"
                  />
                  <span className="text-gray-500 ml-auto">
                    小计：¥{subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <Divider className="my-4" />

            {/* 买家信息 */}
            <div className="mb-4">
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <UserOutlined />
                买家信息
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Form.Item
                  label={<span className="text-sm">姓名</span>}
                  name="user_name"
                  rules={[{ required: true, message: '请输入姓名' }]}
                  className="mb-3"
                >
                  <Input placeholder="请输入姓名" prefix={<UserOutlined />} size="middle" />
                </Form.Item>

                <Form.Item
                  label={<span className="text-sm">手机号</span>}
                  name="user_phone"
                  rules={[
                    { required: true, message: '请输入手机号' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                  ]}
                  className="mb-3"
                >
                  <Input placeholder="请输入手机号" prefix={<PhoneOutlined />} size="middle" />
                </Form.Item>
              </div>

              <Form.Item
                label={<span className="text-sm">地址</span>}
                name="user_address"
                rules={[{ required: true, message: '请输入地址' }]}
                className="mb-0"
              >
                <Input.TextArea
                  placeholder="请输入详细地址（省市区+街道+门牌号）"
                  rows={2}
                  size="middle"
                />
              </Form.Item>
            </div>

            <Divider className="my-4" />

            {/* 金额明细 */}
            <div className="mb-4">
              <h2 className="text-base font-semibold mb-3">金额明细</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>商品总价：</span>
                  <span>¥{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>运费：</span>
                  <span>{shipping === 0 ? '免运费' : `¥${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>购买时间：</span>
                  <span>{dayjs().format('YYYY-MM-DD HH:mm:ss')}</span>
                </div>
                <Divider className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>实付款：</span>
                  <span className="text-primary">¥{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* 提交按钮 */}
            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                className="h-11 text-base font-medium"
              >
                {loading ? '正在创建订单...' : '提交订单'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
