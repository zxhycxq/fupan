import { Modal, Button, Card, Space, Typography, Tag } from 'antd'
import { Crown, Check, X } from 'lucide-react'

const { Title, Paragraph, Text } = Typography

interface VipBenefitsModalProps {
  open: boolean
  onClose: () => void
  onUpgrade?: () => void
  currentFeature?: string
}

/**
 * VIP 权益弹窗组件
 * 展示 VIP 会员权益和升级入口
 */
export function VipBenefitsModal({
  open,
  onClose,
  onUpgrade,
  currentFeature,
}: VipBenefitsModalProps) {
  const featureNames: Record<string, string> = {
    'export-excel': '导出Excel',
    'theme-settings': '主题肤色设置',
    'rank-settings': '等级称谓设置',
    'unlimited-records': '无限考试记录',
  }

  const benefits = [
    {
      title: '无限考试记录',
      free: '最多3条',
      vip: '无限制',
      icon: '📊',
    },
    {
      title: '导出Excel功能',
      free: false,
      vip: true,
      icon: '📥',
    },
    {
      title: '主题肤色设置',
      free: false,
      vip: true,
      icon: '🎨',
    },
    {
      title: '等级称谓设置',
      free: false,
      vip: true,
      icon: '🏆',
    },
    {
      title: '数据分析报告',
      free: '基础版',
      vip: '完整版',
      icon: '📈',
    },
    {
      title: '优先客服支持',
      free: false,
      vip: true,
      icon: '💬',
    },
  ]

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
      styles={{
        body: { padding: 0 }
      }}
    >
      <div className="p-6">
        {/* 标题 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 mb-4">
            <Crown className="w-8 h-8 text-white fill-white" />
          </div>
          <Title level={2} className="mb-2">
            升级VIP会员
          </Title>
          {currentFeature && (
            <Paragraph className="text-muted-foreground">
              <Text type="warning" strong>
                {featureNames[currentFeature] || '该功能'}
              </Text>
              {' '}需要VIP会员权限
            </Paragraph>
          )}
        </div>

        {/* 权益对比 */}
        <Card className="mb-6">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4 pb-3 border-b">
              <div className="font-semibold">功能</div>
              <div className="text-center font-semibold text-muted-foreground">
                免费用户
              </div>
              <div className="text-center font-semibold text-yellow-600">
                <Crown className="w-4 h-4 inline mr-1 fill-yellow-500" />
                VIP会员
              </div>
            </div>

            {benefits.map((benefit, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 items-center py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{benefit.icon}</span>
                  <span>{benefit.title}</span>
                </div>
                <div className="text-center">
                  {typeof benefit.free === 'boolean' ? (
                    benefit.free ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    )
                  ) : (
                    <Text type="secondary">{benefit.free}</Text>
                  )}
                </div>
                <div className="text-center">
                  {typeof benefit.vip === 'boolean' ? (
                    benefit.vip ? (
                      <Check className="w-5 h-5 text-yellow-600 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    )
                  ) : (
                    <Text strong className="text-yellow-600">
                      {benefit.vip}
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 套餐选择 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card
            hoverable
            className="border-2 border-border hover:border-primary transition-colors"
          >
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">季度会员</div>
              <div className="mb-3">
                <span className="text-3xl font-bold text-primary">¥99</span>
                <span className="text-muted-foreground">/3个月</span>
              </div>
              <div className="text-sm text-muted-foreground">
                平均 ¥33/月
              </div>
            </div>
          </Card>

          <Card
            hoverable
            className="border-2 border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20"
          >
            <div className="text-center">
              <Tag color="gold" className="mb-2">
                推荐
              </Tag>
              <div className="text-lg font-semibold mb-2">年度会员</div>
              <div className="mb-3">
                <span className="text-3xl font-bold text-yellow-600">¥299</span>
                <span className="text-muted-foreground">/12个月</span>
              </div>
              <div className="text-sm text-yellow-600 font-medium">
                立省 ¥97
              </div>
            </div>
          </Card>
        </div>

        {/* 操作按钮 */}
        <Space className="w-full" direction="vertical" size="middle">
          <Button
            type="primary"
            size="large"
            block
            icon={<Crown className="w-4 h-4" />}
            onClick={() => {
              onUpgrade?.()
              onClose()
            }}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 border-0"
          >
            立即升级VIP
          </Button>
          <Button size="large" block onClick={onClose}>
            暂不升级
          </Button>
        </Space>

        {/* 说明文字 */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>升级后立即生效，享受全部VIP权益</p>
        </div>
      </div>
    </Modal>
  )
}
