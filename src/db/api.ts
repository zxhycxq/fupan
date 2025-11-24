import { supabase } from './supabase';
import type { ExamRecord, ModuleScore, ExamRecordDetail, UserSetting } from '@/types';

// 获取所有考试记录
export async function getAllExamRecords(): Promise<ExamRecord[]> {
  const { data, error } = await supabase
    .from('exam_records')
    .select('*')
    .order('index_number', { ascending: true });

  if (error) {
    console.error('获取考试记录失败:', error);
    throw error;
  }

  return Array.isArray(data) ? data : [];
}

// 根据ID获取考试记录详情
export async function getExamRecordById(id: string): Promise<ExamRecordDetail | null> {
  const { data: examData, error: examError } = await supabase
    .from('exam_records')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (examError) {
    console.error('获取考试记录失败:', examError);
    throw examError;
  }

  if (!examData) {
    return null;
  }

  const { data: moduleData, error: moduleError } = await supabase
    .from('module_scores')
    .select('*')
    .eq('exam_record_id', id)
    .order('module_name', { ascending: true });

  if (moduleError) {
    console.error('获取模块得分失败:', moduleError);
    throw moduleError;
  }

  return {
    ...examData,
    module_scores: Array.isArray(moduleData) ? moduleData : [],
  };
}

// 创建考试记录
export async function createExamRecord(
  record: Omit<ExamRecord, 'id' | 'created_at' | 'updated_at'>
): Promise<ExamRecord> {
  const { data, error } = await supabase
    .from('exam_records')
    .insert(record)
    .select()
    .maybeSingle();

  if (error) {
    console.error('创建考试记录失败:', error);
    throw error;
  }

  if (!data) {
    throw new Error('创建考试记录失败');
  }

  return data;
}

// 创建模块得分记录
export async function createModuleScores(
  scores: Omit<ModuleScore, 'id' | 'created_at'>[]
): Promise<ModuleScore[]> {
  const { data, error } = await supabase
    .from('module_scores')
    .insert(scores)
    .select();

  if (error) {
    console.error('创建模块得分失败:', error);
    throw error;
  }

  return Array.isArray(data) ? data : [];
}

// 更新考试记录
export async function updateExamRecord(
  id: string,
  updates: Partial<Omit<ExamRecord, 'id' | 'created_at' | 'updated_at'>>
): Promise<ExamRecord> {
  const { data, error } = await supabase
    .from('exam_records')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('更新考试记录失败:', error);
    throw error;
  }

  if (!data) {
    throw new Error('更新考试记录失败');
  }

  return data;
}

// 删除考试记录(级联删除模块得分)
export async function deleteExamRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from('exam_records')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('删除考试记录失败:', error);
    throw error;
  }
}

// 获取最近N次考试记录
export async function getRecentExamRecords(limit: number = 10): Promise<ExamRecord[]> {
  const { data, error } = await supabase
    .from('exam_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('获取最近考试记录失败:', error);
    throw error;
  }

  return Array.isArray(data) ? data : [];
}

// 获取指定考试记录的所有模块得分
export async function getModuleScoresByExamId(examId: string): Promise<ModuleScore[]> {
  const { data, error } = await supabase
    .from('module_scores')
    .select('*')
    .eq('exam_record_id', examId)
    .order('module_name', { ascending: true });

  if (error) {
    console.error('获取模块得分失败:', error);
    throw error;
  }

  return Array.isArray(data) ? data : [];
}

// 获取所有大模块的平均得分
export async function getModuleAverageScores(): Promise<{ module_name: string; avg_accuracy: number }[]> {
  const { data, error } = await supabase
    .from('module_scores')
    .select('module_name, accuracy_rate')
    .is('parent_module', null);

  if (error) {
    console.error('获取模块平均得分失败:', error);
    throw error;
  }

  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  // 计算每个模块的平均正确率
  const moduleMap = new Map<string, number[]>();
  
  for (const item of data) {
    if (item.accuracy_rate !== null && item.accuracy_rate !== undefined) {
      if (!moduleMap.has(item.module_name)) {
        moduleMap.set(item.module_name, []);
      }
      moduleMap.get(item.module_name)?.push(item.accuracy_rate);
    }
  }

  const result = Array.from(moduleMap.entries()).map(([module_name, rates]) => ({
    module_name,
    avg_accuracy: rates.reduce((sum, rate) => sum + rate, 0) / rates.length,
  }));

  return result;
}

// 获取模块趋势数据(按考试期数)
export async function getModuleTrendData(): Promise<{
  exam_numbers: number[];
  exam_names: string[];
  modules: { module_name: string; data: (number | null)[] }[];
}> {
  // 获取所有考试记录和模块得分
  const { data: examRecords, error: examError } = await supabase
    .from('exam_records')
    .select('id, exam_number, exam_name, index_number')
    .order('index_number', { ascending: true });

  if (examError) {
    console.error('获取考试记录失败:', examError);
    throw examError;
  }

  if (!Array.isArray(examRecords) || examRecords.length === 0) {
    return { exam_numbers: [], exam_names: [], modules: [] };
  }

  // 获取所有主模块得分
  const { data: moduleScores, error: moduleError } = await supabase
    .from('module_scores')
    .select('exam_record_id, module_name, accuracy_rate')
    .is('parent_module', null)
    .order('module_name', { ascending: true });

  if (moduleError) {
    console.error('获取模块得分失败:', moduleError);
    throw moduleError;
  }

  if (!Array.isArray(moduleScores)) {
    return { exam_numbers: [], exam_names: [], modules: [] };
  }

  // 构建数据结构
  const exam_numbers = examRecords.map(r => r.exam_number);
  const exam_names = examRecords.map(r => r.exam_name || `第${r.exam_number}期`);
  const moduleMap = new Map<string, Map<string, number>>();

  // 按模块名称和考试ID组织数据
  for (const score of moduleScores) {
    if (!moduleMap.has(score.module_name)) {
      moduleMap.set(score.module_name, new Map());
    }
    moduleMap.get(score.module_name)?.set(score.exam_record_id, score.accuracy_rate || 0);
  }

  // 转换为图表数据格式
  const modules = Array.from(moduleMap.entries()).map(([module_name, scoreMap]) => {
    const data = examRecords.map(exam => {
      const accuracy = scoreMap.get(exam.id);
      return accuracy !== undefined ? accuracy : null;
    });
    return { module_name, data };
  });

  return { exam_numbers, exam_names, modules };
}

// 更新模块得分
export async function updateModuleScore(
  id: string,
  updates: Partial<Omit<ModuleScore, 'id' | 'exam_record_id' | 'created_at'>>
): Promise<void> {
  const { error } = await supabase
    .from('module_scores')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('更新模块得分失败:', error);
    throw error;
  }
}

// 获取用户设置
export async function getUserSettings(userId: string = 'default'): Promise<UserSetting[]> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .order('module_name', { ascending: true });

  if (error) {
    console.error('获取用户设置失败:', error);
    throw error;
  }

  return Array.isArray(data) ? data : [];
}

// 更新或创建用户设置
export async function upsertUserSetting(
  userId: string = 'default',
  moduleName: string,
  targetAccuracy: number
): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        module_name: moduleName,
        target_accuracy: targetAccuracy,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,module_name',
      }
    );

  if (error) {
    console.error('更新用户设置失败:', error);
    throw error;
  }
}

// 批量更新用户设置
export async function batchUpsertUserSettings(
  settings: Array<{ module_name: string; target_accuracy: number }>,
  userId: string = 'default'
): Promise<void> {
  const records = settings.map((s) => ({
    user_id: userId,
    module_name: s.module_name,
    target_accuracy: s.target_accuracy,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('user_settings').upsert(records, {
    onConflict: 'user_id,module_name',
  });

  if (error) {
    console.error('批量更新用户设置失败:', error);
    throw error;
  }
}

// 获取考试配置
export async function getExamConfig(userId: string = 'default'): Promise<{ exam_type?: string; exam_date?: string } | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('exam_type, exam_date')
    .eq('user_id', userId)
    .not('exam_type', 'is', null)
    .maybeSingle();

  if (error) {
    console.error('获取考试配置失败:', error);
    return null;
  }

  return data;
}

// 保存考试配置
export async function saveExamConfig(
  examType: string,
  examDate: string,
  userId: string = 'default'
): Promise<void> {
  // 先获取一个现有的设置记录
  const { data: existingSetting } = await supabase
    .from('user_settings')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (existingSetting) {
    // 更新现有记录
    const { error } = await supabase
      .from('user_settings')
      .update({
        exam_type: examType,
        exam_date: examDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSetting.id);

    if (error) {
      console.error('更新考试配置失败:', error);
      throw error;
    }
  } else {
    // 创建新记录
    const { error } = await supabase.from('user_settings').insert({
      user_id: userId,
      module_name: '政治理论', // 默认模块
      target_accuracy: 80,
      exam_type: examType,
      exam_date: examDate,
    });

    if (error) {
      console.error('创建考试配置失败:', error);
      throw error;
    }
  }
}

// 获取所有模块和子模块的详细统计数据（按期数分组）
export async function getModuleDetailedStats(): Promise<{
  exam_number: number;
  module_name: string;
  parent_module: string | null;
  total_questions: number;
  correct_answers: number;
  accuracy: number;
}[]> {
  const { data, error } = await supabase
    .from('module_scores')
    .select(`
      exam_record_id,
      module_name,
      parent_module,
      total_questions,
      correct_answers,
      accuracy_rate,
      exam_records!inner(exam_number)
    `)
    .order('exam_records(exam_number)')
    .order('parent_module', { nullsFirst: true })
    .order('module_name');

  if (error) {
    console.error('获取模块详细统计失败:', error);
    throw error;
  }

  // 转换数据格式
  return (data || []).map(record => ({
    exam_number: (record.exam_records as any).exam_number,
    module_name: record.module_name,
    parent_module: record.parent_module,
    total_questions: record.total_questions,
    correct_answers: record.correct_answers,
    accuracy: record.accuracy_rate || 0,
  }));
}

// 更新考试记录的星级
export async function updateExamRating(id: string, rating: number): Promise<void> {
  // 验证星级范围
  if (rating < 0 || rating > 5) {
    throw new Error('星级必须在 0-5 之间');
  }

  const { error } = await supabase
    .from('exam_records')
    .update({ rating })
    .eq('id', id);

  if (error) {
    console.error('更新星级失败:', error);
    throw error;
  }
}

// 检查索引号是否已存在（排除指定ID）
export async function checkIndexNumberExists(
  indexNumber: number, 
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from('exam_records')
    .select('id')
    .eq('index_number', indexNumber);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('检查索引号失败:', error);
    throw error;
  }

  return data !== null;
}

// 更新考试记录的索引号
export async function updateExamIndexNumber(
  id: string, 
  indexNumber: number
): Promise<void> {
  // 验证索引号
  if (indexNumber < 1) {
    throw new Error('索引号必须大于 0');
  }

  // 检查索引号是否已被使用
  const exists = await checkIndexNumberExists(indexNumber, id);
  if (exists) {
    throw new Error('该索引号已被使用，请选择其他索引号');
  }

  const { error } = await supabase
    .from('exam_records')
    .update({ index_number: indexNumber })
    .eq('id', id);

  if (error) {
    console.error('更新索引号失败:', error);
    throw error;
  }
}

// 获取下一个可用的索引号
export async function getNextIndexNumber(): Promise<number> {
  const { data, error } = await supabase
    .from('exam_records')
    .select('index_number')
    .order('index_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('获取最大索引号失败:', error);
    throw error;
  }

  return data ? data.index_number + 1 : 1;
}

