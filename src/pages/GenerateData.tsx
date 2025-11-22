import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Database, Loader2, Trash2 } from 'lucide-react';
import { generateMultipleExamRecords } from '@/utils/generateTestData';
import { createExamRecord, createModuleScores, deleteExamRecord, getAllExamRecords } from '@/db/api';

export default function GenerateData() {
  const [count, setCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (count < 1 || count > 20) {
      toast({
        title: '输入错误',
        description: '请输入1-20之间的数字',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { examRecords, moduleScoresMap } = generateMultipleExamRecords(count);

      for (let i = 0; i < examRecords.length; i++) {
        const examRecord = examRecords[i];
        const moduleScores = moduleScoresMap.get(i + 1) || [];

        // 保存考试记录
        const savedRecord = await createExamRecord(examRecord);

        // 保存模块得分
        if (moduleScores.length > 0) {
          const scoresWithExamId = moduleScores.map(score => ({
            ...score,
            exam_record_id: savedRecord.id,
          }));
          await createModuleScores(scoresWithExamId);
        }
      }

      toast({
        title: '生成成功',
        description: `已成功生成${count}条考试记录`,
      });

      // 跳转到仪表板
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('生成数据失败:', error);
      toast({
        title: '生成失败',
        description: error instanceof Error ? error.message : '生成数据时发生错误',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('确定要清空所有考试记录吗?此操作不可恢复!')) {
      return;
    }

    setIsClearing(true);

    try {
      const records = await getAllExamRecords();
      
      for (const record of records) {
        await deleteExamRecord(record.id);
      }

      toast({
        title: '清空成功',
        description: `已删除${records.length}条考试记录`,
      });
    } catch (error) {
      console.error('清空数据失败:', error);
      toast({
        title: '清空失败',
        description: error instanceof Error ? error.message : '清空数据时发生错误',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            生成测试数据
          </CardTitle>
          <CardDescription>
            快速生成模拟考试数据用于测试和演示
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="count">生成数量</Label>
            <Input
              id="count"
              type="number"
              min="1"
              max="20"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              placeholder="输入要生成的考试记录数量(1-20)"
            />
            <p className="text-sm text-muted-foreground">
              将生成{count}次模拟考试记录,每次考试包含6个主模块和多个子模块的详细数据
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-semibold">数据说明</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 每次考试包含130道题目</li>
                <li>• 包含6个主模块:政治理论、常识判断、言语理解与表达、数量关系、判断推理、资料分析</li>
                <li>• 每个主模块包含多个子模块的详细数据</li>
                <li>• 数据会模拟真实考试的正确率和用时</li>
                <li>• 后期考试会模拟学习进步,正确率略有提升</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || isClearing}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    生成数据
                  </>
                )}
              </Button>

              <Button
                onClick={handleClearAll}
                disabled={isGenerating || isClearing}
                variant="destructive"
                className="flex-1"
              >
                {isClearing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    清空中...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    清空所有数据
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>注意:</strong> 生成的数据仅用于测试和演示,不代表真实考试成绩。清空操作将删除所有考试记录,请谨慎操作。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
