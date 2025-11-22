import type { ExamRecord, ModuleScore } from '@/types';

// 解析OCR识别的文本,提取考试数据
export function parseExamData(
  ocrText: string,
  examNumber: number
): {
  examRecord: Omit<ExamRecord, 'id' | 'created_at' | 'updated_at'>;
  moduleScores: Omit<ModuleScore, 'id' | 'exam_record_id' | 'created_at'>[];
} {
  // 提取总分
  const totalScoreMatch = ocrText.match(/我的得分[：:]\s*(\d+\.?\d*)/i) || 
                          ocrText.match(/得分[：:]\s*(\d+\.?\d*)/i) ||
                          ocrText.match(/(\d+\.?\d*)\s*\/\s*100/);
  const totalScore = totalScoreMatch ? parseFloat(totalScoreMatch[1]) : 0;

  // 提取用时
  const timeMatch = ocrText.match(/(\d+)\s*分\s*(\d+)\s*秒/);
  const timeUsed = timeMatch ? parseInt(timeMatch[1]) : 0;

  // 提取最高分
  const maxScoreMatch = ocrText.match(/最高分[：:]\s*(\d+\.?\d*)/i);
  const maxScore = maxScoreMatch ? parseFloat(maxScoreMatch[1]) : undefined;

  // 提取平均分
  const avgScoreMatch = ocrText.match(/平均分[：:]\s*(\d+\.?\d*)/i);
  const averageScore = avgScoreMatch ? parseFloat(avgScoreMatch[1]) : undefined;

  // 提取已击败考生百分比
  const passRateMatch = ocrText.match(/已击败\s*(\d+\.?\d*)%/i);
  const passRate = passRateMatch ? parseFloat(passRateMatch[1]) : undefined;

  const examRecord: Omit<ExamRecord, 'id' | 'created_at' | 'updated_at'> = {
    exam_number: examNumber,
    total_score: totalScore,
    max_score: maxScore,
    average_score: averageScore,
    pass_rate: passRate,
    time_used: timeUsed,
  };

  // 解析模块得分
  const moduleScores: Omit<ModuleScore, 'id' | 'exam_record_id' | 'created_at'>[] = [];

  // 定义模块结构
  const moduleStructure = [
    {
      name: '政治理论',
      children: ['马克思主义', '理论与政策', '时政热点'],
    },
    {
      name: '常识判断',
      children: ['经济常识', '科技常识', '人文常识', '地理国情', '法律常识'],
    },
    {
      name: '言语理解与表达',
      children: ['逻辑填空', '片段阅读', '语句表达'],
    },
    {
      name: '数量关系',
      children: ['数学运算'],
    },
    {
      name: '判断推理',
      children: ['图形推理', '定义判断', '类比推理', '逻辑判断'],
    },
    {
      name: '资料分析',
      children: ['文字资料', '综合资料', '两单计算', '其他与现期', '增长率', '增长量', '比重问题', '平均数问题'],
    },
  ];

  // 尝试从文本中提取每个模块的数据
  for (const module of moduleStructure) {
    // 查找大模块数据
    const moduleRegex = new RegExp(
      `${module.name}[\\s\\S]*?总题数[：:]\\s*(\\d+).*?答对[：:]\\s*(\\d+).*?答错[：:]\\s*(\\d+).*?未答[：:]\\s*(\\d+).*?正确率[：:]\\s*(\\d+)%.*?用时[：:]\\s*(\\d+)`,
      'i'
    );
    const moduleMatch = ocrText.match(moduleRegex);

    if (moduleMatch) {
      const totalQuestions = parseInt(moduleMatch[1]);
      const correctAnswers = parseInt(moduleMatch[2]);
      const wrongAnswers = parseInt(moduleMatch[3]);
      const unanswered = parseInt(moduleMatch[4]);
      const accuracyRate = parseInt(moduleMatch[5]);
      const timeUsedSec = parseInt(moduleMatch[6]);

      moduleScores.push({
        module_name: module.name,
        parent_module: null,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        unanswered: unanswered,
        accuracy_rate: accuracyRate,
        time_used: timeUsedSec,
      });
    }

    // 查找子模块数据
    for (const childName of module.children) {
      const childRegex = new RegExp(
        `${childName}[\\s\\S]*?总题数[：:]\\s*(\\d+).*?答对[：:]\\s*(\\d+).*?答错[：:]\\s*(\\d+).*?未答[：:]\\s*(\\d+).*?正确率[：:]\\s*(\\d+)%.*?用时[：:]\\s*(\\d+)`,
        'i'
      );
      const childMatch = ocrText.match(childRegex);

      if (childMatch) {
        const totalQuestions = parseInt(childMatch[1]);
        const correctAnswers = parseInt(childMatch[2]);
        const wrongAnswers = parseInt(childMatch[3]);
        const unanswered = parseInt(childMatch[4]);
        const accuracyRate = parseInt(childMatch[5]);
        const timeUsedSec = parseInt(childMatch[6]);

        moduleScores.push({
          module_name: childName,
          parent_module: module.name,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          wrong_answers: wrongAnswers,
          unanswered: unanswered,
          accuracy_rate: accuracyRate,
          time_used: timeUsedSec,
        });
      }
    }
  }

  return { examRecord, moduleScores };
}
