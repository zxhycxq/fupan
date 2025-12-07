import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Skeleton, Alert, Table, Modal, Rate, message, Space, Drawer, Form, Input, InputNumber, DatePicker, Tooltip } from 'antd';

const { TextArea } = Input;
import type { ColumnsType } from 'antd/es/table';
import { getAllExamRecords, deleteExamRecord, updateExamRecord, updateExamRating, updateExamNotes } from '@/db/api';
import type { ExamRecord } from '@/types';
import { EyeOutlined, DeleteOutlined, PlusOutlined, EditOutlined, InfoCircleOutlined, MenuOutlined, RiseOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
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
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [notesModalType, setNotesModalType] = useState<'improvements' | 'mistakes'>('improvements');
  const [notesModalContent, setNotesModalContent] = useState<string>('');
  const [editingRecordId, setEditingRecordId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSort, setIsSavingSort] = useState(false); // 新增：保存排序的loading状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
      exam_name: record.exam_name,
      total_score: record.total_score,
      time_used: record.time_used ? Math.round(record.time_used / 60) : null, // 将秒转换为分钟
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

      updates.total_score = Math.round(values.total_score * 10) / 10;
      updates.time_used = values.time_used ? values.time_used * 60 : null; // 将分钟转换为秒
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
      setIsSavingSort(true); // 开始保存，显示loading
      
      // 更新每条记录的 sort_order
      const updates = examRecords.map((record, index) => ({
        id: record.id,
        sort_order: index + 1,
      }));

      // 批量更新
      for (const update of updates) {
        await updateExamRecord(update.id, { sort_order: update.sort_order });
      }

      message.success('排序已保存');
      setHasUnsavedSort(false);
      loadExamRecords();
    } catch (error) {
      console.error('保存排序失败:', error);
      message.error('保存排序失败，请重试');
    } finally {
      setIsSavingSort(false); // 保存完成，隐藏loading
    }
  };

  // 取消排序
  const handleCancelSort = () => {
    loadExamRecords();
    setHasUnsavedSort(false);
  };

  // 打开备注弹窗
  const handleShowNotes = (recordId: string, type: 'improvements' | 'mistakes', content: string) => {
    setEditingRecordId(recordId);
    setNotesModalType(type);
    setNotesModalContent(content || '');
    setNotesModalVisible(true);
  };

  // 保存备注
  const handleSaveNotes = async () => {
    try {
      setIsSaving(true);
      
      // 获取当前记录
      const currentRecord = examRecords.find(r => r.id === editingRecordId);
      if (!currentRecord) {
        message.error('记录不存在');
        return;
      }
      
      // 根据类型更新对应的字段
      const improvements = notesModalType === 'improvements' 
        ? notesModalContent 
        : (currentRecord.improvements || '');
      const mistakes = notesModalType === 'mistakes' 
        ? notesModalContent 
        : (currentRecord.mistakes || '');
      
      await updateExamNotes(editingRecordId, improvements, mistakes);
      
      // 更新本地状态
      setExamRecords(prev => prev.map(record => 
        record.id === editingRecordId 
          ? { ...record, improvements, mistakes }
          : record
      ));
      
      message.success('备注已保存');
      setNotesModalVisible(false);
    } catch (error) {
      console.error('保存备注失败:', error);
      const errorMessage = error instanceof Error ? error.message : '保存备注失败，请重试';
      message.error(errorMessage);
    } finally {
      setIsSaving(false);
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
      title: '序号',
      key: 'row_number',
      width: 70,
      render: (_: any, __: any, index: number) => (
        <span className="font-medium text-gray-600">
          {(currentPage - 1) * pageSize + index + 1}
        </span>
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
      title: (
        <Space size={4}>
          <span>用时</span>
          <Tooltip title="超过115分钟可能来不及涂卡">
            <InfoCircleOutlined className="text-gray-400 text-xs" />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'time_used',
      key: 'time_used',
      width: 140,
      render: (value: number | null) => {
        if (!value) return '-';
        
        // 数据库存储的是秒，需要转换为分钟
        const minutes = Math.round(value / 60);
        const isOvertime = minutes > 115;
        return (
          <Space size={4}>
            <span className={isOvertime ? 'text-red-600 font-semibold' : ''}>
              {minutes}分钟
            </span>
            {isOvertime && (
              <Tooltip title="超过115分钟可能来不及涂卡">
                <ClockCircleOutlined className="text-red-600" />
              </Tooltip>
            )}
          </Space>
        );
      },
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
      title: '备注',
      key: 'notes',
      width: 100,
      render: (_: any, record: ExamRecord) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<RiseOutlined />}
            onClick={() => handleShowNotes(record.id, 'improvements', record.improvements || '')}
            title="有进步的地方"
            className={record.improvements ? 'text-green-600' : 'text-gray-400'}
            disabled={isSavingSort} // 保存排序时禁用备注
          />
          <Button
            type="text"
            size="small"
            icon={<WarningOutlined />}
            onClick={() => handleShowNotes(record.id, 'mistakes', record.mistakes || '')}
            title="出错的地方"
            className={record.mistakes ? 'text-red-600' : 'text-gray-400'}
            disabled={isSavingSort} // 保存排序时禁用备注
          />
        </Space>
      ),
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
          disabled={isSavingSort} // 保存排序时禁用星级修改
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
            disabled={isSavingSort} // 保存排序时禁用查看
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditDrawer(record)}
            title="编辑"
            disabled={isSavingSort} // 保存排序时禁用编辑
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id, record.exam_name)}
            title="删除"
            disabled={isSavingSort} // 保存排序时禁用删除
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
                  <Button 
                    type="primary" 
                    onClick={handleSaveSort} 
                    size="small"
                    loading={isSavingSort}
                    disabled={isSavingSort}
                  >
                    保存排序
                  </Button>
                  <Button 
                    onClick={handleCancelSort} 
                    size="small"
                    disabled={isSavingSort}
                  >
                    取消排序
                  </Button>
                </>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/upload')}
                size="small"
                disabled={isSavingSort}
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
              className="select-none" // 添加禁止文字选中的CSS类
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                pageSizeOptions: ['10', '20', '30', '50'],
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
                position: ['bottomRight'],
                locale: {
                  items_per_page: '条/页',
                  jump_to: '跳至',
                  page: '页',
                },
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                },
                disabled: isSavingSort, // 保存排序时禁用分页
              }}
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

      {/* 备注弹窗 */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            {notesModalType === 'improvements' ? (
              <>
                <RiseOutlined className="text-green-600" />
                <span>有进步的地方</span>
              </>
            ) : (
              <>
                <WarningOutlined className="text-red-600" />
                <span>出错的地方</span>
              </>
            )}
          </div>
        }
        open={notesModalVisible}
        onCancel={() => setNotesModalVisible(false)}
        onOk={handleSaveNotes}
        okText="确定"
        cancelText="取消"
        confirmLoading={isSaving}
        width={600}
      >
        <div>
          <TextArea
            value={notesModalContent}
            onChange={(e) => setNotesModalContent(e.target.value)}
            placeholder={notesModalType === 'improvements' ? '记录本次考试中有进步的地方...' : '记录本次考试中出错的地方...'}
            rows={8}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 text-right mt-1">
            {notesModalContent.length}/500字
          </p>
        </div>
      </Modal>
    </div>
  );
}
