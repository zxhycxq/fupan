import { useState, useEffect } from 'react';
import { Card, Button, InputNumber, Select, DatePicker, Space, message, Spin, Alert, Input } from 'antd';
import { SaveOutlined, ReloadOutlined, CalendarOutlined, BgColorsOutlined, AimOutlined, TrophyOutlined } from '@ant-design/icons';
import { useTheme, themes } from '@/hooks/use-theme';
import { getUserSettings, batchUpsertUserSettings, getExamConfig, saveExamConfig } from '@/db/api';
import type { UserSetting } from '@/types';
import dayjs from 'dayjs';
import { GRADE_LABEL_THEMES } from '@/config/gradeLabels';

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
  { label: '事业编', value: '事业编' },
  { label: '其他', value: '其他' },
];

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, number>>({});
  const [examType, setExamType] = useState<string>('');
  const [examName, setExamName] = useState<string>(''); // 自定义考试名称
  const [examDate, setExamDate] = useState<string>('');
  const [gradeLabelTheme, setGradeLabelTheme] = useState<string>('theme4');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { theme, setTheme } = useTheme();

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
        setExamName(examConfig.exam_name || '');
        setExamDate(examConfig.exam_date || '');
        setGradeLabelTheme(examConfig.grade_label_theme || 'theme4');
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

      // 保存考试配置（包括等级称谓主题）
      // 即使没有设置考试类型和日期，也要保存等级称谓主题
      await saveExamConfig(examType || '', examDate || '', gradeLabelTheme, examName || '');

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
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AimOutlined />
                目标正确率设置
              </h3>
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

            {/* 根据是否选择"其他"调整布局 */}
            {examType === '其他' ? (
              // 选择"其他"时，三个字段在一行显示
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="mb-2 text-sm font-medium">考试类型</div>
                  <Select
                    value={examType || undefined}
                    onChange={(value) => {
                      setExamType(value);
                      // 如果不是"其他"，清空自定义考试名称
                      if (value !== '其他') {
                        setExamName('');
                      }
                    }}
                    placeholder="请选择考试类型"
                    style={{ width: '100%' }}
                    options={EXAM_TYPES}
                  />
                </div>

                <div>
                  <div className="mb-2 text-sm font-medium">考试名称</div>
                  <Input
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="请输入考试名称"
                    maxLength={15}
                    showCount
                  />
                </div>

                <div>
                  <div className="mb-2 text-sm font-medium">考试日期</div>
                  <DatePicker
                    value={examDate ? dayjs(examDate) : null}
                    onChange={(date) => setExamDate(date ? date.format('YYYY-MM-DD') : '')}
                    placeholder="请选择考试日期"
                    style={{ width: '100%' }}
                    size="middle"
                    getPopupContainer={(trigger) => trigger.parentElement || document.body}
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                  />
                </div>
              </div>
            ) : (
              // 未选择"其他"时，两个字段在一行显示
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <div className="mb-2 text-sm font-medium">考试类型</div>
                  <Select
                    value={examType || undefined}
                    onChange={(value) => {
                      setExamType(value);
                      // 如果不是"其他"，清空自定义考试名称
                      if (value !== '其他') {
                        setExamName('');
                      }
                    }}
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
                    size="middle"
                    getPopupContainer={(trigger) => trigger.parentElement || document.body}
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                  />
                </div>
              </div>
            )}

            <Alert
              message="说明"
              description={
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>选择考试类型和日期后,系统将在主页显示倒计时</li>
                  <li>支持国考、省考、事业编和自定义考试类型</li>
                  <li>选择"其他"时可以自定义考试名称(最多15个字符)</li>
                  <li>倒计时会显示距离考试还有多少天</li>
                  <li>可以随时修改考试类型、名称和日期</li>
                </ul>
              }
              type="info"
              showIcon
              className="mt-4"
            />
          </div>

          {/* 等级称谓主题配置部分 */}
          <div>
            <div className="border-b pb-3 mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrophyOutlined />
                等级称谓主题设置
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                选择您喜欢的等级称谓风格,将在仪表盘中显示
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GRADE_LABEL_THEMES.map((themeOption) => {
                const isActive = gradeLabelTheme === themeOption.id;

                return (
                  <div
                    key={themeOption.id}
                    onClick={() => setGradeLabelTheme(themeOption.id)}
                    className={`
                      relative cursor-pointer rounded-lg border-2 p-4 transition-all
                      ${isActive 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      {/* 主题信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base mb-2">
                          {themeOption.name}
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          {themeOption.labels.map((label, index) => {
                            // 根据索引显示对应的分数区间
                            const ranges = ['<50分', '50-60分', '60-70分', '70-80分', '>80分'];
                            return (
                              <div key={index} className="flex items-center gap-2">
                                <span className="text-gray-400">{ranges[index]}:</span>
                                <span className="font-medium">{label.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 选中标记 */}
                      {isActive && (
                        <div className="flex-shrink-0 ml-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Alert
              message="说明"
              description={
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>等级称谓会根据您的平均分显示在仪表盘中</li>
                  <li>不同主题提供不同风格的等级名称</li>
                  <li>选择后需要点击"保存设置"按钮才能生效</li>
                  <li>等级称谓仅用于展示,不影响实际分数</li>
                </ul>
              }
              type="info"
              showIcon
              className="mt-4"
            />
          </div>
        </Space>
      </Card>
    </div>
  );
}
