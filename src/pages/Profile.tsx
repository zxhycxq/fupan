import { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Modal, Input, message, Spin, Alert, Space, Typography, Tag } from 'antd';
import { UserOutlined, PhoneOutlined, CalendarOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, DeleteOutlined, ExclamationCircleOutlined, CrownOutlined } from '@ant-design/icons';
import { getUserProfile, updateUsername, checkUsernameAvailability, softDeleteUserAccount, checkUserVipStatus } from '@/db/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import VipPaymentModal from '@/components/common/VipPaymentModal';
import LearningJourney from '@/components/profile/LearningJourney';

const { Title, Text } = Typography;

interface UserProfile {
  id: string;
  username: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

interface UsernameCheckResult {
  available: boolean;
  reason: string;
  message: string;
}

interface VipStatus {
  isVip: boolean;
  vipEndDate: string | null;
  daysRemaining: number | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameCheckResult, setUsernameCheckResult] = useState<UsernameCheckResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVipModalVisible, setIsVipModalVisible] = useState(false);
  const [vipStatus, setVipStatus] = useState<VipStatus>({
    isVip: false,
    vipEndDate: null,
    daysRemaining: null,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  // 防抖检查用户名
  useEffect(() => {
    if (!newUsername) {
      setUsernameCheckResult(null);
      return;
    }

    const timer = setTimeout(() => {
      checkUsername(newUsername);
    }, 500);

    return () => clearTimeout(timer);
  }, [newUsername]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await getUserProfile();
      setProfile(data);
      
      // 检查VIP状态
      const vipData = await checkUserVipStatus();
      setVipStatus(vipData);
    } catch (error) {
      console.error('加载用户资料失败:', error);
      message.error('加载用户资料失败');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsername = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameCheckResult(null);
      return;
    }

    try {
      setIsCheckingUsername(true);
      const result = await checkUsernameAvailability(username);
      setUsernameCheckResult(result);
    } catch (error) {
      console.error('检查用户名失败:', error);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleEditUsername = () => {
    setNewUsername(profile?.username || '');
    setUsernameCheckResult(null);
    setIsEditModalVisible(true);
  };

  const handleSaveUsername = async () => {
    if (!newUsername) {
      message.error('请输入昵称');
      return;
    }

    if (!usernameCheckResult?.available) {
      message.error(usernameCheckResult?.message || '昵称不可用');
      return;
    }

    try {
      setIsSaving(true);
      await updateUsername(newUsername);
      message.success('昵称更新成功');
      setIsEditModalVisible(false);
      await loadProfile();
    } catch (error: any) {
      console.error('更新昵称失败:', error);
      message.error(error.message || '更新昵称失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalVisible(false);
    setNewUsername('');
    setUsernameCheckResult(null);
  };

  // 删除账户确认
  const handleDeleteAccount = async () => {
    try {
      // 检查VIP状态
      const { isVip, vipEndDate } = await checkUserVipStatus();
      
      if (isVip && vipEndDate) {
        // 如果是VIP用户，显示VIP提醒的确认框
        showVipDeleteConfirm(vipEndDate);
      } else {
        // 非VIP用户，直接显示普通确认框
        showNormalDeleteConfirm();
      }
    } catch (error) {
      console.error('检查VIP状态失败:', error);
      // 出错时按非VIP处理
      showNormalDeleteConfirm();
    }
  };

  // VIP用户删除确认（需要输入确认文字）
  const showVipDeleteConfirm = (expiryDate: string) => {
    let confirmText = '';
    
    Modal.confirm({
      title: '确认删除所有数据',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div className="space-y-4">
          <Alert
            message="⚠️ VIP用户提醒"
            description={
              <div className="space-y-3">
                <p className="text-sm font-semibold text-orange-600">
                  您当前是VIP用户，会员有效期至：{dayjs(expiryDate).format('YYYY-MM-DD')}
                </p>
                <p className="text-sm text-orange-600">
                  删除数据后，您的VIP权益将无法恢复，且无法退款。
                </p>
              </div>
            }
            type="warning"
            showIcon
          />
          <Alert
            message="⚠️ 此操作不可逆"
            description={
              <div className="space-y-3">
                <p className="text-sm">
                  删除后将<span className="font-semibold text-red-600">清除</span>以下所有数据：
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>所有考试记录（包括成绩、用时等）</li>
                  <li>所有模块得分详情</li>
                  <li>所有个人设置和目标</li>
                  <li>考试倒计时配置</li>
                </ul>
                <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
                  <p className="text-sm text-red-700 font-semibold">
                    🚨 重要提示：
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-600 mt-2">
                    <li>数据将被<span className="font-bold">标记为已删除</span>，不再显示</li>
                    <li>删除后<span className="font-bold">无法恢复</span>任何数据</li>
                    <li>即使使用相同的手机号重新注册，也<span className="font-bold">不会关联</span>任何历史数据</li>
                    <li>删除前请确保已导出或备份重要数据</li>
                  </ul>
                </div>
              </div>
            }
            type="error"
            showIcon
          />
          <div className="mt-4">
            <p className="text-base font-medium mb-2">
              请输入"<span className="text-red-600 font-bold">确认删除用户</span>"以继续：
            </p>
            <Input
              placeholder="请输入：确认删除用户"
              onChange={(e) => { confirmText = e.target.value; }}
              onPressEnter={(e) => {
                if ((e.target as HTMLInputElement).value === '确认删除用户') {
                  Modal.destroyAll();
                  executeDelete();
                }
              }}
            />
          </div>
        </div>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      width: 600,
      onOk: () => {
        if (confirmText !== '确认删除用户') {
          message.error('请输入"确认删除用户"以继续');
          return Promise.reject();
        }
        return executeDelete();
      },
    });
  };

  // 普通用户删除确认
  const showNormalDeleteConfirm = () => {
    Modal.confirm({
      title: '确认删除所有数据',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div className="space-y-4">
          <Alert
            message="⚠️ 此操作不可逆"
            description={
              <div className="space-y-3">
                <p className="text-sm">
                  删除后将<span className="font-semibold text-red-600">清除</span>以下所有数据：
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>所有考试记录（包括成绩、用时等）</li>
                  <li>所有模块得分详情</li>
                  <li>所有个人设置和目标</li>
                  <li>考试倒计时配置</li>
                </ul>
                <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
                  <p className="text-sm text-red-700 font-semibold">
                    🚨 重要提示：
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-600 mt-2">
                    <li>数据将被<span className="font-bold">标记为已删除</span>，不再显示</li>
                    <li>删除后<span className="font-bold">无法恢复</span>任何数据</li>
                    <li>即使使用相同的手机号重新注册，也<span className="font-bold">不会关联</span>任何历史数据</li>
                    <li>删除前请确保已导出或备份重要数据</li>
                  </ul>
                </div>
              </div>
            }
            type="error"
            showIcon
          />
          <p className="text-base font-medium mt-4">
            确定要删除所有数据吗？
          </p>
        </div>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      width: 600,
      onOk: executeDelete,
    });
  };

  // 执行删除操作
  const executeDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await softDeleteUserAccount();
      
      if (!result.success) {
        message.error(result.error || '删除数据失败，请重试');
        setIsDeleting(false);
        return;
      }
      
      message.success('所有数据已删除');
      
      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        navigate('/dashboard');
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('删除数据失败:', error);
      message.error('删除数据失败，请重试');
      setIsDeleting(false);
    }
  };

  // 格式化手机号（隐藏中间4位）
  const formatPhone = (phone: string | null) => {
    if (!phone) return '未绑定';
    // 移除国家代码前缀
    const cleanPhone = phone.replace(/^\+?86/, '');
    if (cleanPhone.length === 11) {
      return `${cleanPhone.slice(0, 3)}****${cleanPhone.slice(7)}`;
    }
    return phone;
  };

  // 获取显示昵称
  const getDisplayName = () => {
    if (profile?.username) {
      return profile.username;
    }
    if (profile?.phone) {
      const cleanPhone = profile.phone.replace(/^\+?86/, '');
      return `用户_${cleanPhone.slice(-4)}`;
    }
    return '默认用户';
  };

  // 渲染用户名检查结果
  const renderUsernameCheckResult = () => {
    if (isCheckingUsername) {
      return (
        <div className="flex items-center gap-2 text-gray-500 mt-2">
          <LoadingOutlined />
          <span>检查中...</span>
        </div>
      );
    }

    if (!usernameCheckResult) {
      return null;
    }

    if (usernameCheckResult.available) {
      return (
        <div className="flex items-center gap-2 text-green-600 mt-2">
          <CheckCircleOutlined />
          <span>✅ {usernameCheckResult.message}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-red-600 mt-2">
        <CloseCircleOutlined />
        <span>❌ {usernameCheckResult.message}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert
          message="加载失败"
          description="无法加载用户资料，请刷新页面重试"
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Title level={2} className="mb-6">
        <UserOutlined className="mr-2" />
        个人中心
      </Title>

      {/* 账户信息卡片 */}
      <Card
        title="账户信息"
        className="mb-6"
        extra={
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEditUsername}
          >
            编辑昵称
          </Button>
        }
      >
        <Descriptions column={1} bordered>
          <Descriptions.Item label={<><UserOutlined className="mr-2" />昵称</>}>
            <Text strong>{getDisplayName()}</Text>
            {!profile.username && (
              <Text type="secondary" className="ml-2">
                （未设置，点击右上角编辑昵称）
              </Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label={<><CrownOutlined className="mr-2" />会员状态</>}>
            {vipStatus.isVip ? (
              <Space direction="vertical" size="small">
                <Tag color="gold" icon={<CrownOutlined />} className="text-base py-1 px-3">
                  VIP会员
                </Tag>
                {vipStatus.vipEndDate && (
                  <div className="text-sm">
                    <Text type="secondary">到期时间：</Text>
                    <Text strong>{dayjs(vipStatus.vipEndDate).format('YYYY-MM-DD')}</Text>
                    {vipStatus.daysRemaining !== null && vipStatus.daysRemaining > 0 && (
                      <Text type="warning" className="ml-2">
                        （剩余 {vipStatus.daysRemaining} 天）
                      </Text>
                    )}
                    {vipStatus.daysRemaining !== null && vipStatus.daysRemaining <= 0 && (
                      <Text type="danger" className="ml-2">
                        （已过期）
                      </Text>
                    )}
                  </div>
                )}
                <Button 
                  type="default" 
                  size="small"
                  onClick={() => setIsVipModalVisible(true)}
                >
                  续费会员
                </Button>
              </Space>
            ) : (
              <Space>
                <Tag color="default">普通用户</Tag>
                <Button 
                  type="primary" 
                  size="small"
                  icon={<CrownOutlined />}
                  onClick={() => setIsVipModalVisible(true)}
                >
                  去付款
                </Button>
              </Space>
            )}
          </Descriptions.Item>
          <Descriptions.Item label={<><PhoneOutlined className="mr-2" />手机号</>}>
            {formatPhone(profile.phone)}
          </Descriptions.Item>
          <Descriptions.Item label={<><CalendarOutlined className="mr-2" />注册时间</>}>
            {dayjs(profile.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label={<><CalendarOutlined className="mr-2" />最后更新</>}>
            {dayjs(profile.updated_at).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 会员功能预留区域 */}
      <Card title="会员服务" className="mb-6">
        <Alert
          message="会员功能即将上线"
          description="敬请期待更多会员专属功能和服务"
          type="info"
          showIcon
        />
      </Card>

      {/* 我的来时路 */}
      <LearningJourney />

      {/* 订单功能预留区域 */}
      <Card title="我的订单" className="mb-6">
        <Alert
          message="订单功能即将上线"
          description="您可以在这里查看和管理您的订单"
          type="info"
          showIcon
        />
      </Card>

      {/* 危险区域 - 删除账户 */}
      <Card
        title={
          <span className="text-red-600 flex items-center gap-2">
            <DeleteOutlined />
            危险区域
          </span>
        }
      >
        <Alert
          message="⚠️ 删除所有数据"
          description={
            <div className="space-y-3">
              <p className="text-sm">
                点击下方按钮将<span className="font-semibold text-red-600">永久删除</span>以下所有数据：
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>所有考试记录（包括成绩、用时等）</li>
                <li>所有模块得分详情</li>
                <li>所有个人设置和目标</li>
                <li>考试倒计时配置</li>
              </ul>
              <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
                <p className="text-sm text-red-700 font-semibold">
                  🚨 重要提示：
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-600 mt-2">
                  <li>数据将从后台数据库中<span className="font-bold">永久删除</span></li>
                  <li>删除后<span className="font-bold">无法恢复</span>任何数据</li>
                  <li>即使使用相同的手机号或邮箱重新注册，也<span className="font-bold">不会恢复</span>任何历史数据</li>
                  <li>删除前请确保已导出或备份重要数据</li>
                </ul>
              </div>
              
              <div className="mt-6 flex justify-center">
                <Button
                  type="primary"
                  danger
                  size="large"
                  icon={<DeleteOutlined />}
                  onClick={handleDeleteAccount}
                  loading={isDeleting}
                  disabled={isDeleting}
                  className="h-14 px-12 text-lg font-bold"
                >
                  {isDeleting ? '删除中...' : '删除所有数据'}
                </Button>
              </div>
            </div>
          }
          type="error"
          showIcon
        />
      </Card>

      {/* 编辑昵称弹窗 */}
      <Modal
        title="编辑昵称"
        open={isEditModalVisible}
        onOk={handleSaveUsername}
        onCancel={handleCancelEdit}
        confirmLoading={isSaving}
        okText="保存"
        cancelText="取消"
        okButtonProps={{
          disabled: !usernameCheckResult?.available || isCheckingUsername,
        }}
      >
        <Space direction="vertical" className="w-full" size="large">
          <div>
            <Text strong>昵称规则：</Text>
            <ul className="mt-2 text-gray-600">
              <li>• 长度：3-20 个字符</li>
              <li>• 字符：只能包含字母、数字和下划线</li>
              <li>• 唯一性：不能与其他用户重复</li>
              <li>• 禁用：admin、root、test 等常见用户名</li>
            </ul>
          </div>

          <div>
            <Input
              placeholder="请输入昵称"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              maxLength={20}
              prefix={<UserOutlined />}
              suffix={
                newUsername && (
                  <Text type="secondary">
                    {newUsername.length}/20
                  </Text>
                )
              }
            />
            {renderUsernameCheckResult()}
          </div>
        </Space>
      </Modal>

      {/* 会员购买弹窗 */}
      <VipPaymentModal
        visible={isVipModalVisible}
        onCancel={() => setIsVipModalVisible(false)}
      />
    </div>
  );
}
