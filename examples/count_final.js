const fs = require('fs');

const content = fs.readFileSync('src/data/questions.ts', 'utf8');
const categoryMatches = content.match(/category: '([^']+)'/g);
const categories = categoryMatches.map(match => match.replace("category: '", '').replace("'", ''));

const categoryCount = {};
categories.forEach(category => {
  categoryCount[category] = (categoryCount[category] || 0) + 1;
});

console.log('=== 最终分类题目数量统计 ===');
const sortedCategories = Object.entries(categoryCount).sort();

let allSufficient = true;
sortedCategories.forEach(([category, count]) => {
  const status = count >= 15 ? '✅' : '❌';
  if (count < 15) allSufficient = false;
  console.log(`${category}: ${count}题 ${status}`);
});

console.log(`\n总计: ${Object.values(categoryCount).reduce((a, b) => a + b, 0)}题`);
console.log(`分类数: ${Object.keys(categoryCount).length}`);

if (allSufficient) {
  console.log('\n🎉 所有分类都有至少15题！');
} else {
  console.log('\n⚠️ 仍有分类题目不足');
}