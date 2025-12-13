import { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Switch, Modal, message, Progress, Space, Row, Col, Statistic } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

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

export default function ExamTimer() {
  const [state, setState] = useState<TimerState>({
    totalStartTime: null,
    totalPausedTime: 0,
    isPaused: false,
    isRunning: false,
    isCountdown: false,
    countdownDuration: 7200, // 默认120分钟
    modules: DEFAULT_MODULES,
    currentModuleId: null,
  });

  const [totalTime, setTotalTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [showModuleSettings, setShowModuleSettings] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
          modules: DEFAULT_MODULES.map(m => ({
            ...m,
            suggestedTime: state.modules.find(sm => sm.id === m.id)?.suggestedTime || m.suggestedTime,
            name: state.modules.find(sm => sm.id === m.id)?.name || m.name,
          })),
          currentModuleId: null,
        });
        setTotalTime(0);
        localStorage.removeItem(STORAGE_KEY);
        message.success('已重置');
      },
    });
  };

  // 保存模块设置
  const handleSaveModuleSettings = () => {
    if (editingModule) {
      setState(prev => ({
        ...prev,
        modules: prev.modules.map(m =>
          m.id === editingModule.id ? editingModule : m
        ),
      }));
      setEditingModule(null);
      setShowModuleSettings(false);
      message.success('设置已保存');
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
            onClick={() => setShowSettings(true)}
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
                title={module.name}
                extra={
                  <Button
                    size="small"
                    icon={<SettingOutlined />}
                    onClick={() => {
                      setEditingModule(module);
                      setShowModuleSettings(true);
                    }}
                    disabled={state.isRunning}
                  />
                }
                className={module.status === 'running' ? 'border-2 border-blue-500' : ''}
              >
                <div className="space-y-3">
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
        onOk={() => setShowSettings(false)}
        onCancel={() => setShowSettings(false)}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>倒计时模式</span>
            <Switch
              checked={state.isCountdown}
              onChange={(checked) =>
                setState(prev => ({ ...prev, isCountdown: checked }))
              }
              disabled={state.isRunning}
            />
          </div>
          {state.isCountdown && (
            <div className="space-y-2">
              <label>考试总时长（分钟）</label>
              <Input
                type="number"
                value={Math.floor(state.countdownDuration / 60)}
                onChange={(e) =>
                  setState(prev => ({
                    ...prev,
                    countdownDuration: parseInt(e.target.value) * 60,
                  }))
                }
                disabled={state.isRunning}
                min={1}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* 模块设置对话框 */}
      <Modal
        title="模块设置"
        open={showModuleSettings}
        onOk={handleSaveModuleSettings}
        onCancel={() => {
          setEditingModule(null);
          setShowModuleSettings(false);
        }}
      >
        {editingModule && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label>模块名称</label>
              <Input
                value={editingModule.name}
                onChange={(e) =>
                  setEditingModule({ ...editingModule, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label>建议时间（分钟）</label>
              <Input
                type="number"
                value={Math.floor(editingModule.suggestedTime / 60)}
                onChange={(e) =>
                  setEditingModule({
                    ...editingModule,
                    suggestedTime: parseInt(e.target.value) * 60,
                  })
                }
                min={0}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* 考试报告对话框 */}
      <Modal
        title="考试报告"
        open={showReport}
        onCancel={() => setShowReport(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setShowReport(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        <div className="space-y-6">
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
            <div className="space-y-2">
              {state.modules.map((module) => (
                <Card key={module.id} size="small">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{module.name}</div>
                      <div className="text-sm text-gray-500">
                        {module.status === 'completed' ? (
                          <>
                            用时: {formatTime(module.duration)}
                            {module.suggestedTime > 0 && (
                              <span className={module.duration > module.suggestedTime ? 'text-red-500 ml-2' : 'text-green-500 ml-2'}>
                                ({module.duration > module.suggestedTime ? '+' : '-'}
                                {formatTime(Math.abs(module.duration - module.suggestedTime))})
                              </span>
                            )}
                          </>
                        ) : (
                          '未完成'
                        )}
                      </div>
                    </div>
                    {module.status === 'completed' && module.startTime && module.endTime && (
                      <div className="text-xs text-gray-500 text-right">
                        <div>{new Date(module.startTime).toLocaleTimeString()}</div>
                        <div>{new Date(module.endTime).toLocaleTimeString()}</div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
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
