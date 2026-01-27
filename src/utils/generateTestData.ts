import type { ExamRecord, ModuleScore } from '@/types';

// 模块配置
const MODULE_CONFIG = {
  '政治理论': {
    subModules: ['马克思主义', '新思想', '时事政治'],
    totalQuestions: 20,
    avgCorrectRate: 0.75,
  },
  '常识判断': {
    subModules: ['经济常识', '科技常识', '人文常识', '地理国情', '法律常识'],
    totalQuestions: 15,
    avgCorrectRate: 0.47,
  },
  '言语理解与表达': {
    subModules: ['逻辑填空', '片段阅读', '语句表达'],
    totalQuestions: 30,
    avgCorrectRate: 0.77,
  },
  '数量关系': {
    subModules: [
      '数学运算',
      '工程问题',
      '最值问题',
      '牛吃草问题',
      '周期问题',
      '和差倍比问题',
      '数列问题',
      '行程问题',
      '几何问题',
      '容斥原理问题',
      '排列组合问题',
      '概率问题',
      '经济利润问题',
      '函数最值问题',
      '钟表问题'
    ],
    totalQuestions: 15,
    avgCorrectRate: 0.27,
  },
  '判断推理': {
    subModules: ['图形推理', '定义判断', '类比推理', '逻辑判断'],
    totalQuestions: 35,
    avgCorrectRate: 0.71,
  },
  '资料分析': {
    subModules: ['文字资料', '综合资料', '简单计算', '基期与现期', '增长率', '增长量', '比重问题', '平均数问题'],
    totalQuestions: 20,
    avgCorrectRate: 0.35,
  },
};

// 生成随机数(在范围内)
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成随机正确率(基于平均值波动)
function randomCorrectRate(avgRate: number, variance: number = 0.15): number {
  const rate = avgRate + (Math.random() - 0.5) * variance * 2;
  return Math.max(0, Math.min(1, rate));
}

// 生成单个模块的得分数据
function generateModuleScore(
  examRecordId: string,
  moduleName: string,
  config: typeof MODULE_CONFIG[keyof typeof MODULE_CONFIG],
  examNumber: number
): ModuleScore[] {
  const scores: ModuleScore[] = [];
  const totalQuestions = config.totalQuestions;
  
  // 根据考试期数调整难度(后期考试正确率略有提升)
  const progressFactor = Math.min(examNumber * 0.02, 0.1);
  
  // 生成主模块数据
  const correctRate = randomCorrectRate(config.avgCorrectRate + progressFactor);
  const correctCount = Math.round(totalQuestions * correctRate);
  const wrongCount = totalQuestions - correctCount;
  const timeUsed = randomInRange(
    Math.floor(totalQuestions * 0.8),
    Math.floor(totalQuestions * 1.5)
  );

  scores.push({
    id: crypto.randomUUID(),
    exam_record_id: examRecordId,
    module_name: moduleName,
    parent_module: undefined,
    total_questions: totalQuestions,
    correct_answers: correctCount,
    wrong_answers: wrongCount,
    unanswered: 0,
    accuracy_rate: correctRate,
    time_used: timeUsed,
    created_at: new Date().toISOString(),
  });

  // 生成子模块数据
  const subModules = config.subModules;
  const questionsPerSub = Math.floor(totalQuestions / subModules.length);
  
  subModules.forEach((subModule, index) => {
    const isLast = index === subModules.length - 1;
    const subQuestions = isLast 
      ? totalQuestions - questionsPerSub * (subModules.length - 1)
      : questionsPerSub;
    
    const subCorrectRate = randomCorrectRate(config.avgCorrectRate + progressFactor, 0.2);
    const subCorrect = Math.round(subQuestions * subCorrectRate);
    const subWrong = subQuestions - subCorrect;
    const subTime = randomInRange(
      Math.floor(subQuestions * 0.8),
      Math.floor(subQuestions * 1.5)
    );

    scores.push({
      id: crypto.randomUUID(),
      exam_record_id: examRecordId,
      module_name: subModule,
      parent_module: moduleName,
      total_questions: subQuestions,
      correct_answers: subCorrect,
      wrong_answers: subWrong,
      unanswered: 0,
      accuracy_rate: subCorrectRate,
      time_used: subTime,
      created_at: new Date().toISOString(),
    });
  });

  return scores;
}

// 生成单次考试记录
export function generateExamRecord(examNumber: number): {
  examRecord: Omit<ExamRecord, 'id' | 'created_at'>;
  moduleScores: Omit<ModuleScore, 'exam_record_id'>[];
} {
  const examId = crypto.randomUUID();
  
  // 计算总分和总用时
  let totalScore = 0;
  let totalTime = 0;
  const allModuleScores: ModuleScore[] = [];

  Object.entries(MODULE_CONFIG).forEach(([moduleName, config]) => {
    const moduleScores = generateModuleScore(examId, moduleName, config, examNumber);
    allModuleScores.push(...moduleScores);
    
    // 只计算主模块的分数和时间
    const mainModule = moduleScores[0];
    totalScore += mainModule.correct_answers;
    totalTime += mainModule.time_used || 0;
  });

  const examRecord: Omit<ExamRecord, 'id' | 'created_at'> = {
    exam_number: examNumber,
    exam_name: `第${examNumber}期`,
    index_number: examNumber, // 索引项，用于排序
    sort_order: examNumber,
    rating: 0,
    total_score: totalScore,
    time_used: totalTime,
    updated_at: new Date().toISOString(),
  };

  return {
    examRecord,
    moduleScores: allModuleScores.map(({ exam_record_id, ...rest }) => rest),
  };
}

// 生成多次考试记录
export function generateMultipleExamRecords(count: number): {
  examRecords: Omit<ExamRecord, 'id' | 'created_at'>[];
  moduleScoresMap: Map<number, Omit<ModuleScore, 'exam_record_id'>[]>;
} {
  const examRecords: Omit<ExamRecord, 'id' | 'created_at'>[] = [];
  const moduleScoresMap = new Map<number, Omit<ModuleScore, 'exam_record_id'>[]>();

  for (let i = 1; i <= count; i++) {
    const { examRecord, moduleScores } = generateExamRecord(i);
    examRecords.push(examRecord);
    moduleScoresMap.set(i, moduleScores);
  }

  return { examRecords, moduleScoresMap };
}

// 生成统计分析数据
export function generateAnalysisData(examRecords: ExamRecord[], moduleScores: ModuleScore[]) {
  // 按模块分组
  const moduleGroups = new Map<string, ModuleScore[]>();
  
  moduleScores.forEach(score => {
    if (!score.parent_module) { // 只统计主模块
      const key = score.module_name;
      if (!moduleGroups.has(key)) {
        moduleGroups.set(key, []);
      }
      moduleGroups.get(key)!.push(score);
    }
  });

  // 计算每个模块的平均正确率
  const moduleAvgRates = new Map<string, number>();
  moduleGroups.forEach((scores, moduleName) => {
    const avgRate = scores.reduce((sum, s) => sum + (s.accuracy_rate || 0), 0) / scores.length;
    moduleAvgRates.set(moduleName, avgRate);
  });

  // 找出弱势模块(正确率低于50%)
  const weakModules = Array.from(moduleAvgRates.entries())
    .filter(([_, rate]) => rate < 0.5)
    .sort((a, b) => a[1] - b[1])
    .map(([name, rate]) => ({ name, rate }));

  // 计算总分趋势
  const scoreTrend = examRecords.map(record => ({
    examNumber: record.exam_number,
    score: record.total_score,
  }));

  // 计算各模块趋势
  const moduleTrends = new Map<string, { examNumber: number; rate: number }[]>();
  moduleGroups.forEach((scores, moduleName) => {
    const trend = scores.map(score => {
      const exam = examRecords.find(e => e.id === score.exam_record_id);
      return {
        examNumber: exam?.exam_number || 0,
        rate: score.accuracy_rate || 0,
      };
    }).sort((a, b) => a.examNumber - b.examNumber);
    moduleTrends.set(moduleName, trend);
  });

  return {
    moduleAvgRates,
    weakModules,
    scoreTrend,
    moduleTrends,
  };
}
