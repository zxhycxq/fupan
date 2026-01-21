import { Card, Button, Space, Typography, Alert, Tag } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { usePersistentTimer, formatTime } from '@/hooks/usePersistentTimer';
import { useState } from 'react';

const { Title, Text } = Typography;

/**
 * 持久化计时器示例组件
 * 
 * 演示如何使用usePersistentTimer实现：
 * 1. 长时间后台运行不受影响
 * 2. 关闭页面后重新打开继续计时
 * 3. 页面可见性变化时自动同步时间
 */
export default function PersistentTimerExample() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 10));
  };

  const timer = usePersistentTimer({
    storageKey: 'example_persistent_timer',
    enableVisibilityTracking: true,
    continueWhenHidden: true,
    syncInterval: 1000,
    onRestore: (elapsedSeconds) => {
      addLog(`恢复计时状态，已用时间：${formatTime(elapsedSeconds)}`);
    },
    onHidden: () => {
      addLog('页面隐藏，计时器继续在后台运行');
    },
    onVisible: () => {
      addLog('页面恢复可见，同步实际经过的时间');
    },
  });

  const handleStart = () => {
    timer.start();
    addLog('开始计时');
  };

  const handlePause = () => {
    timer.pause();
    addLog('暂停计时');
  };

  const handleResume = () => {
    timer.resume();
    addLog('继续计时');
  };

  const handleStop = () => {
    timer.stop();
    addLog('停止计时并清除状态');
  };

  const handleReset = () => {
    timer.reset();
    addLog('重置计时器');
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <ClockCircleOutlined className="text-2xl text-primary" />
            <Title level={2} className="!mb-0">持久化计时器示例</Title>
          </div>

          {/* 时间显示 */}
          <div className="text-6xl font-mono font-bold text-primary">
            {formatTime(timer.currentTime)}
          </div>

          {/* 状态标签 */}
          <div className="flex items-center justify-center gap-2">
            {timer.isRunning && (
              <Tag color={timer.isPaused ? 'orange' : 'green'}>
                {timer.isPaused ? '已暂停' : '运行中'}
              </Tag>
            )}
            {!timer.isRunning && <Tag>未开始</Tag>}
          </div>

          {/* 控制按钮 */}
          <Space size="middle" wrap>
            {!timer.isRunning && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleStart}
                size="large"
              >
                开始计时
              </Button>
            )}

            {timer.isRunning && !timer.isPaused && (
              <Button
                icon={<PauseCircleOutlined />}
                onClick={handlePause}
                size="large"
              >
                暂停
              </Button>
            )}

            {timer.isRunning && timer.isPaused && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleResume}
                size="large"
              >
                继续
              </Button>
            )}

            {timer.isRunning && (
              <Button
                danger
                icon={<StopOutlined />}
                onClick={handleStop}
                size="large"
              >
                停止
              </Button>
            )}

            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
              size="large"
              disabled={!timer.isRunning}
            >
              重置
            </Button>
          </Space>
        </div>
      </Card>

      {/* 功能说明 */}
      <Card title="功能特性">
        <Space direction="vertical" className="w-full">
          <Alert
            message="✅ 后台运行不受影响"
            description="切换到其他标签页或最小化浏览器，计时器继续准确计时，不受浏览器节流策略影响"
            type="success"
            showIcon
          />
          <Alert
            message="✅ 关闭后可恢复"
            description="关闭页面或刷新后，重新打开会自动恢复计时状态，并补偿关闭期间的时间"
            type="success"
            showIcon
          />
          <Alert
            message="✅ 自动时间同步"
            description="使用Page Visibility API检测页面可见性变化，恢复可见时自动同步实际经过的时间"
            type="success"
            showIcon
          />
          <Alert
            message="✅ 基于时间戳计时"
            description="不依赖setInterval累加，而是基于时间戳计算，确保时间准确性"
            type="success"
            showIcon
          />
        </Space>
      </Card>

      {/* 测试步骤 */}
      <Card title="测试步骤">
        <ol className="space-y-2 pl-4">
          <li>
            <Text strong>测试后台运行：</Text>
            <Text className="ml-2">点击"开始计时"，然后切换到其他标签页等待1-2分钟，再切回来查看时间是否准确</Text>
          </li>
          <li>
            <Text strong>测试页面关闭恢复：</Text>
            <Text className="ml-2">点击"开始计时"，然后关闭或刷新页面，重新打开后会提示恢复计时状态</Text>
          </li>
          <li>
            <Text strong>测试暂停功能：</Text>
            <Text className="ml-2">点击"暂停"后关闭页面，重新打开后时间应该保持在暂停时的值</Text>
          </li>
          <li>
            <Text strong>测试长时间后台：</Text>
            <Text className="ml-2">开始计时后，最小化浏览器或锁屏，等待较长时间（如10分钟）后恢复，时间应该准确</Text>
          </li>
        </ol>
      </Card>

      {/* 操作日志 */}
      {logs.length > 0 && (
        <Card title="操作日志" size="small">
          <div className="space-y-1 font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className="text-muted-foreground">
                {log}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 技术说明 */}
      <Card title="技术实现">
        <Space direction="vertical" className="w-full">
          <div>
            <Text strong>1. 基于时间戳计时</Text>
            <div className="ml-4 text-muted-foreground">
              <Text>记录开始时间戳，每次更新时计算：当前时间 - 开始时间 + 累计时间</Text>
            </div>
          </div>
          <div>
            <Text strong>2. localStorage持久化</Text>
            <div className="ml-4 text-muted-foreground">
              <Text>保存开始时间戳、累计时间、暂停状态等，页面关闭后可恢复</Text>
            </div>
          </div>
          <div>
            <Text strong>3. Page Visibility API</Text>
            <div className="ml-4 text-muted-foreground">
              <Text>监听visibilitychange事件，页面恢复可见时重新计算实际经过的时间</Text>
            </div>
          </div>
          <div>
            <Text strong>4. beforeunload事件</Text>
            <div className="ml-4 text-muted-foreground">
              <Text>页面卸载前保存最新状态，确保数据不丢失</Text>
            </div>
          </div>
        </Space>
      </Card>
    </div>
  );
}
