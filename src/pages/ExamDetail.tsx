import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getExamRecordById, updateModuleScore, updateExamRecord, getUserSettings } from '@/db/api';
import type { ExamRecordDetail, ModuleScore, UserSetting } from '@/types';
import { ArrowLeft, Clock, Target, TrendingUp, AlertCircle, Edit } from 'lucide-react';

export default function ExamDetail() {
  const { id } = useParams<{ id: string }>();
  const [examDetail, setExamDetail] = useState<ExamRecordDetail | null>(null);
  const [userSettings, setUserSettings] = useState<UserSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingModule, setEditingModule] = useState<ModuleScore | null>(null);
  const [editTime, setEditTime] = useState<string>('');
  const [isEditingExamTime, setIsEditingExamTime] = useState(false);
  const [examTimeMinutes, setExamTimeMinutes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
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
        toast({
          title: '错误',
          description: '考试记录不存在',
          variant: 'destructive',
        });
        navigate('/exams');
        return;
      }
      setExamDetail(detail);
    } catch (error) {
      console.error('加载考试详情失败:', error);
      toast({
        title: '错误',
        description: '加载考试详情失败',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 打开编辑对话框
  const handleEditTime = (module: ModuleScore) => {
    setEditingModule(module);
    setEditTime(module.time_used?.toString() || '0');
  };

  // 保存时间修改
  const handleSaveTime = async () => {
    if (!editingModule || !examDetail) return;

    const newTime = parseInt(editTime);
    if (isNaN(newTime) || newTime < 0) {
      toast({
        title: '错误',
        description: '请输入有效的时间(秒)',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      await updateModuleScore(editingModule.id, { time_used: newTime });
      
      // 更新本地状态
      setExamDetail({
        ...examDetail,
        module_scores: examDetail.module_scores.map(m =>
          m.id === editingModule.id ? { ...m, time_used: newTime } : m
        ),
      });

      toast({
        title: '成功',
        description: '时间已更新',
      });
      
      setEditingModule(null);
    } catch (error) {
      console.error('更新时间失败:', error);
      toast({
        title: '错误',
        description: '更新时间失败',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditExamTime = () => {
    if (!examDetail) return;
    const minutes = Math.floor(examDetail.time_used / 60);
    setExamTimeMinutes(minutes.toString());
    setIsEditingExamTime(true);
  };

  const handleSaveExamTime = async () => {
    if (!examDetail || !id) return;

    const minutes = parseInt(examTimeMinutes);
    if (isNaN(minutes) || minutes < 0) {
      toast({
        title: '错误',
        description: '请输入有效的时间(分钟)',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      const newTimeSeconds = minutes * 60;
      await updateExamRecord(id, { time_used: newTimeSeconds });
      
      // 更新本地状态
      setExamDetail({
        ...examDetail,
        time_used: newTimeSeconds,
      });

      toast({
        title: '成功',
        description: '考试用时已更新',
      });
      
      setIsEditingExamTime(false);
    } catch (error) {
      console.error('更新考试用时失败:', error);
      toast({
        title: '错误',
        description: '更新考试用时失败',
        variant: 'destructive',
      });
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
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!examDetail) {
    return null;
  }

  // 获取大模块数据
  const mainModules = examDetail.module_scores.filter(m => !m.parent_module);
  
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
        // params.name 是系列名称 ('我的' 或 '目标')
        // params.value 是该系列的所有值数组
        const seriesName = params.name;
        
        if (!params.value || !Array.isArray(params.value)) {
          return '';
        }
        
        let result = `<div style="padding: 8px;">`;
        result += `<div style="font-weight: bold; margin-bottom: 8px;">${seriesName}</div>`;
        
        params.value.forEach((value: number, index: number) => {
          const moduleName = mainModules[index].module_name;
          const color = seriesName === '我的' ? '#FF9800' : '#F44336';
          result += `
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; background-color: ${color}; border-radius: 50%; margin-right: 6px;"></span>
              <span>${moduleName}: ${value.toFixed(2)}%</span>
            </div>
          `;
        });
        
        result += `</div>`;
        return result;
      },
    },
    legend: {
      data: ['我的', '目标'],
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
        name: '正确率对比',
        type: 'radar',
        data: [
          {
            value: mainModules.map(m => m.accuracy_rate || 0),
            name: '我的',
            areaStyle: {
              color: 'rgba(255, 152, 0, 0.3)', // 橙色填充
            },
            itemStyle: {
              color: '#FF9800', // 橙色
            },
            lineStyle: {
              color: '#FF9800',
              width: 2,
            },
          },
          {
            value: targetValues,
            name: '目标',
            areaStyle: {
              color: 'rgba(244, 67, 54, 0.1)', // 红色半透明填充
            },
            itemStyle: {
              color: '#F44336', // 红色
            },
            lineStyle: {
              color: '#F44336',
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
    },
    xAxis: {
      type: 'category',
      data: mainModules.map(m => m.module_name),
      axisLabel: {
        interval: 0,
        rotate: 45,
      },
    },
    yAxis: {
      type: 'value',
      name: '用时(秒)',
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
        variant="ghost"
        onClick={() => navigate('/exams')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回列表
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">第{examDetail.exam_number}期考试详情</h1>
        <p className="text-muted-foreground">上传时间: {formatDate(examDetail.created_at)}</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总分</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              examDetail.total_score >= 80 ? 'text-green-600' :
              examDetail.total_score >= 60 ? 'text-blue-600' :
              'text-orange-600'
            }`}>
              {examDetail.total_score.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">满分100分</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">用时</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleEditExamTime}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor((examDetail.time_used || 0) / 60)}:{String((examDetail.time_used || 0) % 60).padStart(2, '0')}
            </div>
            <p className="text-xs text-muted-foreground">分:秒</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最高分</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {examDetail.max_score?.toFixed(2) || '-'}
            </div>
            <p className="text-xs text-muted-foreground">本期最高分</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均分</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {examDetail.average_score?.toFixed(2) || '-'}
            </div>
            <p className="text-xs text-muted-foreground">考生平均分</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">难度</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (examDetail.difficulty || 0) >= 4 ? 'text-red-600' :
              (examDetail.difficulty || 0) >= 3 ? 'text-orange-600' :
              'text-green-600'
            }`}>
              {examDetail.difficulty?.toFixed(1) || '-'}
            </div>
            <p className="text-xs text-muted-foreground">难度系数(0-5)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">击败率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (examDetail.beat_percentage || 0) >= 80 ? 'text-green-600' :
              (examDetail.beat_percentage || 0) >= 60 ? 'text-blue-600' :
              'text-orange-600'
            }`}>
              {examDetail.beat_percentage?.toFixed(1) || '-'}%
            </div>
            <p className="text-xs text-muted-foreground">已击败考生</p>
          </CardContent>
        </Card>
      </div>

      {/* 弱势模块提醒 */}
      {weakModules.length > 0 && (
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-700">
              <AlertCircle className="mr-2 h-5 w-5" />
              弱势模块提醒
            </CardTitle>
            <CardDescription>以下模块正确率低于60%,需要重点加强</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {weakModules.map(m => (
                <Badge key={m.id} variant="outline" className="border-orange-300 text-orange-700">
                  {m.module_name}: {m.accuracy_rate?.toFixed(1)}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 图表 */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>各模块正确率</CardTitle>
            <CardDescription>雷达图展示各模块的正确率分布</CardDescription>
          </CardHeader>
          <CardContent>
            <ReactECharts option={radarOption} style={{ height: '400px' }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>各模块用时对比</CardTitle>
            <CardDescription>各模块答题用时统计</CardDescription>
          </CardHeader>
          <CardContent>
            <ReactECharts option={timeComparisonOption} style={{ height: '400px' }} />
          </CardContent>
        </Card>
      </div>

      {/* 模块详情表格 */}
      <Card>
        <CardHeader>
          <CardTitle>模块详细数据</CardTitle>
          <CardDescription>各模块的详细答题情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {mainModules.map(mainModule => {
              const subModules = examDetail.module_scores.filter(
                m => m.parent_module === mainModule.module_name
              );

              return (
                <div key={mainModule.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{mainModule.module_name}</h3>
                    <Badge variant={
                      (mainModule.accuracy_rate || 0) >= 80 ? 'default' :
                      (mainModule.accuracy_rate || 0) >= 60 ? 'secondary' :
                      'destructive'
                    }>
                      正确率: {mainModule.accuracy_rate?.toFixed(1)}%
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">总题数:</span>
                      <span className="ml-2 font-medium">{mainModule.total_questions}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">答对:</span>
                      <span className="ml-2 font-medium text-green-600">{mainModule.correct_answers}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">答错:</span>
                      <span className="ml-2 font-medium text-red-600">{mainModule.wrong_answers}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">未答:</span>
                      <span className="ml-2 font-medium text-gray-600">{mainModule.unanswered}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">用时:</span>
                      <span className="ml-2 font-medium">{mainModule.time_used}秒</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-6 w-6 p-0"
                        onClick={() => handleEditTime(mainModule)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {subModules.length > 0 && (
                    <div className="pl-4 border-l-2 border-gray-200 space-y-3">
                      {subModules.map(subModule => (
                        <div key={subModule.id} className="text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{subModule.module_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {subModule.accuracy_rate?.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-muted-foreground">
                            <div>总题数: {subModule.total_questions}</div>
                            <div>答对: {subModule.correct_answers}</div>
                            <div>答错: {subModule.wrong_answers}</div>
                            <div>未答: {subModule.unanswered}</div>
                            <div>用时: {subModule.time_used}秒</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 时间编辑对话框 */}
      <Dialog open={!!editingModule} onOpenChange={() => setEditingModule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用时</DialogTitle>
            <DialogDescription>
              修改 {editingModule?.module_name} 的用时(秒)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                用时(秒)
              </Label>
              <Input
                id="time"
                type="number"
                min="0"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingModule(null)}>
              取消
            </Button>
            <Button onClick={handleSaveTime} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑考试用时对话框 */}
      <Dialog open={isEditingExamTime} onOpenChange={setIsEditingExamTime}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑考试用时</DialogTitle>
            <DialogDescription>
              修改整场考试的用时(分钟)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="examTime">用时(分钟)</Label>
              <Input
                id="examTime"
                type="number"
                min="0"
                step="1"
                value={examTimeMinutes}
                onChange={(e) => setExamTimeMinutes(e.target.value)}
                placeholder="请输入考试用时"
              />
              <p className="text-sm text-muted-foreground">
                当前用时: {Math.floor((examDetail?.time_used || 0) / 60)} 分钟
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingExamTime(false)}>
              取消
            </Button>
            <Button onClick={handleSaveExamTime} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
