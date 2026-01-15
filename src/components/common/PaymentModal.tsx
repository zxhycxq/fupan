import { Modal, Button } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface PaymentModalProps {
  open: boolean;
  onCancel: () => void;
}

interface Feature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  unit: string;
  description: string;
  features: Feature[];
  isPopular?: boolean;
  buttonText: string;
  buttonType: 'default' | 'primary';
}

const plans: Plan[] = [
  {
    id: 'free',
    name: '免费版',
    price: 0,
    unit: '/年',
    description: '适合初次体验的用户',
    buttonText: '免费开始',
    buttonType: 'default',
    features: [
      { text: '共计3次考试成绩记录', included: true },
      { text: '基础数据可视化', included: true },
      { text: '考试日历', included: true },
      { text: '模考计时等各种小工具', included: true },
      { text: '错题本功能', included: true },
      { text: '历史趋势追踪', included: false },
      { text: '新功能尝鲜', included: false },
      { text: '优先客服支持', included: false },
    ],
  },
  {
    id: 'basic',
    name: '基础版',
    price: 9,
    unit: '/年',
    description: '适合认真备考的考生',
    buttonText: '立即订阅',
    buttonType: 'primary',
    isPopular: true,
    features: [
      { text: '所有免费版权益', included: true },
      { text: '上传考试成绩记录不限次数', included: true },
      { text: '完整数据可视化', included: true },
      { text: '历次考试数据 Excel 格式导出', included: true },
      { text: '更多主题等的设置', included: true },
      { text: '新功能优先使用', included: true },
      { text: '优先客服支持', included: true },
    ],
  },
];

export default function PaymentModal({ open, onCancel }: PaymentModalProps) {
  const navigate = useNavigate();

  const handlePurchase = (planId: string) => {
    if (planId === 'free') {
      // 免费版直接关闭弹窗
      onCancel();
      return;
    }

    // 跳转到订单确认页面
    navigate(`/order-confirm?plan=${planId}`);
    onCancel();
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1100}
      centered
      styles={{
        body: { padding: '40px 24px' }
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl p-8 ${
              plan.isPopular
                ? 'border-2 border-primary shadow-lg'
                : 'border border-gray-200'
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-6 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  最受欢迎
                </div>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-primary">¥{plan.price}</span>
                <span className="text-gray-500">{plan.unit}</span>
              </div>
            </div>

            <Button
              type={plan.buttonType}
              size="large"
              block
              className={`mb-6 h-12 text-base font-medium ${
                plan.isPopular
                  ? 'bg-gradient-to-r from-orange-400 to-pink-500 border-none hover:opacity-90'
                  : ''
              }`}
              style={
                plan.isPopular
                  ? {
                      background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                      color: 'white',
                    }
                  : plan.buttonType === 'default'
                  ? {
                      background: '#fef3e2',
                      color: '#d97706',
                      borderColor: '#fbbf24',
                    }
                  : undefined
              }
              onClick={() => handlePurchase(plan.id)}
            >
              {plan.buttonText}
            </Button>

            <div className="space-y-3">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  {feature.included ? (
                    <CheckOutlined className="text-primary mt-1 flex-shrink-0" />
                  ) : (
                    <CloseOutlined className="text-gray-300 mt-1 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      feature.included ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  >
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
