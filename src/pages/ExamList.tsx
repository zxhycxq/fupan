import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Skeleton, Input, Alert, Table, InputNumber, Modal, DatePicker, message, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getAllExamRecords, deleteExamRecord, updateExamRecord } from '@/db/api';
import type { ExamRecord } from '@/types';
import { EyeOutlined, DeleteOutlined, PlusOutlined, EditOutlined, SaveOutlined, CloseOutlined, InfoCircleOutlined, MenuOutlined } from '@ant-design/icons';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { arrayMoveImmutable } from 'array-move';
import dayjs from 'dayjs';

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
  const [hasUnsavedSort, setHasUnsavedSort] = useState(false); // 是否有未保存的排序
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
      message.error('加载考试记录失败');
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
          message.success('考试记录已删除');
          loadExamRecords();
        } catch (error) {
          console.error('删除失败:', error);
          message.error('删除失败，请重试');
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
        // 保留1位小数
        updates.total_score = Math.round(editingRecord.total_score * 10) / 10;
      }
      if (editingRecord.time_used !== undefined) {
        updates.time_used = editingRecord.time_used;
      }
      if (editingRecord.average_score !== undefined) {
        // 保留1位小数
        updates.average_score = Math.round(editingRecord.average_score * 10) / 10;
      }
      if (editingRecord.pass_rate !== undefined) {
        // 保留1位小数
        updates.pass_rate = Math.round(editingRecord.pass_rate * 10) / 10;
      }
      if (editingRecord.exam_date !== undefined) {
        updates.exam_date = editingRecord.exam_date;
      }

      await updateExamRecord(id, updates);
      
      message.success('考试记录已更新');
      
      setEditingKey('');
      setEditingRecord({});
      loadExamRecords();
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败，请重试');
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
      setHasUnsavedSort(true); // 标记有未保存的排序
    }
  };

  // 保存排序
  const saveSortOrder = async () => {
    try {
      // 更新每条记录的sort_order
      const updates = examRecords.map((record, index) => 
        updateExamRecord(record.id, { sort_order: index + 1 })
      );
      await Promise.all(updates);
      
      setHasUnsavedSort(false);
      message.success('排序已保存');
    } catch (error) {
      console.error('保存排序失败:', error);
      message.error('保存排序失败');
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
      width: 140,
      render: (value: number, record: ExamRecord) => {
        const editable = isEditing(record);
        return editable ? (
          <Input
            type="number"
            min={0}
            value={editingRecord.exam_number}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setEditingRecord({ ...editingRecord, exam_number: isNaN(val) ? 1 : val });
            }}
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
      width: 140,
      render: (value: number, record: ExamRecord) => {
        const editable = isEditing(record);
        return editable ? (
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={editingRecord.total_score}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setEditingRecord({ ...editingRecord, total_score: isNaN(val) ? 0 : val });
            }}
            style={{ width: '100%' }}
            placeholder="0.0"
          />
        ) : (
          <span
            className={`font-semibold ${
              value >= 80 ? 'text-green-600' : value >= 60 ? 'text-blue-600' : 'text-orange-600'
            }`}
          >
            {value.toFixed(1)}
          </span>
        );
      },
    },
    {
      title: '用时',
      dataIndex: 'time_used',
      key: 'time_used',
      width: 140,
      render: (value: number | null, record: ExamRecord) => {
        const editable = isEditing(record);
        return editable ? (
          <Input
            type="number"
            min={0}
            value={editingRecord.time_used || ''}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setEditingRecord({ ...editingRecord, time_used: isNaN(val) ? null : val });
            }}
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
      width: 140,
      render: (value: number | null, record: ExamRecord) => {
        const editable = isEditing(record);
        return editable ? (
          <Input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={editingRecord.average_score ?? ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setEditingRecord({ ...editingRecord, average_score: isNaN(val) ? 0 : val });
            }}
            style={{ width: '100%' }}
            placeholder="0.0"
          />
        ) : value ? (
          value.toFixed(1)
        ) : (
          '-'
        );
      },
    },
    {
      title: '击败率',
      dataIndex: 'pass_rate',
      key: 'pass_rate',
      width: 140,
      render: (value: number | null, record: ExamRecord) => {
        const editable = isEditing(record);
        return editable ? (
          <div className="flex items-center">
            <Input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={editingRecord.pass_rate ?? ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setEditingRecord({ ...editingRecord, pass_rate: isNaN(val) ? 0 : val });
              }}
              style={{ width: '100%' }}
              placeholder="0.0"
            />
            <span className="ml-1">%</span>
          </div>
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
      title: '考试日期',
      dataIndex: 'exam_date',
      key: 'exam_date',
      width: 140,
      render: (value: string | null, record: ExamRecord) => {
        const editable = isEditing(record);
        return editable ? (
          <DatePicker
            value={editingRecord.exam_date ? dayjs(editingRecord.exam_date) : null}
            onChange={(date) => {
              setEditingRecord({ 
                ...editingRecord, 
                exam_date: date ? date.format('YYYY-MM-DD') : null 
              });
            }}
            disabledDate={(current) => {
              // 不可晚于上传时间
              const uploadDate = dayjs(record.created_at).startOf('day');
              return current && current.isAfter(uploadDate);
            }}
            format="YYYY-MM-DD"
            placeholder="选择日期"
            style={{ width: '100%' }}
          />
        ) : value ? (
          value
        ) : (
          '-'
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: any, record: ExamRecord) => {
        const editable = isEditing(record);
        return editable ? (
          <Space size="small">
            <Button 
              size="small" 
              type="text"
              icon={<SaveOutlined className="text-green-600" />}
              onClick={() => save(record.id)} 
              title="保存"
            />
            <Button 
              size="small" 
              type="text"
              icon={<CloseOutlined className="text-gray-600" />}
              onClick={cancel} 
              title="取消"
            />
          </Space>
        ) : (
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/exam/${record.id}`)}
              disabled={editingKey !== ''}
              title="查看详情"
            />
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => edit(record)}
              disabled={editingKey !== ''}
              title="编辑"
            />
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id, record.exam_number)}
              disabled={editingKey !== ''}
              title="删除"
            />
          </Space>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card loading>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} active />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card 
        title={
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold">考试记录</div>
              <div className="text-sm text-gray-500 font-normal mt-1">查看和管理所有考试记录</div>
            </div>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/upload')}
            >
              上传新成绩
            </Button>
          </div>
        }
      >
          {examRecords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">暂无考试记录</p>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/upload')}
              >
                上传第一份成绩
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 排序提示 */}
              <Alert
                message={
                  <div className="flex items-center justify-between">
                    <span>
                      提示：可以拖动左侧图标调整考试记录顺序，建议按照考试时间顺序排列。
                      {hasUnsavedSort && <span className="text-orange-600 ml-2">（有未保存的排序）</span>}
                    </span>
                    {hasUnsavedSort && (
                      <Button 
                        size="small" 
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={saveSortOrder}
                      >
                        保存排序
                      </Button>
                    )}
                  </div>
                }
                type="info"
                icon={<InfoCircleOutlined />}
                showIcon
              />
              
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
            </div>
          )}
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
