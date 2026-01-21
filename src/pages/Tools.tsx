import { Card, Tabs } from 'antd';
import ExamTimer from '@/components/tools/ExamTimer';
import PersistentTimerExample from '@/components/tools/PersistentTimerExample';
import { ClockCircleOutlined, ExperimentOutlined } from '@ant-design/icons';

export default function Tools() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">小工具</h1>
      </div>

      <Card>
        <Tabs
          defaultActiveKey="timer"
          items={[
            {
              key: 'timer',
              label: (
                <span className="flex items-center gap-2">
                  <ClockCircleOutlined />
                  模考计时
                </span>
              ),
              children: <ExamTimer />,
            },
            {
              key: 'persistent-timer',
              label: (
                <span className="flex items-center gap-2">
                  <ExperimentOutlined />
                  持久化计时器示例
                </span>
              ),
              children: <PersistentTimerExample />,
            },
          ]}
        />
      </Card>
    </div>
  );
}

