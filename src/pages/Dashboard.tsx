import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { Table, Card, Skeleton, Statistic, Row, Col, Button, message, Calendar, Badge, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { RiseOutlined, ClockCircleOutlined, AimOutlined, TrophyOutlined, DownloadOutlined } from '@ant-design/icons';
import { getAllExamRecords, getModuleAverageScores, getModuleTrendData, getModuleDetailedStats, getUserSettings } from '@/db/api';
import type { ExamRecord, UserSetting } from '@/types';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export default function Dashboard() {
  const navigate = useNavigate();
  const [examRecords, setExamRecords] = useState<ExamRecord[]>([]);
  const [moduleAvgScores, setModuleAvgScores] = useState<{ module_name: string; avg_accuracy: number }[]>([]);
  const [moduleTrendData, setModuleTrendData] = useState<{
    exam_numbers: number[];
    exam_names?: string[]; // 添加考试名称数组
    modules: { module_name: string; data: (number | null)[] }[];
  }>({ exam_numbers: [], exam_names: [], modules: [] });
  const [moduleDetailedStats, setModuleDetailedStats] = useState<{
    exam_number: number;
    exam_name: string;
    exam_date: string | null;
    module_name: string;
    parent_module: string | null;
    total_questions: number;
    correct_answers: number;
    accuracy: number;
    time_used: number; // 用时（秒）
  }[]>([]);
  const [userSettings, setUserSettings] = useState<UserSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // 安全地获取窗口宽度
  const getWindowWidth = () => {
    try {
      return typeof window !== 'undefined' ? window.innerWidth : 1024;
    } catch (error) {
      return 1024; // 默认桌面宽度
    }
  };

  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      const width = getWindowWidth();
      setIsMobile(width < 640);
    };

    checkMobile();

    const handleResize = () => {
      checkMobile();
    };

    try {
      window.addEventListener('resize', handleResize);
      return () => {
        try {
          window.removeEventListener('resize', handleResize);
        } catch (error) {
          // 忽略跨域错误
          console.warn('清理 resize 监听器时出错:', error);
        }
      };
    } catch (error) {
      // 忽略跨域错误
      console.warn('添加 resize 监听器时出错:', error);
      return () => {};
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [records, avgScores, trendData, detailedStats, settings] = await Promise.all([
        getAllExamRecords(),
        getModuleAverageScores(),
        getModuleTrendData(),
        getModuleDetailedStats(),
        getUserSettings('default'),
      ]);
      
      console.log('=== Dashboard 数据加载完成 ===');
      console.log('考试记录数量:', records.length);
      console.log('考试记录列表:', records.map(r => `索引${r.index_number} - ${r.exam_name}`).join(', '));
      
      console.log('\n模块详细统计数量:', detailedStats.length);
      const statsExamNumbers = Array.from(new Set(detailedStats.map(s => s.exam_number))).sort((a, b) => a - b);
      console.log('有模块数据的考试期数:', statsExamNumbers.join(', '));
      
      const recordIndexNumbers = records.map(r => r.index_number).sort((a, b) => a - b);
      const missingIndexNumbers = recordIndexNumbers.filter(idx => !statsExamNumbers.includes(idx));
      if (missingIndexNumbers.length > 0) {
        console.warn('⚠️ 警告：以下考试记录没有模块数据:', missingIndexNumbers.join(', '));
        missingIndexNumbers.forEach(idx => {
          const record = records.find(r => r.index_number === idx);
          console.warn(`  - 索引${idx}: ${record?.exam_name}, 考试日期: ${record?.exam_date || '无'}`);
        });
      }
      
      setExamRecords(records);
      setModuleAvgScores(avgScores);
      setModuleTrendData(trendData);
      setModuleDetailedStats(detailedStats);
      setUserSettings(settings);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 计算统计数据
  const stats = {
    totalExams: examRecords.length,
    averageScore: examRecords.length > 0
      ? (examRecords.reduce((sum, r) => sum + r.total_score, 0) / examRecords.length).toFixed(2)
      : '0',
    highestScore: examRecords.length > 0
      ? Math.max(...examRecords.map(r => r.total_score)).toFixed(2)
      : '0',
    averageTime: examRecords.length > 0 && examRecords.some(r => r.time_used)
      ? Math.round(examRecords.filter(r => r.time_used).reduce((sum, r) => sum + (r.time_used || 0), 0) / examRecords.filter(r => r.time_used).length)
      : 0,
  };

  // 总分趋势图配置
  const scoreTrendOption = {
    title: {
      text: '总分趋势',
      left: 'center',
      textStyle: {
        fontSize: isMobile ? 14 : 16,
      },
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!params || params.length === 0) return '';
        const param = params[0];
        return `${param.axisValue}<br/>${param.marker}${param.seriesName}: ${param.value.toFixed(2)}分`;
      },
    },
    grid: {
      left: isMobile ? '5%' : '3%',
      right: isMobile ? '5%' : '4%',
      bottom: isMobile ? '8%' : '3%',
      top: isMobile ? 50 : 60,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: examRecords.map(r => r.exam_name || `第${r.exam_number}期`),
      axisLabel: {
        fontSize: isMobile ? 10 : 12,
      },
    },
    yAxis: {
      type: 'value',
      name: '分数',
      min: 0,
      max: 100,
      nameTextStyle: {
        fontSize: isMobile ? 10 : 12,
      },
      axisLabel: {
        fontSize: isMobile ? 10 : 12,
        formatter: '{value}分',
      },
    },
    series: [
      {
        name: '总分',
        type: 'line',
        data: examRecords.map(r => r.total_score),
        smooth: true,
        itemStyle: {
          color: '#1890FF',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
            ],
          },
        },
      },
    ],
  };

  // 模块平均正确率柱状图配置
  const moduleAvgOption = {
    title: {
      text: '各模块平均正确率',
      left: 'center',
      textStyle: {
        fontSize: isMobile ? 14 : 16,
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        if (!params || params.length === 0) return '';
        const param = params[0];
        return `${param.axisValue}<br/>${param.marker}${param.seriesName}: ${param.value.toFixed(2)}%`;
      },
    },
    grid: {
      left: isMobile ? '5%' : '3%',
      right: isMobile ? '5%' : '4%',
      bottom: isMobile ? '15%' : '10%',
      top: isMobile ? 50 : 60,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: moduleAvgScores.map(m => m.module_name),
      axisLabel: {
        interval: 0,
        rotate: isMobile ? 45 : 30,
        fontSize: isMobile ? 10 : 12,
      },
    },
    yAxis: {
      type: 'value',
      name: '正确率(%)',
      min: 0,
      max: 100,
      nameTextStyle: {
        fontSize: isMobile ? 10 : 12,
      },
      axisLabel: {
        fontSize: isMobile ? 10 : 12,
        formatter: '{value}%',
      },
    },
    series: [
      {
        name: '正确率',
        type: 'bar',
        data: moduleAvgScores.map(m => m.avg_accuracy),
        itemStyle: {
          color: (params: any) => {
            const value = params.value;
            if (value >= 80) return '#52C41A';
            if (value >= 60) return '#1890FF';
            return '#FF7A45';
          },
        },
      },
    ],
  };

  // 模块趋势图配置
  const moduleTrendOption = {
    title: {
      text: '各模块正确率趋势',
      left: 'center',
      textStyle: {
        fontSize: isMobile ? 14 : 16,
      },
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!params || params.length === 0) return '';
        const examNumber = params[0].axisValue;
        let result = `第${examNumber}次考试<br/>`;
        params.forEach((param: any) => {
          if (param.value !== null && param.value !== undefined) {
            result += `${param.marker}${param.seriesName}: ${param.value.toFixed(2)}%<br/>`;
          }
        });
        return result;
      },
    },
    legend: {
      data: moduleTrendData.modules.map(m => m.module_name),
      top: 30,
      type: 'scroll',
      textStyle: {
        fontSize: isMobile ? 10 : 12,
      },
    },
    grid: {
      left: isMobile ? '8%' : '5%',
      right: isMobile ? '8%' : '5%',
      bottom: isMobile ? '8%' : '3%',
      top: isMobile ? 70 : 80,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: ['5%', '5%'], // 左右留间隙
      data: moduleTrendData.exam_names || moduleTrendData.exam_numbers.map(n => `第${n}次`),
      name: '考试',
      nameTextStyle: {
        fontSize: isMobile ? 10 : 12,
      },
      axisLabel: {
        fontSize: isMobile ? 10 : 12,
      },
    },
    yAxis: {
      type: 'value',
      name: '正确率(%)',
      min: 0,
      max: 100,
      nameTextStyle: {
        fontSize: isMobile ? 10 : 12,
      },
      axisLabel: {
        fontSize: isMobile ? 10 : 12,
        formatter: '{value}%',
      },
    },
    series: moduleTrendData.modules.map((module, index) => ({
      name: module.module_name,
      type: 'line',
      data: module.data,
      smooth: true,
      connectNulls: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 2,
      },
      itemStyle: {
        color: [
          '#5470C6',
          '#91CC75',
          '#FAC858',
          '#EE6666',
          '#73C0DE',
          '#3BA272',
          '#FC8452',
          '#9A60B4',
        ][index % 8],
      },
    })),
  };

  // 得分分布图配置
  const scoreDistributionOption = {
    title: {
      text: '得分分布',
      left: 'center',
      textStyle: {
        fontSize: isMobile ? 14 : 16,
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}<br/>${params.marker}${params.value}次 (${params.percent.toFixed(2)}%)`;
      },
    },
    legend: {
      orient: isMobile ? 'horizontal' : 'vertical',
      left: isMobile ? 'center' : 'left',
      top: isMobile ? 'bottom' : 'middle',
      textStyle: {
        fontSize: isMobile ? 10 : 12,
      },
    },
    series: [
      {
        name: '得分区间',
        type: 'pie',
        radius: isMobile ? '45%' : '50%',
        center: isMobile ? ['50%', '45%'] : ['50%', '50%'],
        data: [
          {
            value: examRecords.filter(r => r.total_score >= 90).length,
            name: '90-100分',
          },
          {
            value: examRecords.filter(r => r.total_score >= 80 && r.total_score < 90).length,
            name: '80-89分',
          },
          {
            value: examRecords.filter(r => r.total_score >= 70 && r.total_score < 80).length,
            name: '70-79分',
          },
          {
            value: examRecords.filter(r => r.total_score >= 60 && r.total_score < 70).length,
            name: '60-69分',
          },
          {
            value: examRecords.filter(r => r.total_score < 60).length,
            name: '60分以下',
          },
        ],
        label: {
          fontSize: isMobile ? 10 : 12,
          formatter: '{b}: {c}次 ({d}%)',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  // 准备表格数据
  interface ExamData {
    exam_number: number;
    total_questions: number;
    correct_answers: number;
    accuracy: number;
    time_used: number; // 用时（秒）
  }

  interface TableDataType {
    key: string;
    module_name: string;
    exams: Map<number, ExamData>;
    children?: TableDataType[];
  }

  // 获取目标正确率
  const getTargetAccuracy = (moduleName: string): number => {
    const setting = userSettings.find(s => s.module_name === moduleName);
    return setting?.target_accuracy || 80; // 默认80%
  };

  // 获取所有考试期数（从考试记录中获取，确保包含所有记录）
  const allExamNumbers = examRecords.map(r => r.index_number).sort((a, b) => a - b);

  // 创建考试信息映射（期数 -> {名称, 日期}）
  const examInfoMap = new Map<number, { name: string; date: string | null }>();
  examRecords.forEach(record => {
    examInfoMap.set(record.index_number, {
      name: record.exam_name || `第${record.index_number}期`,
      date: record.exam_date,
    });
  });

  // 组织表格数据：按主模块分组，子模块作为children
  const moduleMap = new Map<string, TableDataType>();

  moduleDetailedStats.forEach(stat => {
    if (!stat.parent_module) {
      // 主模块数据 - 不累加，直接使用原始数据
      if (!moduleMap.has(stat.module_name)) {
        moduleMap.set(stat.module_name, {
          key: stat.module_name,
          module_name: stat.module_name,
          exams: new Map(),
          children: [],
        });
      }
      
      const module = moduleMap.get(stat.module_name)!;
      // 直接设置，不累加
      module.exams.set(stat.exam_number, {
        exam_number: stat.exam_number,
        total_questions: stat.total_questions,
        correct_answers: stat.correct_answers,
        accuracy: stat.accuracy,
        time_used: stat.time_used,
      });
    } else {
      // 子模块数据
      const parentName = stat.parent_module;
      
      if (!moduleMap.has(parentName)) {
        moduleMap.set(parentName, {
          key: parentName,
          module_name: parentName,
          exams: new Map(),
          children: [],
        });
      }
      
      const parent = moduleMap.get(parentName)!;
      
      // 查找或创建子模块
      let child = parent.children!.find(c => c.module_name === stat.module_name);
      if (!child) {
        child = {
          key: `${parentName}-${stat.module_name}`,
          module_name: stat.module_name,
          exams: new Map(),
        };
        parent.children!.push(child);
      }
      
      // 添加子模块的考试数据
      child.exams.set(stat.exam_number, {
        exam_number: stat.exam_number,
        total_questions: stat.total_questions,
        correct_answers: stat.correct_answers,
        accuracy: stat.accuracy,
        time_used: stat.time_used,
      });
    }
  });

  const tableData: TableDataType[] = Array.from(moduleMap.values());

  // 计算总计行数据
  const totalRow: TableDataType = {
    key: 'total',
    module_name: '总计',
    exams: new Map(),
  };

  allExamNumbers.forEach(examNum => {
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalTime = 0;
    
    // 只统计主模块的数据
    tableData.forEach(module => {
      const examData = module.exams.get(examNum);
      if (examData) {
        totalQuestions += examData.total_questions;
        totalCorrect += examData.correct_answers;
        totalTime += examData.time_used;
      }
    });
    
    totalRow.exams.set(examNum, {
      exam_number: examNum,
      total_questions: totalQuestions,
      correct_answers: totalCorrect,
      accuracy: totalQuestions > 0 ? Number(((totalCorrect / totalQuestions) * 100).toFixed(2)) : 0,
      time_used: totalTime,
    });
  });

  // 将总计行添加到表格数据末尾
  const tableDataWithTotal = [...tableData, totalRow];

  // 定义表格列 - 使用分组表头
  const columns: ColumnsType<TableDataType> = [
    {
      title: '模块名称',
      dataIndex: 'module_name',
      key: 'module_name',
      fixed: 'left',
      width: 150,
      render: (text: string, record: TableDataType) => {
        if (record.key === 'total') {
          return <strong>{text}</strong>;
        }
        return text;
      },
    },
    ...allExamNumbers.map(examNum => {
      const examInfo = examInfoMap.get(examNum);
      const examName = examInfo?.name || `第${examNum}期`;
      const examDate = examInfo?.date || '';
      const title = examDate ? `${examName} - ${examDate}` : examName;
      
      return {
        title,
        key: `exam_${examNum}`,
        children: [
        {
          title: '题目数',
          key: `exam_${examNum}_questions`,
          width: 80,
          align: 'center' as const,
          render: (_: any, record: TableDataType) => {
            const examData = record.exams.get(examNum);
            if (!examData) {
              return <span className="text-muted-foreground">-</span>;
            }
            const content = examData.total_questions;
            return record.key === 'total' ? <strong>{content}</strong> : content;
          },
        },
        {
          title: '答对数',
          key: `exam_${examNum}_correct`,
          width: 80,
          align: 'center' as const,
          render: (_: any, record: TableDataType) => {
            const examData = record.exams.get(examNum);
            if (!examData) {
              return <span className="text-muted-foreground">-</span>;
            }
            const content = examData.correct_answers;
            return record.key === 'total' ? <strong>{content}</strong> : content;
          },
        },
        {
          title: '正确率',
          key: `exam_${examNum}_accuracy`,
          width: 90,
          align: 'center' as const,
          render: (_: any, record: TableDataType) => {
            const examData = record.exams.get(examNum);
            if (!examData) {
              return <span className="text-muted-foreground">-</span>;
            }
            
            // 只有低于50%才标红
            const isLow = examData.accuracy < 50 && record.key !== 'total';
            
            // 保留1位小数
            const content = `${examData.accuracy.toFixed(1)}%`;
            
            if (record.key === 'total') {
              return <strong>{content}</strong>;
            }
            
            return (
              <span 
                style={{ 
                  color: isLow ? '#ef4444' : 'inherit', 
                  fontWeight: isLow ? 'bold' : 'normal' 
                }}
              >
                {content}
              </span>
            );
          },
        },
        {
          title: '用时',
          key: `exam_${examNum}_time`,
          width: 80,
          align: 'center' as const,
          render: (_: any, record: TableDataType) => {
            // 只显示大模块（没有children或者是总计行）的用时
            if (record.children && record.children.length > 0 && record.key !== 'total') {
              const examData = record.exams.get(examNum);
              if (!examData) {
                return <span className="text-muted-foreground">-</span>;
              }
              // 将秒转换为分钟，保留1位小数
              const minutes = (examData.time_used / 60).toFixed(1);
              const content = `${minutes}分`;
              return record.key === 'total' ? <strong>{content}</strong> : content;
            }
            // 子模块不显示用时
            return <span className="text-muted-foreground">-</span>;
          },
        },
      ],
      };
    }),
  ];

  // 获取某一天的考试记录
  const getExamsForDate = (date: Dayjs) => {
    return examRecords.filter(record => {
      if (!record.exam_date) return false;
      const examDate = dayjs(record.exam_date);
      return examDate.isSame(date, 'day');
    });
  };

  // 根据分数获取颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success'; // 绿色
    if (score >= 60) return 'warning'; // 橙色
    return 'error'; // 红色
  };

  // 日历单元格渲染
  const dateCellRender = (date: Dayjs) => {
    const exams = getExamsForDate(date);
    if (exams.length === 0) return null;

    return (
      <ul className="space-y-1">
        {exams.map(exam => (
          <li key={exam.id}>
            <Tooltip title={`${exam.exam_name || `第${exam.index_number}期`} - ${exam.total_score}分`}>
              <Badge 
                status={getScoreColor(exam.total_score || 0)} 
                text={
                  <span 
                    className="text-xs cursor-pointer hover:underline"
                    onClick={() => navigate(`/exam/${exam.id}`)}
                  >
                    {exam.exam_name || `第${exam.index_number}期`}
                  </span>
                }
              />
            </Tooltip>
          </li>
        ))}
      </ul>
    );
  };

  // 导出为 Excel
  const handleExportExcel = () => {
    try {
      // 准备导出数据
      const exportData: any[] = [];
      
      // 添加表头行
      const headerRow: any = { '模块名称': '模块名称' };
      allExamNumbers.forEach(examNum => {
        // 查找对应的考试记录获取考试名称
        const examRecord = examRecords.find(r => r.index_number === examNum);
        const examName = examRecord?.exam_name || `第${examNum}期`;
        
        headerRow[`${examName}_题目数`] = '题目数';
        headerRow[`${examName}_答对数`] = '答对数';
        headerRow[`${examName}_正确率`] = '正确率';
        headerRow[`${examName}_用时`] = '用时(分钟)';
      });
      exportData.push(headerRow);
      
      // 添加数据行
      const addRowData = (record: TableDataType, isChild = false) => {
        const rowData: any = {
          '模块名称': isChild ? `  ${record.module_name}` : record.module_name
        };
        
        allExamNumbers.forEach(examNum => {
          const examData = record.exams.get(examNum);
          const examRecord = examRecords.find(r => r.index_number === examNum);
          const examName = examRecord?.exam_name || `第${examNum}期`;
          
          if (examData) {
            rowData[`${examName}_题目数`] = examData.total_questions;
            rowData[`${examName}_答对数`] = examData.correct_answers;
            rowData[`${examName}_正确率`] = `${examData.accuracy.toFixed(1)}%`;
            
            // 只有大模块显示用时
            if (!isChild && record.children && record.children.length > 0) {
              rowData[`${examName}_用时`] = (examData.time_used / 60).toFixed(1);
            } else {
              rowData[`${examName}_用时`] = '-';
            }
          } else {
            rowData[`${examName}_题目数`] = '-';
            rowData[`${examName}_答对数`] = '-';
            rowData[`${examName}_正确率`] = '-';
            rowData[`${examName}_用时`] = '-';
          }
        });
        
        exportData.push(rowData);
      };
      
      // 遍历所有模块数据
      tableDataWithTotal.forEach(module => {
        // 添加主模块
        addRowData(module);
        
        // 添加子模块
        if (module.children && module.children.length > 0 && module.key !== 'total') {
          module.children.forEach(child => {
            addRowData(child, true);
          });
        }
      });
      
      // 创建工作表
      const ws = XLSX.utils.json_to_sheet(exportData, { skipHeader: true });
      
      // 设置列宽
      const colWidths = [{ wch: 20 }]; // 模块名称列
      allExamNumbers.forEach(() => {
        colWidths.push({ wch: 10 }); // 题目数
        colWidths.push({ wch: 10 }); // 答对数
        colWidths.push({ wch: 12 }); // 正确率
        colWidths.push({ wch: 12 }); // 用时
      });
      ws['!cols'] = colWidths;
      
      // 创建工作簿
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '模块详细数据');
      
      // 生成文件名（包含当前日期）
      const date = new Date().toISOString().split('T')[0];
      const fileName = `考试成绩模块详细数据_${date}.xlsx`;
      
      // 导出文件
      XLSX.writeFile(wb, fileName);
      
      message.success('导出成功！');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败，请重试');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Row gutter={[16, 16]} className="mb-8">
          {[...Array(4)].map((_, i) => (
            <Col key={i} xs={24} sm={12} lg={6}>
              <Card loading>
                <Skeleton active />
              </Card>
            </Col>
          ))}
        </Row>
        <Row gutter={[16, 16]}>
          {[...Array(3)].map((_, i) => (
            <Col key={i} xs={24} md={12}>
              <Card loading>
                <Skeleton active paragraph={{ rows: 8 }} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  if (examRecords.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          
            <p className="text-muted-foreground mb-4">暂无考试记录</p>
            <a href="/upload" className="text-primary hover:underline">
              立即上传第一份成绩
            </a>
          </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="考试次数"
              value={stats.totalExams}
              suffix="次"
              prefix={<TrophyOutlined />}
            />
            <div className="text-xs text-gray-500 mt-2">累计考试次数</div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均分"
              value={stats.averageScore}
              suffix="分"
              prefix={<RiseOutlined />}
            />
            <div className="text-xs text-gray-500 mt-2">所有考试平均分</div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="最高分"
              value={stats.highestScore}
              suffix="分"
              prefix={<AimOutlined />}
            />
            <div className="text-xs text-gray-500 mt-2">历史最高分数</div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均用时"
              value={stats.averageTime}
              suffix="分钟"
              prefix={<ClockCircleOutlined />}
            />
            <div className="text-xs text-gray-500 mt-2">平均答题时长</div>
          </Card>
        </Col>
      </Row>

      {/* 考试日历 */}
      <Row gutter={[16, 16]} className="mt-8">
        <Col xs={24}>
          <Card 
            title="考试日历"
            extra={
              <div className="flex items-center gap-4 text-xs">
                <span><Badge status="success" /> 80分以上</span>
                <span><Badge status="warning" /> 60-79分</span>
                <span><Badge status="error" /> 60分以下</span>
              </div>
            }
          >
            <Calendar 
              dateCellRender={dateCellRender}
              className="exam-calendar"
            />
          </Card>
        </Col>
      </Row>

      {/* 图表 */}
      <Row gutter={[16, 16]} className="mt-8">
        <Col xs={24}>
          <Card 
            title="总分趋势"
            extra={<span className="text-sm text-gray-500">查看历次考试总分变化</span>}
          >
            <ReactECharts 
              option={scoreTrendOption} 
              style={{ height: isMobile ? '300px' : '400px' }} 
            />
          </Card>
        </Col>

        {/* 模块趋势图独占一行 */}
        <Col xs={24}>
          <Card
            title="模块趋势"
            extra={<span className="text-sm text-gray-500">查看各模块正确率变化</span>}
          >
            <ReactECharts 
              option={moduleTrendOption} 
              style={{ height: isMobile ? '350px' : '450px' }} 
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="模块平均正确率"
            extra={<span className="text-sm text-gray-500">各模块平均表现</span>}
          >
            <ReactECharts 
              option={moduleAvgOption} 
              style={{ height: isMobile ? '300px' : '400px' }} 
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="得分分布"
            extra={<span className="text-sm text-gray-500">各分数段分布情况</span>}
          >
            <ReactECharts 
              option={scoreDistributionOption} 
              style={{ height: isMobile ? '300px' : '400px' }} 
            />
          </Card>
        </Col>
      </Row>

      {/* 模块详细统计表格 - 独立展示，占满屏幕宽度 */}
      <div className="mt-8">
        <Card 
          title="历次考试各模块详细数据表"
          extra={
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">查看所有考试的详细模块数据</span>
              <Button 
                type="primary" 
                icon={<DownloadOutlined />}
                onClick={handleExportExcel}
                size="middle"
              >
                导出Excel
              </Button>
            </div>
          }
        >
          <Table
            columns={columns}
            dataSource={tableDataWithTotal}
            pagination={false}
            size="middle"
            bordered
            scroll={{ x: 'max-content' }}
            rowClassName={(record, index) => {
              // 总计行使用特殊样式
              if (record.key === 'total') {
                return 'bg-muted/50';
              }
              // 斑马线样式：偶数行使用浅色背景
              return index % 2 === 0 ? '' : 'bg-muted/30';
            }}
            expandable={{
              defaultExpandAllRows: false,
              rowExpandable: (record) => record.key !== 'total' && (record.children?.length || 0) > 0,
            }}
          />
        </Card>
      </div>
    </div>
  );
}
