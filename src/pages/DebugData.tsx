import { useEffect, useState } from 'react';
import { Card, Button, Table } from 'antd';
import { supabase } from '@/db/supabase';

export default function DebugData() {
  const [examRecords, setExamRecords] = useState<any[]>([]);
  const [moduleScores, setModuleScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // 获取最新的5条考试记录
      const { data: exams, error: examsError } = await supabase
        .from('exam_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (examsError) throw examsError;
      setExamRecords(exams || []);

      // 获取这些记录的module_scores
      if (exams && exams.length > 0) {
        const examIds = exams.map(e => e.id);
        const { data: scores, error: scoresError } = await supabase
          .from('module_scores')
          .select('*')
          .in('exam_record_id', examIds);

        if (scoresError) throw scoresError;
        setModuleScores(scores || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const examColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
    { title: '考试名称', dataIndex: 'exam_name', key: 'exam_name' },
    { title: '考试日期', dataIndex: 'exam_date', key: 'exam_date' },
    { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 80 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  ];

  const scoreColumns = [
    { title: 'exam_record_id', dataIndex: 'exam_record_id', key: 'exam_record_id', width: 100 },
    { title: '模块名称', dataIndex: 'module_name', key: 'module_name' },
    { title: '父模块', dataIndex: 'parent_module', key: 'parent_module' },
    { title: '正确率', dataIndex: 'accuracy_rate', key: 'accuracy_rate', width: 100 },
  ];

  return (
    <div className="p-4">
      <Card title="数据调试工具" extra={<Button onClick={loadData} loading={loading}>刷新</Button>}>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">最新的5条考试记录</h3>
            <Table
              dataSource={examRecords}
              columns={examColumns}
              rowKey="id"
              pagination={false}
              scroll={{ x: 800 }}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">对应的模块分数记录</h3>
            <Table
              dataSource={moduleScores}
              columns={scoreColumns}
              rowKey="id"
              pagination={false}
              scroll={{ x: 800 }}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">统计信息</h3>
            <div className="space-y-2">
              <p>考试记录总数: {examRecords.length}</p>
              <p>模块分数记录总数: {moduleScores.length}</p>
              {examRecords.map(exam => {
                const count = moduleScores.filter(s => s.exam_record_id === exam.id).length;
                return (
                  <p key={exam.id}>
                    {exam.exam_name} ({exam.exam_date}): {count} 条模块数据
                    {count === 0 && <span className="text-red-500 ml-2">⚠️ 没有模块数据</span>}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
