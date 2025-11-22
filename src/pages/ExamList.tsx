import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getAllExamRecords, deleteExamRecord, updateExamRecord } from '@/db/api';
import type { ExamRecord } from '@/types';
import { Eye, Trash2, Plus } from 'lucide-react';
import { Table, InputNumber, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { MenuOutlined } from '@ant-design/icons';
import { arrayMoveImmutable } from 'array-move';

// 拖拽手柄
const DragHandle = SortableHandle(() => (
  <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />
));

// 可排序的行
const SortableItem = SortableElement((props: any) => <tr {...props} />);

// 可排序的容器
const SortableBody = SortableContainer((props: any) => <tbody {...props} />);

export default function ExamList() {
  const [examRecords, setExamRecords] = useState<ExamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string>('');
  const [editingRecord, setEditingRecord] = useState<Partial<ExamRecord>>({});
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

  const handleDelete = async (id: string, examNumber: number) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除第${examNumber}期的考试记录吗？此操作无法撤销。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
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
            description: '删除失败，请重试',
            variant: 'destructive',
          });
        }
      },
    });
  };

  const isEditing = (record: ExamRecord) => record.id === editingKey;

  const edit = (record: ExamRecord) => {
    setEditingKey(record.id);
    setEditingRecord({ ...record });
  };

  const cancel = () => {
    setEditingKey('');
    setEditingRecord({});
  };

  const save = async (id: string) => {
    try {
      const updates: Partial<Omit<ExamRecord, 'id' | 'created_at'>> = {};
      
      if (editingRecord.exam_number !== undefined) {
        updates.exam_number = editingRecord.exam_number;
      }
      if (editingRecord.total_score !== undefined) {
        updates.total_score = editingRecord.total_score;
      }
      if (editingRecord.time_used !== undefined) {
        updates.time_used = editingRecord.time_used;
      }
      if (editingRecord.average_score !== undefined) {
        updates.average_score = editingRecord.average_score;
      }
      if (editingRecord.pass_rate !== undefined) {
        updates.pass_rate = editingRecord.pass_rate;
      }

      await updateExamRecord(id, updates);
      
      toast({
        title: '成功',
        description: '考试记录已更新',
      });
      
      setEditingKey('');
      setEditingRecord({});
      loadExamRecords();
    } catch (error) {
      console.error('保存失败:', error);
      toast({
        title: '错误',
        description: '保存失败，请重试',
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

  // 拖拽排序处理
  const onSortEnd = ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
    if (oldIndex !== newIndex) {
      const newData = arrayMoveImmutable(examRecords, oldIndex, newIndex);
      setExamRecords(newData);
    }
  };

  const DraggableContainer = (props: any) => (
    <SortableBody
      useDragHandle
      disableAutoscroll
      helperClass="row-dragging"
      onSortEnd={onSortEnd}
      {...props}
    />
  );

  const DraggableBodyRow = ({ className, style, ...restProps }: any) => {
    const index = examRecords.findIndex((x) => x.id === restProps['data-row-key']);
    return <SortableItem index={index} {...restProps} />;
  };

  const columns: ColumnsType<ExamRecord> = [
    {
      title: '排序',
      dataIndex: 'sort',
      width: 60,
      className: 'drag-visible',
      render: () => <DragHandle />,
    },
    {
      title: '期数',
      dataIndex: 'exam_number',
      key: 'exam_number',
      width: 100,
      render: (value: number, record: ExamRecord) => {
        const editable = isEditing(record);
        return editable ? (
          <InputNumber
            min={1}
            value={editingRecord.exam_number}
            onChange={(val) => setEditingRecord({ ...editingRecord, exam_number: val || 1 })}
            style={{ width: '100%' }}
          />
        ) : (
          `第${value}期`
        );
      },
    },
    {
      title: '总分',
      dataIndex: 'total_score',
      key: 'total_score',
      width: 120,
      render: (value: number, record: ExamRecord) => {
        const editable = isEditing(record);
        return editable ? (
          <InputNumber
            min={0}
            max={100}
            precision={2}
            value={editingRecord.total_score}
            onChange={(val) => setEditingRecord({ ...editingRecord, total_score: val || 0 })}
            style={{ width: '100%' }}
          />
        ) : (
          <span
            className={`font-semibold ${
              value >= 80 ? 'text-green-600' : value >= 60 ? 'text-blue-600' : 'text-orange-600'
            }`}
          >
            {value.toFixed(2)}
          </span>
        );
      },
    },
    {
      title: '用时',
      dataIndex: 'time_used',
      key: 'time_used',
      width: 120,
      render: (value: number | null, record: ExamRecord) => {
        const editable = isEditing(record);
        return editable ? (
          <InputNumber
            min={0}
            precision={0}
            value={editingRecord.time_used || undefined}
            onChange={(val) => setEditingRecord({ ...editingRecord, time_used: val || null })}
            placeholder="分钟"
            style={{ width: '100%' }}
          />
        ) : value ? (
          `${value}分钟`
        ) : (
          '-'
        );
      },
    },
    {
      title: '平均分',
      dataIndex: 'average_score',
      key: 'average_score',
      width: 120,
      render: (value: number | null, record: ExamRecord) => {
        const editable = isEditing(record);
        return editable ? (
          <InputNumber
            min={0}
            max={100}
            precision={2}
            value={editingRecord.average_score || undefined}
            onChange={(val) => setEditingRecord({ ...editingRecord, average_score: val || null })}
            style={{ width: '100%' }}
          />
        ) : value ? (
          value.toFixed(2)
        ) : (
          '-'
        );
      },
    },
    {
      title: '击败率',
      dataIndex: 'pass_rate',
      key: 'pass_rate',
      width: 120,
      render: (value: number | null, record: ExamRecord) => {
        const editable = isEditing(record);
        return editable ? (
          <InputNumber
            min={0}
            max={100}
            precision={1}
            value={editingRecord.pass_rate || undefined}
            onChange={(val) => setEditingRecord({ ...editingRecord, pass_rate: val || null })}
            addonAfter="%"
            style={{ width: '100%' }}
          />
        ) : value ? (
          `${value.toFixed(1)}%`
        ) : (
          '-'
        );
      },
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (value: string) => formatDate(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: ExamRecord) => {
        const editable = isEditing(record);
        return editable ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => save(record.id)}>
              保存
            </Button>
            <Button size="sm" variant="outline" onClick={cancel}>
              取消
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/exam/${record.id}`)}
              disabled={editingKey !== ''}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => edit(record)}
              disabled={editingKey !== ''}
            >
              编辑
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(record.id, record.exam_number)}
              disabled={editingKey !== ''}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];

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
            <Table
              columns={columns}
              dataSource={examRecords}
              rowKey="id"
              pagination={false}
              components={{
                body: {
                  wrapper: DraggableContainer,
                  row: DraggableBodyRow,
                },
              }}
              bordered
            />
          )}
        </CardContent>
      </Card>
      <style>{`
        .row-dragging {
          background: #fafafa;
          border: 1px solid #ccc;
        }
        .row-dragging td {
          padding: 16px;
        }
        .row-dragging .drag-visible {
          visibility: visible;
        }
      `}</style>
    </div>
  );
}
