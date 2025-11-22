// 读取题库文件并统计每个分类的题目数量
const fs = require('fs');

try {
  const content = fs.readFileSync('src/data/questions.ts', 'utf8');
  
  // 提取所有题目的category
  const categoryMatches = content.match(/category: '([^']+)'/g);
  
  if (!categoryMatches) {
    console.log('未找到任何分类信息');
    return;
  }
  
  const categories = categoryMatches.map(match => match.replace("category: '", '').replace("'", ''));
  
  // 统计每个分类的题目数量
  const categoryCount = {};
  categories.forEach(category => {
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });
  
  console.log('=== 分类题目数量统计 ===');
  
  const sortedCategories = Object.entries(categoryCount).sort();
  
  let total = 0;
  sortedCategories.forEach(([category, count]) => {
    console.log(`${category}: ${count}题 ${count < 15 ? '⚠️ 不足15题' : '✅'}`);
    total += count;
  });
  
  console.log(`\n总计: ${total}题`);
  console.log(`分类数: ${Object.keys(categoryCount).length}`);
  
  // 检查不足15题的分类
  const insufficient = sortedCategories.filter(([, count]) => count < 15);
  if (insufficient.length > 0) {
    console.log('\n❌ 不足15题的分类:');
    insufficient.forEach(([category, count]) => {
      console.log(`  ${category}: 只有${count}题，还需${15 - count}题`);
    });
  } else {
    console.log('\n✅ 所有分类都有至少15题');
  }
  
} catch (error) {
  console.error('读取文件出错:', error.message);
}