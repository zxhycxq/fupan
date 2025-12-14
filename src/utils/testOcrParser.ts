// OCR解析测试工具
// 用于测试和验证OCR文本解析的准确性

import { parseExamData } from '@/services/dataParser';

// 模拟手机端OCR识别结果
const mockMobileOcrText = `
模考报告

科技常识
共5道，答对2道，正确率40%，用时5秒

人文常识
共4道，答对2道，正确率50%，用时18秒

地理国情
共1道，答对1道，正确率100%，用时1秒

言语理解与表达
共30道，答对25道，正确率83%，用时39秒

逻辑填空
共15道，答对11道，正确率73%，用时18秒

片段阅读
共11道，答对10道，正确率91%，用时15秒

语句表达
共4道，答对4道，正确率100%，用时6秒

数量关系
共15道，答对5道，正确率33%，用时44秒

数学运算
共15道，答对5道，正确率33%，用时44秒

判断推理
共30道，答对26道，正确率87%，用时50秒

图形推理
共10道，答对8道，正确率80%，用时15秒

定义判断
共5道，答对4道，正确率80%，用时9秒

类比推理
共5道，答对5道，正确率100%，用时9秒

逻辑判断
共10道，答对9道，正确率90%，用时17秒

资料分析
共15道，答对8道，正确率53%，用时36秒

文字资料
共5道，答对2道，正确率40%，用时12秒

综合资料
共5道，答对4道，正确率80%，用时11秒

统计图
共5道，答对2道，正确率40%，用时13秒

我的得分 61.6/100
最高分 100
平均分 62.1
难度 4.9
已击败考生 48.9%
总用时 14分28秒
`;

// 测试函数
export function testOcrParser() {
  console.log('=== 开始OCR解析测试 ===\n');
  
  try {
    const result = parseExamData(mockMobileOcrText, 1, 868); // 14分28秒 = 868秒
    
    console.log('\n=== 测试结果 ===');
    console.log('考试记录:', result.examRecord);
    console.log('\n模块数据:');
    
    // 按模块分组显示
    const parentModules = result.moduleScores.filter(m => !m.parent_module);
    const childModules = result.moduleScores.filter(m => m.parent_module);
    
    console.log('\n一级模块（共', parentModules.length, '个）:');
    parentModules.forEach(m => {
      console.log(`  ${m.module_name}: 共${m.total_questions}道, 答对${m.correct_answers}道, 正确率${m.accuracy_rate}%, 用时${m.time_used}秒`);
    });
    
    console.log('\n二级模块（共', childModules.length, '个）:');
    childModules.forEach(m => {
      console.log(`  ${m.parent_module} > ${m.module_name}: 共${m.total_questions}道, 答对${m.correct_answers}道, 正确率${m.accuracy_rate}%, 用时${m.time_used}秒`);
    });
    
    // 验证关键数据
    console.log('\n=== 关键数据验证 ===');
    
    const judgeModule = parentModules.find(m => m.module_name === '判断推理');
    if (judgeModule) {
      const isCorrect = 
        judgeModule.total_questions === 30 &&
        judgeModule.correct_answers === 26 &&
        judgeModule.accuracy_rate === 87 &&
        judgeModule.time_used === 50;
      
      console.log('判断推理模块:');
      console.log('  总题数:', judgeModule.total_questions, judgeModule.total_questions === 30 ? '✓' : '✗ 应为30');
      console.log('  答对数:', judgeModule.correct_answers, judgeModule.correct_answers === 26 ? '✓' : '✗ 应为26');
      console.log('  正确率:', judgeModule.accuracy_rate + '%', judgeModule.accuracy_rate === 87 ? '✓' : '✗ 应为87%');
      console.log('  用时:', judgeModule.time_used + '秒', judgeModule.time_used === 50 ? '✓' : '✗ 应为50秒');
      console.log('  整体验证:', isCorrect ? '✓ 通过' : '✗ 失败');
    } else {
      console.log('✗ 未找到判断推理模块数据');
    }
    
    const quantityModule = parentModules.find(m => m.module_name === '数量关系');
    if (quantityModule) {
      const isCorrect = 
        quantityModule.total_questions === 15 &&
        quantityModule.correct_answers === 5 &&
        quantityModule.accuracy_rate === 33;
      
      console.log('\n数量关系模块:');
      console.log('  总题数:', quantityModule.total_questions, quantityModule.total_questions === 15 ? '✓' : '✗ 应为15');
      console.log('  答对数:', quantityModule.correct_answers, quantityModule.correct_answers === 5 ? '✓' : '✗ 应为5');
      console.log('  正确率:', quantityModule.accuracy_rate + '%', quantityModule.accuracy_rate === 33 ? '✓' : '✗ 应为33%');
      console.log('  整体验证:', isCorrect ? '✓ 通过' : '✗ 失败');
    } else {
      console.log('✗ 未找到数量关系模块数据');
    }
    
    console.log('\n=== 测试完成 ===');
    
    return result;
  } catch (error) {
    console.error('测试失败:', error);
    throw error;
  }
}

// 在浏览器控制台中运行测试
// 使用方法：
// 1. 打开浏览器开发者工具（F12）
// 2. 在Console中输入：
//    import { testOcrParser } from '@/utils/testOcrParser'
//    testOcrParser()
