import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Skeleton, Alert, Table, Modal, Rate, message, Space, Drawer, Form, Input, InputNumber, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getAllExamRecords, deleteExamRecord, updateExamRecord, updateExamRating, checkIndexNumberExists } from '@/db/api';
import type { ExamRecord } from '@/types';
import { EyeOutlined, DeleteOutlined, PlusOutlined, EditOutlined, InfoCircleOutlined, MenuOutlined } from '@ant-design/icons';
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
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<ExamRecord> | null>(null);
  const [hasUnsavedSort, setHasUnsavedSort] = useState(false);
  const [form] = Form.useForm();
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

  const handleDelete = async (id: string, examName: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除"${examName}"的考试记录吗？此操作无法撤销。`,
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

  // 打开编辑抽屉
  const openEditDrawer = (record: ExamRecord) => {
    setEditingRecord({ ...record });
    form.setFieldsValue({
      index_number: record.index_number,
      exam_name: record.exam_name,
      total_score: record.total_score,
      time_used: record.time_used,
      average_score: record.average_score,
      pass_rate: record.pass_rate,
      exam_date: record.exam_date ? dayjs(record.exam_date) : null,
    });
    setDrawerVisible(true);
  };

  // 关闭编辑抽屉
  const closeEditDrawer = () => {
    setDrawerVisible(false);
    setEditingRecord(null);
    form.resetFields();
  };

  // 更新星级
  const handleRatingChange = async (id: string, rating: number) => {
    try {
      await updateExamRating(id, rating);
      message.success('星级已更新');
      setExamRecords(prev => 
        prev.map(record => 
          record.id === id ? { ...record, rating } : record
        )
      );
    } catch (error) {
      console.error('更新星级失败:', error);
      message.error('更新星级失败，请重试');
    }
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    try {
      const values = await form.validateFields();
      const updates: Partial<Omit<ExamRecord, 'id' | 'created_at'>> = {};

      // 验证考试名称
      if (!values.exam_name || values.exam_name.trim() === '') {
        message.error('考试名称不能为空');
        return;
      }
      updates.exam_name = values.exam_name.trim();

      // 验证并更新索引号
      if (values.index_number < 1) {
        message.error('索引号必须大于 0');
        return;
      }

      // 检查索引号是否已被使用
      const exists = await checkIndexNumberExists(values.index_number, editingRecord.id);
      if (exists) {
        message.error('该索引号已被使用，请选择其他索引号');
        return;
      }

      updates.index_number = values.index_number;
      updates.total_score = Math.round(values.total_score * 10) / 10;
      updates.time_used = values.time_used || null;
      updates.average_score = values.average_score ? Math.round(values.average_score * 10) / 10 : null;
      updates.pass_rate = values.pass_rate ? Math.round(values.pass_rate * 10) / 10 : null;
      updates.exam_date = values.exam_date ? values.exam_date.format('YYYY-MM-DD') : null;

      await updateExamRecord(editingRecord.id!, updates);

      message.success('考试记录已更新');
      closeEditDrawer();
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

  // 拖拽排序
  const onSortEnd = ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
    if (oldIndex !== newIndex) {
      const newData = arrayMoveImmutable(examRecords, oldIndex, newIndex);
      setExamRecords(newData);
      setHasUnsavedSort(true);
    }
  };

  // 保存排序
  const handleSaveSort = async () => {
    try {
      // 更新每条记录的 index_number
      const updates = examRecords.map((record, index) => ({
        id: record.id,
        index_number: index + 1,
      }));

      // 批量更新
      for (const update of updates) {
        await updateExamRecord(update.id, { index_number: update.index_number });
      }

      message.success('排序已保存');
      setHasUnsavedSort(false);
      loadExamRecords();
    } catch (error) {
      console.error('保存排序失败:', error);
      message.error('保存排序失败，请重试');
    }
  };

  // 取消排序
  const handleCancelSort = () => {
    loadExamRecords();
    setHasUnsavedSort(false);
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
      title: '索引',
      dataIndex: 'index_number',
      key: 'index_number',
      width: 100,
      render: (value: number) => (
        <span className="font-medium text-gray-700">{value}</span>
      ),
    },
    {
      title: '考试名称',
      dataIndex: 'exam_name',
      key: 'exam_name',
      width: 200,
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      ),
    },
    {
      title: '总分',
      dataIndex: 'total_score',
      key: 'total_score',
      width: 90,
      render: (value: number) => (
        <span
          className={`font-semibold ${
            value >= 80 ? 'text-green-600' : value >= 60 ? 'text-blue-600' : 'text-orange-600'
          }`}
        >
          {value.toFixed(1)}
        </span>
      ),
    },
    {
      title: '用时',
      dataIndex: 'time_used',
      key: 'time_used',
      width: 140,
      render: (value: number | null) => (
        value ? `${value}分钟` : '-'
      ),
    },
    {
      title: '平均分',
      dataIndex: 'average_score',
      key: 'average_score',
      width: 90,
      render: (value: number | null) => (
        value ? value.toFixed(1) : '-'
      ),
    },
    {
      title: '击败率',
      dataIndex: 'pass_rate',
      key: 'pass_rate',
      width: 90,
      render: (value: number | null) => (
        value ? `${value.toFixed(1)}%` : '-'
      ),
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
      render: (value: string | null) => value || '-',
    },
    {
      title: '星级',
      dataIndex: 'rating',
      key: 'rating',
      width: 150,
      render: (value: number, record: ExamRecord) => (
        <Rate
          allowHalf
          value={value || 0}
          onChange={(rating) => handleRatingChange(record.id, rating)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_: any, record: ExamRecord) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/exam/${record.id}`)}
            title="查看详情"
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditDrawer(record)}
            title="编辑"
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id, record.exam_name)}
            title="删除"
          />
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto py-4 px-2 xl:py-8 xl:px-4">
        <Card loading>
          <div className="space-y-4">
            <Skeleton active />
            <Skeleton active />
            <Skeleton active />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-2 xl:py-8 xl:px-4">
      <Card
        title={
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <h2 className="text-lg xl:text-xl font-bold m-0">考试记录列表</h2>
            <div className="flex flex-wrap items-center gap-2">
              {hasUnsavedSort && (
                <>
                  <Button type="primary" onClick={handleSaveSort} size="small">
                    保存排序
                  </Button>
                  <Button onClick={handleCancelSort} size="small">
                    取消排序
                  </Button>
                </>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/upload')}
                size="small"
              >
                上传新记录
              </Button>
            </div>
          </div>
        }
        className="shadow-sm"
      >
        {hasUnsavedSort && (
          <Alert
            message="排序未保存"
            description='您已调整了记录的排序，请点击"保存排序"按钮保存更改。'
            type="warning"
            showIcon
            icon={<InfoCircleOutlined />}
            className="mb-4"
          />
        )}

        {examRecords.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">暂无考试记录</p>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/upload')}>
              上传第一条记录
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={examRecords}
              rowKey="id"
              pagination={false}
              scroll={{ x: 1400 }}
              components={{
                body: {
                  wrapper: DraggableContainer,
                  row: DraggableBodyRow,
                },
              }}
            />
          </div>
        )}
      </Card>

      {/* 编辑抽屉 */}
      <Drawer
        title="编辑考试记录"
        placement="right"
        width={window.innerWidth < 768 ? '100%' : 480}
        onClose={closeEditDrawer}
        open={drawerVisible}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={closeEditDrawer}>取消</Button>
            <Button type="primary" onClick={handleSaveEdit}>
              保存
            </Button>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="索引号"
            name="index_number"
            rules={[
              { required: true, message: '请输入索引号' },
              { type: 'number', min: 1, message: '索引号必须大于 0' },
            ]}
          >
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              placeholder="请输入索引号"
            />
          </Form.Item>

          <Form.Item
            label="考试名称"
            name="exam_name"
            rules={[
              { required: true, message: '请输入考试名称' },
              { max: 50, message: '考试名称不能超过50个字符' },
            ]}
          >
            <Input
              maxLength={50}
              placeholder="请输入考试名称"
            />
          </Form.Item>

          <Form.Item
            label="总分"
            name="total_score"
            rules={[
              { required: true, message: '请输入总分' },
              { type: 'number', min: 0, max: 100, message: '总分必须在 0-100 之间' },
            ]}
          >
            <InputNumber
              min={0}
              max={100}
              step={0.1}
              style={{ width: '100%' }}
              placeholder="请输入总分"
            />
          </Form.Item>

          <Form.Item
            label="用时（分钟）"
            name="time_used"
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="请输入用时"
            />
          </Form.Item>

          <Form.Item
            label="平均分"
            name="average_score"
          >
            <InputNumber
              min={0}
              max={100}
              step={0.1}
              style={{ width: '100%' }}
              placeholder="请输入平均分"
            />
          </Form.Item>

          <Form.Item
            label="击败率（%）"
            name="pass_rate"
          >
            <InputNumber
              min={0}
              max={100}
              step={0.1}
              style={{ width: '100%' }}
              placeholder="请输入击败率"
            />
          </Form.Item>

          <Form.Item
            label="考试日期"
            name="exam_date"
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder="选择考试日期"
              disabledDate={(current) => {
                if (!editingRecord) return false;
                const uploadDate = dayjs(editingRecord.created_at).startOf('day');
                return current && current.isAfter(uploadDate);
              }}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
