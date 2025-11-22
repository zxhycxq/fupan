import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Table, Card, Skeleton, Statistic, Row, Col } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { RiseOutlined, ClockCircleOutlined, AimOutlined, TrophyOutlined } from '@ant-design/icons';
import { getAllExamRecords, getModuleAverageScores, getModuleTrendData, getModuleDetailedStats, getUserSettings } from '@/db/api';
import type { ExamRecord, UserSetting } from '@/types';

export default function Dashboard() {
  const [examRecords, setExamRecords] = useState<ExamRecord[]>([]);
  const [moduleAvgScores, setModuleAvgScores] = useState<{ module_name: string; avg_accuracy: number }[]>([]);
  const [moduleTrendData, setModuleTrendData] = useState<{
    exam_numbers: number[];
    modules: { module_name: string; data: (number | null)[] }[];
  }>({ exam_numbers: [], modules: [] });
  const [moduleDetailedStats, setModuleDetailedStats] = useState<{
    exam_number: number;
    module_name: string;
    parent_module: string | null;
    total_questions: number;
    correct_answers: number;
    accuracy: number;
  }[]>([]);
  const [userSettings, setUserSettings] = useState<UserSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        fontSize: window.innerWidth < 640 ? 14 : 16,
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
      left: window.innerWidth < 640 ? '5%' : '3%',
      right: window.innerWidth < 640 ? '5%' : '4%',
      bottom: window.innerWidth < 640 ? '8%' : '3%',
      top: window.innerWidth < 640 ? 50 : 60,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: examRecords.map(r => `第${r.exam_number}期`),
      axisLabel: {
        fontSize: window.innerWidth < 640 ? 10 : 12,
      },
    },
    yAxis: {
      type: 'value',
      name: '分数',
      min: 0,
      max: 100,
      nameTextStyle: {
        fontSize: window.innerWidth < 640 ? 10 : 12,
      },
      axisLabel: {
        fontSize: window.innerWidth < 640 ? 10 : 12,
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
        fontSize: window.innerWidth < 640 ? 14 : 16,
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
      left: window.innerWidth < 640 ? '5%' : '3%',
      right: window.innerWidth < 640 ? '5%' : '4%',
      bottom: window.innerWidth < 640 ? '15%' : '10%',
      top: window.innerWidth < 640 ? 50 : 60,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: moduleAvgScores.map(m => m.module_name),
      axisLabel: {
        interval: 0,
        rotate: window.innerWidth < 640 ? 45 : 30,
        fontSize: window.innerWidth < 640 ? 10 : 12,
      },
    },
    yAxis: {
      type: 'value',
      name: '正确率(%)',
      min: 0,
      max: 100,
      nameTextStyle: {
        fontSize: window.innerWidth < 640 ? 10 : 12,
      },
      axisLabel: {
        fontSize: window.innerWidth < 640 ? 10 : 12,
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
        fontSize: window.innerWidth < 640 ? 14 : 16,
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
        fontSize: window.innerWidth < 640 ? 10 : 12,
      },
    },
    grid: {
      left: window.innerWidth < 640 ? '8%' : '5%',
      right: window.innerWidth < 640 ? '8%' : '5%',
      bottom: window.innerWidth < 640 ? '8%' : '3%',
      top: window.innerWidth < 640 ? 70 : 80,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: ['5%', '5%'], // 左右留间隙
      data: moduleTrendData.exam_numbers.map(n => `第${n}次`),
      name: '考试期数',
      nameTextStyle: {
        fontSize: window.innerWidth < 640 ? 10 : 12,
      },
      axisLabel: {
        fontSize: window.innerWidth < 640 ? 10 : 12,
      },
    },
    yAxis: {
      type: 'value',
      name: '正确率(%)',
      min: 0,
      max: 100,
      nameTextStyle: {
        fontSize: window.innerWidth < 640 ? 10 : 12,
      },
      axisLabel: {
        fontSize: window.innerWidth < 640 ? 10 : 12,
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
        fontSize: window.innerWidth < 640 ? 14 : 16,
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}<br/>${params.marker}${params.value}次 (${params.percent.toFixed(2)}%)`;
      },
    },
    legend: {
      orient: window.innerWidth < 640 ? 'horizontal' : 'vertical',
      left: window.innerWidth < 640 ? 'center' : 'left',
      top: window.innerWidth < 640 ? 'bottom' : 'middle',
      textStyle: {
        fontSize: window.innerWidth < 640 ? 10 : 12,
      },
    },
    series: [
      {
        name: '得分区间',
        type: 'pie',
        radius: window.innerWidth < 640 ? '45%' : '50%',
        center: window.innerWidth < 640 ? ['50%', '45%'] : ['50%', '50%'],
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
          fontSize: window.innerWidth < 640 ? 10 : 12,
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

  // 获取所有考试期数
  const allExamNumbers = Array.from(new Set(moduleDetailedStats.map(s => s.exam_number))).sort((a, b) => a - b);

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
    
    // 只统计主模块的数据
    tableData.forEach(module => {
      const examData = module.exams.get(examNum);
      if (examData) {
        totalQuestions += examData.total_questions;
        totalCorrect += examData.correct_answers;
      }
    });
    
    totalRow.exams.set(examNum, {
      exam_number: examNum,
      total_questions: totalQuestions,
      correct_answers: totalCorrect,
      accuracy: totalQuestions > 0 ? Number(((totalCorrect / totalQuestions) * 100).toFixed(2)) : 0,
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
    ...allExamNumbers.map(examNum => ({
      title: `第${examNum}期`,
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
      ],
    })),
  ];

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

      {/* 图表 */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card 
            title="总分趋势"
            extra={<span className="text-sm text-gray-500">查看历次考试总分变化</span>}
          >
            <ReactECharts 
              option={scoreTrendOption} 
              style={{ height: window.innerWidth < 640 ? '300px' : '400px' }} 
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
              style={{ height: window.innerWidth < 640 ? '350px' : '450px' }} 
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
              style={{ height: window.innerWidth < 640 ? '300px' : '400px' }} 
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="模块详细统计"
            extra={<span className="text-sm text-gray-500">最近考试各模块表现</span>}
          >
          
            <ReactECharts 
              option={scoreDistributionOption} 
              style={{ height: window.innerWidth < 640 ? '300px' : '400px' }} 
            />
          </Card>

        {/* 模块详细统计表格 */}
        <Card className="md:col-span-2">
          
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
        </Col>
      </Row>
    </div>
  );
}
