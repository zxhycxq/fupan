import { Modal, Button, Space, Typography, Card, Alert } from 'antd';
import { CrownOutlined, CheckCircleOutlined, LinkOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface VipPaymentModalProps {
  visible: boolean;
  onCancel: () => void;
}

// 会员套餐配置
const VIP_PACKAGES = [
  {
    id: 'quarter',
    name: '季度会员',
    duration: '3个月',
    price: '¥99',
    features: [
      '无限次上传考试成绩',
      '详细的成绩分析报告',
      '个性化学习建议',
      '历史数据对比',
      '优先客服支持',
    ],
  },
  {
    id: 'year',
    name: '年度会员',
    duration: '12个月',
    price: '¥299',
    originalPrice: '¥396',
    discount: '立省¥97',
    features: [
      '包含季度会员所有功能',
      '更长的数据保存期限',
      '专属学习计划定制',
      '考试提醒服务',
      '优先体验新功能',
    ],
    recommended: true,
  },
];

// 支付链接配置（可以在这里配置飞书表单或支付文章链接）
const PAYMENT_CONFIG = {
  // 飞书表单链接（从环境变量读取，或使用默认值）
  feishuFormUrl: import.meta.env.VITE_FEISHU_FORM_URL || 'https://example.feishu.cn/share/base/form/shrcn...',
  
  // 或者支付文章链接（从环境变量读取，或使用默认值）
  paymentArticleUrl: import.meta.env.VITE_PAYMENT_ARTICLE_URL || 'https://your-domain.com/payment-guide',
  
  // 当前使用的支付方式（从环境变量读取，或使用默认值 'article'）
  paymentType: (import.meta.env.VITE_PAYMENT_TYPE || 'article') as 'feishu' | 'article',
};

export default function VipPaymentModal({ visible, onCancel }: VipPaymentModalProps) {
  const handlePayment = (packageId: string) => {
    // 根据配置的支付方式跳转
    const url = PAYMENT_CONFIG.paymentType === 'feishu' 
      ? PAYMENT_CONFIG.feishuFormUrl 
      : PAYMENT_CONFIG.paymentArticleUrl;
    
    // 可以在URL中添加套餐信息
    const paymentUrl = `${url}?package=${packageId}`;
    
    // 在新窗口打开支付链接
    window.open(paymentUrl, '_blank');
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      centered
      title={
        <div className="flex items-center gap-2">
          <CrownOutlined className="text-yellow-500" />
          <span>开通会员</span>
        </div>
      }
    >
      <div className="py-4">
        {/* 说明提示 */}
        <Alert
          message="支付说明"
          description={
            <div className="space-y-2">
              <div>1. 选择您需要的会员套餐，点击"去付款"按钮</div>
              <div>2. 在打开的页面中完成支付</div>
              <div>3. 支付完成后，请联系客服提供支付凭证</div>
              <div>4. 客服确认后将在24小时内为您开通会员</div>
            </div>
          }
          type="info"
          showIcon
          className="mb-6"
        />

        {/* 套餐选择 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VIP_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`
                relative transition-all hover:shadow-lg
                ${pkg.recommended ? 'border-2 border-yellow-500' : ''}
              `}
            >
              {/* 推荐标签 */}
              {pkg.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 py-1 rounded-full text-xs font-medium shadow-md">
                    推荐
                  </div>
                </div>
              )}

              <div className="text-center mb-4">
                <Title level={4} className="mb-2">
                  {pkg.name}
                </Title>
                <div className="flex items-baseline justify-center gap-2">
                  <Text className="text-3xl font-bold text-primary">
                    {pkg.price}
                  </Text>
                  {pkg.originalPrice && (
                    <Text delete type="secondary" className="text-sm">
                      {pkg.originalPrice}
                    </Text>
                  )}
                </div>
                <Text type="secondary" className="text-sm">
                  {pkg.duration}
                </Text>
                {pkg.discount && (
                  <div className="mt-2">
                    <Text className="text-red-500 text-sm font-medium">
                      {pkg.discount}
                    </Text>
                  </div>
                )}
              </div>

              {/* 功能列表 */}
              <div className="space-y-2 mb-6">
                {pkg.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircleOutlined className="text-green-500 mt-1 flex-shrink-0" />
                    <Text className="text-sm">{feature}</Text>
                  </div>
                ))}
              </div>

              {/* 购买按钮 */}
              <Button
                type={pkg.recommended ? 'primary' : 'default'}
                size="large"
                block
                icon={<LinkOutlined />}
                onClick={() => handlePayment(pkg.id)}
                className={pkg.recommended ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 border-0' : ''}
              >
                去付款
              </Button>
            </Card>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <Paragraph className="text-sm text-gray-600 mb-2">
            <strong>温馨提示：</strong>
          </Paragraph>
          <ul className="text-sm text-gray-600 space-y-1 pl-4">
            <li>会员权益自开通之日起计算</li>
            <li>支付完成后请保存支付凭证，以便客服核实</li>
            <li>如有任何问题，请联系客服：support@example.com</li>
            <li>会员到期前7天会通过邮件提醒您续费</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
