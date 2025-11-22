import { supabase } from './supabase';
import type { ExamRecord, ModuleScore, ExamRecordDetail, UserSetting } from '@/types';

// 获取所有考试记录
export async function getAllExamRecords(): Promise<ExamRecord[]> {
  const { data, error } = await supabase
    .from('exam_records')
    .select('*')
    .order('exam_number', { ascending: true });

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
