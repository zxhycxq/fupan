import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { Table, Card, Skeleton, Statistic, Row, Col, Button, message, Calendar, Badge, Tooltip, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { RiseOutlined, ClockCircleOutlined, AimOutlined, TrophyOutlined, DownloadOutlined } from '@ant-design/icons';
import { getAllExamRecords, getModuleAverageScores, getModuleTrendData, getModuleTimeTrendData, getModuleDetailedStats, getUserSettings, getExamConfig } from '@/db/api';
import type { ExamRecord, UserSetting } from '@/types';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { Lunar, Solar } from 'lunar-typescript';
import { DASHBOARD_GRADIENTS, generateGradientStyle } from '@/config/gradients';

// 扩展dayjs
dayjs.extend(dayOfYear);

// 励志古诗词数组
const MOTIVATIONAL_POEMS = [
  '长风破浪会有时，直挂云帆济沧海。',
  '千淘万漉虽辛苦，吹尽狂沙始到金。',
  '大鹏一日同风起，扶摇直上九万里。',
  '千磨万击还坚劲，任尔东西南北风。',
  '功崇惟志，业广于勤。',
  '为有牺牲多壮志，敢教日月换新天。',
  '少年负壮气，奋烈自有时。',
  '苔花如米小，也学牡丹开。',
  '空谈误国，实干兴邦。',
  '自信人生二百年，会当水击三千里。',
  '路漫漫其修远兮，吾将上下而求索。',
  '不经一番寒彻骨，怎得梅花扑鼻香。',
  '人生在勤，勤则不匮。',
  '臣心一片磁针石，不指南方不肯休。',
  '时人不识凌云木，直待凌云始道高。',
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [examRecords, setExamRecords] = useState<ExamRecord[]>([]);
  const [moduleAvgScores, setModuleAvgScores] = useState<{ module_name: string; avg_accuracy: number }[]>([]);
  const [moduleTrendData, setModuleTrendData] = useState<{
    exam_numbers: number[];
    exam_names?: string[]; // 添加考试名称数组
    exam_dates?: (string | null)[]; // 添加考试日期数组
    modules: { module_name: string; data: (number | null)[] }[];
  }>({ exam_numbers: [], exam_names: [], exam_dates: [], modules: [] });
  const [moduleTimeTrendData, setModuleTimeTrendData] = useState<{
    exam_numbers: number[];
    exam_names?: string[];
    exam_dates?: (string | null)[];
    modules: { module_name: string; data: (number | null)[] }[];
  }>({ exam_numbers: [], exam_names: [], exam_dates: [], modules: [] });
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
  const [examConfig, setExamConfig] = useState<{ exam_type?: string; exam_date?: string } | null>(null);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number } | null>(null);
  const [todayPoem, setTodayPoem] = useState<string>('');
  const [calendarValue, setCalendarValue] = useState<Dayjs>(dayjs()); // 日历当前显示的月份

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
      const [records, avgScores, trendData, timeTrendData, detailedStats, settings, config] = await Promise.all([
        getAllExamRecords(),
        getModuleAverageScores(),
        getModuleTrendData(),
        getModuleTimeTrendData(),
        getModuleDetailedStats(),
        getUserSettings('default'),
        getExamConfig(),
      ]);
      
      console.log('=== Dashboard 数据加载完成 ===');
      console.log('考试记录数量:', records.length);
      console.log('考试记录列表:', records.map(r => `索引${r.sort_order} - ${r.exam_name}`).join(', '));
      
      console.log('\n模块详细统计数量:', detailedStats.length);
      const statsExamNumbers = Array.from(new Set(detailedStats.map(s => s.exam_number))).sort((a, b) => a - b);
      console.log('有模块数据的考试期数:', statsExamNumbers.join(', '));
      
      const recordIndexNumbers = records.map(r => r.sort_order).sort((a, b) => a - b);
      const missingIndexNumbers = recordIndexNumbers.filter(idx => !statsExamNumbers.includes(idx));
      if (missingIndexNumbers.length > 0) {
        console.warn('⚠️ 警告：以下考试记录没有模块数据:', missingIndexNumbers.join(', '));
        missingIndexNumbers.forEach(idx => {
          const record = records.find(r => r.sort_order === idx);
          console.warn(`  - 索引${idx}: ${record?.exam_name}, 考试日期: ${record?.exam_date || '无'}`);
        });
      }
      
      setExamRecords(records);
      setModuleAvgScores(avgScores);
      setModuleTrendData(trendData);
      setModuleTimeTrendData(timeTrendData);
      setModuleDetailedStats(detailedStats);
      setUserSettings(settings);
      
      // 设置考试配置（倒计时会在useEffect中自动计算）
      if (config && config.exam_type && config.exam_date) {
        setExamConfig(config);
      }
      
      // 设置今日古诗词（基于日期）
      const dayOfYear = dayjs().dayOfYear();
      const poemIndex = dayOfYear % MOTIVATIONAL_POEMS.length;
      setTodayPoem(MOTIVATIONAL_POEMS[poemIndex]);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 计算倒计时（精确到时、分）
  const calculateCountdown = (examDate: string) => {
    const now = new Date();
    const exam = new Date(examDate);
    exam.setHours(9, 0, 0, 0); // 假设考试时间为上午9点
    
    const diff = exam.getTime() - now.getTime();
    
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown({ days, hours, minutes });
    } else {
      setCountdown({ days: 0, hours: 0, minutes: 0 });
    }
  };

  // 定时更新倒计时
  useEffect(() => {
    if (examConfig?.exam_date) {
      // 立即计算一次最新值
      calculateCountdown(examConfig.exam_date);
      
      // 设置定时器每分钟更新
      const timer = setInterval(() => {
        calculateCountdown(examConfig.exam_date!);
      }, 60000); // 每分钟更新一次

      return () => clearInterval(timer);
    }
  }, [examConfig?.exam_date]); // 依赖于exam_date而不是整个examConfig对象

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
      bottom: isMobile ? '15%' : '12%', // 增加底部空间以容纳旋转的标签
      top: isMobile ? 50 : 60,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: examRecords.map(r => {
        const date = r.exam_date || '';
        const name = r.exam_name || `第${r.exam_number}期`;
        return date ? `${date} ${name}` : name;
      }),
      axisLabel: {
        fontSize: isMobile ? 10 : 12,
        rotate: 45, // 始终旋转标签以完整显示
        interval: 0, // 显示所有标签
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
      bottom: isMobile ? '15%' : '12%', // 增加底部空间以容纳旋转的标签
      top: isMobile ? 70 : 80,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: ['5%', '5%'], // 左右留间隙
      data: moduleTrendData.exam_dates && moduleTrendData.exam_names 
        ? moduleTrendData.exam_dates.map((date, idx) => {
            const name = moduleTrendData.exam_names?.[idx] || `第${moduleTrendData.exam_numbers[idx]}次`;
            return date ? `${date} ${name}` : name;
          })
        : moduleTrendData.exam_numbers.map(n => `第${n}次`),
      name: '考试',
      nameTextStyle: {
        fontSize: isMobile ? 10 : 12,
      },
      axisLabel: {
        fontSize: isMobile ? 10 : 12,
        rotate: 45, // 始终旋转标签以完整显示
        interval: 0, // 显示所有标签
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

  // 模块用时趋势图配置
  const moduleTimeTrendOption = {
    title: {
      text: '各模块用时趋势',
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
        let result = `${examNumber}<br/>`;
        params.forEach((param: any) => {
          if (param.value !== null && param.value !== undefined) {
            result += `${param.marker}${param.seriesName}: ${param.value}分钟<br/>`;
          }
        });
        return result;
      },
    },
    legend: {
      data: moduleTimeTrendData.modules.map(m => m.module_name),
      top: 30,
      type: 'scroll',
      textStyle: {
        fontSize: isMobile ? 10 : 12,
      },
    },
    grid: {
      left: isMobile ? '8%' : '5%',
      right: isMobile ? '8%' : '5%',
      bottom: isMobile ? '15%' : '12%', // 增加底部空间以容纳旋转的标签
      top: isMobile ? 70 : 80,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: ['5%', '5%'],
      data: moduleTimeTrendData.exam_dates && moduleTimeTrendData.exam_names 
        ? moduleTimeTrendData.exam_dates.map((date, idx) => {
            const name = moduleTimeTrendData.exam_names?.[idx] || `第${moduleTimeTrendData.exam_numbers[idx]}次`;
            return date ? `${date} ${name}` : name;
          })
        : moduleTimeTrendData.exam_numbers.map(n => `第${n}次`),
      name: '考试',
      nameTextStyle: {
        fontSize: isMobile ? 10 : 12,
      },
      axisLabel: {
        fontSize: isMobile ? 10 : 12,
        rotate: 45, // 始终旋转标签以完整显示
        interval: 0, // 显示所有标签
      },
    },
    yAxis: {
      type: 'value',
      name: '用时(m)',
      min: 0,
      nameTextStyle: {
        fontSize: isMobile ? 10 : 12,
      },
      axisLabel: {
        fontSize: isMobile ? 10 : 12,
        formatter: '{value}',
      },
    },
    series: moduleTimeTrendData.modules.map((module, index) => ({
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

  // 平均分仪表盘配置
  const averageScoreGaugeOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 10,
        axisLine: {
          lineStyle: {
            width: 20,
            color: [
              [0.6, '#5DADE2'], // 0-60分：蓝色
              [0.8, '#48C9B0'], // 60-80分：青色
              [1, '#EC7063']    // 80-100分：红色
            ]
          }
        },
        pointer: {
          itemStyle: {
            color: 'auto'
          },
          width: 5,
          length: '70%'
        },
        axisTick: {
          distance: -20,
          length: 8,
          lineStyle: {
            color: '#fff',
            width: 2
          }
        },
        splitLine: {
          distance: -20,
          length: 15,
          lineStyle: {
            color: '#fff',
            width: 3
          }
        },
        axisLabel: {
          color: 'inherit',
          distance: 25,
          fontSize: isMobile ? 10 : 12
        },
        detail: {
          valueAnimation: true,
          formatter: '{value} 分',
          color: 'inherit',
          fontSize: isMobile ? 20 : 28,
          offsetCenter: [0, '70%']
        },
        title: {
          offsetCenter: [0, '90%'],
          fontSize: isMobile ? 12 : 14,
          color: '#666'
        },
        data: [
          {
            value: stats.averageScore,
            name: '平均分'
          }
        ]
      }
    ]
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
  const allExamNumbers = examRecords.map(r => r.sort_order).sort((a, b) => a - b);

  // 创建考试信息映射（期数 -> {名称, 日期}）
  const examInfoMap = new Map<number, { name: string; date: string | null }>();
  examRecords.forEach(record => {
    examInfoMap.set(record.sort_order, {
      name: record.exam_name || `第${record.sort_order}期`,
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

  // 创建汇总统计行
  const summaryRows: TableDataType[] = [
    {
      key: 'summary_time',
      module_name: '总时长',
      exams: new Map(
        allExamNumbers.map(examNum => {
          const examData = totalRow.exams.get(examNum);
          return [examNum, {
            exam_number: examNum,
            total_questions: 0,
            correct_answers: 0,
            accuracy: 0,
            time_used: examData?.time_used || 0,
          }];
        })
      ),
    },
    {
      key: 'summary_correct',
      module_name: '总答对',
      exams: new Map(
        allExamNumbers.map(examNum => {
          const examData = totalRow.exams.get(examNum);
          return [examNum, {
            exam_number: examNum,
            total_questions: 0,
            correct_answers: examData?.correct_answers || 0,
            accuracy: 0,
            time_used: 0,
          }];
        })
      ),
    },
    {
      key: 'summary_total',
      module_name: '总题量',
      exams: new Map(
        allExamNumbers.map(examNum => {
          const examData = totalRow.exams.get(examNum);
          return [examNum, {
            exam_number: examNum,
            total_questions: examData?.total_questions || 0,
            correct_answers: 0,
            accuracy: 0,
            time_used: 0,
          }];
        })
      ),
    },
    {
      key: 'summary_accuracy',
      module_name: '总正确率',
      exams: new Map(
        allExamNumbers.map(examNum => {
          const examData = totalRow.exams.get(examNum);
          return [examNum, {
            exam_number: examNum,
            total_questions: 0,
            correct_answers: 0,
            accuracy: examData?.accuracy || 0,
            time_used: 0,
          }];
        })
      ),
    },
    {
      key: 'summary_score',
      module_name: '得分',
      exams: new Map(
        allExamNumbers.map(examNum => {
          const exam = examRecords.find(r => r.sort_order === examNum);
          return [examNum, {
            exam_number: examNum,
            total_questions: 0,
            correct_answers: 0,
            accuracy: exam?.total_score || 0, // 使用accuracy字段存储得分
            time_used: 0,
          }];
        })
      ),
    },
  ];

  // 将汇总统计行添加到表格数据
  const tableDataWithSummary = [...tableDataWithTotal, ...summaryRows];

  // 定义表格列 - 使用分组表头
  const columns: ColumnsType<TableDataType> = [
    {
      title: '模块名称',
      dataIndex: 'module_name',
      key: 'module_name',
      fixed: 'left',
      width: 150,
      render: (text: string, record: TableDataType) => {
        // 总计行加粗
        if (record.key === 'total') {
          return <strong>{text}</strong>;
        }
        // 汇总统计行特殊样式
        if (record.key?.startsWith('summary_')) {
          return <strong className="text-blue-600 dark:text-blue-400">{text}</strong>;
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
          title: '题目数/答对数',
          key: `exam_${examNum}_questions_correct`,
          width: 120,
          align: 'center' as const,
          onCell: (record: TableDataType) => {
            // 汇总行合并3列
            if (record.key?.startsWith('summary_')) {
              return { colSpan: 3 };
            }
            return {};
          },
          render: (_: any, record: TableDataType) => {
            const examData = record.exams.get(examNum);
            if (!examData) {
              return <span className="text-muted-foreground">-</span>;
            }
            
            // 汇总统计行特殊处理 - 合并单元格后显示对应的汇总数据
            if (record.key === 'summary_time') {
              // 总时长
              const minutes = (examData.time_used / 60).toFixed(1);
              return <strong className="text-blue-600 dark:text-blue-400">{minutes}分</strong>;
            }
            if (record.key === 'summary_correct') {
              // 总答对
              return <strong className="text-blue-600 dark:text-blue-400">{examData.correct_answers}</strong>;
            }
            if (record.key === 'summary_total') {
              // 总题量
              return <strong className="text-blue-600 dark:text-blue-400">{examData.total_questions}</strong>;
            }
            if (record.key === 'summary_accuracy') {
              // 总正确率
              return <strong className="text-blue-600 dark:text-blue-400">{examData.accuracy.toFixed(1)}%</strong>;
            }
            if (record.key === 'summary_score') {
              // 得分
              return <strong className="text-lg text-green-600 dark:text-green-400">{examData.accuracy.toFixed(2)}</strong>;
            }
            
            const content = `${examData.total_questions}/${examData.correct_answers}`;
            return record.key === 'total' ? <strong>{content}</strong> : content;
          },
        },
        {
          title: '正确率',
          key: `exam_${examNum}_accuracy`,
          width: 90,
          align: 'center' as const,
          onCell: (record: TableDataType) => {
            // 汇总行隐藏此列（已被第一列合并）
            if (record.key?.startsWith('summary_')) {
              return { colSpan: 0 };
            }
            return {};
          },
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
          onCell: (record: TableDataType) => {
            // 汇总行隐藏此列（已被第一列合并）
            if (record.key?.startsWith('summary_')) {
              return { colSpan: 0 };
            }
            return {};
          },
          render: (_: any, record: TableDataType) => {
            // 只显示大模块（没有children或者是总计行）的用时
            if (record.children && record.children.length > 0 && record.key !== 'total') {
              const examData = record.exams.get(examNum);
              if (!examData) {
                return <span className="text-muted-foreground">-</span>;
              }
              // 将秒转换为分钟，保留1位小数
              const minutes = (examData.time_used / 60).toFixed(1);
              const content = `${minutes}m`;
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
            <Tooltip title={`${exam.exam_name || `第${exam.sort_order}期`} - ${exam.total_score}分`}>
              <Badge 
                status={getScoreColor(exam.total_score || 0)} 
                text={
                  <span 
                    className="text-xs cursor-pointer hover:underline"
                    onClick={() => navigate(`/exam/${exam.id}`)}
                  >
                    {exam.exam_name || `第${exam.sort_order}期`}
                  </span>
                }
              />
            </Tooltip>
          </li>
        ))}
      </ul>
    );
  };

  // 获取农历信息
  const getLunarInfo = (date: Dayjs) => {
    const solar = Solar.fromYmd(date.year(), date.month() + 1, date.date());
    const lunar = solar.getLunar();
    return lunar.getDayInChinese();
  };

  // 获取农历月份信息
  const getLunarMonthInfo = (date: Dayjs) => {
    const solar = Solar.fromYmd(date.year(), date.month() + 1, 1);
    const lunar = solar.getLunar();
    return lunar.getMonthInChinese() + '月';
  };

  // 完整日期单元格渲染（包含农历）
  const fullCellRender = (date: Dayjs) => {
    const exams = getExamsForDate(date);
    const lunarDay = getLunarInfo(date);
    const isWeekend = date.day() === 0 || date.day() === 6; // 0是周日，6是周六
    
    return (
      <div className="h-full flex flex-col">
        <div className="text-right pr-2 pt-1">
          <div className={`text-sm ${isWeekend ? 'text-red-500' : ''}`}>{date.date()}</div>
          <div className="text-xs text-gray-400">{lunarDay}</div>
        </div>
        {exams.length > 0 && (
          <ul className="mt-1 space-y-1 px-2 pb-1">
            {exams.map(exam => (
              <li key={exam.id}>
                <Tooltip title={`${exam.exam_name || `第${exam.sort_order}期`} - ${exam.total_score}分`}>
                  <Badge 
                    status={getScoreColor(exam.total_score || 0)} 
                    text={
                      <span 
                        className="text-xs cursor-pointer hover:underline"
                        onClick={() => navigate(`/exam/${exam.id}`)}
                      >
                        {exam.exam_name || `第${exam.sort_order}期`}
                      </span>
                    }
                  />
                </Tooltip>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  // 统一单元格渲染（根据模式判断）
  const cellRender = (current: Dayjs, info: { originNode: React.ReactElement; today: Dayjs; type: string }) => {
    if (info.type === 'date') {
      // 月视图 - 只显示当前月份的日期
      // 如果日期不属于当前显示的月份，返回null（不显示）
      const currentMonth = calendarValue.month();
      const currentYear = calendarValue.year();
      
      if (current.month() !== currentMonth || current.year() !== currentYear) {
        return null;
      }
      
      return fullCellRender(current);
    } else if (info.type === 'month') {
      // 年视图 - 显示月份
      const month = current.month() + 1;
      const lunarMonth = getLunarMonthInfo(current);
      
      // 获取该月的所有考试
      const monthExams = examRecords.filter(exam => {
        if (!exam.exam_date) return false;
        const examDate = dayjs(exam.exam_date);
        return examDate.year() === current.year() && examDate.month() === current.month();
      });

      return (
        <div className="h-full p-2">
          <div className="text-center mb-2">
            <div className="text-base font-medium">{month}月</div>
            <div className="text-xs text-gray-400">（{lunarMonth}）</div>
          </div>
          {monthExams.length > 0 && (
            <ul className="space-y-1">
              {monthExams.map(exam => (
                <li key={exam.id}>
                  <Tooltip title={`${exam.exam_name || `第${exam.sort_order}期`} - ${exam.total_score}分`}>
                    <Badge 
                      status={getScoreColor(exam.total_score || 0)} 
                      text={
                        <span 
                          className="text-xs cursor-pointer hover:underline"
                          onClick={() => navigate(`/exam/${exam.id}`)}
                        >
                          {dayjs(exam.exam_date).format('MM-DD')} {exam.exam_name || `第${exam.sort_order}期`}
                        </span>
                      }
                    />
                  </Tooltip>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    return info.originNode;
  };

  // 自定义日历头部
  const headerRender = ({ value, type, onChange, onTypeChange }: any) => {
    const year = value.year();
    const month = value.month();
    const monthOptions = [];
    
    for (let i = 0; i < 12; i++) {
      monthOptions.push(
        <Select.Option key={i} value={i}>
          {i + 1}月
        </Select.Option>
      );
    }

    const yearOptions = [];
    const currentYear = dayjs().year();
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      yearOptions.push(
        <Select.Option key={i} value={i}>
          {i}年
        </Select.Option>
      );
    }

    return (
      <div className="flex justify-end items-center px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
        <div className="flex gap-2 items-center">
          <Select
            value={year}
            onChange={(newYear) => {
              const now = value.clone().year(newYear);
              onChange(now);
              setCalendarValue(now); // 更新日历显示的月份
            }}
            className="w-24"
          >
            {yearOptions}
          </Select>
          <Select
            value={month}
            onChange={(newMonth) => {
              const now = value.clone().month(newMonth);
              onChange(now);
              setCalendarValue(now); // 更新日历显示的月份
            }}
            className="w-20"
          >
            {monthOptions}
          </Select>
          <Button
            type={type === 'month' ? 'primary' : 'default'}
            onClick={() => onTypeChange('month')}
          >
            月
          </Button>
          <Button
            type={type === 'year' ? 'primary' : 'default'}
            onClick={() => onTypeChange('year')}
          >
            年
          </Button>
        </div>
      </div>
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
        const examRecord = examRecords.find(r => r.sort_order === examNum);
        const examName = examRecord?.exam_name || `第${examNum}期`;
        
        headerRow[`${examName}_题目数/答对数`] = '题目数/答对数';
        headerRow[`${examName}_正确率`] = '正确率';
        headerRow[`${examName}_用时`] = '用时(m)';
      });
      exportData.push(headerRow);
      
      // 添加数据行
      const addRowData = (record: TableDataType, isChild = false) => {
        const rowData: any = {
          '模块名称': isChild ? `  ${record.module_name}` : record.module_name
        };
        
        allExamNumbers.forEach(examNum => {
          const examData = record.exams.get(examNum);
          const examRecord = examRecords.find(r => r.sort_order === examNum);
          const examName = examRecord?.exam_name || `第${examNum}期`;
          
          if (examData) {
            rowData[`${examName}_题目数/答对数`] = `${examData.total_questions}/${examData.correct_answers}`;
            rowData[`${examName}_正确率`] = `${examData.accuracy.toFixed(1)}%`;
            
            // 只有大模块显示用时
            if (!isChild && record.children && record.children.length > 0) {
              rowData[`${examName}_用时`] = (examData.time_used / 60).toFixed(1);
            } else {
              rowData[`${examName}_用时`] = '-';
            }
          } else {
            rowData[`${examName}_题目数/答对数`] = '-';
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
        colWidths.push({ wch: 15 }); // 题目数/答对数
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
      {/* 倒计时和加油站 */}
      {examConfig && countdown && (
        <Row gutter={[16, 16]} className="mb-6">
          {/* 考试倒计时 */}
          <Col xs={24} md={12}>
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-4">
                <div className="text-4xl">📅</div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {examConfig.exam_type}倒计时
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {countdown.days > 0 ? (
                      <>
                        <span className="text-3xl">{countdown.days}</span> 天 
                        <span className="text-xl ml-2">{countdown.hours}</span> 时 
                        <span className="text-xl ml-1">{countdown.minutes}</span> 分
                      </>
                    ) : countdown.hours > 0 || countdown.minutes > 0 ? (
                      <>
                        <span className="text-3xl">{countdown.hours}</span> 时 
                        <span className="text-xl ml-2">{countdown.minutes}</span> 分
                      </>
                    ) : (
                      <span className="text-xl">考试进行中</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          {/* 加油站 */}
          <Col xs={24} md={12}>
            <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-800/20 border-orange-200 dark:border-orange-700">
              <div className="flex items-center gap-4">
                <div className="text-4xl">💪</div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    今日加油站
                  </div>
                  <div className="text-base font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                    {todayPoem}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* 平均分仪表盘和统计卡片 */}
      <Row gutter={[16, 16]} className="mb-8">
        {/* 左侧：平均分仪表盘 */}
        <Col xs={24} lg={8}>
          <Card className="h-full flex items-center justify-center p-2">
            <ReactECharts
              option={averageScoreGaugeOption}
              style={{ height: isMobile ? '300px' : '360px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>

        {/* 右侧：统计卡片（两行两列） */}
        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            {/* 第一行 */}
            <Col xs={24} sm={12}>
              <Card 
                className="stat-card stat-card-primary" 
                style={{ background: generateGradientStyle(DASHBOARD_GRADIENTS[0]) }}
              >
                <Statistic
                  title={<span className="stat-title text-gray-700 dark:text-gray-200">考试次数</span>}
                  value={stats.totalExams}
                  suffix="次"
                  prefix={<TrophyOutlined className="stat-icon text-purple-600 dark:text-purple-300" />}
                  valueStyle={{ color: '#374151' }}
                />
                <div className="text-xs opacity-70 mt-2 text-gray-600 dark:text-gray-300">累计考试次数</div>
              </Card>
            </Col>

            <Col xs={24} sm={12}>
              <Card 
                className="stat-card stat-card-success"
                style={{ background: generateGradientStyle(DASHBOARD_GRADIENTS[1]) }}
              >
                <Statistic
                  title={<span className="stat-title text-gray-700 dark:text-gray-200">平均分</span>}
                  value={stats.averageScore}
                  suffix="分"
                  prefix={<RiseOutlined className="stat-icon text-orange-600 dark:text-orange-300" />}
                  valueStyle={{ color: '#374151' }}
                />
                <div className="text-xs opacity-70 mt-2 text-gray-600 dark:text-gray-300">所有考试平均分</div>
              </Card>
            </Col>

            {/* 第二行 */}
            <Col xs={24} sm={12}>
              <Card 
                className="stat-card stat-card-warning"
                style={{ background: generateGradientStyle(DASHBOARD_GRADIENTS[2]) }}
              >
                <Statistic
                  title={<span className="stat-title text-gray-700 dark:text-gray-200">最高分</span>}
                  value={stats.highestScore}
                  suffix="分"
                  prefix={<AimOutlined className="stat-icon text-blue-600 dark:text-blue-300" />}
                  valueStyle={{ color: '#374151' }}
                />
                <div className="text-xs opacity-70 mt-2 text-gray-600 dark:text-gray-300">历史最高分数</div>
              </Card>
            </Col>

            <Col xs={24} sm={12}>
              <Card 
                className="stat-card stat-card-info"
                style={{ background: generateGradientStyle(DASHBOARD_GRADIENTS[3]) }}
              >
                <Statistic
                  title={<span className="stat-title text-gray-700 dark:text-gray-200">平均用时</span>}
                  value={stats.averageTime}
                  suffix="分钟"
                  prefix={<ClockCircleOutlined className="stat-icon text-yellow-600 dark:text-yellow-300" />}
                  valueStyle={{ color: '#374151' }}
                />
                <div className="text-xs opacity-70 mt-2 text-gray-600 dark:text-gray-300">平均答题时长</div>
              </Card>
            </Col>
          </Row>
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
            className="calendar-card"
          >
            <Calendar 
              cellRender={cellRender}
              headerRender={headerRender}
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

        {/* 模块正确率趋势图独占一行 */}
        <Col xs={24}>
          <Card
            title="各模块正确率趋势"
            extra={<span className="text-sm text-gray-500">查看各模块正确率变化</span>}
          >
            <ReactECharts 
              option={moduleTrendOption} 
              style={{ height: isMobile ? '350px' : '450px' }} 
            />
          </Card>
        </Col>

        {/* 模块用时趋势图独占一行 */}
        <Col xs={24}>
          <Card
            title="各模块用时趋势"
            extra={<span className="text-sm text-gray-500">查看各模块用时变化</span>}
          >
            <ReactECharts 
              option={moduleTimeTrendOption} 
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
            dataSource={tableDataWithSummary}
            pagination={false}
            size="middle"
            bordered
            scroll={{ x: 'max-content' }}
            rowClassName={(record, index) => {
              // 总计行使用特殊样式
              if (record.key === 'total') {
                return 'bg-muted/50';
              }
              // 汇总统计行使用特殊样式
              if (record.key?.startsWith('summary_')) {
                // 得分行使用绿色背景
                if (record.key === 'summary_score') {
                  return 'bg-green-50 dark:bg-green-900/20';
                }
                // 其他汇总行使用蓝色背景
                return 'bg-blue-50 dark:bg-blue-900/20';
              }
              // 斑马线样式：偶数行使用浅色背景
              return index % 2 === 0 ? '' : 'bg-muted/30';
            }}
            expandable={{
              defaultExpandAllRows: false,
              rowExpandable: (record) => record.key !== 'total' && !record.key?.startsWith('summary_') && (record.children?.length || 0) > 0,
            }}
          />
          
          {/* 原来的独立汇总统计表格 - 保留注释以备后用 */}
          {/* <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300 min-w-[150px]">
                    考试期数
                  </th>
                  {allExamNumbers.map(examNum => {
                    const examInfo = examInfoMap.get(examNum);
                    const examName = examInfo?.name || `第${examNum}期`;
                    return (
                      <th key={examNum} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300 min-w-[120px]">
                        {examName}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium text-gray-700 dark:text-gray-300">
                    总时长
                  </td>
                  {allExamNumbers.map(examNum => {
                    const examData = totalRow.exams.get(examNum);
                    const minutes = examData ? (examData.time_used / 60).toFixed(1) : '0.0';
                    return (
                      <td key={examNum} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-gray-800 dark:text-gray-200">
                        {minutes}分
                      </td>
                    );
                  })}
                </tr>
                
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium text-gray-700 dark:text-gray-300">
                    总答对
                  </td>
                  {allExamNumbers.map(examNum => {
                    const examData = totalRow.exams.get(examNum);
                    return (
                      <td key={examNum} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-gray-800 dark:text-gray-200">
                        {examData?.correct_answers || 0}
                      </td>
                    );
                  })}
                </tr>
                
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium text-gray-700 dark:text-gray-300">
                    总题量
                  </td>
                  {allExamNumbers.map(examNum => {
                    const examData = totalRow.exams.get(examNum);
                    return (
                      <td key={examNum} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-gray-800 dark:text-gray-200">
                        {examData?.total_questions || 0}
                      </td>
                    );
                  })}
                </tr>
                
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium text-gray-700 dark:text-gray-300">
                    总正确率
                  </td>
                  {allExamNumbers.map(examNum => {
                    const examData = totalRow.exams.get(examNum);
                    const accuracy = examData?.accuracy || 0;
                    return (
                      <td key={examNum} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-gray-800 dark:text-gray-200">
                        {accuracy.toFixed(1)}%
                      </td>
                    );
                  })}
                </tr>
                
                <tr className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/30 dark:hover:to-green-800/30">
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    得分
                  </td>
                  {allExamNumbers.map(examNum => {
                    const exam = examRecords.find(r => r.sort_order === examNum);
                    const score = exam?.total_score || 0;
                    return (
                      <td key={examNum} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center font-semibold text-lg text-green-600 dark:text-green-400">
                        {score.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div> */}
        </Card>
      </div>
    </div>
  );
}
