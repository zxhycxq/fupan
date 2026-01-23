import { useEffect, useState } from 'react';
import { Card, Spin, Button, message } from 'antd';
import { getLearningJourney, type LearningJourneyData } from '@/db/api';

export default function TestLearningJourney() {
  const [data, setData] = useState<LearningJourneyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const journeyData = await getLearningJourney();
      setData(journeyData);
      console.log('学习历程数据:', journeyData);
      message.success('数据加载成功');
    } catch (error) {
      console.error('加载失败:', error);
      message.error('加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <Card title="学习历程数据测试">
        <Button onClick={loadData} loading={isLoading} className="mb-4">
          重新加载
        </Button>
        
        {isLoading ? (
          <Spin />
        ) : (
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </Card>
    </div>
  );
}
