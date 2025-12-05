import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('=== 检查索引号21的考试记录 ===');
  
  // 查询考试记录
  const { data: examRecords, error: examError } = await supabase
    .from('exam_records')
    .select('*')
    .eq('index_number', 21)
    .order('created_at', { ascending: false });
  
  if (examError) {
    console.error('查询考试记录失败:', examError);
    return;
  }
  
  console.log(`找到 ${examRecords?.length || 0} 条记录`);
  
  if (examRecords && examRecords.length > 0) {
    examRecords.forEach((record, index) => {
      console.log(`\n记录 ${index + 1}:`);
      console.log('ID:', record.id);
      console.log('名称:', record.exam_name);
      console.log('索引号:', record.index_number);
      console.log('总分:', record.total_score);
      console.log('用时(秒):', record.time_used);
      console.log('创建时间:', record.created_at);
    });
    
    // 查询第一条记录的模块得分
    const examId = examRecords[0].id;
    console.log(`\n=== 查询考试ID ${examId} 的模块得分 ===`);
    
    const { data: moduleScores, error: moduleError } = await supabase
      .from('module_scores')
      .select('*')
      .eq('exam_record_id', examId)
      .order('created_at', { ascending: true });
    
    if (moduleError) {
      console.error('查询模块得分失败:', moduleError);
      return;
    }
    
    console.log(`找到 ${moduleScores?.length || 0} 个模块`);
    
    if (moduleScores && moduleScores.length > 0) {
      moduleScores.forEach((module, index) => {
        console.log(`\n模块 ${index + 1}:`);
        console.log('模块名:', module.module_name);
        console.log('父模块:', module.parent_module);
        console.log('总题数:', module.total_questions);
        console.log('答对:', module.correct_answers);
        console.log('答错:', module.wrong_answers);
        console.log('正确率:', module.accuracy_rate);
        console.log('用时(秒):', module.time_used);
      });
    } else {
      console.log('没有找到模块得分数据！');
    }
  } else {
    console.log('没有找到索引号为21的考试记录');
  }
}

checkData().catch(console.error);
