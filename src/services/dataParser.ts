import type { ExamRecord, ModuleScore } from '@/types';

// 验证是否为有效的成绩截图
function validateExamScreenshot(text: string): { isValid: boolean; reason?: string } {
  console.log('=== 验证成绩截图格式 ===');
  
  // 必须包含的关键词
  const requiredKeywords = ['得分', '正确率'];
  const moduleKeywords = ['政治理论', '常识判断', '言语理解', '数量关系', '判断推理', '资料分析'];
  
  // 检查是否包含"得分"关键词
  const hasScore = requiredKeywords.some(keyword => text.includes(keyword));
  if (!hasScore) {
    return {
      isValid: false,
      reason: '未识别到成绩信息，请确保上传的是考试成绩截图',
    };
  }
  
  // 检查是否包含至少一个模块名称
  const hasModule = moduleKeywords.some(keyword => text.includes(keyword));
  if (!hasModule) {
    return {
      isValid: false,
      reason: '未识别到考试模块信息，请确保上传的是完整的成绩截图',
    };
  }
  
  // 检查是否包含题数信息
  const hasQuestions = /(?:共|总题数)[：:\s]*\d+[：:\s]*(?:题|道)/i.test(text) ||
                       /\d+[：:\s]*(?:题|道)/i.test(text);
  if (!hasQuestions) {
    return {
      isValid: false,
      reason: '未识别到题目数量信息，请确保上传的是完整的成绩截图',
    };
  }
  
  console.log('✓ 成绩截图格式验证通过');
  return { isValid: true };
}

// 预处理OCR文本，提高解析准确度
function preprocessOcrText(text: string): string {
  let processed = text;
  
  // 1. 统一标点符号
  processed = processed
    .replace(/，/g, ',')  // 中文逗号转英文逗号
    .replace(/：/g, ':')  // 中文冒号转英文冒号
    .replace(/（/g, '(')  // 中文括号转英文括号
    .replace(/）/g, ')')
    .replace(/％/g, '%'); // 全角百分号转半角
  
  // 2. 清理多余空白字符（但保留必要的换行）
  processed = processed
    .replace(/[ \t]+/g, ' ')  // 多个空格/制表符合并为一个空格
    .replace(/\n\s+/g, '\n')  // 删除行首空格
    .replace(/\s+\n/g, '\n')  // 删除行尾空格
    .replace(/\n{3,}/g, '\n\n');  // 多个换行合并为两个
  
  // 3. 修复常见OCR错误
  processed = processed
    .replace(/[oO0]/g, '0')  // 在数字上下文中，o/O可能是0
    .replace(/[lI1]/g, '1')  // 在数字上下文中，l/I可能是1
    .replace(/共\s*([0-9]+)\s*([道题])/g, '共$1$2')  // 规范化"共X道"格式
    .replace(/答对\s*([0-9]+)\s*([道题])/g, '答对$1$2')  // 规范化"答对X道"格式
    .replace(/正确率\s*([0-9]+)\s*%/g, '正确率$1%')  // 规范化"正确率X%"格式
    .replace(/用时\s*([0-9]+)\s*(秒|分)/g, '用时$1$2');  // 规范化"用时X秒"格式
  
  console.log('=== OCR文本预处理 ===');
  console.log('原始文本长度:', text.length);
  console.log('处理后文本长度:', processed.length);
  console.log('处理后前300字符:', processed.substring(0, 300));
  
  return processed;
}

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
  console.log('OCR原始文本长度:', ocrText.length);
  console.log('用户输入用时:', timeUsedSeconds, '秒');
  
  // 验证成绩截图格式
  const validation = validateExamScreenshot(ocrText);
  if (!validation.isValid) {
    throw new Error(validation.reason || '无效的成绩截图');
  }
  
  // 预处理OCR文本
  const processedText = preprocessOcrText(ocrText);
  
  // 使用处理后的文本进行解析
  const textToUse = processedText;

  // 提取总分 - 支持多种格式,包括紧凑格式和圆形进度条格式
  const totalScoreMatch = textToUse.match(/我的得分[：:\s]*(\d+\.?\d*)/i) || 
                          textToUse.match(/得分[：:\s]*(\d+\.?\d*)/i) ||
                          textToUse.match(/(\d+\.?\d*)\s*[/／]\s*100/) ||
                          textToUse.match(/(\d+\.?\d*)[/／]100/) ||
                          // 新增：支持圆形进度条格式，得分在前，/100在后
                          textToUse.match(/(\d+\.?\d*)\s*\/\s*100/) ||
                          // 新增：支持单独的得分数字（在"得分"关键字附近）
                          (() => {
                            const lines = textToUse.split('\n');
                            for (let i = 0; i < lines.length; i++) {
                              if (lines[i].includes('得分') && i + 1 < lines.length) {
                                const nextLine = lines[i + 1];
                                const scoreMatch = nextLine.match(/(\d+\.?\d*)/);
                                if (scoreMatch) {
                                  return scoreMatch;
                                }
                              }
                            }
                            return null;
                          })();
  let totalScore = totalScoreMatch ? parseFloat(totalScoreMatch[1]) : 0;
  
  // 验证总分不能超过100分
  if (totalScore > 100) {
    console.warn(`⚠️ 总分 ${totalScore} 超过100分，可能是识别错误`);
    // 尝试修正：如果是613.0这种，可能是61.3
    if (totalScore >= 1000) {
      const corrected = totalScore / 10;
      if (corrected <= 100) {
        console.log(`✓ 自动修正: ${totalScore} → ${corrected}`);
        totalScore = corrected;
      } else {
        console.log(`✗ 无法自动修正，设置为100分`);
        totalScore = 100;
      }
    } else if (totalScore > 100 && totalScore < 1000) {
      // 如果是613.0，可能是61.3
      const corrected = totalScore / 10;
      if (corrected <= 100) {
        console.log(`✓ 自动修正: ${totalScore} → ${corrected}`);
        totalScore = corrected;
      } else {
        console.log(`✗ 无法自动修正，设置为100分`);
        totalScore = 100;
      }
    } else {
      totalScore = 100;
    }
  }
  
  console.log('提取总分:', totalScore, '匹配结果:', totalScoreMatch?.[0]);

  // 提取最高分 - 增强匹配
  const maxScoreMatch = textToUse.match(/最高分[：:\s]*(\d+\.?\d*)/i) ||
                        textToUse.match(/最高[：:\s]*(\d+\.?\d*)/i);
  const maxScore = maxScoreMatch ? parseFloat(maxScoreMatch[1]) : undefined;
  console.log('提取最高分:', maxScore, '匹配结果:', maxScoreMatch?.[0]);

  // 提取平均分 - 增强匹配
  const avgScoreMatch = textToUse.match(/平均分[：:\s]*(\d+\.?\d*)/i) ||
                        textToUse.match(/平均[：:\s]*(\d+\.?\d*)/i);
  const averageScore = avgScoreMatch ? parseFloat(avgScoreMatch[1]) : undefined;
  console.log('提取平均分:', averageScore, '匹配结果:', avgScoreMatch?.[0]);

  // 提取难度系数 - 增强匹配,支持右上角的"难度4.8"格式
  const difficultyMatch = textToUse.match(/难度[：:\s]*(\d+\.?\d*)/i) ||
                          textToUse.match(/难度(\d+\.?\d*)/i);
  let difficulty = difficultyMatch ? parseFloat(difficultyMatch[1]) : undefined;
  // 确保难度系数在 0-5 范围内
  if (difficulty !== undefined && difficulty > 5) {
    console.warn(`难度系数 ${difficulty} 超过最大值 5，将被限制为 5`);
    difficulty = 5;
  }
  console.log('提取难度:', difficulty, '匹配结果:', difficultyMatch?.[0]);

  // 提取已击败考生百分比 - 增强匹配,支持"73.3%"等格式
  const beatPercentageMatch = textToUse.match(/已击败[考生\s]*[：:\s]*(\d+\.?\d*)%/i) ||
                              textToUse.match(/击败[考生\s]*[：:\s]*(\d+\.?\d*)%/i) ||
                              textToUse.match(/已击败(\d+\.?\d*)%/i);
  const beatPercentage = beatPercentageMatch ? parseFloat(beatPercentageMatch[1]) : undefined;
  console.log('提取击败百分比:', beatPercentage, '匹配结果:', beatPercentageMatch?.[0]);

  // 保持向后兼容 - pass_rate 也保存击败百分比
  const passRate = beatPercentage;

  const examRecord: Omit<ExamRecord, 'id' | 'created_at' | 'updated_at'> = {
    exam_number: examNumber,
    index_number: examNumber, // 索引项，用于排序，必须唯一
    exam_name: '', // 将在 Upload 页面设置
    sort_order: examNumber, // 将在 Upload 页面设置
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
        '多位数问题',
        '平均数问题',
        '工程问题',
        '溶液问题',
        '最值问题',
        '计数模型问题',
        '年龄问题',
        '和差倍比问题',
        '牛吃草问题',
        '周期问题',
        '数列问题',
        '行程问题',
        '几何问题',
        '容斥原理问题',
        '排列组合问题',
        '概率问题',
        '经济利润问题',
        '函数最值问题',
        '钟表问题',
        '不定方程问题',
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
    
    // 先查找模块名称在文本中的位置
    const moduleIndex = textToUse.indexOf(module.name);
    let moduleMatch: RegExpMatchArray | null = null;
    
    if (moduleIndex === -1) {
      console.log(`✗ 未找到模块名称: ${module.name}`);
      // 即使没找到模块名称，也创建空记录，并继续解析子模块
      moduleScores.push({
        module_name: module.name,
        parent_module: undefined,
        total_questions: 0,
        correct_answers: 0,
        wrong_answers: 0,
        unanswered: 0,
        accuracy_rate: 0,
        time_used: 0,
      });
      console.log(`✓ 创建空模块记录: ${module.name}`);
    } else {
      // 提取模块名称后的200个字符，用于调试
      const contextAfterModule = textToUse.substring(moduleIndex, moduleIndex + 200);
      console.log(`找到模块位置: ${moduleIndex}`);
      console.log(`模块后的内容（前200字符）:`, contextAfterModule);
      
      // 查找大模块数据 - 支持多种格式，但要精确匹配
      // 格式1（网页版）: "总题数20题 答对15题 正确率75% 用时30秒"
      // 格式2（手机端）: "共20道，答对15道，正确率75%，用时30秒"
      // 
      // 关键改进：使用更小的搜索范围，确保只匹配紧跟在模块名后的数据
      // 避免跨越到其他模块或子模块
      
      // 手机端格式：模块名后面紧跟数据（最多100字符内）
      // 支持"共X题"和"共X道"两种格式
      const mobilePattern = `${module.name}[\\s\\n]{0,20}` +  // 模块名后最多20个空白字符
        `共[\\s，,]*?(\\d+)[\\s]*?(?:题|道)[\\s，,]+?` +  // 共X题/道
        `答对[\\s，,]*?(\\d+)[\\s]*?(?:题|道)[\\s，,]+?` +  // 答对Y题/道
        `正确率[\\s，,]*?(\\d+)[\\s]*?%[\\s，,]+?` +  // 正确率Z%
        `用时[\\s，,]*?(\\d+)[\\s]*?(?:分[\\s]*?)?(\\d+)?[\\s]*?秒`;  // 用时W分X秒 或 用时W秒
      
      const mobileRegex = new RegExp(mobilePattern, 'i');
      moduleMatch = textToUse.match(mobileRegex);
      let isMobileFormat = !!moduleMatch;
      
      // 如果手机端格式没匹配到，尝试网页版格式
      if (!moduleMatch) {
        // PC端格式1：总题数 35题  答对 22道  正确率 63%  用时 29分
        // PC端格式2：总题数 5题   答对 2道   正确率 40%  用时 6分
        // PC端格式3：总题数 1题   答对 0道   正确率 0%   用时 84秒
        // 
        // 关键改进：
        // 1. 模块名称和数据之间可能有换行符
        // 2. 使用 [\s\S] 匹配任意字符（包括换行符）
        // 3. 增加搜索范围到200字符
        const webPattern = `${module.name}[\\s\\S]{0,200}?` +  // 增加搜索范围，使用非贪婪匹配
          `(?:总题数|共计)[：:\\s]{0,10}(\\d+)[\\s]*(?:题|道)[\\s]{0,20}` +  // 允许0-10个空格，字段间0-20个空格
          `答对[：:\\s]{0,10}(\\d+)[\\s]*(?:题|道)[\\s]{0,20}` +  // 允许0-10个空格
          `正确率[：:\\s]{0,10}(\\d+)%[\\s]{0,20}` +  // 允许0-10个空格
          `用时[：:\\s]{0,10}(\\d+)(?:[\\s]*(\\d+))?[\\s]*(?:秒|分)`;  // 用时 W秒 或 W分 或 W分X秒
        
        const webRegex = new RegExp(webPattern, 'i');
        moduleMatch = textToUse.match(webRegex);
        
        console.log(`尝试网页版格式匹配: ${module.name}`);
        console.log(`正则表达式: ${webPattern}`);
        console.log(`匹配结果:`, moduleMatch ? moduleMatch[0].substring(0, 100) : '未匹配');
      }
      
      // 如果还是没匹配到，尝试简化格式（只有数字和百分比）
      if (!moduleMatch) {
        // 简化格式：模块名称后面直接是数字、百分比、数字
        // 例如：
        // 言语理解与表达
        // 21
        // 70%
        // 25
        const simplePattern = `${module.name}[\\s\\S]{0,50}?` +  // 模块名称后最多50个字符
          `(\\d+)[\\s\\S]{0,20}?` +  // 第一个数字（总题数）
          `(\\d+)%[\\s\\S]{0,20}?` +  // 百分比（正确率）
          `(\\d+)`;  // 第二个数字（用时）
        
        const simpleRegex = new RegExp(simplePattern, 'i');
        moduleMatch = textToUse.match(simpleRegex);
        
        console.log(`尝试简化格式匹配: ${module.name}`);
        console.log(`正则表达式: ${simplePattern}`);
        console.log(`匹配结果:`, moduleMatch ? moduleMatch[0].substring(0, 100) : '未匹配');
        
        if (moduleMatch) {
          // 标记为简化格式
          isMobileFormat = false;
          // 重新组织匹配结果，使其与标准格式兼容
          // 简化格式：[完整匹配, 总题数, 正确率, 用时]
          // 标准格式：[完整匹配, 总题数, 答对数, 正确率, 用时]
          // 需要根据总题数和正确率计算答对数
          const totalQuestions = parseInt(moduleMatch[1]);
          const accuracyRate = parseInt(moduleMatch[2]);
          const correctAnswers = Math.round(totalQuestions * accuracyRate / 100);
          
          // 重新构造匹配结果
          moduleMatch = [
            moduleMatch[0],  // 完整匹配
            moduleMatch[1],  // 总题数
            correctAnswers.toString(),  // 答对数（计算得出）
            moduleMatch[2],  // 正确率
            moduleMatch[3],  // 用时
          ];
          
          console.log(`简化格式解析: 总题数=${totalQuestions}, 正确率=${accuracyRate}%, 计算答对数=${correctAnswers}`);
        }
      }
      
      // 处理模块匹配结果
      if (moduleMatch) {
        console.log(`找到模块数据:`, moduleMatch[0].substring(0, 150));
      
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
        
        // 处理用时：moduleMatch[4]是分钟或秒，moduleMatch[5]是秒（如果有分钟）
        const timeValue = parseInt(moduleMatch[4]);
        const secondsValue = moduleMatch[5] ? parseInt(moduleMatch[5]) : 0;
        
        if (moduleMatch[5]) {
          // 格式：X分Y秒
          timeUsedSec = timeValue * 60 + secondsValue;
        } else if (moduleMatch[0].includes('分')) {
          // 格式：X分
          timeUsedSec = timeValue * 60;
        } else {
          // 格式：X秒
          timeUsedSec = timeValue;
        }
      }
      
      // 验证用时不能小于1分钟（60秒）
      if (timeUsedSec < 60) {
        console.warn(`⚠️ ${module.name} 用时 ${timeUsedSec}秒 小于1分钟，设置为60秒`);
        timeUsedSec = 60;
      }
      
      // 数据验证：确保数据合理
      if (totalQuestions < correctAnswers) {
        console.warn(`警告: ${module.name} 的答对数(${correctAnswers})大于总题数(${totalQuestions})，数据可能有误`);
        // 自动修正：答对数不能超过总题数
        correctAnswers = totalQuestions;
      }
      if (accuracyRate > 100) {
        console.warn(`警告: ${module.name} 的正确率(${accuracyRate}%)超过100%，数据可能有误`);
      }
      
      // 计算答错数和未答数
      const wrongAnswers = totalQuestions - correctAnswers;
      const unanswered = 0; // 默认为0

      console.log(`✓ 解析成功: 总题数=${totalQuestions}, 答对=${correctAnswers}, 正确率=${accuracyRate}%, 用时=${timeUsedSec}秒`);

      moduleScores.push({
        module_name: module.name,
        parent_module: undefined,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        unanswered: unanswered,
        accuracy_rate: accuracyRate,
        time_used: timeUsedSec,
      });
      } else {
        console.log(`✗ 未找到模块数据: ${module.name}`);
        // 即使没有识别到大模块数据，也创建一个空记录
        moduleScores.push({
          module_name: module.name,
          parent_module: undefined,
          total_questions: 0,
          correct_answers: 0,
          wrong_answers: 0,
          unanswered: 0,
          accuracy_rate: 0,
          time_used: 0,
        });
        console.log(`✓ 创建空模块记录: ${module.name}`);
      }
    } // 结束 else 块（找到模块名称的情况）

    // 查找子模块数据
    for (const childName of module.children) {
      console.log(`  - 解析子模块: ${childName}`);
      
      // 手机端格式：子模块名后面紧跟数据（最多100字符内）
      // 支持"共X题"和"共X道"两种格式
      const childMobilePattern = `${childName}[\\s\\n]{0,20}` +  // 子模块名后最多20个空白字符
        `共[\\s，,]*?(\\d+)[\\s]*?(?:题|道)[\\s，,]+?` +  // 共X题/道
        `答对[\\s，,]*?(\\d+)[\\s]*?(?:题|道)[\\s，,]+?` +  // 答对Y题/道
        `正确率[\\s，,]*?(\\d+)[\\s]*?%[\\s，,]+?` +  // 正确率Z%
        `用时[\\s，,]*?(\\d+)[\\s]*?(?:分[\\s]*?)?(\\d+)?[\\s]*?秒`;  // 用时W分X秒 或 用时W秒
      
      const childMobileRegex = new RegExp(childMobilePattern, 'i');
      let childMatch = textToUse.match(childMobileRegex);
      let isChildMobileFormat = !!childMatch;
      
      // 如果手机端格式没匹配到，尝试网页版格式
      if (!childMatch) {
        // PC端格式：总题数 X题/道  答对 Y题/道  正确率 Z%  用时 W秒/分
        // 允许模块名称和数据之间有换行符
        const childWebPattern = `${childName}[\\s\\S]{0,200}?` +  // 增加搜索范围，使用非贪婪匹配
          `(?:总题数|共计)[：:\\s]{0,10}(\\d+)[\\s]*(?:题|道)[\\s]{0,20}` +  // 允许0-10个空格
          `答对[：:\\s]{0,10}(\\d+)[\\s]*(?:题|道)[\\s]{0,20}` +  // 允许0-10个空格
          `正确率[：:\\s]{0,10}(\\d+)%[\\s]{0,20}` +  // 允许0-10个空格
          `用时[：:\\s]{0,10}(\\d+)(?:[\\s]*(\\d+))?[\\s]*(?:秒|分)`;  // 用时 W秒 或 W分 或 W分X秒
        
        const childWebRegex = new RegExp(childWebPattern, 'i');
        childMatch = textToUse.match(childWebRegex);
        
        console.log(`  尝试网页版格式匹配: ${childName}`);
        console.log(`  匹配结果:`, childMatch ? childMatch[0].substring(0, 100) : '未匹配');
      }
      
      // 如果还是没匹配到，尝试简化格式（只有数字和百分比）
      if (!childMatch) {
        // 简化格式：子模块名称后面直接是数字、百分比、数字
        const childSimplePattern = `${childName}[\\s\\S]{0,50}?` +  // 子模块名称后最多50个字符
          `(\\d+)[\\s\\S]{0,20}?` +  // 第一个数字（总题数）
          `(\\d+)%[\\s\\S]{0,20}?` +  // 百分比（正确率）
          `(\\d+)`;  // 第二个数字（用时）
        
        const childSimpleRegex = new RegExp(childSimplePattern, 'i');
        childMatch = textToUse.match(childSimpleRegex);
        
        console.log(`  尝试简化格式匹配: ${childName}`);
        console.log(`  匹配结果:`, childMatch ? childMatch[0].substring(0, 100) : '未匹配');
        
        if (childMatch) {
          // 标记为简化格式
          isChildMobileFormat = false;
          // 重新组织匹配结果
          const totalQuestions = parseInt(childMatch[1]);
          const accuracyRate = parseInt(childMatch[2]);
          const correctAnswers = Math.round(totalQuestions * accuracyRate / 100);
          
          childMatch = [
            childMatch[0],
            childMatch[1],
            correctAnswers.toString(),
            childMatch[2],
            childMatch[3],
          ];
          
          console.log(`  简化格式解析: 总题数=${totalQuestions}, 正确率=${accuracyRate}%, 计算答对数=${correctAnswers}`);
        }
      }

      if (childMatch) {
        console.log(`  找到子模块数据:`, childMatch[0].substring(0, 100));
        
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
          
          // 处理用时：childMatch[4]是分钟或秒，childMatch[5]是秒（如果有分钟）
          const timeValue = parseInt(childMatch[4]);
          const secondsValue = childMatch[5] ? parseInt(childMatch[5]) : 0;
          
          if (childMatch[5]) {
            // 格式：X分Y秒
            timeUsedSec = timeValue * 60 + secondsValue;
          } else if (childMatch[0].includes('分')) {
            // 格式：X分
            timeUsedSec = timeValue * 60;
          } else {
            // 格式：X秒
            timeUsedSec = timeValue;
          }
        }
        
        // 验证用时不能小于1分钟（60秒）
        if (timeUsedSec < 60) {
          console.warn(`⚠️ ${childName} 用时 ${timeUsedSec}秒 小于1分钟，设置为60秒`);
          timeUsedSec = 60;
        }
        
        // 数据验证
        if (totalQuestions < correctAnswers) {
          console.warn(`  警告: ${childName} 的答对数(${correctAnswers})大于总题数(${totalQuestions})，数据可能有误`);
          // 自动修正：答对数不能超过总题数
          correctAnswers = totalQuestions;
        }
        
        // 如果总用时小于10分钟,子模块时间设为0
        if (!shouldRecordSubModuleTime) {
          console.log(`  总用时小于10分钟,子模块时间设为0`);
          timeUsedSec = 0;
        }
        
        const wrongAnswers = totalQuestions - correctAnswers;
        const unanswered = 0;

        console.log(`  ✓ 解析成功: 总题数=${totalQuestions}, 答对=${correctAnswers}, 正确率=${accuracyRate}%, 用时=${timeUsedSec}秒`);

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
        console.log(`  ✗ 未找到子模块数据: ${childName}`);
        // 即使没有识别到子模块数据，也创建一个空记录
        moduleScores.push({
          module_name: childName,
          parent_module: module.name,
          total_questions: 0,
          correct_answers: 0,
          wrong_answers: 0,
          unanswered: 0,
          accuracy_rate: 0,
          time_used: 0,
        });
        console.log(`  ✓ 创建空子模块记录: ${childName}`);
      }
    }
  }

  console.log('\n=== 解析完成 ===');
  console.log('总共解析到', moduleScores.length, '个模块');
  console.log('模块列表:', moduleScores.map(m => m.module_name).join(', '));

  // 计算总题数
  const totalQuestions = moduleScores.reduce((sum, module) => sum + (module.total_questions || 0), 0);
  console.log('总题数:', totalQuestions);

  // 更新examRecord，添加question_count和duration_seconds
  examRecord.question_count = totalQuestions;
  examRecord.duration_seconds = timeUsedSeconds;

  return { examRecord, moduleScores };
}
