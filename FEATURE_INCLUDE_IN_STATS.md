# 参与统计功能说明

## 功能概述

在考试记录列表中新增"参与统计"列，允许用户控制哪些考试记录参与数据分析。

## 功能特性

### 1. 列表显示
- 位置：在"用时"列之后
- 表头：带有 tooltip 说明"默认开启，关闭代表不参与数据总览和各模块分析的统计分析"
- 显示：
  - 开启状态：绿色勾选图标 + "开启"文字
  - 关闭状态：灰色叉号图标 + "关闭"文字

### 2. 交互功能
- 点击按钮可切换开启/关闭状态
- 切换后立即保存到数据库
- 显示成功提示消息

### 3. 数据过滤
- **数据总览页面**：只统计 `include_in_stats=true` 的记录
- **各模块分析页面**：只统计 `include_in_stats=true` 的记录
- **考试记录列表**：显示所有记录（包括关闭统计的）

## 数据库变更

### 新增字段
```sql
ALTER TABLE exam_records 
ADD COLUMN include_in_stats BOOLEAN DEFAULT true;
```

### 字段说明
- 字段名：`include_in_stats`
- 类型：`BOOLEAN`
- 默认值：`true`
- 说明：是否参与统计分析

## 代码变更

### 1. 类型定义 (src/types/index.ts)
```typescript
export interface ExamRecord {
  // ... 其他字段
  include_in_stats?: boolean; // 是否参与统计分析，默认true
}
```

### 2. API 接口 (src/db/api.ts)
新增函数：
```typescript
export async function updateExamIncludeInStats(
  id: string, 
  includeInStats: boolean
): Promise<void>
```

### 3. 考试记录列表 (src/pages/ExamList.tsx)
- 新增"参与统计"列
- 新增 `handleIncludeInStatsChange` 处理函数
- 导入 `CheckCircleOutlined` 和 `CloseCircleOutlined` 图标

### 4. 数据总览 (src/pages/Dashboard.tsx)
- 在 `loadData` 函数中过滤数据：
  ```typescript
  const records = allRecords.filter(record => record.include_in_stats !== false);
  ```

### 5. 各模块分析 (src/pages/ModuleAnalysis.tsx)
- 在 `loadData` 函数中过滤数据：
  ```typescript
  const exams = (allExams || []).filter(record => record.include_in_stats !== false);
  ```

## 使用场景

1. **测试数据**：用户可以关闭测试考试的统计，避免影响真实数据分析
2. **异常数据**：某次考试状态异常，可以暂时关闭统计
3. **历史数据**：旧的考试记录可以保留但不参与当前分析
4. **对比分析**：可以通过开关不同记录来对比不同数据集的统计结果

## 注意事项

1. 默认所有记录都参与统计（`include_in_stats=true`）
2. 关闭统计的记录仍然在列表中显示，只是不参与数据分析
3. 可以随时切换开关状态，立即生效
4. 数据总览和各模块分析页面需要刷新才能看到最新的统计结果
