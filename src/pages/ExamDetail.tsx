import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { getExamRecordById, updateModuleScore, updateExamRecord, getUserSettings } from '@/db/api';
import type { ExamRecordDetail, ModuleScore, UserSetting } from '@/types';
import { ArrowLeft, Clock, Target, TrendingUp, AlertCircle, Edit, Calendar, FileText, ExternalLink, Info } from 'lucide-react';

// 带说明的标题组件
function TitleWithTooltip({ title, tooltip }: { title: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-2">
      <span>{title}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="inline-flex items-center">
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export default function ExamDetail() {
  const { id } = useParams<{ id: string }>();
  const [examDetail, setExamDetail] = useState<ExamRecordDetail | null>(null);
  const [userSettings, setUserSettings] = useState<UserSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingModule, setEditingModule] = useState<ModuleScore | null>(null);
  const [editTime, setEditTime] = useState<string>('');
  const [isEditingExamTime, setIsEditingExamTime] = useState(false);
  const [examTimeMinutes, setExamTimeMinutes] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState<string>('');
  const [isEditingExamDate, setIsEditingExamDate] = useState(false);
  const [examDate, setExamDate] = useState<string>('');
  const [isEditingReportUrl, setIsEditingReportUrl] = useState(false);
  const [reportUrl, setReportUrl] = useState<string>('');
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

  // 打开备注编辑对话框
  const handleEditNotes = () => {
    if (!examDetail) return;
    setNotes(examDetail.notes || '');
    setIsEditingNotes(true);
  };

  // 保存备注
  const handleSaveNotes = async () => {
    if (!examDetail || !id) return;

    // 验证备注长度
    if (notes.length > 500) {
      toast({
        title: '错误',
        description: '备注不能超过500字',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      await updateExamRecord(id, { notes });
      
      // 更新本地状态
      setExamDetail({
        ...examDetail,
        notes,
      });

      toast({
        title: '成功',
        description: '备注已保存',
      });
      
      setIsEditingNotes(false);
    } catch (error) {
      console.error('保存备注失败:', error);
      const errorMessage = error instanceof Error ? error.message : '保存备注失败';
      toast({
        title: '错误',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 打开日期编辑对话框
  const handleEditExamDate = () => {
    if (!examDetail) return;
    // 如果有exam_date就用exam_date,否则用created_at的日期部分
    const dateStr = examDetail.exam_date || examDetail.created_at.split('T')[0];
    setExamDate(dateStr);
    setIsEditingExamDate(true);
  };

  // 保存考试日期
  const handleSaveExamDate = async () => {
    if (!examDetail || !id) return;

    // 验证日期格式
    const selectedDate = new Date(examDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // 设置为今天的最后一刻

    if (isNaN(selectedDate.getTime())) {
      toast({
        title: '错误',
        description: '请输入有效的日期',
        variant: 'destructive',
      });
      return;
    }

    // 验证日期不能晚于今天
    if (selectedDate > today) {
      toast({
        title: '错误',
        description: '考试日期不能晚于今天',
        variant: 'destructive',
      });
      return;
    }

    // 验证日期不能早于上传时间
    const createdDate = new Date(examDetail.created_at);
    if (selectedDate < createdDate) {
      toast({
        title: '错误',
        description: '考试日期不能早于上传时间',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      await updateExamRecord(id, { exam_date: examDate });
      
      // 更新本地状态
      setExamDetail({
        ...examDetail,
        exam_date: examDate,
      });

      toast({
        title: '成功',
        description: '考试日期已更新',
      });
      
      setIsEditingExamDate(false);
    } catch (error) {
      console.error('更新考试日期失败:', error);
      const errorMessage = error instanceof Error ? error.message : '更新考试日期失败';
      toast({
        title: '错误',
        description: errorMessage,
        variant: 'destructive',
      });
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
        toast({
          title: '错误',
          description: '请输入有效的URL地址',
          variant: 'destructive',
        });
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

      toast({
        title: '成功',
        description: '考试报告链接已更新',
      });
      
      setIsEditingReportUrl(false);
    } catch (error) {
      console.error('更新考试报告链接失败:', error);
      const errorMessage = error instanceof Error ? error.message : '更新考试报告链接失败';
      toast({
        title: '错误',
        description: errorMessage,
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
      trigger: 'axis',
      formatter: (params: any) => {
        if (!params || params.length === 0) return '';
        
        // params 是一个数组,包含所有系列在当前指标上的数据
        const indicatorName = params[0].name; // 指标名称(模块名称)
        
        let result = `<div style="padding: 8px;">`;
        result += `<div style="font-weight: bold; margin-bottom: 8px;">${indicatorName}</div>`;
        
        params.forEach((param: any) => {
          const seriesName = param.seriesName; // '我的' 或 '目标'
          const value = param.value; // 该系列在当前指标上的值
          const color = seriesName === '我的' ? '#FF9800' : '#F44336';
          
          result += `
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; background-color: ${color}; border-radius: 50%; margin-right: 6px;"></span>
              <span>${seriesName}: ${value.toFixed(2)}%</span>
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
        name: '我的',
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
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>考试日期: {examDetail.exam_date || examDetail.created_at.split('T')[0]}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleEditExamDate}
            >
              <Edit className="h-3 w-3" />
            </Button>
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
                  <ExternalLink className="h-4 w-4" />
                  <span>考试报告链接地址</span>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleEditReportUrl}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-muted-foreground hover:text-primary"
                onClick={handleEditReportUrl}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                添加考试报告链接地址
              </Button>
            )}
          </div>
        </div>
        {examDetail.notes && (
          <div className="mt-3 p-3 bg-muted rounded-md">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <p className="text-sm whitespace-pre-wrap break-words">{examDetail.notes}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={handleEditNotes}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        {!examDetail.notes && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={handleEditNotes}
          >
            <FileText className="mr-2 h-4 w-4" />
            添加备注
          </Button>
        )}
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
            <CardTitle>
              <TitleWithTooltip 
                title="各模块正确率" 
                tooltip="雷达图展示各个考试模块的正确率分布情况，可以直观地看出各模块的强弱项。正确率越高，该模块掌握越好。"
              />
            </CardTitle>
            <CardDescription>雷达图展示各模块的正确率分布</CardDescription>
          </CardHeader>
          <CardContent>
            <ReactECharts option={radarOption} style={{ height: '400px' }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <TitleWithTooltip 
                title="各模块用时对比" 
                tooltip="柱状图展示各模块的答题用时统计，帮助分析时间分配是否合理。用时过长可能表示该模块需要提高答题速度，用时过短则需要注意准确率。"
              />
            </CardTitle>
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
          <CardTitle>
            <TitleWithTooltip 
              title="模块详细数据" 
              tooltip="详细展示各个模块和子模块的答题情况，包括总题数、答对题数、正确率和用时。可以点击编辑按钮修改数据。"
            />
          </CardTitle>
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

      {/* 编辑备注对话框 */}
      <Dialog open={isEditingNotes} onOpenChange={setIsEditingNotes}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑考试备注</DialogTitle>
            <DialogDescription>
              记录错误原因、注意事项等(最多500字)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">备注内容</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="请输入备注内容..."
                className="min-h-[200px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {notes.length}/500字
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingNotes(false)}>
              取消
            </Button>
            <Button onClick={handleSaveNotes} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑考试日期对话框 */}
      <Dialog open={isEditingExamDate} onOpenChange={setIsEditingExamDate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑考试日期</DialogTitle>
            <DialogDescription>
              设置实际的考试日期(不能晚于今天)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exam-date">考试日期</Label>
              <Input
                id="exam-date"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground">
                日期不能晚于今天,也不能早于上传时间
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingExamDate(false)}>
              取消
            </Button>
            <Button onClick={handleSaveExamDate} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑考试报告链接对话框 */}
      <Dialog open={isEditingReportUrl} onOpenChange={setIsEditingReportUrl}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑考试报告链接</DialogTitle>
            <DialogDescription>
              添加外部考试报告的链接地址,点击后将在新窗口打开
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-url">链接地址</Label>
              <Input
                id="report-url"
                type="url"
                value={reportUrl}
                onChange={(e) => setReportUrl(e.target.value)}
                placeholder="https://example.com/report"
              />
              <p className="text-xs text-muted-foreground">
                请输入完整的URL地址,包括 http:// 或 https://
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingReportUrl(false)}>
              取消
            </Button>
            <Button onClick={handleSaveReportUrl} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
