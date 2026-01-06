import { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Skeleton, Button, Tooltip, Modal } from 'antd';
import { FullscreenOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { supabase } from '@/db/supabase';
import type { ExamRecord } from '@/types';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import { getSeriesStyle, LEGEND_CONFIG, TOOLTIP_CONFIG } from '@/config/chartStyles';
import { MODULE_CONFIG, SUB_MODULE_COLORS, type ModuleConfig } from '@/config/moduleConfig';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export default function ModuleAnalysis() {
  const [examRecords, setExamRecords] = useState<ExamRecord[]>([]); // 考试记录列表
  const [isLoading, setIsLoading] = useState(true); // 加载状态
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null); // 日期范围筛选
  const [isMobile, setIsMobile] = useState(false); // 是否为移动端
  const [showLandscapeModal, setShowLandscapeModal] = useState<{
    visible: boolean;
    title: string;
    moduleName: string;
  }>({
    visible: false,
    title: '',
    moduleName: '',
  });

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  /**
   * 加载各模块分析页面所需的考试记录数据
   * @description 从数据库加载所有考试记录，并过滤出参与统计的记录
   */
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // 获取所有考试记录
      const { data: allExams, error: examsError } = await supabase
        .from('exam_records')
        .select('*')
        .order('sort_order', { ascending: true });

      if (examsError) throw examsError;
      
      // 【重要】过滤出参与统计的记录（include_in_stats !== false）
      // 只有参与统计的记录才会在各模块分析中显示和计算
      const exams = (allExams || []).filter(record => record.include_in_stats !== false);
      
      setExamRecords(exams);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 根据日期范围过滤考试记录
  const filteredExamRecords = useMemo(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return examRecords;
    }
    
    const [startDate, endDate] = dateRange;
    return examRecords.filter(record => {
      // 如果没有exam_date，使用created_at作为默认日期
      const dateToUse = record.exam_date || record.created_at;
      if (!dateToUse) {
        console.warn('考试记录没有日期信息:', record);
        return false;
      }
      const examDate = dayjs(dateToUse);
      const isInRange = examDate.isSameOrAfter(startDate, 'day') && examDate.isSameOrBefore(endDate, 'day');
      
      // 添加调试日志
      if (!isInRange) {
        console.log('考试记录不在日期范围内:', {
          exam_name: record.exam_name,
          exam_date: record.exam_date,
          created_at: record.created_at,
          dateToUse,
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
        });
      }
      
      return isInRange;
    });
  }, [examRecords, dateRange]);

  // 获取模块趋势数据
  const getModuleTrendData = async (parentModule: string, subModules: string[], filteredRecords: ExamRecord[]) => {
    try {
      // 如果没有过滤后的记录，返回空数据
      if (filteredRecords.length === 0) {
        return {
          examNumbers: [],
          examNames: [],
          examDates: [],
          series: subModules.map(name => ({ name, data: [] }))
        };
      }

      // 获取过滤后的考试记录的 ID 列表
      const filteredExamIds = filteredRecords.map(r => r.id);

      // 如果没有考试记录，直接返回空数据
      if (filteredExamIds.length === 0) {
        return {
          examNumbers: [],
          examNames: [],
          examDates: [],
          series: subModules.map(name => ({ name, data: [] }))
        };
      }

      // 获取所有模块分数记录，只查询过滤后的考试
      const { data: moduleScores, error } = await supabase
        .from('module_scores')
        .select(`
          id,
          module_name,
          parent_module,
          total_questions,
          correct_answers,
          accuracy_rate,
          exam_record_id,
          exam_records!inner(
            id,
            sort_order,
            exam_name,
            exam_date
          )
        `)
        .in('module_name', subModules)
        .in('exam_record_id', filteredExamIds)
        .order('exam_records(sort_order)', { ascending: true });

      if (error) {
        console.error('查询模块分数失败:', error);
        throw error;
      }

      console.log('查询到的模块分数数据:', moduleScores);
      console.log('过滤后的考试记录数:', filteredRecords.length);
      console.log('查询到的模块分数记录数:', moduleScores?.length || 0);

      // 检查哪些考试记录没有模块数据
      const examIdsWithModuleScores = new Set(moduleScores?.map((s: any) => s.exam_record_id) || []);
      const examRecordsWithoutModuleScores = filteredRecords.filter(r => !examIdsWithModuleScores.has(r.id));
      
      if (examRecordsWithoutModuleScores.length > 0) {
        console.warn('以下考试记录没有模块数据:', examRecordsWithoutModuleScores.map(r => ({
          id: r.id,
          exam_name: r.exam_name,
          sort_order: r.sort_order
        })));
      }

      // 按考试期数分组
      const examMap = new Map<number, { exam_name?: string; exam_date?: string | null; modules: Map<string, number> }>();
      
      moduleScores?.forEach((score: any) => {
        const examNumber = score.exam_records.sort_order;
        const examName = score.exam_records.exam_name;
        const examDate = score.exam_records.exam_date;
        
        if (!examMap.has(examNumber)) {
          examMap.set(examNumber, { exam_name: examName, exam_date: examDate, modules: new Map() });
        }
        
        const examData = examMap.get(examNumber)!;
        
        // 使用accuracy_rate字段，如果没有则计算
        let accuracy = 0;
        if (score.accuracy_rate !== null && score.accuracy_rate !== undefined) {
          accuracy = Number(score.accuracy_rate);
        } else if (score.correct_answers && score.total_questions) {
          accuracy = (score.correct_answers / score.total_questions) * 100;
        }
        
        examData.modules.set(score.module_name, accuracy);
      });

      console.log('处理后的考试数据:', Array.from(examMap.entries()));

      // 转换为图表数据格式
      const examNumbers = Array.from(examMap.keys()).sort((a, b) => a - b);
      const examNames = examNumbers.map(num => examMap.get(num)?.exam_name || `第${num}期`);
      const examDates = examNumbers.map(num => examMap.get(num)?.exam_date || null);
      
      const series = subModules.map(moduleName => ({
        name: moduleName,
        data: examNumbers.map(num => {
          const accuracy = examMap.get(num)?.modules.get(moduleName);
          return accuracy !== undefined ? Number(accuracy.toFixed(1)) : null;
        })
      }));

      console.log('生成的图表数据:', { examNumbers, examNames, examDates, series });

      return { examNumbers, examNames, examDates, series };
    } catch (error) {
      console.error('获取模块趋势数据失败:', error);
      return { examNumbers: [], examNames: [], examDates: [], series: [] };
    }
  };

  // 生成图表配置
  const getChartOption = (
    title: string, 
    color: string,
    examNumbers: number[], 
    examNames: string[],
    examDates: (string | null)[],
    series: { name: string; data: (number | null)[] }[]
  ) => {
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const examIndex = params[0].dataIndex;
          const examName = examNames[examIndex] || `第${examNumbers[examIndex]}期`;
          let result = `<div style="font-weight: bold; margin-bottom: 8px;">${examName}</div>`;
          params.forEach((param: any) => {
            const value = param.value !== null && param.value !== undefined ? param.value : 0;
            result += `
              <div style="display: flex; align-items: center; margin: 4px 0;">
                <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
                <span style="flex: 1;">${param.seriesName}</span>
                <span style="font-weight: bold; margin-left: 12px;">${value}%</span>
              </div>
            `;
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
        data: examDates.map((date, idx) => {
          const name = examNames[idx] || `第${examNumbers[idx]}期`;
          return date ? `${name} ${date}` : name; // 调整格式：考试名称在前，日期在后
        }),
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
      series: series.map((s, index) => {
        const style = getSeriesStyle(index);
        return {
          name: s.name,
          type: 'line',
          data: s.data,
          smooth: true,
          ...style,
          connectNulls: false,
        };
      })
    };
  };

  // 渲染模块图表
  const ModuleChart = ({ config, filteredRecords, landscapeMode = false }: { config: typeof MODULE_CONFIG[0]; filteredRecords: ExamRecord[]; landscapeMode?: boolean }) => {
    const [chartData, setChartData] = useState<{
      examNumbers: number[];
      examNames: string[];
      examDates?: (string | null)[];
      series: { name: string; data: (number | null)[] }[];
    }>({ examNumbers: [], examNames: [], examDates: [], series: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadChartData = async () => {
        setLoading(true);
        const data = await getModuleTrendData(config.name, config.subModules, filteredRecords);
        setChartData(data);
        setLoading(false);
      };
      loadChartData();
    }, [config, filteredRecords]);

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
          chartData.examDates || [],
          chartData.series
        )}
        style={{ height: landscapeMode ? 'calc(100% - 60px)' : '400px' }}
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
        <p className="text-gray-500 mt-2">
          查看各个模块的正确率趋势变化
          <span className="text-orange-500 ml-2">
            （注意：仅显示包含模块数据的考试记录。如果某些考试记录未显示，请通过图片上传方式补充数据）
          </span>
        </p>
      </div>

      {/* 日期范围筛选器 */}
      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      <Row gutter={[16, 16]}>
        {MODULE_CONFIG.map((config) => (
          <Col xs={24} key={config.name}>
            <Card
              title={
                <div className="flex items-center justify-between">
                  <span>{config.name}</span>
                  {isMobile && (
                    <Tooltip title="横屏查看">
                      <Button
                        type="text"
                        icon={<FullscreenOutlined />}
                        onClick={() => setShowLandscapeModal({
                          visible: true,
                          title: config.name,
                          moduleName: config.name,
                        })}
                        className="flex items-center"
                      />
                    </Tooltip>
                  )}
                </div>
              }
            >
              <ModuleChart config={config} filteredRecords={filteredExamRecords} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 横屏查看弹窗 */}
      <Modal
        open={showLandscapeModal.visible}
        onCancel={() => setShowLandscapeModal({ visible: false, title: '', moduleName: '' })}
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
          <div className="w-full h-full p-4">
            <div className="text-xl font-bold mb-4 text-center">{showLandscapeModal.title}</div>
            {MODULE_CONFIG.filter(c => c.name === showLandscapeModal.moduleName).map(config => (
              <ModuleChart 
                key={config.name}
                config={config} 
                filteredRecords={filteredExamRecords}
                landscapeMode={true}
              />
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
