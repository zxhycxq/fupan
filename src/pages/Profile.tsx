import { useState } from 'react';
import { Card, Button, Alert, Modal, message } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined, UserOutlined } from '@ant-design/icons';
import { deleteAllUserData } from '@/db/api';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  // 删除账户确认
  const handleDeleteAccount = () => {
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
                  删除后将<span className="font-semibold text-red-600">永久清除</span>以下所有数据：
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
      onOk: async () => {
        try {
          setIsDeleting(true);
          await deleteAllUserData();
          message.success('所有数据已删除');
          
          // 延迟跳转，让用户看到成功消息
          setTimeout(() => {
            navigate('/');
            window.location.reload();
          }, 1000);
        } catch (error) {
          console.error('删除数据失败:', error);
          message.error('删除数据失败，请重试');
          setIsDeleting(false);
        }
      },
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">

      <Card 
        title={
          <div className="flex items-center gap-2">
            <UserOutlined />
            <span>个人中心</span>
          </div>
        }
        className="max-w-5xl mx-auto"
      >
        <div className="space-y-8">
          {/* 账户信息部分 */}
          <div>
            <div className="border-b pb-3 mb-4">
              <h3 className="text-lg font-semibold">账户信息</h3>
              <p className="text-sm text-gray-500 mt-1">
                查看和管理您的账户信息
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserOutlined className="text-3xl text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold">默认用户</p>
                  <p className="text-sm text-gray-500">考试成绩分析系统</p>
                </div>
              </div>
            </div>
          </div>

          {/* 危险区域 - 删除账户 */}
          <div>
            <div className="border-b border-red-200 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                <DeleteOutlined />
                危险区域
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                以下操作将永久删除您的所有数据，请谨慎操作
              </p>
            </div>

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
          </div>
        </div>
      </Card>
    </div>
  );
}
