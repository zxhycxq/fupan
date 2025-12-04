import { useEffect, useState } from 'react';
import { Card, Row, Col, Skeleton } from 'antd';
import ReactECharts from 'echarts-for-react';
import { supabase } from '@/db/supabase';
import type { ExamRecord } from '@/types';

// 模块配置：定义一级模块和二级模块
const MODULE_CONFIG = [
  {
    name: '常识判断',
    color: '#1890ff',
    subModules: ['地理国情', '法律常识', '经济常识', '科技常识', '人文常识']
  },
  {
    name: '判断推理',
    color: '#52c41a',
    subModules: ['图形推理', '定义判断', '类比推理', '逻辑判断']
  },
  {
    name: '数量关系',
    color: '#faad14',
    subModules: ['数学运算']
  },
  {
    name: '言语理解与表达',
    color: '#13c2c2',
    subModules: ['逻辑填空', '片段阅读', '语句表达']
  },
  {
    name: '政治理论',
    color: '#eb2f96',
    subModules: ['马克思主义', '理论与政策', '时政热点']
  },
  {
    name: '资料分析',
    color: '#722ed1',
    subModules: ['文字资料', '综合资料', '两单计算', '其期与现期', '增长率', '增长量', '比重问题', '平均数问题']
  }
];

export default function ModuleAnalysis() {
  const [examRecords, setExamRecords] = useState<ExamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // 获取所有考试记录
      const { data: exams, error: examsError } = await supabase
        .from('exam_records')
        .select('*')
        .order('index_number', { ascending: true });

      if (examsError) throw examsError;
      
      setExamRecords(exams || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取模块趋势数据
  const getModuleTrendData = async (parentModule: string, subModules: string[]) => {
    try {
      // 获取所有模块分数记录
      const { data: moduleScores, error } = await supabase
        .from('module_scores')
        .select(`
          *,
          exam_records!inner(index_number, exam_name)
        `)
        .in('module_name', subModules)
        .order('exam_records(index_number)', { ascending: true });

      if (error) throw error;

      // 按考试期数分组
      const examMap = new Map<number, { exam_name?: string; modules: Map<string, number> }>();
      
      moduleScores?.forEach((score: any) => {
        const examNumber = score.exam_records.index_number;
        const examName = score.exam_records.exam_name;
        
        if (!examMap.has(examNumber)) {
          examMap.set(examNumber, { exam_name: examName, modules: new Map() });
        }
        
        const examData = examMap.get(examNumber)!;
        const accuracy = score.correct_count && score.total_count 
          ? (score.correct_count / score.total_count) * 100 
          : 0;
        examData.modules.set(score.module_name, accuracy);
      });

      // 转换为图表数据格式
      const examNumbers = Array.from(examMap.keys()).sort((a, b) => a - b);
      const examNames = examNumbers.map(num => examMap.get(num)?.exam_name || `第${num}期`);
      
      const series = subModules.map(moduleName => ({
        name: moduleName,
        data: examNumbers.map(num => {
          const accuracy = examMap.get(num)?.modules.get(moduleName);
          return accuracy !== undefined ? Number(accuracy.toFixed(1)) : null;
        })
      }));

      return { examNumbers, examNames, series };
    } catch (error) {
      console.error('获取模块趋势数据失败:', error);
      return { examNumbers: [], examNames: [], series: [] };
    }
  };

  // 生成图表配置
  const getChartOption = (
    title: string, 
    color: string,
    examNumbers: number[], 
    examNames: string[],
    series: { name: string; data: (number | null)[] }[]
  ) => {
    return {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          color: color,
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const examIndex = params[0].dataIndex;
          const examName = examNames[examIndex] || `第${examNumbers[examIndex]}期`;
          let result = `<div style="font-weight: bold; margin-bottom: 8px;">${examName}</div>`;
          params.forEach((param: any) => {
            if (param.value !== null) {
              result += `
                <div style="display: flex; align-items: center; margin: 4px 0;">
                  <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
                  <span style="flex: 1;">${param.seriesName}</span>
                  <span style="font-weight: bold; margin-left: 12px;">${param.value}%</span>
                </div>
              `;
            }
          });
          return result;
        }
      },
      legend: {
        data: series.map(s => s.name),
        top: 40,
        type: 'scroll'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 100,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: examNumbers.map(num => `第${num}期`),
        axisLabel: {
          rotate: 45,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        name: '正确率(%)',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: series.map((s, index) => ({
        name: s.name,
        type: 'line',
        data: s.data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2
        },
        itemStyle: {
          color: generateColor(color, index, series.length)
        },
        connectNulls: false
      }))
    };
  };

  // 根据基础颜色生成渐变色
  const generateColor = (baseColor: string, index: number, total: number) => {
    // 简单的颜色变化逻辑
    const colors = [
      baseColor,
      adjustColor(baseColor, 20),
      adjustColor(baseColor, -20),
      adjustColor(baseColor, 40),
      adjustColor(baseColor, -40),
      adjustColor(baseColor, 60),
      adjustColor(baseColor, -60),
      adjustColor(baseColor, 80)
    ];
    return colors[index % colors.length];
  };

  // 调整颜色亮度
  const adjustColor = (color: string, amount: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  // 渲染模块图表
  const ModuleChart = ({ config }: { config: typeof MODULE_CONFIG[0] }) => {
    const [chartData, setChartData] = useState<{
      examNumbers: number[];
      examNames: string[];
      series: { name: string; data: (number | null)[] }[];
    }>({ examNumbers: [], examNames: [], series: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadChartData = async () => {
        setLoading(true);
        const data = await getModuleTrendData(config.name, config.subModules);
        setChartData(data);
        setLoading(false);
      };
      loadChartData();
    }, [config]);

    if (loading) {
      return <Skeleton active />;
    }

    if (chartData.examNumbers.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          暂无数据
        </div>
      );
    }

    return (
      <ReactECharts
        option={getChartOption(
          config.name,
          config.color,
          chartData.examNumbers,
          chartData.examNames,
          chartData.series
        )}
        style={{ height: '400px' }}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton active />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">各模块分析</h1>
        <p className="text-gray-500 mt-2">查看各个模块的正确率趋势变化</p>
      </div>

      <Row gutter={[16, 16]}>
        {MODULE_CONFIG.map((config) => (
          <Col xs={24} key={config.name}>
            <Card>
              <ModuleChart config={config} />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
