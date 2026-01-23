import { useState, useEffect } from 'react';
import { Card, Spin, Empty, Timeline, Statistic, Row, Col, Tag } from 'antd';
import { 
  TrophyOutlined, 
  CalendarOutlined, 
  FileTextOutlined, 
  ClockCircleOutlined,
  RocketOutlined,
  FireOutlined 
} from '@ant-design/icons';
import { getLearningJourney, type LearningJourneyData } from '@/db/api';
import dayjs from 'dayjs';

export default function LearningJourney() {
  const [data, setData] = useState<LearningJourneyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const journeyData = await getLearningJourney();
      setData(journeyData);
    } catch (error) {
      console.error('加载学习历程失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    return dayjs(dateStr).format('YYYY年MM月DD日');
  };

  // 生成时间线项目
  const getTimelineItems = () => {
    if (!data) return [];

    const items: Array<{
      color: string;
      dot: React.ReactNode;
      children: React.ReactNode;
    }> = [];

    // 第一次考试
    if (data.firstExamDate) {
      items.push({
        color: 'blue',
        dot: <RocketOutlined style={{ fontSize: '16px' }} />,
        children: (
          <div>
            <div className="font-semibold text-base mb-1">
              {formatDate(data.firstExamDate)}
            </div>
            <div className="text-gray-600">
              我开启了第一次考试，踏上了备考之路 🎯
            </div>
          </div>
        ),
      });
    }

    // 首次突破60分
    if (data.milestones.score60) {
      items.push({
        color: 'green',
        dot: <TrophyOutlined style={{ fontSize: '16px' }} />,
        children: (
          <div>
            <div className="font-semibold text-base mb-1">
              {formatDate(data.milestones.score60.date)}
            </div>
            <div className="text-gray-600">
              我第一次突破了 <Tag color="green">60分</Tag>，得分 {data.milestones.score60.score} 分 🎉
            </div>
          </div>
        ),
      });
    }

    // 首次突破70分
    if (data.milestones.score70) {
      items.push({
        color: 'cyan',
        dot: <TrophyOutlined style={{ fontSize: '16px' }} />,
        children: (
          <div>
            <div className="font-semibold text-base mb-1">
              {formatDate(data.milestones.score70.date)}
            </div>
            <div className="text-gray-600">
              我第一次突破了 <Tag color="cyan">70分</Tag>，得分 {data.milestones.score70.score} 分 🌟
            </div>
          </div>
        ),
      });
    }

    // 首次突破80分
    if (data.milestones.score80) {
      items.push({
        color: 'orange',
        dot: <TrophyOutlined style={{ fontSize: '16px' }} />,
        children: (
          <div>
            <div className="font-semibold text-base mb-1">
              {formatDate(data.milestones.score80.date)}
            </div>
            <div className="text-gray-600">
              我第一次突破了 <Tag color="orange">80分</Tag>，得分 {data.milestones.score80.score} 分 ⭐
            </div>
          </div>
        ),
      });
    }

    // 首次突破90分
    if (data.milestones.score90) {
      items.push({
        color: 'gold',
        dot: <FireOutlined style={{ fontSize: '16px' }} />,
        children: (
          <div>
            <div className="font-semibold text-base mb-1">
              {formatDate(data.milestones.score90.date)}
            </div>
            <div className="text-gray-600">
              我第一次突破了 <Tag color="gold">90分</Tag>，得分 {data.milestones.score90.score} 分 🏆
            </div>
          </div>
        ),
      });
    }

    return items;
  };

  if (isLoading) {
    return (
      <Card title="我的来时路" className="mb-6">
        <div className="flex items-center justify-center py-8">
          <Spin size="large" tip="加载中..." />
        </div>
      </Card>
    );
  }

  if (!data || !data.firstExamDate) {
    return (
      <Card title="我的来时路" className="mb-6">
        <Empty
          description="还没有考试记录，快去参加第一次考试吧！"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  const timelineItems = getTimelineItems();

  return (
    <Card 
      title={
        <span>
          <RocketOutlined className="mr-2" />
          我的来时路
        </span>
      } 
      className="mb-6"
    >
      {/* 统计数据 */}
      <Row gutter={16} className="mb-6">
        <Col xs={12} sm={6}>
          <Card className="text-center">
            <Statistic
              title="参与考试"
              value={data.examCount}
              suffix="次"
              valueStyle={{ color: '#1890ff' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center">
            <Statistic
              title="备考天数"
              value={data.studyDays}
              suffix="天"
              valueStyle={{ color: '#52c41a' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center">
            <Statistic
              title="累计做题"
              value={data.totalQuestions}
              suffix="道"
              valueStyle={{ color: '#faad14' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center">
            <Statistic
              title="累计时长"
              value={data.totalHours}
              suffix="小时"
              valueStyle={{ color: '#722ed1' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 里程碑时间线 */}
      {timelineItems.length > 0 && (
        <div>
          <div className="text-base font-semibold mb-4 text-gray-700">
            🎯 我的里程碑
          </div>
          <Timeline items={timelineItems} />
        </div>
      )}

      {/* 鼓励语 */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
        <div className="text-center text-gray-700">
          <div className="text-lg font-semibold mb-2">
            💪 坚持就是胜利！
          </div>
          <div className="text-sm">
            {data.studyDays > 0 && `已经坚持了 ${data.studyDays} 天，`}
            {data.examCount > 0 && `完成了 ${data.examCount} 次考试，`}
            {data.totalQuestions > 0 && `做了 ${data.totalQuestions} 道题，`}
            继续加油！🚀
          </div>
        </div>
      </div>
    </Card>
  );
}
