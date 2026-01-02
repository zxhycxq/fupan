# 数据显示问题调试指南

## 问题描述

用户反馈：使用表单录入的数据在各模块分析页面无法显示。具体表现为：
- 最新的2026年考试记录在考试列表中可以看到
- 在数据总览页面也能看到
- 但在各模块分析页面，使用"最近一个月"查看时，只能看到2015年12月31日的记录

## 可能的原因

### 1. 缺少module_scores数据

**最可能的原因**：表单录入的考试记录没有对应的module_scores数据。

- 图片上传方式会自动创建module_scores数据
- 表单编辑只更新exam_records表的基本信息
- 各模块分析页面需要从module_scores表查询数据

### 2. 日期过滤问题

**已修复**：之前的代码对于没有exam_date的记录会直接过滤掉。

- 现在改为：如果没有exam_date，使用created_at作为默认日期
- 添加了详细的调试日志

### 3. 日期范围选择问题

如果选择的日期范围不包含2026年的记录，也会导致看不到。

## 调试步骤

### 步骤1：访问调试页面

在浏览器地址栏输入：`/debug`

例如：`http://localhost:5173/debug`

### 步骤2：查看数据统计

调试页面会显示：
1. 最新的5条考试记录
2. 对应的模块分数记录
3. 每条记录的模块数据数量

**重点关注**：
- 2026年的记录是否在列表中
- 该记录的"模块数据数量"是否为0
- 如果为0，说明缺少module_scores数据

### 步骤3：查看浏览器控制台

打开浏览器开发者工具（F12），切换到Console标签。

**查找以下日志**：

1. **日期过滤日志**：
```
考试记录不在日期范围内: {
  exam_name: "...",
  exam_date: "...",
  created_at: "...",
  dateToUse: "...",
  startDate: "...",
  endDate: "..."
}
```

2. **模块数据统计日志**：
```
过滤后的考试记录数: 10
查询到的模块分数记录数: 8
以下考试记录没有模块数据: [...]
```

### 步骤4：分析问题

根据日志判断问题类型：

#### 情况A：记录不在日期范围内

**日志特征**：
- 看到"考试记录不在日期范围内"的日志
- 2026年的记录的dateToUse不在startDate和endDate之间

**解决方案**：
1. 调整日期范围，包含2026年的记录
2. 或者在考试记录列表中，编辑该记录，设置正确的exam_date

#### 情况B：缺少模块数据

**日志特征**：
- 看到"以下考试记录没有模块数据"的日志
- 2026年的记录在列表中

**解决方案**：
1. 通过图片上传方式重新创建该记录
2. 或者等待后续版本的"补充模块数据"功能

#### 情况C：记录根本不存在

**日志特征**：
- 调试页面中看不到2026年的记录
- 考试记录总数不包含该记录

**解决方案**：
1. 检查考试记录列表，确认记录是否真的存在
2. 刷新页面，重新加载数据

## 临时解决方案

### 方案1：重新上传（推荐）

1. 删除表单录入的记录
2. 使用图片上传方式重新创建
3. 图片上传会自动创建完整的module_scores数据

### 方案2：手动补充数据（需要数据库访问权限）

如果有数据库访问权限，可以手动为该记录创建module_scores数据：

```sql
-- 查询考试记录ID
SELECT id, exam_name FROM exam_records WHERE exam_name = '2026年的考试名称';

-- 为该记录创建默认的module_scores数据
INSERT INTO module_scores (exam_record_id, module_name, parent_module, total_questions, correct_answers, accuracy_rate)
VALUES
  ('考试记录ID', '政治理论', '政治理论', 0, 0, 0),
  ('考试记录ID', '常识判断', '常识判断', 0, 0, 0),
  -- ... 其他模块
;
```

### 方案3：等待功能更新

后续版本将提供：
1. 在表单中添加模块分数输入字段
2. 或者提供"补充模块数据"功能
3. 或者在保存时自动创建默认模块数据

## 预防措施

### 建议1：优先使用图片上传

- 图片上传会自动识别并创建完整的数据
- 包括exam_records和module_scores
- 数据更准确，更完整

### 建议2：检查数据完整性

在考试记录列表中，可以添加一个标识，显示哪些记录缺少模块数据。

### 建议3：设置exam_date

在表单编辑时，务必设置exam_date字段，避免日期过滤问题。

## 技术细节

### 数据查询流程

1. **加载考试记录**：
```typescript
const { data: exams } = await supabase
  .from('exam_records')
  .select('*')
  .order('sort_order', { ascending: true });
```

2. **日期过滤**：
```typescript
const filteredRecords = exams.filter(record => {
  const dateToUse = record.exam_date || record.created_at;
  const examDate = dayjs(dateToUse);
  return examDate.isSameOrAfter(startDate, 'day') 
    && examDate.isSameOrBefore(endDate, 'day');
});
```

3. **查询模块数据**：
```typescript
const { data: moduleScores } = await supabase
  .from('module_scores')
  .select('...')
  .in('module_name', subModules)
  .in('exam_record_id', filteredExamIds);
```

4. **数据完整性检查**：
```typescript
const examIdsWithModuleScores = new Set(moduleScores?.map(s => s.exam_record_id));
const examRecordsWithoutModuleScores = filteredRecords.filter(
  r => !examIdsWithModuleScores.has(r.id)
);
```

### 关键代码位置

- **日期过滤**：`src/pages/ModuleAnalysis.tsx` 第138-169行
- **模块数据查询**：`src/pages/ModuleAnalysis.tsx` 第178-219行
- **表单编辑**：`src/pages/ExamList.tsx` 第331-362行
- **调试页面**：`src/pages/DebugData.tsx`

## 联系支持

如果以上步骤无法解决问题，请提供以下信息：

1. 调试页面的截图
2. 浏览器控制台的日志
3. 问题记录的考试名称和日期
4. 选择的日期范围

## 更新日志

- 2026-01-02: 修复日期过滤逻辑，添加调试页面
- 2026-01-02: 添加详细的调试日志
- 2026-01-02: 创建调试指南文档
