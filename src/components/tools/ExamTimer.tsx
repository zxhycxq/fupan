import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Modal, message, Progress, Space, Row, Col, Statistic, InputNumber, Switch } from 'antd';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  HolderOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import html2canvas from 'html2canvas';

// 模块接口定义
interface Module {
  id: string;
  name: string;
  startTime: number | null;
  endTime: number | null;
  duration: number;
  suggestedTime: number; // 建议时间（秒）
  status: 'pending' | 'running' | 'completed';
}

// 计时状态接口
interface TimerState {
  totalStartTime: number | null;
  totalPausedTime: number;
  isPaused: boolean;
  isRunning: boolean;
  isCountdown: boolean;
  countdownDuration: number; // 倒计时总时长（秒）
  modules: Module[];
  currentModuleId: string | null;
}

// 默认模块配置
const DEFAULT_MODULES: Module[] = [
  { id: '1', name: '常识判断', startTime: null, endTime: null, duration: 0, suggestedTime: 600, status: 'pending' },
  { id: '2', name: '言语理解与表达', startTime: null, endTime: null, duration: 0, suggestedTime: 2400, status: 'pending' },
  { id: '3', name: '数量关系', startTime: null, endTime: null, duration: 0, suggestedTime: 900, status: 'pending' },
  { id: '4', name: '判断推理', startTime: null, endTime: null, duration: 0, suggestedTime: 2100, status: 'pending' },
  { id: '5', name: '资料分析', startTime: null, endTime: null, duration: 0, suggestedTime: 1200, status: 'pending' },
  { id: '6', name: '政治理论', startTime: null, endTime: null, duration: 0, suggestedTime: 600, status: 'pending' },
];

const STORAGE_KEY = 'exam_timer_state';
const SETTINGS_KEY = 'exam_timer_settings'; // 新增：保存设置的键

// 可拖拽项组件
interface DraggableItemProps {
  module: Module;
  index: number;
  onNameChange: (index: number, value: string) => void;
  onTimeChange: (index: number, value: number) => void;
}

const DraggableItem = ({ module, index, onNameChange, onTimeChange }: DraggableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: module.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const minutes = Math.floor(module.suggestedTime / 60);
  const timeRange = minutes < 10 ? '(5-10分钟)' : 
                    minutes < 20 ? '(10-20分钟)' : 
                    minutes < 30 ? '(20-30分钟)' : 
                    minutes < 40 ? '(30-40分钟)' : '(40-50分钟)';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 bg-gray-50 rounded-lg mb-2"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-move text-gray-400 hover:text-gray-600 self-start sm:self-center"
      >
        <HolderOutlined style={{ fontSize: '16px' }} />
      </div>
      
      <div className="flex-1 w-full flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        <Input
          value={module.name}
          onChange={(e) => onNameChange(index, e.target.value)}
          maxLength={10}
          className="w-full sm:w-48"
          placeholder="模块名称"
        />
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <InputNumber
            min={0}
            value={minutes}
            onChange={(value) => onTimeChange(index, value || 0)}
            className="flex-1 sm:flex-none sm:w-20"
            placeholder="分钟"
            inputMode="numeric"
          />
          <span className="text-xs text-gray-400 whitespace-nowrap">{timeRange}</span>
        </div>
      </div>
    </div>
  );
};

export default function ExamTimer() {
  const [state, setState] = useState<TimerState>({
    totalStartTime: null,
    totalPausedTime: 0,
    isPaused: false,
    isRunning: false,
    isCountdown: false,
    countdownDuration: 6900, // 默认115分钟
    modules: DEFAULT_MODULES,
    currentModuleId: null,
  });

  const [totalTime, setTotalTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [tempModules, setTempModules] = useState<Module[]>(DEFAULT_MODULES);
  const [tempCountdown, setTempCountdown] = useState(false);
  const [tempDuration, setTempDuration] = useState(115);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    })
  );

  // 初始化时加载保存的设置
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setState(prev => ({
          ...prev,
          modules: settings.modules || DEFAULT_MODULES,
          isCountdown: settings.isCountdown || false,
          countdownDuration: settings.countdownDuration || 6900,
        }));
      } catch (e) {
        console.error('加载设置失败:', e);
      }
    }
  }, []);

  // 从localStorage恢复状态
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const savedState = JSON.parse(saved);
        if (savedState.isRunning) {
          Modal.confirm({
            title: '检测到未完成的模考',
            content: '是否恢复上次的计时状态？',
            onOk: () => {
              setState(savedState);
              message.success('已恢复计时状态');
            },
            onCancel: () => {
              localStorage.removeItem(STORAGE_KEY);
              message.info('已清除旧状态');
            },
          });
        }
      } catch (e) {
        console.error('恢复状态失败:', e);
      }
    }
  }, []);

  // 保存状态到localStorage
  useEffect(() => {
    if (state.isRunning) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  // 计时器更新
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        if (state.totalStartTime) {
          const elapsed = Math.floor((now - state.totalStartTime - state.totalPausedTime) / 1000);
          setTotalTime(elapsed);

          // 倒计时模式检查
          if (state.isCountdown && elapsed >= state.countdownDuration) {
            handleEndExam();
            playAlert();
            message.error('考试时间到！已自动结束考试');
          }

          // 更新当前模块时间
          setState(prev => ({
            ...prev,
            modules: prev.modules.map(m => {
              if (m.id === prev.currentModuleId && m.status === 'running' && m.startTime) {
                const moduleDuration = Math.floor((now - m.startTime) / 1000);
                
                // 检查模块建议时间
                if (moduleDuration >= m.suggestedTime && moduleDuration % 60 === 0) {
                  playAlert();
                  message.warning(`${m.name}已超过建议时间 ${Math.floor((moduleDuration - m.suggestedTime) / 60)} 分钟`);
                }
                
                return { ...m, duration: moduleDuration };
              }
              return m;
            }),
          }));
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, state.isPaused, state.totalStartTime, state.totalPausedTime, state.currentModuleId, state.isCountdown, state.countdownDuration]);

  // 播放提醒音
  const playAlert = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6OyrWBQLSKDf8sFuIwUug8/y2Ik2CBhku+zooVARC0yl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVC0ig3/LBbiMFL4PP8tiJNggYZLvs6KFQEQtMpeHxuWUcBTaN1e/OfSkFKH7M8NqPOwsSXLHo7atYFQtIoN/ywW4jBS+Dz/LYiTYIGGS77OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6O2rWBULSKDf8sFuIwUvg8/y2Ik2CBhku+zooVARC0yl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVC0ig3/LBbiMFL4PP8tiJNggYZLvs6KFQEQtMpeHxuWUcBTaN1e/OfSkFKH7M8NqPOwsSXLHo7atYFQtIoN/ywW4jBS+Dz/LYiTYIGGS77OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6O2rWBULSKDf8sFuIwUvg8/y2Ik2CBhku+zooVARC0yl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVC0ig3/LBbiMFL4PP8tiJNggYZLvs6KFQEQtMpeHxuWUcBTaN1e/OfSkFKH7M8NqPOwsSXLHo7atYFQtIoN/ywW4jBS+Dz/LYiTYIGGS77OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6O2rWBULSKDf8sFuIwUvg8/y2Ik2CBhku+zooVARC0yl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVC0ig3/LBbiMFL4PP8tiJNggYZLvs6KFQEQtMpeHxuWUcBTaN1e/OfSkFKH7M8NqPOwsSXLHo7atYFQtIoN/ywW4jBS+Dz/LYiTYIGGS77OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6O2rWBULSKDf8sFuIwUvg8/y2Ik2CBhku+zooVARC0yl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVC0ig3/LBbiMFL4PP8tiJNggYZLvs6KFQEQtMpeHxuWUcBTaN1e/OfSkFKH7M8NqPOwsSXLHo7atYFQtIoN/ywW4jBS+Dz/LYiTYIGGS77OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6O2rWBULSKDf8sFuIwUvg8/y');
    }
    audioRef.current.play().catch(e => console.error('播放提醒音失败:', e));
  };

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 开始考试
  const handleStartExam = () => {
    setState(prev => ({
      ...prev,
      totalStartTime: Date.now(),
      totalPausedTime: 0,
      isRunning: true,
      isPaused: false,
    }));
    message.success('考试开始，请开始答题');
  };

  // 暂停/继续
  const handleTogglePause = () => {
    if (state.isPaused) {
      const pauseDuration = Date.now() - (state.totalStartTime || 0);
      setState(prev => ({
        ...prev,
        isPaused: false,
        totalPausedTime: prev.totalPausedTime + pauseDuration,
      }));
      message.info('继续计时');
    } else {
      setState(prev => ({
        ...prev,
        isPaused: true,
        totalStartTime: Date.now(),
      }));
      message.info('已暂停');
    }
  };

  // 开始模块
  const handleStartModule = (moduleId: string) => {
    const now = Date.now();
    setState(prev => ({
      ...prev,
      modules: prev.modules.map(m => {
        if (m.status === 'running' && m.id !== moduleId) {
          return {
            ...m,
            endTime: now,
            status: 'completed' as const,
          };
        }
        if (m.id === moduleId) {
          return {
            ...m,
            startTime: now,
            status: 'running' as const,
          };
        }
        return m;
      }),
      currentModuleId: moduleId,
    }));
    
    const module = state.modules.find(m => m.id === moduleId);
    message.success(`开始 ${module?.name}`);
  };

  // 结束模块
  const handleEndModule = (moduleId: string) => {
    const now = Date.now();
    const completedModules = state.modules.filter(m => m.status === 'completed').length + 1;
    const isLastModule = completedModules === state.modules.length;

    setState(prev => ({
      ...prev,
      modules: prev.modules.map(m =>
        m.id === moduleId
          ? { ...m, endTime: now, status: 'completed' as const }
          : m
      ),
      currentModuleId: null,
    }));
    
    const module = state.modules.find(m => m.id === moduleId);
    message.success(`完成 ${module?.name}`);

    // 如果是最后一个模块，自动结束考试
    if (isLastModule) {
      setTimeout(() => {
        handleEndExam();
      }, 500);
    }
  };

  // 结束考试
  const handleEndExam = () => {
    const now = Date.now();
    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      modules: prev.modules.map(m =>
        m.status === 'running'
          ? { ...m, endTime: now, status: 'completed' as const }
          : m
      ),
      currentModuleId: null,
    }));
    
    setShowReport(true);
    localStorage.removeItem(STORAGE_KEY);
    message.success('考试结束，正在生成报告...');
  };

  // 重置
  const handleReset = () => {
    Modal.confirm({
      title: '确认重置',
      content: '重置后将清空所有计时数据，是否继续？',
      onOk: () => {
        setState({
          totalStartTime: null,
          totalPausedTime: 0,
          isPaused: false,
          isRunning: false,
          isCountdown: state.isCountdown,
          countdownDuration: state.countdownDuration,
          modules: state.modules.map(m => ({
            ...m,
            startTime: null,
            endTime: null,
            duration: 0,
            status: 'pending' as const,
          })),
          currentModuleId: null,
        });
        setTotalTime(0);
        localStorage.removeItem(STORAGE_KEY);
        message.success('已重置');
      },
    });
  };

  // 打开设置对话框
  const handleOpenSettings = () => {
    setTempModules([...state.modules]);
    setTempCountdown(state.isCountdown);
    setTempDuration(Math.floor(state.countdownDuration / 60));
    setShowSettings(true);
  };

  // 保存设置
  const handleSaveSettings = () => {
    // 验证总时间
    if (tempCountdown) {
      const totalModuleTime = tempModules.reduce((sum, m) => sum + m.suggestedTime, 0);
      if (totalModuleTime > tempDuration * 60) {
        message.error(`所有模块时间总和（${Math.ceil(totalModuleTime / 60)}分钟）不能超过考试总时长（${tempDuration}分钟）`);
        return;
      }
    }
    
    const newSettings = {
      modules: tempModules,
      isCountdown: tempCountdown,
      countdownDuration: tempDuration * 60,
    };
    
    // 保存设置到localStorage
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    
    setState(prev => ({
      ...prev,
      ...newSettings,
    }));
    setShowSettings(false);
    message.success('设置已保存');
  };

  // 拖拽结束
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setTempModules((prev) => {
        const activeIndex = prev.findIndex((i) => i.id === active.id);
        const overIndex = prev.findIndex((i) => i.id === over?.id);
        return arrayMove(prev, activeIndex, overIndex);
      });
    }
  };

  // 保存报告为图片
  const handleSaveReport = async () => {
    if (!reportRef.current) return;
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `考试报告_${new Date().toLocaleDateString()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      message.success('报告已保存为图片');
    } catch (error) {
      console.error('保存图片失败:', error);
      message.error('保存图片失败');
    }
  };

  // 生成报告图表配置
  const getReportChartOption = () => {
    const completedModules = state.modules.filter(m => m.status === 'completed');
    
    return {
      title: {
        text: '各模块时间分布',
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}秒 ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [
        {
          name: '时间分布',
          type: 'pie',
          radius: '50%',
          data: completedModules.map(m => ({
            value: m.duration,
            name: m.name,
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
  };

  const displayTime = state.isCountdown 
    ? Math.max(0, state.countdownDuration - totalTime)
    : totalTime;

  // 处理模块名称变更
  const handleModuleNameChange = (index: number, value: string) => {
    const newModules = [...tempModules];
    newModules[index].name = value;
    setTempModules(newModules);
  };

  // 处理模块时间变更
  const handleModuleTimeChange = (index: number, minutes: number) => {
    const newModules = [...tempModules];
    newModules[index].suggestedTime = minutes * 60;
    setTempModules(newModules);
  };

  return (
    <div className="space-y-6">
      {/* 总计时器和控制按钮 */}
      <Card
        title={
          <Space>
            <ClockCircleOutlined />
            {state.isCountdown ? '倒计时' : '总用时'}
          </Space>
        }
        extra={
          <Button
            icon={<SettingOutlined />}
            onClick={handleOpenSettings}
            disabled={state.isRunning}
          >
            设置
          </Button>
        }
      >
        <div className="text-center space-y-4">
          <div className={`text-5xl font-bold font-mono ${state.isCountdown && displayTime < 300 ? 'text-red-500' : ''}`}>
            {formatTime(displayTime)}
          </div>
          {state.isCountdown && (
            <div className="text-sm text-gray-500">
              剩余时间
            </div>
          )}

          <Space size="middle" wrap className="justify-center">
            {!state.isRunning ? (
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={handleStartExam}
              >
                开始考试
              </Button>
            ) : (
              <>
                <Button
                  size="large"
                  icon={state.isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                  onClick={handleTogglePause}
                >
                  {state.isPaused ? '继续' : '暂停'}
                </Button>
                <Button
                  danger
                  size="large"
                  icon={<StopOutlined />}
                  onClick={handleEndExam}
                >
                  结束考试
                </Button>
              </>
            )}
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={handleReset}
              disabled={state.isRunning}
            >
              重置
            </Button>
          </Space>
        </div>
      </Card>

      {/* 模块计时器 */}
      <Row gutter={[16, 16]}>
        {state.modules.map((module) => {
          const progress = module.suggestedTime > 0
            ? Math.min(100, (module.duration / module.suggestedTime) * 100)
            : 0;
          const isOvertime = module.duration > module.suggestedTime;

          return (
            <Col xs={24} sm={12} lg={8} key={module.id}>
              <Card
                className={`${module.status === 'running' ? 'border-2 border-blue-500' : ''} shadow-md hover:shadow-lg transition-shadow`}
                style={{ height: '100%' }}
              >
                <div className="space-y-3">
                  <div className="font-semibold text-base">{module.name}</div>
                  
                  <div className="text-2xl font-mono font-bold text-center">
                    {formatTime(module.duration)}
                  </div>

                  {module.suggestedTime > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>建议: {formatTime(module.suggestedTime)}</span>
                        <span className={isOvertime ? 'text-red-500' : ''}>
                          {isOvertime ? '+' : ''}{formatTime(Math.abs(module.duration - module.suggestedTime))}
                        </span>
                      </div>
                      <Progress
                        percent={progress}
                        status={isOvertime ? 'exception' : 'active'}
                        showInfo={false}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    {module.status === 'pending' && (
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleStartModule(module.id)}
                        disabled={!state.isRunning || state.isPaused}
                        block
                      >
                        开始
                      </Button>
                    )}
                    {module.status === 'running' && (
                      <Button
                        icon={<StopOutlined />}
                        onClick={() => handleEndModule(module.id)}
                        block
                      >
                        结束
                      </Button>
                    )}
                    {module.status === 'completed' && (
                      <div className="text-center text-sm text-gray-500 py-2 w-full">
                        ✓ 已完成
                      </div>
                    )}
                  </div>

                  {module.status === 'completed' && module.startTime && module.endTime && (
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>开始: {new Date(module.startTime).toLocaleTimeString()}</div>
                      <div>结束: {new Date(module.endTime).toLocaleTimeString()}</div>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* 设置对话框 */}
      <Modal
        title="计时器设置"
        open={showSettings}
        onOk={handleSaveSettings}
        onCancel={() => setShowSettings(false)}
        width="90%"
        style={{ maxWidth: '700px' }}
        className="exam-timer-settings-modal"
      >
        <div className="space-y-4 sm:space-y-6">
          {/* 倒计时模式 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-base sm:text-lg" />
                <span className="font-semibold text-sm sm:text-base">倒计时模式</span>
              </div>
              <Switch
                checked={tempCountdown}
                onChange={setTempCountdown}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pl-0 sm:pl-7">
              <span className="text-sm text-gray-600">考试总时长</span>
              <InputNumber
                min={1}
                value={tempDuration}
                onChange={(value) => setTempDuration(value || 115)}
                className="w-full sm:w-28"
                addonAfter="分钟"
                disabled={!tempCountdown}
                inputMode="numeric"
              />
            </div>
          </div>
          
          {/* 模块设置 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <SettingOutlined className="text-base sm:text-lg" />
              <span className="font-semibold text-sm sm:text-base">时间设置（拖拽排序）</span>
            </div>
            <DndContext sensors={sensors} onDragEnd={onDragEnd}>
              <SortableContext
                items={tempModules.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {tempModules.map((module, index) => (
                    <DraggableItem
                      key={module.id}
                      module={module}
                      index={index}
                      onNameChange={handleModuleNameChange}
                      onTimeChange={handleModuleTimeChange}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            
            {/* 总时间提示 */}
            {tempCountdown && (
              <div className="mt-3 text-xs sm:text-sm text-gray-500 pl-0 sm:pl-7">
                当前模块总时间：{Math.ceil(tempModules.reduce((sum, m) => sum + m.suggestedTime, 0) / 60)} 分钟
                {tempModules.reduce((sum, m) => sum + m.suggestedTime, 0) > tempDuration * 60 && (
                  <span className="text-red-500 ml-2">（超出考试总时长）</span>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* 考试报告对话框 */}
      <Modal
        title="考试报告"
        open={showReport}
        onCancel={() => setShowReport(false)}
        footer={[
          <Button key="save" icon={<DownloadOutlined />} onClick={handleSaveReport}>
            保存为图片
          </Button>,
          <Button key="close" type="primary" onClick={() => setShowReport(false)}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        <div ref={reportRef} className="space-y-6 p-4 bg-white">
          <Row gutter={16}>
            <Col span={12}>
              <Card>
                <Statistic
                  title="总用时"
                  value={formatTime(totalTime)}
                  valueStyle={{ fontSize: '24px' }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic
                  title="完成模块"
                  value={`${state.modules.filter(m => m.status === 'completed').length} / ${state.modules.length}`}
                  valueStyle={{ fontSize: '24px' }}
                />
              </Card>
            </Col>
          </Row>

          {state.modules.filter(m => m.status === 'completed').length > 0 && (
            <div>
              <ReactECharts option={getReportChartOption()} style={{ height: '300px' }} />
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">各模块详情</h3>
            <Row gutter={[16, 16]}>
              {state.modules.map((module) => {
                const isOvertime = module.status === 'completed' && module.duration > module.suggestedTime;
                const isUndertime = module.status === 'completed' && module.duration < module.suggestedTime;
                
                return (
                  <Col span={8} key={module.id}>
                    <Card size="small" className="h-full">
                      <div className="space-y-2">
                        <div className="font-medium">{module.name}</div>
                        <div className="text-sm text-gray-500">
                          {module.status === 'completed' ? (
                            <>
                              <div>用时: {formatTime(module.duration)}</div>
                              {module.suggestedTime > 0 && (
                                <div className={isOvertime ? 'text-red-500' : isUndertime ? 'text-green-500' : ''}>
                                  {isOvertime && <ArrowUpOutlined />}
                                  {isUndertime && <ArrowDownOutlined />}
                                  {' '}
                                  {isOvertime ? '+' : '-'}
                                  {formatTime(Math.abs(module.duration - module.suggestedTime))}
                                </div>
                              )}
                            </>
                          ) : (
                            '未完成'
                          )}
                        </div>
                        {module.status === 'completed' && module.startTime && module.endTime && (
                          <div className="text-xs text-gray-400">
                            <div>{new Date(module.startTime).toLocaleTimeString()}</div>
                            <div>{new Date(module.endTime).toLocaleTimeString()}</div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>

          {state.modules.some(m => m.status === 'completed' && m.duration > m.suggestedTime) && (
            <Card className="border-yellow-500">
              <div className="flex items-start gap-2">
                <ExclamationCircleOutlined className="text-yellow-500 text-lg mt-1" />
                <div>
                  <div className="font-medium">时间分配建议</div>
                  <div className="text-sm text-gray-500 mt-1">
                    以下模块超时，建议在下次模考中注意时间控制：
                    <ul className="list-disc list-inside mt-1">
                      {state.modules
                        .filter(m => m.status === 'completed' && m.duration > m.suggestedTime)
                        .map(m => (
                          <li key={m.id}>
                            {m.name}: 超时 {formatTime(m.duration - m.suggestedTime)}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </Modal>
    </div>
  );
}
