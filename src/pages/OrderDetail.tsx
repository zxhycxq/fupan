import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin, Result, Button, Descriptions, Tag, message } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import QRCode from 'qrcode';
import { getOrderDetail } from '@/db/api';

interface Order {
  id: string;
  order_no: string;
  user_name: string;
  user_address: string;
  user_phone: string;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  wechat_pay_url: string | null;
  total_amount: number;
  created_at: string;
  items: Array<{
    sku_code: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    sku_snapshot: {
      name: string;
      duration_months: number;
    };
  }>;
}

const statusMap = {
  pending: { text: '待支付', color: 'warning', icon: <ClockCircleOutlined /> },
  paid: { text: '已支付', color: 'success', icon: <CheckCircleOutlined /> },
  cancelled: { text: '已取消', color: 'default', icon: <CloseCircleOutlined /> },
  refunded: { text: '已退款', color: 'error', icon: <CloseCircleOutlined /> },
};

export default function OrderDetail() {
  const { orderNo } = useParams<{ orderNo: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [polling, setPolling] = useState(false);

  // 获取订单详情
  const fetchOrderDetail = async () => {
    if (!orderNo) return;

    try {
      const result = await getOrderDetail(orderNo);
      if (result.success && result.data) {
        setOrder(result.data);

        // 如果有支付 URL，生成二维码
        if (result.data.wechat_pay_url) {
          const qrUrl = await QRCode.toDataURL(result.data.wechat_pay_url, {
            width: 300,
            margin: 2,
          });
          setQrCodeUrl(qrUrl);
        }

        // 如果订单状态是待支付，开始轮询
        if (result.data.status === 'pending') {
          setPolling(true);
        } else {
          setPolling(false);
        }
      } else {
        message.error(result.error || '获取订单详情失败');
      }
    } catch (error: any) {
      message.error(error.message || '获取订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderNo]);

  // 轮询订单状态
  useEffect(() => {
    if (!polling) return;

    const timer = setInterval(() => {
      fetchOrderDetail();
    }, 2000); // 每2秒轮询一次

    return () => clearInterval(timer);
  }, [polling, orderNo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Result
          status="404"
          title="订单不存在"
          subTitle="抱歉，您访问的订单不存在或已被删除"
          extra={
            <Button type="primary" onClick={() => navigate('/')}>
              返回首页
            </Button>
          }
        />
      </div>
    );
  }

  const statusInfo = statusMap[order.status];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 订单状态 */}
        {order.status === 'paid' && (
          <Result
            status="success"
            title="支付成功！"
            subTitle={`订单号：${order.order_no}`}
            extra={[
              <Button type="primary" key="home" onClick={() => navigate('/')}>
                返回首页
              </Button>,
            ]}
          />
        )}

        {/* 待支付状态 */}
        {order.status === 'pending' && (
          <Card className="mb-6 shadow-sm">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">请使用微信扫码支付</h2>
              {qrCodeUrl && (
                <div className="flex justify-center mb-4">
                  <img src={qrCodeUrl} alt="支付二维码" className="border-4 border-gray-200 rounded-lg" />
                </div>
              )}
              <p className="text-gray-500 mb-2">订单号：{order.order_no}</p>
              <p className="text-primary text-2xl font-bold mb-4">¥{order.total_amount.toFixed(2)}</p>
              <p className="text-gray-400 text-sm">支付完成后，页面将自动跳转</p>
            </div>
          </Card>
        )}

        {/* 订单详情 */}
        <Card title="订单详情" className="shadow-sm">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="订单号">{order.order_no}</Descriptions.Item>
            <Descriptions.Item label="订单状态">
              <Tag color={statusInfo.color} icon={statusInfo.icon}>
                {statusInfo.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(order.created_at).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="订单金额">
              <span className="text-primary text-lg font-bold">¥{order.total_amount.toFixed(2)}</span>
            </Descriptions.Item>
          </Descriptions>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">商品信息</h3>
            {order.items.map((item, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{item.sku_snapshot.name}</div>
                    <div className="text-gray-500 text-sm mt-1">
                      有效期：{item.sku_snapshot.duration_months > 0 ? `${item.sku_snapshot.duration_months}个月` : '永久'}
                    </div>
                    <div className="text-gray-500 text-sm">数量：{item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-500 text-sm">单价：¥{item.unit_price.toFixed(2)}</div>
                    <div className="text-primary font-bold">小计：¥{item.total_price.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">买家信息</h3>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="姓名">{order.user_name}</Descriptions.Item>
              <Descriptions.Item label="手机号">{order.user_phone}</Descriptions.Item>
              <Descriptions.Item label="地址">{order.user_address}</Descriptions.Item>
            </Descriptions>
          </div>
        </Card>
      </div>
    </div>
  );
}
