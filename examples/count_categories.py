import re

# 读取文件内容
with open('src/data/questions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 提取所有category
categories = re.findall(r"category: '([^']+)'", content)

# 统计每个分类的数量
category_count = {}
for category in categories:
    category_count[category] = category_count.get(category, 0) + 1

# 打印结果
print("分类题目数量统计：")
for category, count in sorted(category_count.items()):
    print(f"{category}: {count}题")

print(f"\n总题目数: {sum(category_count.values())}")
print(f"总分类数: {len(category_count)}")

# 检查哪些分类不足15题
insufficient = [cat for cat, count in category_count.items() if count < 15]
print(f"\n不足15题的分类: {insufficient}")