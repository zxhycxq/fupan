import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Typography,
  Tabs,
  Descriptions
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
  CloseCircleOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { getExamRecordById, updateModuleScore, updateExamRecord, getUserSettings, updateExamNotes, addModuleScore, deleteModuleScore } from '@/db/api';
import type { ExamRecordDetail, ModuleScore, UserSetting } from '@/types';
import { EXAM_DETAIL_GRADIENTS, generateGradientStyle } from '@/config/gradients';
import WangEditor from '@/components/common/WangEditor';

const { TextArea } = Input;
const { Title, Text } = Typography;

// 带说明的标题组件
function TitleWithTooltip({ title, tooltip }: { title: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-2">
      <span>{title}</span>
      <Tooltip title={tooltip}>
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
  const [examDetail, setExamDetail] = useState<ExamRecordDetail | null>(null); // 考试详情数据
  const [userSettings, setUserSettings] = useState<UserSetting[]>([]); // 用户设置
  const [isLoading, setIsLoading] = useState(true); // 加载状态
  const [editingTimeModuleId, setEditingTimeModuleId] = useState<string | null>(null); // 正在编辑用时的模块ID
  const [editTime, setEditTime] = useState<string>(''); // 编辑中的用时值
  const [editingField, setEditingField] = useState<{ moduleId: string; field: 'total' | 'correct' } | null>(null); // 正在编辑的字段（总题数/答对数）
  const [editValue, setEditValue] = useState<string>(''); // 编辑中的值
  const [isEditingNotes, setIsEditingNotes] = useState(false); // 是否正在编辑笔记
  const [editingNoteType, setEditingNoteType] = useState<'improvements' | 'mistakes' | 'both'>('both'); // 编辑笔记类型（改进点/错题/全部）
  const [improvements, setImprovements] = useState<string>(''); // 改进点内容
  const [mistakes, setMistakes] = useState<string>(''); // 错题内容
  const [isSaving, setIsSaving] = useState(false); // 保存状态
  const [timeChartType, setTimeChartType] = useState<'pie' | 'bar'>('pie'); // 用时图表类型（饼图/柱状图）
  const [isAddingModule, setIsAddingModule] = useState(false); // 是否正在添加子模块
  const [addingParentModule, setAddingParentModule] = useState<string>(''); // 正在添加子模块的父模块名称
  const [newModuleName, setNewModuleName] = useState<string>(''); // 新子模块名称
  const [newModuleTotal, setNewModuleTotal] = useState<string>(''); // 新子模块总题数
  const [newModuleCorrect, setNewModuleCorrect] = useState<string>(''); // 新子模块答对数
  const [newModuleTime, setNewModuleTime] = useState<string>(''); // 新子模块用时
  // 使用 antd message
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
    // console.log('所有模块:', examDetail.module_scores.map(m => ({
    //   name: m.module_name,
    //   parent: m.parent_module,
    //   time: secondsToMinutes(m.time_used || 0)
    // })));

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

      // 计算所有大模块的总用时（秒）
      const totalTimeInSeconds = updatedModuleScores
        .filter(m => !m.parent_module) // 只计算大模块
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

  // 开始编辑字段（总题数、答对）
  // 注意：答错题数量不再支持编辑，由系统自动计算
  const handleEditField = (module: ModuleScore, field: 'total' | 'correct') => {
    setEditingField({ moduleId: module.id, field });
    const value = field === 'total' ? module.total_questions : module.correct_answers;
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
      // 验证答对数不能超过总题数
      if (module.correct_answers > value) {
        message.error("答对数不能超过总题数");
        setEditingField(null);
        return;
      }
      // 自动计算答错数和未答题数
      updateData.wrong_answers = value - module.correct_answers;
      updateData.unanswered = 0; // 默认未答题数为0
    } else if (editingField.field === 'correct') {
      updateData.correct_answers = value;
      if (value > module.total_questions) {
        message.error("答对数不能超过总题数");
        setEditingField(null);
        return;
      }
      // 自动计算答错数和未答题数
      updateData.wrong_answers = module.total_questions - value;
      updateData.unanswered = 0; // 默认未答题数为0
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

  // 定义固定子模块数量的模块
  const FIXED_SUBMODULE_COUNTS: Record<string, number> = {
    '言语理解与表达': 3,
    '判断推理': 4,
  };

  // 判断是否可以添加子模块
  const canAddSubModule = (parentModuleName: string, currentSubModuleCount: number): boolean => {
    const fixedCount = FIXED_SUBMODULE_COUNTS[parentModuleName];
    if (fixedCount !== undefined) {
      return currentSubModuleCount < fixedCount;
    }
    return true; // 其他模块可以自由添加
  };

  // 打开添加子模块对话框
  const handleOpenAddModule = (parentModuleName: string) => {
    setAddingParentModule(parentModuleName);
    setNewModuleName('');
    setNewModuleTotal('');
    setNewModuleCorrect('');
    setNewModuleTime('');
    setIsAddingModule(true);
  };

  // 添加子模块
  const handleAddModule = async () => {
    if (!examDetail || !id) return;

    // 验证输入
    if (!newModuleName.trim()) {
      message.error('请输入子模块名称');
      return;
    }
    if (!newModuleTotal || parseInt(newModuleTotal) < 0) {
      message.error('请输入有效的总题数');
      return;
    }
    if (!newModuleCorrect || parseInt(newModuleCorrect) < 0) {
      message.error('请输入有效的答对数');
      return;
    }
    if (parseInt(newModuleCorrect) > parseInt(newModuleTotal)) {
      message.error('答对数不能大于总题数');
      return;
    }
    if (!newModuleTime || parseFloat(newModuleTime) < 0) {
      message.error('请输入有效的用时');
      return;
    }

    // 验证子模块总题数不能超过父模块总题数
    const parentModule = examDetail.module_scores.find(
      m => m.module_name === addingParentModule && !m.parent_module
    );
    if (parentModule) {
      const currentSubModules = examDetail.module_scores.filter(
        m => m.parent_module === addingParentModule
      );
      const currentSubTotal = currentSubModules.reduce((sum, m) => sum + (m.total_questions || 0), 0);
      const newTotal = currentSubTotal + parseInt(newModuleTotal);

      if (newTotal > parentModule.total_questions) {
        message.error(`子模块总题数不能超过父模块总题数（${parentModule.total_questions}题）`);
        return;
      }
    }

    try {
      setIsSaving(true);

      const totalQuestions = parseInt(newModuleTotal);
      const correctAnswers = parseInt(newModuleCorrect);
      const timeUsed = minutesToSeconds(parseFloat(newModuleTime));
      const accuracyRate = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      const wrongAnswers = totalQuestions - correctAnswers; // 错误数 = 总题数 - 答对数
      const unanswered = 0; // 默认未答题数为0

      const newModule: Omit<ModuleScore, 'id' | 'created_at'> = {
        exam_record_id: id,
        module_name: newModuleName.trim(),
        parent_module: addingParentModule,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        unanswered: unanswered,
        accuracy_rate: accuracyRate,
        time_used: timeUsed,
      };

      const addedModule = await addModuleScore(newModule);

      if (addedModule) {
        // 无感知刷新：直接更新本地状态，不重新加载整个页面
        setExamDetail({
          ...examDetail,
          module_scores: [...examDetail.module_scores, addedModule],
        });
        message.success('子模块添加成功');
        setIsAddingModule(false);
      } else {
        message.error('添加子模块失败');
      }
    } catch (error) {
      console.error('添加子模块失败:', error);
      message.error('添加子模块失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 删除子模块
  const handleDeleteModule = async (moduleId: string, moduleName: string) => {
    if (!id || !examDetail) return;

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除子模块"${moduleName}"吗？此操作不可恢复！`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const success = await deleteModuleScore(moduleId);
          if (success) {
            // 无感知刷新：直接更新本地状态，不重新加载整个页面
            setExamDetail({
              ...examDetail,
              module_scores: examDetail.module_scores.filter(m => m.id !== moduleId),
            });
            message.success('子模块删除成功');
          } else {
            message.error('删除子模块失败');
          }
        } catch (error) {
          console.error('删除子模块失败:', error);
          message.error('删除子模块失败');
        }
      },
    });
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

  // 计算所有大模块的总用时（秒）
  const totalModulesTime = mainModules.reduce((sum, m) => sum + (m.time_used || 0), 0);

  // 优先使用各大模块用时总和
  // 只有当用户在列表页手动修改过总用时（与模块总和差异较大）时，才使用用户设置的值
  const displayTime = totalModulesTime || examDetail.time_used || 0;

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

  // 模块用时饼图配置
  const timeComparisonPieOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const minutes = (params.value / 60).toFixed(1);
        const percent = params.percent.toFixed(1);
        return `${params.marker}${params.name}<br/>用时: ${minutes}m<br/>占比: ${percent}%`;
      },
    },
    legend: {
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      textStyle: {
        fontSize: 12,
      },
    },
    series: [
      {
        name: '用时',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: (params: any) => {
            const minutes = (params.value / 60).toFixed(1);
            return `${params.name}\n${minutes}m (${params.percent.toFixed(1)}%)`;
          },
          fontSize: 12,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: true,
        },
        data: mainModules
          .map(m => ({
            name: m.module_name,
            value: m.time_used || 0,
          }))
          .filter(item => item.value > 0) // 过滤掉用时为0的模块
          .sort((a, b) => b.value - a.value), // 按用时降序排列
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
        onClick={() => {
          // 检查是否从列表页跳转过来
          const from = searchParams.get('from');
          const page = searchParams.get('page');
          const pageSize = searchParams.get('pageSize');

          if (from === 'list' && page) {
            // 返回到列表页的指定页码
            navigate(`/exams?page=${page}${pageSize ? `&pageSize=${pageSize}` : ''}`);
          } else {
            // 默认返回列表页第一页
            navigate('/exams');
          }
        }}
        className="mb-6"
      >
        <ArrowLeftOutlined className="mr-2 h-4 w-4" />
        返回列表
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">{examDetail.exam_name} - 详情</h1>

        <Descriptions
          bordered
          column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}
          size="middle"
        >
          <Descriptions.Item label="排序">
            {examDetail.sort_order}
          </Descriptions.Item>
          <Descriptions.Item label="考试类型">
            {examDetail.exam_type || '国考模考'}
          </Descriptions.Item>
          <Descriptions.Item label="考试日期">
            <div className="flex items-center gap-2">
              <CalendarOutlined />
              <span>{examDetail.exam_date || examDetail.created_at.split('T')[0]}</span>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(examDetail.created_at).toLocaleString('zh-CN')}
          </Descriptions.Item>
          <Descriptions.Item label="上传时间">
            {formatDate(examDetail.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label="考试报告链接" span={2}>
            {examDetail.report_url ? (
              <a
                href={examDetail.report_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <LinkOutlined />
                <span>{examDetail.exam_name}考试报告链接地址</span>
              </a>
            ) : (
              <span className="text-gray-400">暂无链接</span>
            )}
          </Descriptions.Item>
        </Descriptions>

        {/* 备注区域 - 两列布局 */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 有进步的地方 */}
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <RiseOutlined className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">有进步的地方</span>
            </div>
            {examDetail.improvements ? (
              <div
                className="text-sm break-words text-gray-700 dark:text-gray-300 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: examDetail.improvements }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">暂无内容</p>
            )}
          </div>

          {/* 出错的地方 */}
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <WarningOutlined className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">出错的地方</span>
            </div>
            {examDetail.mistakes ? (
              <div
                className="text-sm break-words text-gray-700 dark:text-gray-300 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: examDetail.mistakes }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">暂无内容</p>
            )}
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
        <Card
          className="exam-stat-card shadow-lg hover:shadow-xl transition-shadow duration-300"
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
          className="exam-stat-card shadow-lg hover:shadow-xl transition-shadow duration-300"
          style={{ background: generateGradientStyle(EXAM_DETAIL_GRADIENTS[1]) }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-semibold text-white">用时</span>
            <ClockCircleOutlined className="text-lg text-white opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1 text-white">
            {displayTime ? Math.round(displayTime / 60) : '-'}
          </div>
          <p className="text-xs text-white opacity-80">m</p>
        </Card>

        <Card
          className="exam-stat-card shadow-lg hover:shadow-xl transition-shadow duration-300"
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
          className="exam-stat-card shadow-lg hover:shadow-xl transition-shadow duration-300"
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
          className="exam-stat-card shadow-lg hover:shadow-xl transition-shadow duration-300"
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
        <Card className="mb-8 border-orange-200 bg-orange-50 shadow-md">
              <WarningOutlined className="mr-2 h-5 w-5" />             弱势模块提醒            以下模块正确率低于60%,需要重点加强
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
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="mb-4">
              <TitleWithTooltip
                title="各模块正确率"
                tooltip="雷达图展示各个考试模块的正确率分布情况，可以直观地看出各模块的强弱项。正确率越高，表示该模块掌握得越好。"
              />
            </div>
            {mainModules.length > 0 ? (
              <div className="flex items-center justify-center">
                <ReactECharts option={radarOption} style={{ height: '450px', width: '100%' }} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[450px] text-gray-500">
                暂无数据
              </div>
            )}
          </Card>

        <Card
          className="shadow-md hover:shadow-lg transition-shadow duration-300"
          title={
            <TitleWithTooltip
              title="各模块用时对比"
              tooltip="展示各模块的答题用时统计，帮助分析时间分配是否合理。饼图显示用时占比，柱状图显示具体用时。"
            />
          }
          extra={
            <Tabs
              activeKey={timeChartType}
              onChange={(key) => setTimeChartType(key as 'pie' | 'bar')}
              items={[
                { key: 'pie', label: '饼图' },
                { key: 'bar', label: '柱状图' },
              ]}
              size="small"
            />
          }
        >
          {mainModules.length > 0 ? (
            timeChartType === 'pie' ? (
              <ReactECharts
                key="pie-chart"
                option={timeComparisonPieOption}
                style={{ height: '400px' }}
              />
            ) : (
              <ReactECharts
                key="bar-chart"
                option={timeComparisonOption}
                style={{ height: '400px' }}
              />
            )
          ) : (
            <div className="flex items-center justify-center h-[400px] text-gray-500">
              暂无数据
            </div>
          )}
        </Card>
      </div>

      {/* 模块详情表格 */}
      <Card className="shadow-md">
        <div className="mb-4">
          <TitleWithTooltip
            title="模块详细数据"
            tooltip="详细展示各个模块和子模块的答题情况，包括总题数、答对题数、正确率和用时。可以点击编辑按钮修改数据。"
          />
        </div>
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
                      <span className="ml-2 font-medium text-red-600">{mainModule.wrong_answers}</span>
                      <Tooltip title="答错题数由系统自动计算（总题数 - 答对数）">
                        <InfoCircleOutlined className="ml-1 h-3 w-3 text-muted-foreground cursor-help" />
                      </Tooltip>
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
                        <div
                          key={subModule.id}
                          className="bg-gradient-to-r from-muted/30 to-muted/50 rounded-md p-4 text-sm border-l-4 border-primary/30 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
                              <span className="font-medium text-base">{subModule.module_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Tag
                                className="text-xs"
                                color={
                                  (subModule.accuracy_rate || 0) >= 80 ? 'green' :
                                  (subModule.accuracy_rate || 0) >= 60 ? 'blue' :
                                  'red'
                                }
                              >
                                正确率: {subModule.accuracy_rate?.toFixed(1)}%
                              </Tag>
                              <Button
                                type="text"
                                size="small"
                                danger
                                className="h-6 w-6 p-0"
                                onClick={() => handleDeleteModule(subModule.id, subModule.module_name)}
                                title="删除子模块"
                              >
                                <DeleteOutlined className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* 第一行：总题数、答对 */}
                          <div className="grid grid-cols-2 gap-4 mb-2">
                            <div className="flex items-center gap-1">
                              <FileOutlined className="text-muted-foreground" />
                              <span className="text-muted-foreground">总题数:</span>
                              {editingField?.moduleId === subModule.id && editingField.field === 'total' ? (
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
                                      handleSaveField(subModule);
                                    } else {
                                      setEditingField(null);
                                    }
                                  }}
                                  onPressEnter={() => {
                                    if (editValue) {
                                      handleSaveField(subModule);
                                    }
                                  }}
                                  autoFocus
                                  className="ml-2 w-16 h-7 text-sm"
                                  disabled={isSaving}
                                />
                              ) : (
                                <>
                                  <span className="ml-2 font-medium">{subModule.total_questions}</span>
                                  <Button
                                    type="text"
                                    size="small"
                                    className="ml-1 h-6 w-6 p-0"
                                    onClick={() => handleEditField(subModule, 'total')}
                                  >
                                    <EditOutlined className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
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
                              <span className="text-muted-foreground">答对:</span>
                              {editingField?.moduleId === subModule.id && editingField.field === 'correct' ? (
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
                                      handleSaveField(subModule);
                                    } else {
                                      setEditingField(null);
                                    }
                                  }}
                                  onPressEnter={() => {
                                    if (editValue) {
                                      handleSaveField(subModule);
                                    }
                                  }}
                                  autoFocus
                                  className="ml-2 w-16 h-7 text-sm"
                                  disabled={isSaving}
                                />
                              ) : (
                                <>
                                  <span className="ml-2 font-medium text-green-600">{subModule.correct_answers}</span>
                                  <Button
                                    type="text"
                                    size="small"
                                    className="ml-1 h-6 w-6 p-0"
                                    onClick={() => handleEditField(subModule, 'correct')}
                                  >
                                    <EditOutlined className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* 第二行：答错、用时 */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-1">
                              <CloseCircleOutlined className="text-red-600" />
                              <span className="text-muted-foreground">答错:</span>
                              <span className="ml-2 font-medium text-red-600">{subModule.wrong_answers}</span>
                              <Tooltip title="答错题数由系统自动计算（总题数 - 答对数）">
                                <InfoCircleOutlined className="ml-1 h-3 w-3 text-muted-foreground cursor-help" />
                              </Tooltip>
                            </div>
                            <div className="flex items-center gap-1">
                              <ClockCircleOutlined className="text-muted-foreground" />
                              <span className="text-muted-foreground">用时:</span>
                              {editingTimeModuleId === subModule.id ? (
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
                                        handleSaveTime(subModule, editTime);
                                      } else {
                                        setEditingTimeModuleId(null);
                                      }
                                    }}
                                    onPressEnter={() => {
                                      if (editTime) {
                                        handleSaveTime(subModule, editTime);
                                      }
                                    }}
                                    autoFocus
                                    className="w-16 h-7 text-sm"
                                    disabled={isSaving}
                                  />
                                  <span className="text-xs">分钟</span>
                                </div>
                              ) : (
                                <>
                                  <span className="ml-2 font-medium">{formatTime(subModule.time_used)}</span>
                                  <Button
                                    type="text"
                                    size="small"
                                    className="ml-1 h-6 w-6 p-0"
                                    onClick={() => handleEditTime(subModule)}
                                  >
                                    <EditOutlined className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 添加子模块按钮 */}
                  {canAddSubModule(mainModule.module_name, subModules.length) && (
                    <div className="mt-4">
                      <Button
                        type="dashed"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => handleOpenAddModule(mainModule.module_name)}
                        className="w-full"
                      >
                        添加子模块
                      </Button>
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
        width={window.innerWidth >= 1366 ? 1100 : 900}
      >
        <div className="space-y-4">
          {/* 有进步的地方 */}
          {(editingNoteType === 'improvements' || editingNoteType === 'both') && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <RiseOutlined className="text-green-600" />
                <span className="font-medium">有进步的地方</span>
              </div>
              <WangEditor
                value={improvements}
                onChange={(html) => setImprovements(html)}
                placeholder="记录本次考试中有进步的地方..."
                maxLength={5000}
                height={300}
              />
            </div>
          )}

          {/* 出错的地方 */}
          {(editingNoteType === 'mistakes' || editingNoteType === 'both') && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <WarningOutlined className="text-red-600" />
                <span className="font-medium">出错的地方</span>
              </div>
              <WangEditor
                value={mistakes}
                onChange={(html) => setMistakes(html)}
                placeholder="记录本次考试中出错的地方..."
                maxLength={5000}
                height={300}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* 添加子模块对话框 */}
      <Modal
        title={`添加子模块 - ${addingParentModule}`}
        open={isAddingModule}
        onCancel={() => setIsAddingModule(false)}
        onOk={handleAddModule}
        okText="确定"
        cancelText="取消"
        confirmLoading={isSaving}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">子模块名称 *</label>
            <Input
              placeholder="请输入子模块名称"
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              maxLength={50}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">总题数 *</label>
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="请输入总题数"
              value={newModuleTotal}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d+$/.test(value)) {
                  setNewModuleTotal(value);
                }
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">答对数 *</label>
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="请输入答对数"
              value={newModuleCorrect}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d+$/.test(value)) {
                  setNewModuleCorrect(value);
                }
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">用时（分钟） *</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="请输入用时"
              value={newModuleTime}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d+\.?\d*$/.test(value)) {
                  setNewModuleTime(value);
                }
              }}
              suffix="分钟"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
