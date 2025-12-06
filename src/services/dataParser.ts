import type { ExamRecord, ModuleScore } from '@/types';

// 解析OCR识别的文本,提取考试数据
export function parseExamData(
  ocrText: string,
  examNumber: number,
  timeUsedSeconds: number = 0
): {
  examRecord: Omit<ExamRecord, 'id' | 'created_at' | 'updated_at'>;
  moduleScores: Omit<ModuleScore, 'id' | 'exam_record_id' | 'created_at'>[];
} {
  console.log('=== 开始解析OCR文本 ===');
  console.log('OCR文本长度:', ocrText.length);
  console.log('OCR文本前500字符:', ocrText.substring(0, 500));
  console.log('用户输入用时:', timeUsedSeconds, '秒');

  // 提取总分 - 支持多种格式,包括紧凑格式
  const totalScoreMatch = ocrText.match(/我的得分[：:\s]*(\d+\.?\d*)/i) || 
                          ocrText.match(/得分[：:\s]*(\d+\.?\d*)/i) ||
                          ocrText.match(/(\d+\.?\d*)\s*[/／]\s*100/) ||
                          ocrText.match(/(\d+\.?\d*)[/／]100/);
  const totalScore = totalScoreMatch ? parseFloat(totalScoreMatch[1]) : 0;
  console.log('提取总分:', totalScore, '匹配结果:', totalScoreMatch?.[0]);

  // 提取最高分 - 增强匹配
  const maxScoreMatch = ocrText.match(/最高分[：:\s]*(\d+\.?\d*)/i) ||
                        ocrText.match(/最高[：:\s]*(\d+\.?\d*)/i);
  const maxScore = maxScoreMatch ? parseFloat(maxScoreMatch[1]) : undefined;
  console.log('提取最高分:', maxScore, '匹配结果:', maxScoreMatch?.[0]);

  // 提取平均分 - 增强匹配
  const avgScoreMatch = ocrText.match(/平均分[：:\s]*(\d+\.?\d*)/i) ||
                        ocrText.match(/平均[：:\s]*(\d+\.?\d*)/i);
  const averageScore = avgScoreMatch ? parseFloat(avgScoreMatch[1]) : undefined;
  console.log('提取平均分:', averageScore, '匹配结果:', avgScoreMatch?.[0]);

  // 提取难度系数 - 增强匹配,支持右上角的"难度4.8"格式
  const difficultyMatch = ocrText.match(/难度[：:\s]*(\d+\.?\d*)/i) ||
                          ocrText.match(/难度(\d+\.?\d*)/i);
  let difficulty = difficultyMatch ? parseFloat(difficultyMatch[1]) : undefined;
  // 确保难度系数在 0-5 范围内
  if (difficulty !== undefined && difficulty > 5) {
    console.warn(`难度系数 ${difficulty} 超过最大值 5，将被限制为 5`);
    difficulty = 5;
  }
  console.log('提取难度:', difficulty, '匹配结果:', difficultyMatch?.[0]);

  // 提取已击败考生百分比 - 增强匹配,支持"73.3%"等格式
  const beatPercentageMatch = ocrText.match(/已击败[考生\s]*[：:\s]*(\d+\.?\d*)%/i) ||
                              ocrText.match(/击败[考生\s]*[：:\s]*(\d+\.?\d*)%/i) ||
                              ocrText.match(/已击败(\d+\.?\d*)%/i);
  const beatPercentage = beatPercentageMatch ? parseFloat(beatPercentageMatch[1]) : undefined;
  console.log('提取击败百分比:', beatPercentage, '匹配结果:', beatPercentageMatch?.[0]);

  // 保持向后兼容 - pass_rate 也保存击败百分比
  const passRate = beatPercentage;

  const examRecord: Omit<ExamRecord, 'id' | 'created_at' | 'updated_at'> = {
    exam_number: examNumber,
    exam_name: '', // 将在 Upload 页面设置
    index_number: examNumber, // 将在 Upload 页面设置
    rating: 0, // 默认星级为 0
    total_score: totalScore,
    max_score: maxScore,
    average_score: averageScore,
    difficulty: difficulty,
    beat_percentage: beatPercentage,
    pass_rate: passRate,
    time_used: timeUsedSeconds, // 使用用户输入的用时
  };

  console.log('考试记录:', examRecord);

  // 解析模块得分
  const moduleScores: Omit<ModuleScore, 'id' | 'exam_record_id' | 'created_at'>[] = [];
  console.log('=== 开始解析模块数据 ===');
  
  // 判断是否记录细分模块时间(总用时小于10分钟=600秒)
  const shouldRecordSubModuleTime = timeUsedSeconds >= 600;
  console.log('总用时:', timeUsedSeconds, '秒,', shouldRecordSubModuleTime ? '记录所有模块时间' : '只记录一级和二级模块时间');

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
      children: [
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
    },
    {
      name: '判断推理',
      children: ['图形推理', '定义判断', '类比推理', '逻辑判断'],
    },
    {
      name: '资料分析',
      children: ['文字资料', '综合资料', '简单计算', '基期与现期', '增长率', '增长量', '比重问题', '平均数问题'],
    },
  ];

  // 尝试从文本中提取每个模块的数据
  for (const module of moduleStructure) {
    console.log(`\n--- 解析模块: ${module.name} ---`);
    
    // 查找大模块数据 - 支持两种格式
    // 格式1（网页版）: "总题数20题 答对15题 正确率75% 用时30秒"
    // 格式2（手机端）: "共20道，答对15道，正确率75%，用时30秒"
    
    // 先尝试手机端格式
    const mobilePattern = `${module.name}[\\s\\S]{0,200}?` +
      `共\\s*(\\d+)\\s*道[，,\\s]+` + // 共X道
      `答对\\s*(\\d+)\\s*道[，,\\s]+` + // 答对Y道
      `正确率\\s*(\\d+)%[，,\\s]+` + // 正确率Z%
      `用时\\s*(\\d+)\\s*(?:分\\s*)?(\\d+)?\\s*秒`; // 用时W分X秒 或 用时W秒
    
    const mobileRegex = new RegExp(mobilePattern, 'i');
    let moduleMatch = ocrText.match(mobileRegex);
    let isMobileFormat = !!moduleMatch;
    
    // 如果手机端格式没匹配到，尝试网页版格式
    if (!moduleMatch) {
      const webPattern = `${module.name}[\\s\\S]{0,200}?` +
        `(?:总题数|共计)[：:\\s]*?(\\d+)(?:题|道)?[\\s\\S]{0,50}?` +
        `(?:答对|正确)[：:\\s]*?(\\d+)(?:题|道)?[\\s\\S]{0,50}?` +
        `(?:正确率|准确率)[：:\\s]*?(\\d+)%[\\s\\S]{0,50}?` +
        `(?:用时|时间)[：:\\s]*?(\\d+)(?:秒|分)?`;
      
      const webRegex = new RegExp(webPattern, 'i');
      moduleMatch = ocrText.match(webRegex);
    }

    if (moduleMatch) {
      console.log(`找到模块数据:`, moduleMatch[0].substring(0, 100));
      
      let totalQuestions, correctAnswers, accuracyRate, timeUsedSec;
      
      if (isMobileFormat) {
        // 手机端格式解析
        totalQuestions = parseInt(moduleMatch[1]);
        correctAnswers = parseInt(moduleMatch[2]);
        accuracyRate = parseInt(moduleMatch[3]);
        
        // 处理用时：可能是"X分Y秒"或"X秒"
        if (moduleMatch[5]) {
          // 有分钟和秒
          timeUsedSec = parseInt(moduleMatch[4]) * 60 + parseInt(moduleMatch[5]);
        } else {
          // 只有秒
          timeUsedSec = parseInt(moduleMatch[4]);
        }
      } else {
        // 网页版格式解析
        totalQuestions = parseInt(moduleMatch[1]);
        correctAnswers = parseInt(moduleMatch[2]);
        accuracyRate = parseInt(moduleMatch[3]);
        timeUsedSec = parseInt(moduleMatch[4]);
        
        // 检查用时单位
        if (moduleMatch[0].includes('分')) {
          timeUsedSec = timeUsedSec * 60;
        }
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
      
      // 先尝试手机端格式
      const childMobilePattern = `${childName}[\\s\\S]{0,200}?` +
        `共\\s*(\\d+)\\s*道[，,\\s]+` +
        `答对\\s*(\\d+)\\s*道[，,\\s]+` +
        `正确率\\s*(\\d+)%[，,\\s]+` +
        `用时\\s*(\\d+)\\s*(?:分\\s*)?(\\d+)?\\s*秒`;
      
      const childMobileRegex = new RegExp(childMobilePattern, 'i');
      let childMatch = ocrText.match(childMobileRegex);
      let isChildMobileFormat = !!childMatch;
      
      // 如果手机端格式没匹配到，尝试网页版格式
      if (!childMatch) {
        const childWebPattern = `${childName}[\\s\\S]{0,200}?` +
          `(?:总题数|共计)[：:\\s]*?(\\d+)(?:题|道)?[\\s\\S]{0,50}?` +
          `(?:答对|正确)[：:\\s]*?(\\d+)(?:题|道)?[\\s\\S]{0,50}?` +
          `(?:正确率|准确率)[：:\\s]*?(\\d+)%[\\s\\S]{0,50}?` +
          `(?:用时|时间)[：:\\s]*?(\\d+)(?:秒|分)?`;
        
        const childWebRegex = new RegExp(childWebPattern, 'i');
        childMatch = ocrText.match(childWebRegex);
      }

      if (childMatch) {
        console.log(`  找到子模块数据:`, childMatch[0].substring(0, 80));
        
        let totalQuestions, correctAnswers, accuracyRate, timeUsedSec;
        
        if (isChildMobileFormat) {
          // 手机端格式解析
          totalQuestions = parseInt(childMatch[1]);
          correctAnswers = parseInt(childMatch[2]);
          accuracyRate = parseInt(childMatch[3]);
          
          // 处理用时
          if (childMatch[5]) {
            timeUsedSec = parseInt(childMatch[4]) * 60 + parseInt(childMatch[5]);
          } else {
            timeUsedSec = parseInt(childMatch[4]);
          }
        } else {
          // 网页版格式解析
          totalQuestions = parseInt(childMatch[1]);
          correctAnswers = parseInt(childMatch[2]);
          accuracyRate = parseInt(childMatch[3]);
          timeUsedSec = parseInt(childMatch[4]);
          
          // 检查用时单位
          if (childMatch[0].includes('分')) {
            timeUsedSec = timeUsedSec * 60;
          }
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
