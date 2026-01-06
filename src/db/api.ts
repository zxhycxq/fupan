import { supabase } from './supabase';
import type { ExamRecord, ModuleScore, ExamRecordDetail, UserSetting } from '@/types';

// 获取所有考试记录
export async function getAllExamRecords(): Promise<ExamRecord[]> {
  try {
    const { data, error } = await supabase
      .from('exam_records')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('获取考试记录失败:', error);
      throw error;
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('获取考试记录异常:', error);
    // 返回空数组而不是抛出错误，避免页面崩溃
    return [];
  }
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
  exam_dates: (string | null)[];
  modules: { module_name: string; data: (number | null)[] }[];
}> {
  // 获取所有考试记录和模块得分
  const { data: examRecords, error: examError } = await supabase
    .from('exam_records')
    .select('id, exam_number, exam_name, exam_date, sort_order')
    .order('sort_order', { ascending: true });

  if (examError) {
    console.error('获取考试记录失败:', examError);
    throw examError;
  }

  if (!Array.isArray(examRecords) || examRecords.length === 0) {
    return { exam_numbers: [], exam_names: [], exam_dates: [], modules: [] };
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
    return { exam_numbers: [], exam_names: [], exam_dates: [], modules: [] };
  }

  // 构建数据结构
  const exam_numbers = examRecords.map(r => r.exam_number);
  const exam_names = examRecords.map(r => r.exam_name || `第${r.exam_number}期`);
  const exam_dates = examRecords.map(r => r.exam_date);
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

  return { exam_numbers, exam_names, exam_dates, modules };
}

// 获取模块用时趋势数据
export async function getModuleTimeTrendData(): Promise<{
  exam_numbers: number[];
  exam_names: string[];
  exam_dates: (string | null)[];
  modules: { module_name: string; data: (number | null)[] }[];
}> {
  // 获取所有考试记录
  const { data: examRecords, error: examError } = await supabase
    .from('exam_records')
    .select('id, exam_number, exam_name, exam_date, sort_order')
    .order('sort_order', { ascending: true });

  if (examError) {
    console.error('获取考试记录失败:', examError);
    throw examError;
  }

  if (!Array.isArray(examRecords) || examRecords.length === 0) {
    return { exam_numbers: [], exam_names: [], exam_dates: [], modules: [] };
  }

  // 获取所有主模块的用时数据
  const { data: moduleScores, error: moduleError } = await supabase
    .from('module_scores')
    .select('exam_record_id, module_name, time_used')
    .is('parent_module', null)
    .order('module_name', { ascending: true });

  if (moduleError) {
    console.error('获取模块用时失败:', moduleError);
    throw moduleError;
  }

  if (!Array.isArray(moduleScores)) {
    return { exam_numbers: [], exam_names: [], exam_dates: [], modules: [] };
  }

  // 构建数据结构
  const exam_numbers = examRecords.map(r => r.exam_number);
  const exam_names = examRecords.map(r => r.exam_name || `第${r.exam_number}期`);
  const exam_dates = examRecords.map(r => r.exam_date);
  const moduleMap = new Map<string, Map<string, number>>();

  // 按模块名称和考试ID组织数据，将秒转换为分钟
  for (const score of moduleScores) {
    if (!moduleMap.has(score.module_name)) {
      moduleMap.set(score.module_name, new Map());
    }
    // 将秒转换为分钟，保留1位小数
    const timeInMinutes = score.time_used ? Math.round(score.time_used / 60 * 10) / 10 : 0;
    moduleMap.get(score.module_name)?.set(score.exam_record_id, timeInMinutes);
  }

  // 转换为图表数据格式
  const modules = Array.from(moduleMap.entries()).map(([module_name, timeMap]) => {
    const data = examRecords.map(exam => {
      const time = timeMap.get(exam.id);
      return time !== undefined ? time : null;
    });
    return { module_name, data };
  });

  return { exam_numbers, exam_names, exam_dates, modules };
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
export async function getExamConfig(): Promise<{ exam_type?: string; exam_name?: string; exam_date?: string; grade_label_theme?: string } | null> {
  const { data, error } = await supabase
    .from('exam_config')
    .select('exam_type, exam_name, exam_date, grade_label_theme')
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
  gradeLabelTheme: string = 'theme4',
  examName: string = ''
): Promise<void> {
  // 尝试获取现有配置
  const { data: existingConfig } = await supabase
    .from('exam_config')
    .select('id')
    .maybeSingle();

  if (existingConfig) {
    // 更新现有记录
    const { error } = await supabase
      .from('exam_config')
      .update({
        exam_type: examType,
        exam_name: examName,
        exam_date: examDate,
        grade_label_theme: gradeLabelTheme,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingConfig.id);

    if (error) {
      console.error('更新考试配置失败:', error);
      throw error;
    }
  } else {
    // 创建新记录
    const { error } = await supabase.from('exam_config').insert({
      exam_type: examType,
      exam_name: examName,
      exam_date: examDate,
      grade_label_theme: gradeLabelTheme,
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
  exam_name: string;
  exam_date: string | null;
  module_name: string;
  parent_module: string | null;
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  time_used: number; // 用时（秒）
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
      time_used,
      exam_records!inner(sort_order, exam_name, exam_date)
    `)
    .order('exam_records(sort_order)')
    .order('parent_module', { nullsFirst: true })
    .order('module_name');

  if (error) {
    console.error('获取模块详细统计失败:', error);
    throw error;
  }

  // 转换数据格式，使用 sort_order 作为 exam_number
  return (data || []).map(record => ({
    exam_number: (record.exam_records as any).sort_order,
    exam_name: (record.exam_records as any).exam_name || '',
    exam_date: (record.exam_records as any).exam_date || null,
    module_name: record.module_name,
    parent_module: record.parent_module,
    total_questions: record.total_questions,
    correct_answers: record.correct_answers,
    accuracy: record.accuracy_rate || 0,
    time_used: record.time_used || 0,
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

/**
 * 更新考试记录的参与统计状态
 * @param id 考试记录ID
 * @param includeInStats 是否参与统计（true=参与，false=不参与）
 * @description 更新 exam_records 表的 include_in_stats 字段
 * @description 影响数据总览和各模块分析页面的统计结果
 * @throws 更新失败时抛出错误
 */
export async function updateExamIncludeInStats(id: string, includeInStats: boolean): Promise<void> {
  const { error } = await supabase
    .from('exam_records')
    .update({ include_in_stats: includeInStats })
    .eq('id', id);

  if (error) {
    console.error('更新参与统计状态失败:', error);
    throw error;
  }
}

// 获取下一个可用的排序号
export async function getNextSortOrder(): Promise<number> {
  const { data, error } = await supabase
    .from('exam_records')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('获取最大排序号失败:', error);
    throw error;
  }

  return data ? data.sort_order + 1 : 1;
}

// 获取下一个可用的索引号（用于 index_number 字段）
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

// 更新考试记录的备注（进步和错误）
export async function updateExamNotes(
  id: string, 
  improvements: string, 
  mistakes: string
): Promise<void> {
  console.log('更新备注 - ID:', id);
  console.log('更新备注 - improvements:', improvements);
  console.log('更新备注 - mistakes:', mistakes);
  
  const { data, error } = await supabase
    .from('exam_records')
    .update({ 
      improvements,
      mistakes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('更新备注失败 - 错误详情:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`更新备注失败: ${error.message}`);
  }
  
  console.log('更新备注成功 - 返回数据:', data);
}

// 删除所有用户数据
export async function deleteAllUserData(): Promise<void> {
  // 删除所有模块成绩
  const { error: scoresError } = await supabase
    .from('module_scores')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (scoresError) {
    console.error('删除模块成绩失败:', scoresError);
    throw scoresError;
  }

  // 删除所有考试记录
  const { error: recordsError } = await supabase
    .from('exam_records')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (recordsError) {
    console.error('删除考试记录失败:', recordsError);
    throw recordsError;
  }

  // 删除所有用户设置
  const { error: settingsError } = await supabase
    .from('user_settings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (settingsError) {
    console.error('删除用户设置失败:', settingsError);
    throw settingsError;
  }

  // 删除考试配置
  const { error: configError } = await supabase
    .from('exam_config')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (configError) {
    console.error('删除考试配置失败:', configError);
    throw configError;
  }

  // 清空localStorage
  localStorage.clear();
}

