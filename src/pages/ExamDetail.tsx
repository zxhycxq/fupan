import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { 
  Card, 
  Button, 
  Skeleton, 
  Tag, 
  Input, 
  Modal, 
  Tooltip, 
  message,
  Row,
  Col,
  Space,
  Typography
} from 'antd';
import { 
  ArrowLeftOutlined, 
  ClockCircleOutlined, 
  AimOutlined, 
  RiseOutlined, 
  WarningOutlined, 
  EditOutlined, 
  CalendarOutlined, 
  FileTextOutlined, 
  LinkOutlined, 
  InfoCircleOutlined, 
  FileOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { getExamRecordById, updateModuleScore, updateExamRecord, getUserSettings, updateExamNotes } from '@/db/api';
import type { ExamRecordDetail, ModuleScore, UserSetting } from '@/types';
import { EXAM_DETAIL_GRADIENTS, generateGradientStyle } from '@/config/gradients';

const { TextArea } = Input;
const { Title, Text } = Typography;

// 带说明的标题组件
function TitleWithTooltip({ title, tooltip }: { title: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-2">
      <span>{title}</span>
      <Tooltip title="
            <p>{tooltip}</p>
          ">
            <button type="button" className="inline-flex items-center">
              <InfoCircleOutlined className="h-4 w-4 text-muted-foreground cursor-help" />
            </button>
          </Tooltip>
    </div>
  );
}

// 格式化时间：秒转为"X分Y秒"
function formatTime(seconds?: number): string {
  if (!seconds) return '0m';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}.${remainingSeconds}m`;
}

// 分钟转秒
function minutesToSeconds(minutes: number): number {
  return Math.round(minutes * 60);
}

// 秒转分钟（保留小数）
function secondsToMinutes(seconds: number): number {
  return Math.round((seconds / 60) * 100) / 100;
}

export default function ExamDetail() {
  const { id } = useParams<{ id: string }>();
  const [examDetail, setExamDetail] = useState<ExamRecordDetail | null>(null);
  const [userSettings, setUserSettings] = useState<UserSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTimeModuleId, setEditingTimeModuleId] = useState<string | null>(null); // 正在编辑用时的模块ID
  const [editTime, setEditTime] = useState<string>(''); // 编辑中的用时值
  const [editingField, setEditingField] = useState<{ moduleId: string; field: 'total' | 'correct' | 'wrong' } | null>(null); // 正在编辑的字段
  const [editValue, setEditValue] = useState<string>(''); // 编辑中的值
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editingNoteType, setEditingNoteType] = useState<'improvements' | 'mistakes' | 'both'>('both'); // 新增：区分编辑类型
  const [improvements, setImprovements] = useState<string>('');
  const [mistakes, setMistakes] = useState<string>('');
  const [isEditingReportUrl, setIsEditingReportUrl] = useState(false);
  const [reportUrl, setReportUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  // 使用 antd message
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadExamDetail(id);
      loadUserSettings();
    }
  }, [id]);

  const loadUserSettings = async () => {
    try {
      const settings = await getUserSettings();
      setUserSettings(settings);
    } catch (error) {
      console.error('加载用户设置失败:', error);
    }
  };

  const loadExamDetail = async (examId: string) => {
    try {
      setIsLoading(true);
      const detail = await getExamRecordById(examId);
      if (!detail) {
        message.success("错误");
        navigate('/exams');
        return;
      }
      setExamDetail(detail);
    } catch (error) {
      console.error('加载考试详情失败:', error);
      message.success("错误");
    } finally {
      setIsLoading(false);
    }
  };

  // 开始编辑用时
  const handleEditTime = (module: ModuleScore) => {
    setEditingTimeModuleId(module.id);
    // 将秒转为分钟显示
    setEditTime(secondsToMinutes(module.time_used || 0).toString());
  };

  // 计算所有模块的总用时（分钟）
  const calculateTotalTime = (excludeModuleId?: string): number => {
    if (!examDetail) return 0;
    
    return examDetail.module_scores
      .filter(m => m.id !== excludeModuleId && !m.parent_module) // 只计算大模块，排除正在编辑的模块
      .reduce((total, m) => total + secondsToMinutes(m.time_used || 0), 0);
  };

  // 保存时间修改
  const handleSaveTime = async (module: ModuleScore, newMinutes: string) => {
    if (!examDetail || !id) return;

    const minutes = parseFloat(newMinutes);
    if (isNaN(minutes) || minutes < 0) {
      message.error("请输入有效的分钟数");
      setEditingTimeModuleId(null);
      return;
    }

    // 计算其他模块的总用时
    const otherModulesTime = calculateTotalTime(module.id);
    const totalTime = otherModulesTime + minutes;

    // 验证总时长不超过120分钟
    if (totalTime > 120) {
      message.error(`所有模块总用时不能超过120分钟，当前其他模块已用时${otherModulesTime.toFixed(1)}分钟`);
      setEditingTimeModuleId(null);
      return;
    }

    // 将分钟转为秒
    const newTime = minutesToSeconds(minutes);

    try {
      setIsSaving(true);
      
      // 更新模块用时
      await updateModuleScore(module.id, { time_used: newTime });
      
      // 更新本地模块状态
      const updatedModuleScores = examDetail.module_scores.map(m =>
        m.id === module.id ? { ...m, time_used: newTime } : m
      );
      
      // 计算所有模块的总用时（秒）
      const totalTimeInSeconds = updatedModuleScores
        .reduce((total, m) => total + (m.time_used || 0), 0);
      
      // 更新考试记录的总用时
      await updateExamRecord(id, { time_used: totalTimeInSeconds });
      
      // 更新本地状态
      setExamDetail({
        ...examDetail,
        time_used: totalTimeInSeconds,
        module_scores: updatedModuleScores,
      });

      message.success("用时更新成功");
      setEditingTimeModuleId(null);
    } catch (error) {
      console.error('更新时间失败:', error);
      message.error("更新失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  // 开始编辑字段（总题数、答对、答错）
  const handleEditField = (module: ModuleScore, field: 'total' | 'correct' | 'wrong') => {
    setEditingField({ moduleId: module.id, field });
    const value = field === 'total' ? module.total_questions : 
                  field === 'correct' ? module.correct_answers : 
                  module.wrong_answers;
    setEditValue(value.toString());
  };

  // 保存字段修改
  const handleSaveField = async (module: ModuleScore) => {
    if (!examDetail || !editingField) return;

    const value = parseInt(editValue);
    if (isNaN(value) || value < 0) {
      message.error("请输入有效的数字");
      setEditingField(null);
      return;
    }

    // 构建更新数据
    const updateData: Partial<ModuleScore> = {};
    if (editingField.field === 'total') {
      updateData.total_questions = value;
      // 验证总题数不能小于答对+答错
      if (value < module.correct_answers + module.wrong_answers) {
        message.error("总题数不能小于答对数和答错数之和");
        setEditingField(null);
        return;
      }
      // 自动计算未答题数
      updateData.unanswered = value - module.correct_answers - module.wrong_answers;
    } else if (editingField.field === 'correct') {
      updateData.correct_answers = value;
      // 验证答对数不能大于总题数
      if (value + module.wrong_answers > module.total_questions) {
        message.error("答对数和答错数之和不能大于总题数");
        setEditingField(null);
        return;
      }
      // 自动计算未答题数
      updateData.unanswered = module.total_questions - value - module.wrong_answers;
    } else if (editingField.field === 'wrong') {
      updateData.wrong_answers = value;
      // 验证答错数不能大于总题数
      if (module.correct_answers + value > module.total_questions) {
        message.error("答对数和答错数之和不能大于总题数");
        setEditingField(null);
        return;
      }
      // 自动计算未答题数
      updateData.unanswered = module.total_questions - module.correct_answers - value;
    }

    // 重新计算正确率
    if (updateData.total_questions !== undefined || updateData.correct_answers !== undefined) {
      const totalQuestions = updateData.total_questions ?? module.total_questions;
      const correctAnswers = updateData.correct_answers ?? module.correct_answers;
      updateData.accuracy_rate = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    }

    try {
      setIsSaving(true);
      await updateModuleScore(module.id, updateData);
      
      // 更新本地状态
      setExamDetail({
        ...examDetail,
        module_scores: examDetail.module_scores.map(m =>
          m.id === module.id ? { ...m, ...updateData } : m
        ),
      });

      message.success("更新成功");
      setEditingField(null);
    } catch (error) {
      console.error('更新失败:', error);
      message.error("更新失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  // 打开备注编辑对话框
  const handleEditNotes = (type: 'improvements' | 'mistakes' | 'both' = 'both') => {
    if (!examDetail) return;
    setEditingNoteType(type);
    setImprovements(examDetail.improvements || '');
    setMistakes(examDetail.mistakes || '');
    setIsEditingNotes(true);
  };

  // 保存备注
  const handleSaveNotes = async () => {
    if (!examDetail || !id) return;

    // 验证备注长度
    if (improvements.length > 500) {
      message.error('有进步的地方不能超过500字');
      return;
    }
    if (mistakes.length > 500) {
      message.error('出错的地方不能超过500字');
      return;
    }

    try {
      setIsSaving(true);
      await updateExamNotes(id, improvements, mistakes);
      
      // 更新本地状态
      setExamDetail({
        ...examDetail,
        improvements,
        mistakes,
      });

      message.success('备注保存成功');
      
      setIsEditingNotes(false);
    } catch (error) {
      console.error('保存备注失败:', error);
      const errorMessage = error instanceof Error ? error.message : '保存备注失败';
      message.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // 打开报告链接编辑对话框
  const handleEditReportUrl = () => {
    if (!examDetail) return;
    setReportUrl(examDetail.report_url || '');
    setIsEditingReportUrl(true);
  };

  // 保存报告链接
  const handleSaveReportUrl = async () => {
    if (!examDetail || !id) return;

    // 验证URL格式(如果有输入的话)
    if (reportUrl && reportUrl.trim()) {
      try {
        new URL(reportUrl.trim());
      } catch {
        message.success("错误");
        return;
      }
    }

    try {
      setIsSaving(true);
      const urlToSave = reportUrl.trim() || null;
      await updateExamRecord(id, { report_url: urlToSave });
      
      // 更新本地状态
      setExamDetail({
        ...examDetail,
        report_url: urlToSave || undefined,
      });

      message.success("成功");
      
      setIsEditingReportUrl(false);
    } catch (error) {
      console.error('更新考试报告链接失败:', error);
      const errorMessage = error instanceof Error ? error.message : '更新考试报告链接失败';
      message.success("错误");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-10 w-32 mb-6" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              
                <Skeleton className="h-4 w-24" />
              
              
                <Skeleton className="h-8 w-16" />
              </Card>
          ))}
        </div>
        <Card>
          
            <Skeleton className="h-6 w-32" />
          
          
            <Skeleton className="h-96 w-full" />
          </Card>
      </div>
    );
  }

  if (!examDetail) {
    return null;
  }

  // 定义模块显示顺序
  const moduleOrder = [
    '政治理论',
    '常识判断',
    '言语理解与表达',
    '数量关系',
    '判断推理',
    '资料分析'
  ];

  // 获取大模块数据并按指定顺序排序
  const mainModules = examDetail.module_scores
    .filter(m => !m.parent_module)
    .sort((a, b) => {
      const indexA = moduleOrder.indexOf(a.module_name);
      const indexB = moduleOrder.indexOf(b.module_name);
      // 如果模块名不在排序列表中，放到最后
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  
  // 判断是否应该标红（低于目标值或默认50%）
  const shouldHighlightRed = (moduleName: string, accuracyRate: number | undefined): boolean => {
    if (!accuracyRate) return true; // 没有数据时标红
    const setting = userSettings.find(s => s.module_name === moduleName);
    const threshold = setting?.target_accuracy || 50; // 默认50%
    return accuracyRate < threshold;
  };
  
  // 获取弱势模块(正确率低于60%)
  const weakModules = mainModules.filter(m => (m.accuracy_rate || 0) < 60);

  // 获取目标值数组
  const targetValues = mainModules.map(m => {
    const setting = userSettings.find(s => s.module_name === m.module_name);
    return setting ? setting.target_accuracy : 80; // 默认80%
  });

  // 模块正确率雷达图配置
  const radarOption = {
    title: {
      text: '各模块正确率对比',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (!params || !params.value) return '';
        
        const seriesName = params.seriesName; // '实际' 或 '目标'
        const values = params.value; // 数组，包含所有指标的值
        const color = seriesName === '实际' ? '#1890FF' : '#52C41A';
        
        let result = `<div style="padding: 8px;">`;
        result += `<div style="font-weight: bold; margin-bottom: 8px;">${seriesName}</div>`;
        
        mainModules.forEach((module, index) => {
          result += `
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; background-color: ${color}; border-radius: 50%; margin-right: 6px;"></span>
              <span>${module.module_name}: ${values[index].toFixed(1)}%</span>
            </div>
          `;
        });
        
        result += `</div>`;
        return result;
      },
    },
    legend: {
      data: ['实际', '目标'],
      bottom: 10,
    },
    radar: {
      indicator: mainModules.map(m => ({
        name: m.module_name,
        max: 100,
      })),
    },
    series: [
      {
        name: '实际',
        type: 'radar',
        data: [
          {
            value: mainModules.map(m => m.accuracy_rate || 0),
            name: '实际',
            areaStyle: {
              color: 'rgba(24, 144, 255, 0.3)', // 蓝色填充
            },
            itemStyle: {
              color: '#1890FF', // 蓝色
            },
            lineStyle: {
              color: '#1890FF',
              width: 2,
            },
          },
        ],
      },
      {
        name: '目标',
        type: 'radar',
        data: [
          {
            value: targetValues,
            name: '目标',
            areaStyle: {
              color: 'rgba(82, 196, 26, 0.1)', // 绿色半透明填充
            },
            itemStyle: {
              color: '#52C41A', // 绿色
            },
            lineStyle: {
              color: '#52C41A',
              width: 2,
              type: 'dashed', // 虚线
            },
          },
        ],
      },
    ],
  };

  // 模块用时对比图配置
  const timeComparisonOption = {
    title: {
      text: '各模块用时对比',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        if (!params || params.length === 0) return '';
        const param = params[0];
        const minutes = (param.value / 60).toFixed(1);
        return `${param.name}<br/>用时: ${minutes}m`;
      },
    },
    xAxis: {
      type: 'category',
      data: mainModules.map(m => m.module_name),
      axisLabel: {
        interval: 0,
        rotate: 30,
        fontSize: 12,
      },
    },
    yAxis: {
      type: 'value',
      name: '用时(m)',
      axisLabel: {
        formatter: (value: number) => (value / 60).toFixed(0),
      },
    },
    series: [
      {
        name: '用时',
        type: 'bar',
        data: mainModules.map(m => m.time_used || 0),
        itemStyle: {
          color: '#1890FF',
        },
      },
    ],
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        type="text"
        onClick={() => navigate('/exams')}
        className="mb-6"
      >
        <ArrowLeftOutlined className="mr-2 h-4 w-4" />
        返回列表
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{examDetail.exam_name} - 详情</h1>
        <div className="text-gray-500">
          排序: {examDetail.sort_order} | 创建时间: {new Date(examDetail.created_at).toLocaleString('zh-CN')}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarOutlined className="h-4 w-4" />
            <span>考试日期: {examDetail.exam_date || examDetail.created_at.split('T')[0]}</span>
          </div>
          <span className="text-muted-foreground/50">|</span>
          <span>上传时间: {formatDate(examDetail.created_at)}</span>
          <span className="text-muted-foreground/50">|</span>
          <div className="flex items-center gap-2">
            {examDetail.report_url ? (
              <>
                <a
                  href={examDetail.report_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <LinkOutlined className="h-4 w-4" />
                  <span>{examDetail.exam_name}考试报告链接地址</span>
                </a>
                <Button
                  type="text"
                  size="small"
                  className="h-6 w-6"
                  onClick={handleEditReportUrl}
                >
                  <EditOutlined className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <Button
                type="text"
                size="small"
                className="h-6 px-2 text-muted-foreground hover:text-primary"
                onClick={handleEditReportUrl}
              >
                <LinkOutlined className="h-3 w-3 mr-1" />
                添加{examDetail.exam_name}考试报告链接地址
              </Button>
            )}
          </div>
        </div>
        
        {/* 备注区域 - 两列布局 */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 有进步的地方 */}
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <RiseOutlined className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">有进步的地方</span>
              </div>
              <Button
                type="text"
                size="small"
                className="h-6 w-6"
                onClick={() => handleEditNotes('improvements')}
              >
                <EditOutlined className="h-3 w-3" />
              </Button>
            </div>
            {examDetail.improvements ? (
              <p className="text-sm whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300">
                {examDetail.improvements}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">暂无内容</p>
            )}
          </div>

          {/* 出错的地方 */}
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <WarningOutlined className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">出错的地方</span>
              </div>
              <Button
                type="text"
                size="small"
                className="h-6 w-6"
                onClick={() => handleEditNotes('mistakes')}
              >
                <EditOutlined className="h-3 w-3" />
              </Button>
            </div>
            {examDetail.mistakes ? (
              <p className="text-sm whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300">
                {examDetail.mistakes}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">暂无内容</p>
            )}
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
        <Card 
          className="exam-stat-card"
          style={{ background: generateGradientStyle(EXAM_DETAIL_GRADIENTS[0]) }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-semibold text-white">总分</span>
            <AimOutlined className="text-lg text-white opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1 text-white">
            {examDetail.total_score.toFixed(1)}
          </div>
          <p className="text-xs text-white opacity-80">满分100分</p>
        </Card>

        <Card 
          className="exam-stat-card"
          style={{ background: generateGradientStyle(EXAM_DETAIL_GRADIENTS[1]) }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-semibold text-white">用时</span>
            <ClockCircleOutlined className="text-lg text-white opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1 text-white">
            {examDetail.time_used ? Math.round(examDetail.time_used / 60) : '-'}
          </div>
          <p className="text-xs text-white opacity-80">m</p>
        </Card>

        <Card 
          className="exam-stat-card"
          style={{ background: generateGradientStyle(EXAM_DETAIL_GRADIENTS[2]) }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-semibold text-white">平均分</span>
            <RiseOutlined className="text-lg text-white opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1 text-white">
            {examDetail.average_score?.toFixed(1) || '-'}
          </div>
          <p className="text-xs text-white opacity-80">考生平均分</p>
        </Card>

        <Card 
          className="exam-stat-card"
          style={{ background: generateGradientStyle(EXAM_DETAIL_GRADIENTS[3]) }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-semibold text-white">难度</span>
            <WarningOutlined className="text-lg text-white opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1 text-white">
            {examDetail.difficulty?.toFixed(1) || '-'}
          </div>
          <p className="text-xs text-white opacity-80">难度系数(0-5)</p>
        </Card>

        <Card 
          className="exam-stat-card"
          style={{ background: generateGradientStyle(EXAM_DETAIL_GRADIENTS[4]) }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-semibold text-white">击败率</span>
            <RiseOutlined className="text-lg text-white opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1 text-white">
            {examDetail.pass_rate?.toFixed(1) || '-'}%
          </div>
          <p className="text-xs text-white opacity-80">已击败考生</p>
        </Card>
      </div>

      {/* 弱势模块提醒 */}
      {weakModules.length > 0 && (
        <Card className="mb-8 border-orange-200 bg-orange-50">
          
            
              <WarningOutlined className="mr-2 h-5 w-5" />
              弱势模块提醒
            
            以下模块正确率低于60%,需要重点加强
          
          
            <div className="flex flex-wrap gap-2">
              {weakModules.map(m => (
                <Tag key={m.id} className="border-orange-300 text-orange-700">
                  {m.module_name}: {m.accuracy_rate?.toFixed(1)}%
                </Tag>
              ))}
            </div>
          </Card>
      )}

      {/* 图表 */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          
            
              <TitleWithTooltip 
                title="各模块正确率" 
                tooltip="雷达图展示各个考试模块的正确率分布情况，可以直观地看出各模块的强弱项。正确率越高，该模块掌握越好。"
              />
            
            雷达图展示各模块的正确率分布
          
          
            {mainModules.length > 0 ? (
              <ReactECharts option={radarOption} style={{ height: '400px' }} />
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                暂无数据
              </div>
            )}
          </Card>

        <Card>
          
            
              <TitleWithTooltip 
                title="各模块用时对比" 
                tooltip="柱状图展示各模块的答题用时统计，帮助分析时间分配是否合理。用时过长可能表示该模块需要提高答题速度，用时过短则需要注意准确率。"
              />
            
            各模块答题用时统计
          
          
            {mainModules.length > 0 ? (
              <ReactECharts option={timeComparisonOption} style={{ height: '400px' }} />
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                暂无数据
              </div>
            )}
          </Card>
      </div>

      {/* 模块详情表格 */}
      <Card>
        
          
            <TitleWithTooltip 
              title="模块详细数据" 
              tooltip="详细展示各个模块和子模块的答题情况，包括总题数、答对题数、正确率和用时。可以点击编辑按钮修改数据。"
            />
          
          各模块的详细答题情况
        
        
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {mainModules.map(mainModule => {
              const subModules = examDetail.module_scores.filter(
                m => m.parent_module === mainModule.module_name
              );

              return (
                <div key={mainModule.id} className="border rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{mainModule.module_name}</h3>
                    <Tag color={
                      (mainModule.accuracy_rate || 0) >= 80 ? 'green' :
                      (mainModule.accuracy_rate || 0) >= 60 ? 'blue' :
                      'red'
                    }>
                      正确率: {mainModule.accuracy_rate?.toFixed(1)}%
                    </Tag>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1">
                      <FileOutlined className="text-muted-foreground" />
                      <span className="text-muted-foreground">总题数:</span>
                      {editingField?.moduleId === mainModule.id && editingField.field === 'total' ? (
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={editValue}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d+$/.test(value)) {
                              setEditValue(value);
                            }
                          }}
                          onBlur={() => {
                            if (editValue) {
                              handleSaveField(mainModule);
                            } else {
                              setEditingField(null);
                            }
                          }}
                          onPressEnter={() => {
                            if (editValue) {
                              handleSaveField(mainModule);
                            }
                          }}
                          autoFocus
                          className="ml-2 w-16 h-8 text-sm"
                          disabled={isSaving}
                        />
                      ) : (
                        <>
                          <span className="ml-2 font-medium">{mainModule.total_questions}</span>
                          <Button
                            type="text"
                            size="small"
                            className="ml-1 h-6 w-6 p-0"
                            onClick={() => handleEditField(mainModule, 'total')}
                          >
                            <EditOutlined className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircleOutlined className="text-green-600" />
                      <span className="text-muted-foreground">答对:</span>
                      {editingField?.moduleId === mainModule.id && editingField.field === 'correct' ? (
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={editValue}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d+$/.test(value)) {
                              setEditValue(value);
                            }
                          }}
                          onBlur={() => {
                            if (editValue) {
                              handleSaveField(mainModule);
                            } else {
                              setEditingField(null);
                            }
                          }}
                          onPressEnter={() => {
                            if (editValue) {
                              handleSaveField(mainModule);
                            }
                          }}
                          autoFocus
                          className="ml-2 w-16 h-8 text-sm"
                          disabled={isSaving}
                        />
                      ) : (
                        <>
                          <span className={`ml-2 font-medium ${
                            shouldHighlightRed(mainModule.module_name, mainModule.accuracy_rate) 
                              ? 'text-red-600' 
                              : 'text-green-600'
                          }`}>
                            {mainModule.correct_answers}
                          </span>
                          <Button
                            type="text"
                            size="small"
                            className="ml-1 h-6 w-6 p-0"
                            onClick={() => handleEditField(mainModule, 'correct')}
                          >
                            <EditOutlined className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <CloseCircleOutlined className="text-red-600" />
                      <span className="text-muted-foreground">答错:</span>
                      {editingField?.moduleId === mainModule.id && editingField.field === 'wrong' ? (
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={editValue}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d+$/.test(value)) {
                              setEditValue(value);
                            }
                          }}
                          onBlur={() => {
                            if (editValue) {
                              handleSaveField(mainModule);
                            } else {
                              setEditingField(null);
                            }
                          }}
                          onPressEnter={() => {
                            if (editValue) {
                              handleSaveField(mainModule);
                            }
                          }}
                          autoFocus
                          className="ml-2 w-16 h-8 text-sm"
                          disabled={isSaving}
                        />
                      ) : (
                        <>
                          <span className="ml-2 font-medium text-red-600">{mainModule.wrong_answers}</span>
                          <Button
                            type="text"
                            size="small"
                            className="ml-1 h-6 w-6 p-0"
                            onClick={() => handleEditField(mainModule, 'wrong')}
                          >
                            <EditOutlined className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <ClockCircleOutlined className="text-muted-foreground" />
                      <span className="text-muted-foreground">用时:</span>
                      {editingTimeModuleId === mainModule.id ? (
                        <div className="ml-2 flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={editTime}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d+$/.test(value)) {
                                setEditTime(value);
                              }
                            }}
                            onBlur={() => {
                              if (editTime) {
                                handleSaveTime(mainModule, editTime);
                              } else {
                                setEditingTimeModuleId(null);
                              }
                            }}
                            onPressEnter={() => {
                              if (editTime) {
                                handleSaveTime(mainModule, editTime);
                              }
                            }}
                            autoFocus
                            className="w-20 h-8 text-sm"
                            suffix="m"
                            disabled={isSaving}
                          />
                        </div>
                      ) : (
                        <>
                          <span className="ml-2 font-medium">{formatTime(mainModule.time_used)}</span>
                          <Button
                            type="text"
                            size="small"
                            className="ml-2 h-6 w-6 p-0"
                            onClick={() => handleEditTime(mainModule)}
                          >
                            <EditOutlined className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {subModules.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {subModules.map(subModule => (
                        <div key={subModule.id} className="bg-muted/50 rounded-md p-3 text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{subModule.module_name}</span>
                            <Tag className="text-xs">
                              {subModule.accuracy_rate?.toFixed(1)}%
                            </Tag>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <FileOutlined className="text-muted-foreground" />
                              <span>总题数: {subModule.total_questions}</span>
                            </div>
                            <div className={`flex items-center gap-1 ${
                              shouldHighlightRed(subModule.module_name, subModule.accuracy_rate)
                                ? 'text-red-600 font-medium'
                                : ''
                            }`}>
                              <CheckCircleOutlined className={
                                shouldHighlightRed(subModule.module_name, subModule.accuracy_rate)
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              } />
                              <span>答对: {subModule.correct_answers}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CloseCircleOutlined className="text-red-600" />
                              <span>答错: {subModule.wrong_answers}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ClockCircleOutlined className="text-muted-foreground" />
                              <span>用时: {formatTime(subModule.time_used)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

      {/* 编辑备注对话框 */}
      <Modal 
        title={
          editingNoteType === 'improvements' ? '编辑有进步的地方' :
          editingNoteType === 'mistakes' ? '编辑出错的地方' :
          '编辑备注'
        }
        open={isEditingNotes} 
        onCancel={() => setIsEditingNotes(false)}
        onOk={handleSaveNotes}
        okText="确定"
        cancelText="取消"
        confirmLoading={isSaving}
        width={600}
      >
        <div className="space-y-4">
          {/* 有进步的地方 */}
          {(editingNoteType === 'improvements' || editingNoteType === 'both') && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <RiseOutlined className="text-green-600" />
                <span className="font-medium">有进步的地方</span>
              </div>
              <TextArea
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="记录本次考试中有进步的地方..."
                rows={6}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right mt-1">
                {improvements.length}/500字
              </p>
            </div>
          )}

          {/* 出错的地方 */}
          {(editingNoteType === 'mistakes' || editingNoteType === 'both') && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <WarningOutlined className="text-red-600" />
                <span className="font-medium">出错的地方</span>
              </div>
              <TextArea
                value={mistakes}
                onChange={(e) => setMistakes(e.target.value)}
                placeholder="记录本次考试中出错的地方..."
                rows={6}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right mt-1">
                {mistakes.length}/500字
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* 编辑考试报告链接对话框 */}
      <Modal 
        title="链接地址"
        open={isEditingReportUrl} 
        onCancel={() => setIsEditingReportUrl(false)}
        onOk={handleSaveReportUrl}
        okText="确定"
        cancelText="取消"
        confirmLoading={isSaving}
      >
        <div className="space-y-2">
          <Input
            type="url"
            value={reportUrl}
            onChange={(e) => setReportUrl(e.target.value)}
            placeholder="https://example.com/report"
          />
          <p className="text-xs text-gray-500">
            请输入完整的URL地址，包括 http:// 或 https://
          </p>
        </div>
      </Modal>
    </div>
  );
}
