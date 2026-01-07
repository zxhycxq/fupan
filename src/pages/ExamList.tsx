import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Skeleton, Alert, Table, Modal, Rate, message, Space, Drawer, Form, Input, InputNumber, DatePicker, Tooltip, Select, Tag, Row, Col, Switch } from 'antd';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
import type { ColumnsType } from 'antd/es/table';
import { getAllExamRecords, deleteExamRecord, updateExamRecord, updateExamRating, updateExamNotes, updateExamIncludeInStats } from '@/db/api';
import type { ExamRecord } from '@/types';
import { EyeOutlined, DeleteOutlined, PlusOutlined, EditOutlined, InfoCircleOutlined, MenuOutlined, RiseOutlined, WarningOutlined, ClockCircleOutlined, LinkOutlined, DownloadOutlined, SearchOutlined, ReloadOutlined, FullscreenOutlined } from '@ant-design/icons';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { arrayMoveImmutable } from 'array-move';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import WangEditor, { type WangEditorRef } from '@/components/common/WangEditor';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import { PERCENTAGE_RANGE_OPTIONS, RATING_OPTIONS } from '@/config/formOptions';

// 拖拽手柄
const DragHandle = SortableHandle(() => (
  <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />
));

// 可排序的行
const SortableItem = SortableElement((props: any) => <tr {...props} />);

// 可排序的容器
const SortableBody = SortableContainer((props: any) => <tbody {...props} />);

// 筛选条件接口
interface FilterParams {
  examName?: string;
  examType?: string;
  scoreRange?: string;
  passRateRange?: string;
  dateRange?: [Dayjs, Dayjs] | null;
  rating?: number | 'unrated'; // 支持"未评定"选项
}

// localStorage键名
const PAGINATION_STORAGE_KEY = 'examList_pagination';
const FILTER_STORAGE_KEY = 'examList_filters';

// 从localStorage读取分页状态
const loadPaginationFromStorage = () => {
  try {
    const stored = localStorage.getItem(PAGINATION_STORAGE_KEY);
    if (stored) {
      const { currentPage, pageSize } = JSON.parse(stored);
      return { currentPage: currentPage || 1, pageSize: pageSize || 10 };
    }
  } catch (error) {
    console.error('读取分页状态失败:', error);
  }
  return { currentPage: 1, pageSize: 10 };
};

// 保存分页状态到localStorage
const savePaginationToStorage = (currentPage: number, pageSize: number) => {
  try {
    localStorage.setItem(PAGINATION_STORAGE_KEY, JSON.stringify({ currentPage, pageSize }));
  } catch (error) {
    console.error('保存分页状态失败:', error);
  }
};

export default function ExamList() {
  const [examRecords, setExamRecords] = useState<ExamRecord[]>([]); // 所有考试记录
  const [filteredRecords, setFilteredRecords] = useState<ExamRecord[]>([]); // 筛选后的考试记录
  const [isLoading, setIsLoading] = useState(true); // 加载状态
  const [loadError, setLoadError] = useState<string | null>(null); // 加载错误信息
  const [drawerVisible, setDrawerVisible] = useState(false); // 编辑抽屉显示状态
  const [editingRecord, setEditingRecord] = useState<Partial<ExamRecord> | null>(null); // 正在编辑的记录
  const [hasUnsavedSort, setHasUnsavedSort] = useState(false); // 是否有未保存的排序
  const [notesModalVisible, setNotesModalVisible] = useState(false); // 笔记弹窗显示状态
  const [notesModalType, setNotesModalType] = useState<'improvements' | 'mistakes'>('improvements'); // 笔记类型（改进点/错题）
  const [notesModalContent, setNotesModalContent] = useState<string>(''); // 笔记内容
  const [editingRecordId, setEditingRecordId] = useState<string>(''); // 正在编辑笔记的记录ID
  const [isSaving, setIsSaving] = useState(false); // 保存状态
  const [isSavingSort, setIsSavingSort] = useState(false); // 保存排序的loading状态
  
  // 从localStorage读取初始分页状态
  const initialPagination = loadPaginationFromStorage();
  const [currentPage, setCurrentPage] = useState(initialPagination.currentPage); // 当前页码
  const [pageSize, setPageSize] = useState(initialPagination.pageSize); // 每页显示数量
  
  const [filterParams, setFilterParams] = useState<FilterParams>({}); // 筛选参数
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  const editorRef = useRef<WangEditorRef>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isMobile, setIsMobile] = useState(false); // 是否为移动端
  const [showLandscapeModal, setShowLandscapeModal] = useState(false); // 横屏弹窗显示状态
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null); // 日期范围筛选

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 从URL参数读取页码（优先级低于localStorage）
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    
    // 只有在localStorage没有保存状态时才使用URL参数
    const stored = localStorage.getItem(PAGINATION_STORAGE_KEY);
    if (!stored) {
      if (pageParam) {
        const page = parseInt(pageParam, 10);
        if (!isNaN(page) && page > 0) {
          setCurrentPage(page);
        }
      }
      
      if (pageSizeParam) {
        const size = parseInt(pageSizeParam, 10);
        if (!isNaN(size) && size > 0) {
          setPageSize(size);
        }
      }
    }
  }, [searchParams]);

  // 监听分页变化，保存到localStorage
  useEffect(() => {
    savePaginationToStorage(currentPage, pageSize);
  }, [currentPage, pageSize]);

  useEffect(() => {
    loadExamRecords();
  }, []);

  const loadExamRecords = async () => {
    try {
      setIsLoading(true);
      setLoadError(null); // 清除之前的错误
      const records = await getAllExamRecords();
      setExamRecords(records);
      setFilteredRecords(records); // 初始化筛选后的记录
      
      // 检查当前页是否还有数据，如果没有则跳转到上一页
      const totalPages = Math.ceil(records.length / pageSize);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
      
      if (records.length === 0) {
        console.warn('未获取到考试记录数据');
      }
    } catch (error) {
      console.error('加载考试记录失败:', error);
      const errorMessage = '加载考试记录失败。可能是网络问题或浏览器扩展（如广告拦截器）阻止了请求。请尝试：\n1. 禁用广告拦截器\n2. 刷新页面重试\n3. 检查网络连接';
      setLoadError(errorMessage);
      message.error('加载考试记录失败，请查看页面提示');
      // 即使失败也设置空数组，避免页面崩溃
      setExamRecords([]);
      setFilteredRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 应用筛选条件
  useEffect(() => {
    applyFilters();
  }, [examRecords, filterParams]);

  // 筛选逻辑
  const applyFilters = (params = filterParams) => {
    let filtered = [...examRecords];

    // 按名称筛选
    if (params.examName) {
      const searchText = params.examName.toLowerCase();
      filtered = filtered.filter(record => 
        record.exam_name.toLowerCase().includes(searchText)
      );
    }

    // 按考试类型筛选
    if (params.examType) {
      filtered = filtered.filter(record => 
        record.exam_type === params.examType
      );
    }

    // 按总分区间筛选
    if (params.scoreRange) {
      const [min, max] = params.scoreRange.split('-').map(Number);
      filtered = filtered.filter(record => {
        const score = record.total_score || 0;
        return score >= min && score <= max;
      });
    }

    // 按击败率区间筛选
    if (params.passRateRange) {
      const [min, max] = params.passRateRange.split('-').map(Number);
      filtered = filtered.filter(record => {
        const rate = record.pass_rate || 0;
        return rate >= min && rate <= max;
      });
    }

    // 按考试日期筛选 - 使用dateRange状态
    if (params.dateRange && params.dateRange.length === 2) {
      const [startDate, endDate] = params.dateRange;
      filtered = filtered.filter(record => {
        if (!record.exam_date) return false;
        const examDate = dayjs(record.exam_date);
        return examDate.isAfter(startDate.startOf('day')) && 
               examDate.isBefore(endDate.endOf('day'));
      });
    }

    // 按星级筛选
    if (params.rating !== undefined) {
      if (params.rating === 'unrated') {
        // 筛选未评定的记录（rating为0或null）
        filtered = filtered.filter(record => {
          const rating = record.rating || 0;
          return rating === 0;
        });
      } else {
        // 筛选指定星级的记录
        filtered = filtered.filter(record => {
          const rating = record.rating || 0;
          // 四舍五入到整数
          return Math.round(rating) === params.rating;
        });
      }
    }

    setFilteredRecords(filtered);
    // 筛选时不重置页码，保持当前页
    // setCurrentPage(1); // 注释掉这行
  };

  // 处理搜索
  const handleSearch = () => {
    const values = filterForm.getFieldsValue();
    const newParams = {
      examName: values.examName,
      examType: values.examType,
      scoreRange: values.scoreRange,
      passRateRange: values.passRateRange,
      dateRange: dateRange, // 使用dateRange状态
      rating: values.rating,
    };
    setFilterParams(newParams);
    applyFilters(newParams);
  };

  // 处理重置
  const handleReset = () => {
    filterForm.resetFields();
    setDateRange(null);
    setFilterParams({});
  };

  const handleDelete = async (id: string, examName: string) => {
    Modal.confirm({
      title: '确认删除',
      content: (
        <div>
          确定要删除"<span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{examName}</span>"的考试记录吗？此操作无法撤销。
        </div>
      ),
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
      exam_type: record.exam_type || '国考模考', // 添加考试类型
      total_score: record.total_score,
      time_used: record.time_used ? Math.round(record.time_used / 60) : null, // 将秒转换为分钟
      average_score: record.average_score,
      pass_rate: record.pass_rate,
      exam_date: record.exam_date ? dayjs(record.exam_date) : null,
      report_url: record.report_url || '',
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

  /**
   * 处理参与统计状态变更
   * @param id 考试记录ID
   * @param includeInStats 是否参与统计（true=参与，false=不参与）
   * @description 更新考试记录的参与统计状态，影响数据总览和各模块分析的统计结果
   */
  const handleIncludeInStatsChange = async (id: string, includeInStats: boolean) => {
    try {
      // 调用API更新数据库
      await updateExamIncludeInStats(id, includeInStats);
      
      // 显示成功提示
      message.success(includeInStats ? '已开启参与统计' : '已关闭参与统计');
      
      // 更新本地状态
      setExamRecords(prev => 
        prev.map(record => 
          record.id === id ? { ...record, include_in_stats: includeInStats } : record
        )
      );
    } catch (error) {
      console.error('更新参与统计状态失败:', error);
      message.error('更新参与统计状态失败，请重试');
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
      updates.exam_type = values.exam_type || '国考模考'; // 添加考试类型

      updates.total_score = Math.round(values.total_score * 10) / 10;
      updates.time_used = values.time_used ? values.time_used * 60 : undefined; // 将分钟转换为秒
      updates.average_score = values.average_score ? Math.round(values.average_score * 10) / 10 : undefined;
      updates.pass_rate = values.pass_rate ? Math.round(values.pass_rate * 10) / 10 : undefined;
      updates.exam_date = values.exam_date ? values.exam_date.format('YYYY-MM-DD') : undefined;
      updates.report_url = values.report_url ? values.report_url.trim() : undefined;

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
  // 导出Word文档
  const handleExportText = () => {
    if (!editorRef.current) {
      message.error('编辑器未初始化');
      return;
    }

    const html = editorRef.current.getHtml();
    const text = editorRef.current.getText();
    if (!text || text.trim() === '') {
      message.warning('内容为空，无法导出');
      return;
    }

    try {
      // 获取当前记录的考试名称作为文件名
      const currentRecord = examRecords.find(r => r.id === editingRecordId);
      const examName = currentRecord?.exam_name || '考试记录';
      const typeText = notesModalType === 'improvements' ? '进步' : '错误';
      
      // 创建完整的HTML文档，添加Word可以识别的XML命名空间
      const fullHtml = `
        <!DOCTYPE html>
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="UTF-8">
          <title>${examName}-${typeText}</title>
          <style>
            body {
              font-family: "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
              font-size: 14px;
              line-height: 1.6;
              padding: 20px;
            }
            p {
              margin: 0.5em 0;
            }
            ul, ol {
              margin: 0.5em 0;
              padding-left: 2em;
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `;
      
      // 创建Blob对象，使用application/msword类型
      const blob = new Blob(['\ufeff', fullHtml], { 
        type: 'application/msword;charset=utf-8' 
      });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${examName}-${typeText}.doc`;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      message.success('导出成功');
    } catch (error) {
      console.error('导出Word失败:', error);
      message.error('导出失败，请重试');
    }
  };

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

  // 获取考试类型的标签颜色
  const getExamTypeColor = (examType: string | null): string => {
    const type = examType || '国考模考';
    switch (type) {
      case '国考真题':
        return 'red'; // 红色
      case '国考模考':
        return 'blue'; // 蓝色
      case '省考真题':
        return 'orange'; // 橙色
      case '省考模考':
        return 'green'; // 绿色
      case '其他':
        return 'default'; // 默认灰色
      default:
        return 'blue'; // 默认蓝色
    }
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
      width: 180,
      ellipsis: {
        showTitle: false,
      },
      render: (value: string, record: ExamRecord) => {
        // 如果有报告链接，显示为可点击的链接
        if (record.report_url && record.report_url.trim()) {
          return (
            <Tooltip title={value}>
              <a 
                href={record.report_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium inline-flex items-center gap-1"
                style={{ color: '#1890ff' }}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="truncate max-w-[140px]">{value}</span>
                <LinkOutlined style={{ fontSize: '12px' }} />
              </a>
            </Tooltip>
          );
        }
        // 否则显示普通文本
        return (
          <Tooltip title={value}>
            <span className="font-medium truncate block">{value}</span>
          </Tooltip>
        );
      },
    },
    {
      title: '考试类型',
      dataIndex: 'exam_type',
      key: 'exam_type',
      width: 110,
      render: (value: string | null) => {
        const type = value || '国考模考';
        const color = getExamTypeColor(value);
        return <Tag color={color} bordered>{type}</Tag>;
      },
    },
    {
      title: '总分',
      dataIndex: 'total_score',
      key: 'total_score',
      width: 70,
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
          <Tooltip title="超过115分钟可能来不及涂卡，会显示为红色">
            <InfoCircleOutlined className="text-gray-400 text-xs" />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'time_used',
      key: 'time_used',
      width: 85,
      render: (value: number | null) => {
        if (!value) return '-';
        
        // 数据库存储的是秒，需要转换为分钟
        const minutes = Math.round(value / 60);
        const isOvertime = minutes > 115;
        return (
          <span className={isOvertime ? 'text-red-600 font-semibold' : ''}>
            {minutes}m
          </span>
        );
      },
    },
    {
      title: (
        <Space size={4}>
          <span>参与统计</span>
          <Tooltip title="默认开启，关闭代表不参与数据总览和各模块分析的统计分析">
            <InfoCircleOutlined className="text-gray-400 text-xs" />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'include_in_stats',
      key: 'include_in_stats',
      width: 90,
      render: (value: boolean | null | undefined, record: ExamRecord) => {
        const isIncluded = value !== false; // 默认为 true
        return (
          <Switch
            checked={isIncluded}
            onChange={(checked) => handleIncludeInStatsChange(record.id, checked)}
            disabled={isSavingSort}
            checkedChildren="开启"
            unCheckedChildren="关闭"
          />
        );
      },
    },
    {
      title: '平均分',
      dataIndex: 'average_score',
      key: 'average_score',
      width: 80,
      render: (value: number | null) => (
        value ? value.toFixed(1) : '-'
      ),
    },
    {
      title: '击败率',
      dataIndex: 'pass_rate',
      key: 'pass_rate',
      width: 80,
      render: (value: number | null) => (
        value ? `${value.toFixed(1)}%` : '-'
      ),
    },
    {
      title: '考试日期',
      dataIndex: 'exam_date',
      key: 'exam_date',
      width: 120,
      render: (value: string | null) => value || '-',
    },
    {
      title: '备注',
      key: 'notes',
      width: 90,
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
      width: 180,
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
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (value: string) => formatDate(value),
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
            onClick={() => navigate(`/exam/${record.id}?from=list&page=${currentPage}&pageSize=${pageSize}`)}
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

  // 显示错误状态
  if (loadError) {
    return (
      <div className="container mx-auto py-4 px-2 xl:py-8 xl:px-4">
        <Card>
          <Alert
            message="加载失败"
            description={
              <div className="space-y-4">
                <div className="whitespace-pre-line">{loadError}</div>
                <div className="flex gap-2">
                  <Button type="primary" onClick={loadExamRecords}>
                    重新加载
                  </Button>
                  <Button onClick={() => navigate('/upload')}>
                    上传新记录
                  </Button>
                </div>
              </div>
            }
            type="error"
            showIcon
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-2 xl:py-8 xl:px-4 bg-gray-50 min-h-screen">

      <div className="mb-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl xl:text-3xl font-bold m-0 text-gray-800">考试记录列表</h2>
            <p className="text-sm text-gray-500 m-0">智能管理您的所有考试成绩与模拟分析</p>
            {isMobile && filteredRecords.length > 0 && (
              <Tooltip title="横屏查看">
                <Button
                  type="text"
                  icon={<FullscreenOutlined />}
                  onClick={() => setShowLandscapeModal(true)}
                  className="flex items-center"
                />
              </Tooltip>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasUnsavedSort && (
              <>
                <Button 
                  type="primary" 
                  onClick={handleSaveSort} 
                  loading={isSavingSort}
                  disabled={isSavingSort}
                >
                  保存排序
                </Button>
                <Button 
                  onClick={handleCancelSort} 
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
              disabled={isSavingSort}
              size="large"
            >
              上传新记录
            </Button>
          </div>
        </div>
      </div>

      <Card
        className="shadow-sm mb-4"
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

        {/* 筛选表单 */}
        <div className="bg-white rounded-lg p-6 mb-4 shadow-sm border border-gray-200">
          <Form
            form={filterForm}
            onFinish={handleSearch}
            className="filter-form"
          >
            <Row gutter={[16, 8]}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item 
                  label="考试名称" 
                  name="examName" 
                  className="mb-2"
                  labelCol={{ xs: 24, sm: 8 }}
                  wrapperCol={{ xs: 24, sm: 16 }}
                >
                  <Input placeholder="请输入考试名称" allowClear />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item 
                  label="考试类型" 
                  name="examType" 
                  className="mb-2"
                  labelCol={{ xs: 24, sm: 8 }}
                  wrapperCol={{ xs: 24, sm: 16 }}
                >
                  <Select placeholder="请选择考试类型" allowClear>
                    <Select.Option value="国考真题">国考真题</Select.Option>
                    <Select.Option value="国考模考">国考模考</Select.Option>
                    <Select.Option value="省考真题">省考真题</Select.Option>
                    <Select.Option value="省考模考">省考模考</Select.Option>
                    <Select.Option value="其他">其他</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item 
                  label="总分区间" 
                  name="scoreRange" 
                  className="mb-2"
                  labelCol={{ xs: 24, sm: 8 }}
                  wrapperCol={{ xs: 24, sm: 16 }}
                >
                  <Select placeholder="请选择总分区间" allowClear>
                    {PERCENTAGE_RANGE_OPTIONS.map(opt => (
                      <Select.Option key={opt.value} value={opt.value}>{opt.label.replace('%', '分')}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item 
                  label="击败率区间" 
                  name="passRateRange" 
                  className="mb-2"
                  labelCol={{ xs: 24, sm: 8 }}
                  wrapperCol={{ xs: 24, sm: 16 }}
                >
                  <Select placeholder="请选择击败率区间" allowClear>
                    {PERCENTAGE_RANGE_OPTIONS.map(opt => (
                      <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item 
                  label="星级" 
                  name="rating" 
                  className="mb-2"
                  labelCol={{ xs: 24, sm: 8 }}
                  wrapperCol={{ xs: 24, sm: 16 }}
                >
                  <Select placeholder="请选择星级" allowClear>
                    {RATING_OPTIONS.map(opt => (
                      <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12} md={12} lg={9}>
                <Form.Item 
                  label="考试日期" 
                  name="dateRange" 
                  className="mb-2"
                  labelCol={{ xs: 24, sm: 8, md: 4, lg: 4 }}
                  wrapperCol={{ xs: 24, sm: 16, md: 20, lg: 20 }}
                >
                  <DateRangeFilter 
                    value={dateRange} 
                    onChange={(dates) => {
                      setDateRange(dates);
                      // 不需要立即触发筛选，等用户点击搜索按钮
                    }}
                    showLabel={false}
                    className="mb-0"
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={24} md={12} lg={9} className="flex items-start justify-end">
                <Space size="small" className="mb-2">
                  <Button 
                    type="primary" 
                    icon={<SearchOutlined />}
                    htmlType="submit"
                  >
                    搜索
                  </Button>
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={handleReset}
                  >
                    重置
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form>
        </div>

        {examRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4">
            <div className="text-center space-y-6 max-w-md">
              {/* 空状态图标 */}
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                  <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              
              {/* 提示文字 */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-800">暂无考试记录</h3>
                <p className="text-sm text-gray-500">
                  开始记录您的考试成绩，追踪学习进度
                </p>
              </div>
              
              {/* 操作按钮 */}
              <Button 
                type="primary" 
                size="large"
                icon={<PlusOutlined />} 
                onClick={() => navigate('/upload')}
                className="h-12 px-8 text-base font-medium shadow-lg hover:shadow-xl transition-all"
              >
                上传第一条记录
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
            <Table
              columns={columns}
              dataSource={filteredRecords}
              rowKey="id"
              className="select-none" // 添加禁止文字选中的CSS类
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                pageSizeOptions: ['10', '20', '30', '50', '100'],
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
          {/* 1. 考试名称 */}
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

          {/* 2. 总分 */}
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

          {/* 3. 考试日期 */}
          <Form.Item
            label="考试日期"
            name="exam_date"
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder="选择考试日期"
              size="middle"
              getPopupContainer={(trigger) => trigger.parentElement || document.body}
              disabledDate={(current) => {
                if (!editingRecord) return false;
                const uploadDate = dayjs(editingRecord.created_at).startOf('day');
                return current && current.isAfter(uploadDate);
              }}
            />
          </Form.Item>

          {/* 4. 用时（分钟） */}
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

          {/* 5. 平均分 */}
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

          {/* 6. 击败率（%） */}
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

          {/* 7. 考试类型 */}
          <Form.Item
            label="考试类型"
            name="exam_type"
          >
            <Select
              placeholder="请选择考试类型"
              options={[
                { value: '国考真题', label: '国考真题' },
                { value: '国考模考', label: '国考模考' },
                { value: '省考真题', label: '省考真题' },
                { value: '省考模考', label: '省考模考' },
                { value: '其他', label: '其他' }
              ]}
            />
          </Form.Item>

          {/* 8. 考试报告链接 */}
          <Form.Item
            label="考试报告链接"
            name="report_url"
            rules={[
              {
                type: 'url',
                message: '请输入有效的URL地址',
              },
            ]}
          >
            <Input
              placeholder="请输入考试报告链接地址（选填）"
              prefix={<LinkOutlined />}
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* 横屏查看弹窗 */}
      <Modal
        open={showLandscapeModal}
        onCancel={() => setShowLandscapeModal(false)}
        footer={null}
        width="100vw"
        style={{ 
          top: 0,
          maxWidth: '100vw',
          margin: 0,
          padding: 0,
        }}
        bodyStyle={{
          height: '100vh',
          padding: 0,
          overflow: 'hidden',
        }}
        className="landscape-modal"
      >
        <div 
          className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-900"
          style={{
            transform: 'rotate(90deg)',
            transformOrigin: 'center center',
            width: '100vh',
            height: '100vw',
            position: 'absolute',
            left: '50%',
            top: '50%',
            marginLeft: '-50vh',
            marginTop: '-50vw',
          }}
        >
          <div className="w-full h-full p-4 overflow-auto">
            <div className="text-xl font-bold mb-4 text-center">考试记录列表</div>
            <div className="h-[calc(100%-60px)] overflow-auto">
              <Table
                columns={columns}
                dataSource={filteredRecords}
                rowKey="id"
                pagination={false}
                size="small"
                bordered
                scroll={{ x: 'max-content' }}
              />
            </div>
          </div>
        </div>
      </Modal>

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
        footer={[
          <Button 
            key="export" 
            icon={<DownloadOutlined />}
            onClick={handleExportText}
            style={{ float: 'left' }}
          >
            导出Word
          </Button>,
          <Button key="cancel" onClick={() => setNotesModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={isSaving}
            onClick={handleSaveNotes}
          >
            确定
          </Button>,
        ]}
        width={window.innerWidth >= 1366 ? 1000 : 800}
      >
        <div>
          <WangEditor
            ref={editorRef}
            value={notesModalContent}
            onChange={(html) => setNotesModalContent(html)}
            placeholder={notesModalType === 'improvements' ? '记录本次考试中有进步的地方...' : '记录本次考试中出错的地方...'}
            maxLength={5000}
            height={400}
          />
        </div>
      </Modal>
    </div>
  );
}
