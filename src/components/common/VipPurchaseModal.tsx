import { Modal, Radio, Button, Space, Typography, Divider } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Title, Text } = Typography;

interface VipPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
  features: {
    name: string;
    included: boolean;
  }[];
  recommended?: boolean;
}

interface VipPurchaseModalProps {
  visible: boolean;
  onCancel: () => void;
  onPurchase?: (planId: string) => void;
}

const VIP_PLANS: VipPlan[] = [
  {
    id: 'monthly',
    name: '月度会员',
    price: 19.9,
    period: '每月',
    features: [
      { name: '无限次考试记录', included: true },
      { name: '数据总览分析', included: true },
      { name: '各模块详细分析', included: true },
      { name: '考试倒计时', included: true },
      { name: '数据导出功能', included: true },
      { name: '优先客服支持', included: false },
      { name: '学习建议推送', included: false },
    ],
  },
  {
    id: 'quarterly',
    name: '季度会员',
    price: 49.9,
    originalPrice: 59.7,
    period: '每季度',
    features: [
      { name: '无限次考试记录', included: true },
      { name: '数据总览分析', included: true },
      { name: '各模块详细分析', included: true },
      { name: '考试倒计时', included: true },
      { name: '数据导出功能', included: true },
      { name: '优先客服支持', included: true },
      { name: '学习建议推送', included: false },
    ],
    recommended: true,
  },
  {
    id: 'yearly',
    name: '年度会员',
    price: 168.0,
    originalPrice: 238.8,
    period: '每年',
    features: [
      { name: '无限次考试记录', included: true },
      { name: '数据总览分析', included: true },
      { name: '各模块详细分析', included: true },
      { name: '考试倒计时', included: true },
      { name: '数据导出功能', included: true },
      { name: '优先客服支持', included: true },
      { name: '学习建议推送', included: true },
    ],
  },
];

export default function VipPurchaseModal({ visible, onCancel, onPurchase }: VipPurchaseModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('quarterly');

  const handlePurchase = () => {
    if (onPurchase) {
      onPurchase(selectedPlan);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
      centered
      title={
        <div className="text-center">
          <Title level={3} className="mb-2">选择方案</Title>
          <Text type="secondary" className="text-sm">
            感谢您对我们服务的关注，我们提供多种订阅套餐，以满足您的不同需求。请在下方选择套餐，即可开始享受我们高效功能的各项优势。
          </Text>
        </div>
      }
    >
      <div className="py-6">
        <Radio.Group
          value={selectedPlan}
          onChange={(e) => setSelectedPlan(e.target.value)}
          className="w-full"
        >
          <Space direction="vertical" size={16} className="w-full">
            {VIP_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                    推荐
                  </div>
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Radio value={plan.id} className="mt-1" />
                    
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3 mb-2">
                        <Title level={4} className="mb-0">{plan.name}</Title>
                        <div className="flex items-baseline gap-2">
                          <Text className="text-2xl font-bold text-primary">
                            ¥{plan.price}
                          </Text>
                          {plan.originalPrice && (
                            <Text delete type="secondary" className="text-sm">
                              ¥{plan.originalPrice}
                            </Text>
                          )}
                          <Text type="secondary" className="text-sm">
                            / {plan.period}
                          </Text>
                        </div>
                      </div>

                      <Divider className="my-3" />

                      <div className="space-y-2">
                        <Text strong className="block mb-2">特征</Text>
                        <div className="grid grid-cols-2 gap-2">
                          {plan.features.map((feature, index) => (
                            <div
                              key={index}
                              className={`flex items-center gap-2 ${
                                feature.included ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                            >
                              {feature.included ? (
                                <CheckOutlined className="text-primary" />
                              ) : (
                                <CloseOutlined className="text-muted-foreground" />
                              )}
                              <Text className={feature.included ? '' : 'line-through'}>
                                {feature.name}
                              </Text>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Space>
        </Radio.Group>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={handlePurchase} size="large">
            订阅
          </Button>
        </div>
      </div>
    </Modal>
  );
}
