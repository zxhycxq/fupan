import { useState, useEffect } from 'react';
import { Card, Button, InputNumber, Select, DatePicker, Space, message, Spin, Alert, Modal } from 'antd';
import { SaveOutlined, ReloadOutlined, CalendarOutlined, BgColorsOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useTheme, themes } from '@/hooks/use-theme';
import { getUserSettings, batchUpsertUserSettings, getExamConfig, saveExamConfig, deleteAllUserData } from '@/db/api';
import type { UserSetting } from '@/types';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// 6大模块
const MAIN_MODULES = [
  '政治理论',
  '常识判断',
  '言语理解与表达',
  '数量关系',
  '判断推理',
  '资料分析',
];

// 考试类型
const EXAM_TYPES = [
  { label: '国考', value: '国考' },
  { label: '省考', value: '省考' },
];

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, number>>({});
  const [examType, setExamType] = useState<string>('');
  const [examDate, setExamDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // 加载设置
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const userSettings = await getUserSettings();
      
      // 转换为 Record 格式
      const settingsMap: Record<string, number> = {};
      for (const setting of userSettings) {
        settingsMap[setting.module_name] = setting.target_accuracy;
      }
      
      // 确保所有模块都有默认值
      for (const module of MAIN_MODULES) {
        if (!(module in settingsMap)) {
          settingsMap[module] = 80; // 默认80%
        }
      }
      
      setSettings(settingsMap);

      // 加载考试配置
      const examConfig = await getExamConfig();
      if (examConfig) {
        setExamType(examConfig.exam_type || '');
        setExamDate(examConfig.exam_date || '');
      }
    } catch (error) {
      console.error('加载设置失败:', error);
      message.error('加载设置失败,请刷新页面重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // 验证所有值
      for (const [module, value] of Object.entries(settings)) {
        if (value < 0 || value > 100) {
          message.error(`${module}的目标正确率必须在0-100之间`);
          return;
        }
      }

      // 验证考试配置
      if (examType && !examDate) {
        message.error('请选择考试日期');
        return;
      }

      if (examDate && !examType) {
        message.error('请选择考试类型');
        return;
      }

      // 转换为 UserSetting 数组
      const settingsArray: Omit<UserSetting, 'id' | 'created_at' | 'updated_at'>[] = 
        Object.entries(settings).map(([module_name, target_accuracy]) => ({
          user_id: 'default',
          module_name,
          target_accuracy,
        }));

      await batchUpsertUserSettings(settingsArray);

      // 保存考试配置
      if (examType && examDate) {
        await saveExamConfig(examType, examDate);
      }

      message.success('设置已保存');
    } catch (error) {
      console.error('保存设置失败:', error);
      message.error('保存设置失败,请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaultSettings: Record<string, number> = {};
    for (const module of MAIN_MODULES) {
      defaultSettings[module] = 80;
    }
    setSettings(defaultSettings);
  };

  const handleChange = (module: string, value: number | null) => {
    setSettings(prev => ({
      ...prev,
      [module]: value || 0,
    }));
  };

  const handleDeleteAccount = () => {
    Modal.confirm({
      title: '删除所有数据',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div className="space-y-3">
          <Alert
            message="警告：此操作不可恢复！"
            description={
              <div className="space-y-2">
                <p className="font-semibold">删除后将清空以下所有数据：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>所有考试记录</li>
                  <li>所有模块成绩</li>
                  <li>所有个人设置</li>
                  <li>考试倒计时配置</li>
                </ul>
                <p className="text-red-600 font-semibold mt-3">
                  ⚠️ 数据将从后台数据库中永久删除，无法恢复！
                </p>
                <p className="text-gray-600 mt-2">
                  删除后即使使用相同的手机号或邮箱重新注册，也不会恢复任何数据。
                </p>
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card 
        title="系统设置"
        className="max-w-5xl mx-auto"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              重置为默认值
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={isSaving}
              onClick={handleSave}
            >
              保存设置
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 目标设置部分 */}
          <div>
            <div className="border-b pb-3 mb-4">
              <h3 className="text-lg font-semibold">目标正确率设置</h3>
              <p className="text-sm text-gray-500 mt-1">
                设置各模块的目标正确率,用于在雷达图中对比实际表现
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {MAIN_MODULES.map((module) => (
                <div key={module}>
                  <div className="mb-2 text-sm font-medium">{module}</div>
                  <Space.Compact style={{ width: '100%' }}>
                    <InputNumber
                      min={0}
                      max={100}
                      value={settings[module] || 80}
                      onChange={(value) => handleChange(module, value)}
                      style={{ width: '100%' }}
                    />
                    <Button disabled>%</Button>
                  </Space.Compact>
                </div>
              ))}
            </div>

            <Alert
              message="说明"
              description={
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>目标正确率范围: 0-100%</li>
                  <li>默认目标为80%</li>
                  <li>设置后将在雷达图中显示目标线,方便对比实际表现</li>
                  <li>建议根据自身情况设置合理的目标</li>
                </ul>
              }
              type="info"
              showIcon
              className="mt-4"
            />
          </div>

          {/* 主题配置部分 */}
          <div>
            <div className="border-b pb-3 mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BgColorsOutlined />
                主题肤色设置
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                选择您喜欢的主题配色方案
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {themes.map((themeOption) => {
                const isActive = theme === themeOption.value;
                const themeColorMap: Record<string, string> = {
                  default: '#1677ff',
                  blue: '#3b82f6',
                  green: '#22c55e',
                  purple: '#a855f7',
                  orange: '#f97316',
                };
                const themeColor = themeColorMap[themeOption.value];

                return (
                  <div
                    key={themeOption.value}
                    onClick={() => setTheme(themeOption.value)}
                    className={`
                      relative cursor-pointer rounded-lg border-2 p-4 transition-all
                      ${isActive 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* 颜色预览 */}
                      <div 
                        className="w-12 h-12 rounded-lg shadow-sm flex-shrink-0"
                        style={{ backgroundColor: themeColor }}
                      />
                      
                      {/* 主题信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base mb-1">
                          {themeOption.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {themeOption.description}
                        </div>
                      </div>

                      {/* 选中标记 */}
                      {isActive && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 颜色示例条 */}
                    <div className="mt-3 flex gap-1">
                      <div 
                        className="h-2 flex-1 rounded-full"
                        style={{ backgroundColor: themeColor, opacity: 1 }}
                      />
                      <div 
                        className="h-2 flex-1 rounded-full"
                        style={{ backgroundColor: themeColor, opacity: 0.7 }}
                      />
                      <div 
                        className="h-2 flex-1 rounded-full"
                        style={{ backgroundColor: themeColor, opacity: 0.4 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <Alert
              message="说明"
              description={
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>主题配色会立即生效,无需保存</li>
                  <li>主题设置会自动保存到浏览器本地</li>
                  <li>不同主题适合不同的使用场景和个人喜好</li>
                  <li>主题颜色会应用到所有按钮、图表和交互元素</li>
                </ul>
              }
              type="info"
              showIcon
              className="mt-4"
            />
          </div>

          {/* 考试倒计时配置部分 */}
          <div>
            <div className="border-b pb-3 mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CalendarOutlined />
                考试倒计时设置
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                设置考试类型和日期,系统将在顶部显示倒计时
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-2 text-sm font-medium">考试类型</div>
                <Select
                  value={examType || undefined}
                  onChange={setExamType}
                  placeholder="请选择考试类型"
                  style={{ width: '100%' }}
                  options={EXAM_TYPES}
                />
              </div>

              <div>
                <div className="mb-2 text-sm font-medium">考试日期</div>
                <DatePicker
                  value={examDate ? dayjs(examDate) : null}
                  onChange={(date) => setExamDate(date ? date.format('YYYY-MM-DD') : '')}
                  placeholder="请选择考试日期"
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </div>
            </div>

            <Alert
              message="说明"
              description={
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>选择考试类型和日期后,系统将在顶部显示倒计时</li>
                  <li>倒计时会显示距离考试还有多少天</li>
                  <li>可以随时修改考试日期</li>
                </ul>
              }
              type="info"
              showIcon
              className="mt-4"
            />
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
        </Space>
      </Card>
    </div>
  );
}
