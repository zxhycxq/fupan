import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { getAllExamRecords, deleteExamRecord } from '@/db/api';
import type { ExamRecord } from '@/types';
import { Eye, Trash2, Plus } from 'lucide-react';

export default function ExamList() {
  const [examRecords, setExamRecords] = useState<ExamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadExamRecords();
  }, []);

  const loadExamRecords = async () => {
    try {
      setIsLoading(true);
      const records = await getAllExamRecords();
      setExamRecords(records);
    } catch (error) {
      console.error('加载考试记录失败:', error);
      toast({
        title: '错误',
        description: '加载考试记录失败',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExamRecord(id);
      toast({
        title: '成功',
        description: '考试记录已删除',
      });
      loadExamRecords();
    } catch (error) {
      console.error('删除失败:', error);
      toast({
        title: '错误',
        description: '删除失败,请重试',
        variant: 'destructive',
      });
    }
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>考试记录</CardTitle>
              <CardDescription>查看和管理所有考试记录</CardDescription>
            </div>
            <Button onClick={() => navigate('/upload')}>
              <Plus className="mr-2 h-4 w-4" />
              上传新成绩
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {examRecords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">暂无考试记录</p>
              <Button onClick={() => navigate('/upload')}>
                <Plus className="mr-2 h-4 w-4" />
                上传第一份成绩
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>期数</TableHead>
                  <TableHead>总分</TableHead>
                  <TableHead>用时</TableHead>
                  <TableHead>平均分</TableHead>
                  <TableHead>击败率</TableHead>
                  <TableHead>上传时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">第{record.exam_number}期</TableCell>
                    <TableCell>
                      <span className={`font-semibold ${
                        record.total_score >= 80 ? 'text-green-600' :
                        record.total_score >= 60 ? 'text-blue-600' :
                        'text-orange-600'
                      }`}>
                        {record.total_score.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {record.time_used ? `${record.time_used}分钟` : '-'}
                    </TableCell>
                    <TableCell>
                      {record.average_score ? record.average_score.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell>
                      {record.pass_rate ? `${record.pass_rate.toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell>{formatDate(record.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/exam/${record.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除第{record.exam_number}期的考试记录吗?此操作无法撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(record.id)}>
                                删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
