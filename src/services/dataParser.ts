import type { ExamRecord, ModuleScore } from '@/types';

// 解析OCR识别的文本,提取考试数据
export function parseExamData(
  ocrText: string,
  examNumber: number
): {
  examRecord: Omit<ExamRecord, 'id' | 'created_at' | 'updated_at'>;
  moduleScores: Omit<ModuleScore, 'id' | 'exam_record_id' | 'created_at'>[];
} {
  console.log('=== 开始解析OCR文本 ===');
  console.log('OCR文本长度:', ocrText.length);
  console.log('OCR文本前500字符:', ocrText.substring(0, 500));

  // 提取总分 - 支持多种格式
  const totalScoreMatch = ocrText.match(/我的得分[：:\s]*(\d+\.?\d*)/i) || 
                          ocrText.match(/得分[：:\s]*(\d+\.?\d*)/i) ||
                          ocrText.match(/(\d+\.?\d*)\s*[/／/]\s*100/) ||
                          ocrText.match(/(\d+\.?\d*)[/／/]100/);
  const totalScore = totalScoreMatch ? parseFloat(totalScoreMatch[1]) : 0;
  console.log('提取总分:', totalScore, '匹配结果:', totalScoreMatch?.[0]);

  // 提取用时 - 支持多种格式
  const timeMatch = ocrText.match(/总?用时[：:\s]*(\d+)\s*分\s*(\d+)\s*秒/i) ||
                    ocrText.match(/(\d+)\s*分\s*(\d+)\s*秒/) ||
                    ocrText.match(/(\d+)分(\d+)秒/);
  const timeUsed = timeMatch ? parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]) : 0;
  console.log('提取用时:', timeUsed, '秒, 匹配结果:', timeMatch?.[0]);

  // 提取最高分
  const maxScoreMatch = ocrText.match(/最高分[：:\s]*(\d+\.?\d*)/i);
  const maxScore = maxScoreMatch ? parseFloat(maxScoreMatch[1]) : undefined;
  console.log('提取最高分:', maxScore);

  // 提取平均分
  const avgScoreMatch = ocrText.match(/平均分[：:\s]*(\d+\.?\d*)/i);
  const averageScore = avgScoreMatch ? parseFloat(avgScoreMatch[1]) : undefined;
  console.log('提取平均分:', averageScore);

  // 提取已击败考生百分比
  const passRateMatch = ocrText.match(/已击败[考生\s]*(\d+\.?\d*)%/i);
  const passRate = passRateMatch ? parseFloat(passRateMatch[1]) : undefined;
  console.log('提取击败率:', passRate);

  const examRecord: Omit<ExamRecord, 'id' | 'created_at' | 'updated_at'> = {
    exam_number: examNumber,
    total_score: totalScore,
    max_score: maxScore,
    average_score: averageScore,
    pass_rate: passRate,
    time_used: timeUsed,
  };

  console.log('考试记录:', examRecord);

  // 解析模块得分
  const moduleScores: Omit<ModuleScore, 'id' | 'exam_record_id' | 'created_at'>[] = [];
  console.log('=== 开始解析模块数据 ===');
  
  // 判断是否记录细分模块时间(总用时小于10分钟=600秒)
  const shouldRecordSubModuleTime = timeUsed >= 600;
  console.log('总用时:', timeUsed, '秒,', shouldRecordSubModuleTime ? '记录所有模块时间' : '只记录一级和二级模块时间');

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
    console.log(`\n--- 解析模块: ${module.name} ---`);
    
    // 查找大模块数据 - 使用更灵活的正则表达式
    // 支持多种格式: "总题数20题" 或 "总题数:20" 或 "总题数 20"
    const modulePattern = `${module.name}[\\s\\S]{0,200}?` + // 模块名称后最多200个字符
      `(?:总题数|共计)[：:\\s]*?(\\d+)(?:题|道)?[\\s\\S]{0,50}?` + // 总题数
      `(?:答对|正确)[：:\\s]*?(\\d+)(?:题|道)?[\\s\\S]{0,50}?` + // 答对数
      `(?:正确率|准确率)[：:\\s]*?(\\d+)%[\\s\\S]{0,50}?` + // 正确率
      `(?:用时|时间)[：:\\s]*?(\\d+)(?:秒|分)?`; // 用时
    
    const moduleRegex = new RegExp(modulePattern, 'i');
    const moduleMatch = ocrText.match(moduleRegex);

    if (moduleMatch) {
      console.log(`找到模块数据:`, moduleMatch[0].substring(0, 100));
      
      const totalQuestions = parseInt(moduleMatch[1]);
      const correctAnswers = parseInt(moduleMatch[2]);
      const accuracyRate = parseInt(moduleMatch[3]);
      let timeUsedSec = parseInt(moduleMatch[4]);
      
      // 检查用时单位
      if (moduleMatch[0].includes('分')) {
        timeUsedSec = timeUsedSec * 60;
      }
      
      // 计算答错数和未答数
      const wrongAnswers = totalQuestions - correctAnswers;
      const unanswered = 0; // 默认为0

      console.log(`解析结果: 总题数=${totalQuestions}, 答对=${correctAnswers}, 正确率=${accuracyRate}%, 用时=${timeUsedSec}秒`);

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
    } else {
      console.log(`未找到模块数据`);
    }

    // 查找子模块数据
    for (const childName of module.children) {
      console.log(`  - 解析子模块: ${childName}`);
      
      const childPattern = `${childName}[\\s\\S]{0,200}?` +
        `(?:总题数|共计)[：:\\s]*?(\\d+)(?:题|道)?[\\s\\S]{0,50}?` +
        `(?:答对|正确)[：:\\s]*?(\\d+)(?:题|道)?[\\s\\S]{0,50}?` +
        `(?:正确率|准确率)[：:\\s]*?(\\d+)%[\\s\\S]{0,50}?` +
        `(?:用时|时间)[：:\\s]*?(\\d+)(?:秒|分)?`;
      
      const childRegex = new RegExp(childPattern, 'i');
      const childMatch = ocrText.match(childRegex);

      if (childMatch) {
        console.log(`  找到子模块数据:`, childMatch[0].substring(0, 80));
        
        const totalQuestions = parseInt(childMatch[1]);
        const correctAnswers = parseInt(childMatch[2]);
        const accuracyRate = parseInt(childMatch[3]);
        let timeUsedSec = parseInt(childMatch[4]);
        
        // 检查用时单位
        if (childMatch[0].includes('分')) {
          timeUsedSec = timeUsedSec * 60;
        }
        
        // 如果总用时小于10分钟,子模块时间设为0
        if (!shouldRecordSubModuleTime) {
          console.log(`  总用时小于10分钟,子模块时间设为0`);
          timeUsedSec = 0;
        }
        
        const wrongAnswers = totalQuestions - correctAnswers;
        const unanswered = 0;

        console.log(`  解析结果: 总题数=${totalQuestions}, 答对=${correctAnswers}, 正确率=${accuracyRate}%, 用时=${timeUsedSec}秒`);

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
      } else {
        console.log(`  未找到子模块数据`);
      }
    }
  }

  console.log('\n=== 解析完成 ===');
  console.log('总共解析到', moduleScores.length, '个模块');
  console.log('模块列表:', moduleScores.map(m => m.module_name).join(', '));

  return { examRecord, moduleScores };
}
