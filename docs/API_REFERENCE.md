# API接口文档

## 目录

- [概述](#概述)
- [数据库API](#数据库api)
- [OCR识别API](#ocr识别api)
- [数据类型](#数据类型)
- [错误处理](#错误处理)
- [使用示例](#使用示例)

---

## 概述

本文档详细描述了考试成绩分析系统的所有API接口，包括数据库操作API和OCR识别API。

### 基础信息

- **API版本**: v1.0
- **数据格式**: JSON
- **字符编码**: UTF-8
- **时间格式**: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)

---

## 数据库API

所有数据库操作都封装在 `src/db/api.ts` 文件中。

### 1. 考试记录管理

#### 1.1 获取所有考试记录

**函数签名**:
```typescript
getAllExamRecords(): Promise<ExamRecord[]>
```

**描述**: 获取所有考试记录，按 `sort_order` 升序排列。

**参数**: 无

**返回值**: 
```typescript
ExamRecord[] // 考试记录数组
```

**异常**: 
- 数据库查询失败时返回空数组（不抛出异常）

**使用示例**:
```typescript
import { getAllExamRecords } from '@/db/api';

const records = await getAllExamRecords();
console.log('考试记录数量:', records.length);

records.forEach(record => {
  console.log(`第${record.exam_number}期: ${record.total_score}分`);
});
```

**SQL查询**:
```sql
SELECT * FROM exam_records 
ORDER BY sort_order ASC;
```

---

#### 1.2 根据ID获取考试记录详情

**函数签名**:
```typescript
getExamRecordById(id: string): Promise<ExamRecordDetail | null>
```

**描述**: 获取指定ID的考试记录及其所有模块得分。

**参数**:
| 参数名 | 类型 | 说明 | 必填 |
|--------|------|------|------|
| id | string | 考试记录ID（UUID格式） | 是 |

**返回值**: 
```typescript
ExamRecordDetail | null // 考试记录详情或null
```

**异常**: 
- 数据库查询失败时抛出Error

**使用示例**:
```typescript
import { getExamRecordById } from '@/db/api';

const detail = await getExamRecordById('7b6ce2e1-48c5-4ace-848e-871cb22d3d92');

if (detail) {
  console.log('考试名称:', detail.exam_name);
  console.log('总分:', detail.total_score);
  console.log('模块数量:', detail.module_scores.length);
  
  detail.module_scores.forEach(score => {
    console.log(`${score.module_name}: ${score.accuracy_rate}%`);
  });
} else {
  console.log('考试记录不存在');
}
```

**SQL查询**:
```sql
-- 查询考试记录
SELECT * FROM exam_records WHERE id = $1;

-- 查询模块得分
SELECT * FROM module_scores 
WHERE exam_record_id = $1 
ORDER BY module_name ASC;
```

---

#### 1.3 创建考试记录

**函数签名**:
```typescript
createExamRecord(
  record: Omit<ExamRecord, 'id' | 'created_at' | 'updated_at'>
): Promise<ExamRecord>
```

**描述**: 创建新的考试记录。

**参数**:
| 参数名 | 类型 | 说明 | 必填 |
|--------|------|------|------|
| record | object | 考试记录对象 | 是 |
| record.exam_number | number | 考试期数 | 是 |
| record.exam_name | string | 考试名称 | 是 |
| record.index_number | number | 索引项（必须唯一） | 是 |
| record.rating | number | 星级评分（0-5） | 是 |
| record.total_score | number | 总分 | 是 |
| record.sort_order | number | 排序顺序 | 是 |
| record.max_score | number | 最高分 | 否 |
| record.average_score | number | 平均分 | 否 |
| record.difficulty | number | 难度系数（0-5） | 否 |
| record.beat_percentage | number | 已击败考生百分比 | 否 |
| record.time_used | number | 用时（秒） | 否 |
| record.image_url | string | 图片URL | 否 |
| record.exam_type | string | 考试类型 | 否 |
| record.exam_date | string | 考试日期（YYYY-MM-DD） | 否 |
| record.improvements | string | 有进步的地方 | 否 |
| record.mistakes | string | 出错的地方 | 否 |
| record.report_url | string | 考试报告链接 | 否 |

**返回值**: 
```typescript
ExamRecord // 创建的考试记录（包含id、created_at、updated_at）
```

**异常**: 
- 数据库插入失败时抛出Error
- index_number重复时抛出Error

**使用示例**:
```typescript
import { createExamRecord } from '@/db/api';

const newRecord = await createExamRecord({
  exam_number: 1,
  exam_name: '2024年国考模拟考试',
  exam_type: '国考模考',
  index_number: 1,
  rating: 4.5,
  total_score: 75.5,
  max_score: 100,
  average_score: 62.1,
  difficulty: 4.9,
  beat_percentage: 48.9,
  time_used: 7200,
  exam_date: '2024-12-15',
  sort_order: 1,
});

console.log('创建成功，ID:', newRecord.id);
```

**SQL查询**:
```sql
INSERT INTO exam_records (
  exam_number, exam_name, exam_type, index_number, rating,
  total_score, max_score, average_score, difficulty,
  beat_percentage, time_used, exam_date, sort_order
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
) RETURNING *;
```

---

#### 1.4 更新考试记录

**函数签名**:
```typescript
updateExamRecord(
  id: string,
  updates: Partial<Omit<ExamRecord, 'id' | 'created_at' | 'updated_at'>>
): Promise<ExamRecord>
```

**描述**: 更新指定ID的考试记录。

**参数**:
| 参数名 | 类型 | 说明 | 必填 |
|--------|------|------|------|
| id | string | 考试记录ID | 是 |
| updates | object | 要更新的字段 | 是 |

**返回值**: 
```typescript
ExamRecord // 更新后的考试记录
```

**异常**: 
- 数据库更新失败时抛出Error
- 记录不存在时抛出Error

**使用示例**:
```typescript
import { updateExamRecord } from '@/db/api';

const updated = await updateExamRecord('7b6ce2e1-48c5-4ace-848e-871cb22d3d92', {
  rating: 5,
  improvements: '言语理解有明显进步，正确率提升10%',
  mistakes: '数量关系需要加强，建议多做练习题',
  exam_date: '2024-12-15',
});

console.log('更新成功:', updated);
```

**SQL查询**:
```sql
UPDATE exam_records 
SET 
  rating = $1,
  improvements = $2,
  mistakes = $3,
  exam_date = $4,
  updated_at = now()
WHERE id = $5
RETURNING *;
```

---

#### 1.5 删除考试记录

**函数签名**:
```typescript
deleteExamRecord(id: string): Promise<void>
```

**描述**: 删除指定ID的考试记录，会级联删除相关的模块得分记录。

**参数**:
| 参数名 | 类型 | 说明 | 必填 |
|--------|------|------|------|
| id | string | 考试记录ID | 是 |

**返回值**: 无

**异常**: 
- 数据库删除失败时抛出Error

**使用示例**:
```typescript
import { deleteExamRecord } from '@/db/api';

await deleteExamRecord('7b6ce2e1-48c5-4ace-848e-871cb22d3d92');
console.log('删除成功');
```

**SQL查询**:
```sql
DELETE FROM exam_records WHERE id = $1;

-- 由于外键约束设置了 ON DELETE CASCADE，
-- 相关的 module_scores 记录会自动删除
```

---

#### 1.6 获取最近N次考试记录

**函数签名**:
```typescript
getRecentExamRecords(limit: number = 10): Promise<ExamRecord[]>
```

**描述**: 获取最近N次考试记录，按创建时间降序排列。

**参数**:
| 参数名 | 类型 | 说明 | 必填 | 默认值 |
|--------|------|------|------|--------|
| limit | number | 返回记录数量 | 否 | 10 |

**返回值**: 
```typescript
ExamRecord[] // 考试记录数组
```

**异常**: 
- 数据库查询失败时抛出Error

**使用示例**:
```typescript
import { getRecentExamRecords } from '@/db/api';

const recent = await getRecentExamRecords(5);
console.log('最近5次考试:');
recent.forEach(record => {
  console.log(`${record.exam_name}: ${record.total_score}分`);
});
```

**SQL查询**:
```sql
SELECT * FROM exam_records 
ORDER BY created_at DESC 
LIMIT $1;
```

---

### 2. 模块得分管理

#### 2.1 创建模块得分记录

**函数签名**:
```typescript
createModuleScores(
  scores: Omit<ModuleScore, 'id' | 'created_at'>[]
): Promise<ModuleScore[]>
```

**描述**: 批量创建模块得分记录。

**参数**:
| 参数名 | 类型 | 说明 | 必填 |
|--------|------|------|------|
| scores | array | 模块得分数组 | 是 |
| scores[].exam_record_id | string | 考试记录ID | 是 |
| scores[].module_name | string | 模块名称 | 是 |
| scores[].parent_module | string | 父模块名称 | 否 |
| scores[].total_questions | number | 总题数 | 是 |
| scores[].correct_answers | number | 答对题数 | 是 |
| scores[].wrong_answers | number | 答错题数 | 是 |
| scores[].unanswered | number | 未答题数 | 是 |
| scores[].accuracy_rate | number | 正确率 | 否 |
| scores[].time_used | number | 用时（秒） | 否 |

**返回值**: 
```typescript
ModuleScore[] // 创建的模块得分数组
```

**异常**: 
- 数据库插入失败时抛出Error

**使用示例**:
```typescript
import { createModuleScores } from '@/db/api';

const scores = await createModuleScores([
  {
    exam_record_id: '7b6ce2e1-48c5-4ace-848e-871cb22d3d92',
    module_name: '政治理论',
    parent_module: null,
    total_questions: 20,
    correct_answers: 15,
    wrong_answers: 5,
    unanswered: 0,
    accuracy_rate: 75,
    time_used: 1680,
  },
  {
    exam_record_id: '7b6ce2e1-48c5-4ace-848e-871cb22d3d92',
    module_name: '马克思主义',
    parent_module: '政治理论',
    total_questions: 3,
    correct_answers: 2,
    wrong_answers: 1,
    unanswered: 0,
    accuracy_rate: 67,
    time_used: 180,
  },
]);

console.log('创建了', scores.length, '条模块得分记录');
```

**SQL查询**:
```sql
INSERT INTO module_scores (
  exam_record_id, module_name, parent_module,
  total_questions, correct_answers, wrong_answers,
  unanswered, accuracy_rate, time_used
) VALUES 
  ($1, $2, $3, $4, $5, $6, $7, $8, $9),
  ($10, $11, $12, $13, $14, $15, $16, $17, $18)
RETURNING *;
```

---

#### 2.2 获取指定考试的所有模块得分

**函数签名**:
```typescript
getModuleScoresByExamId(examId: string): Promise<ModuleScore[]>
```

**描述**: 获取指定考试记录的所有模块得分，按模块名称升序排列。

**参数**:
| 参数名 | 类型 | 说明 | 必填 |
|--------|------|------|------|
| examId | string | 考试记录ID | 是 |

**返回值**: 
```typescript
ModuleScore[] // 模块得分数组
```

**异常**: 
- 数据库查询失败时抛出Error

**使用示例**:
```typescript
import { getModuleScoresByExamId } from '@/db/api';

const scores = await getModuleScoresByExamId('7b6ce2e1-48c5-4ace-848e-871cb22d3d92');

// 分离大模块和子模块
const mainModules = scores.filter(s => !s.parent_module);
const subModules = scores.filter(s => s.parent_module);

console.log('大模块数量:', mainModules.length);
console.log('子模块数量:', subModules.length);
```

**SQL查询**:
```sql
SELECT * FROM module_scores 
WHERE exam_record_id = $1 
ORDER BY module_name ASC;
```

---

#### 2.3 更新模块得分

**函数签名**:
```typescript
updateModuleScore(
  id: string,
  updates: Partial<Omit<ModuleScore, 'id' | 'exam_record_id' | 'created_at'>>
): Promise<void>
```

**描述**: 更新指定ID的模块得分记录。

**参数**:
| 参数名 | 类型 | 说明 | 必填 |
|--------|------|------|------|
| id | string | 模块得分ID | 是 |
| updates | object | 要更新的字段 | 是 |

**返回值**: 无

**异常**: 
- 数据库更新失败时抛出Error

**使用示例**:
```typescript
import { updateModuleScore } from '@/db/api';

await updateModuleScore('uuid-456', {
  accuracy_rate: 80,
  time_used: 1500,
  correct_answers: 16,
  wrong_answers: 4,
});

console.log('更新成功');
```

**SQL查询**:
```sql
UPDATE module_scores 
SET 
  accuracy_rate = $1,
  time_used = $2,
  correct_answers = $3,
  wrong_answers = $4
WHERE id = $5;
```

---

#### 2.4 获取所有大模块的平均得分

**函数签名**:
```typescript
getModuleAverageScores(): Promise<{ 
  module_name: string; 
  avg_accuracy: number 
}[]>
```

**描述**: 计算所有大模块（parent_module = NULL）的平均正确率。

**参数**: 无

**返回值**: 
```typescript
Array<{
  module_name: string;    // 模块名称
  avg_accuracy: number;   // 平均正确率
}>
```

**异常**: 
- 数据库查询失败时抛出Error

**使用示例**:
```typescript
import { getModuleAverageScores } from '@/db/api';

const avgScores = await getModuleAverageScores();

avgScores.forEach(item => {
  console.log(`${item.module_name}: ${item.avg_accuracy.toFixed(2)}%`);
});

// 找出弱势模块（正确率<60%）
const weakModules = avgScores.filter(item => item.avg_accuracy < 60);
console.log('弱势模块:', weakModules);
```

**SQL查询**:
```sql
SELECT 
  module_name,
  accuracy_rate
FROM module_scores
WHERE parent_module IS NULL;

-- 在应用层计算平均值
```

---

#### 2.5 获取模块趋势数据

**函数签名**:
```typescript
getModuleTrendData(): Promise<{
  exam_numbers: number[];
  exam_names: string[];
  exam_dates: (string | null)[];
  modules: { module_name: string; data: (number | null)[] }[];
}>
```

**描述**: 获取所有大模块的正确率趋势数据，用于绘制折线图。

**参数**: 无

**返回值**: 
```typescript
{
  exam_numbers: number[];           // 考试期数数组
  exam_names: string[];             // 考试名称数组
  exam_dates: (string | null)[];    // 考试日期数组
  modules: Array<{
    module_name: string;            // 模块名称
    data: (number | null)[];        // 正确率数据（对应每期考试）
  }>;
}
```

**异常**: 
- 数据库查询失败时抛出Error

**使用示例**:
```typescript
import { getModuleTrendData } from '@/db/api';

const trendData = await getModuleTrendData();

console.log('考试期数:', trendData.exam_numbers);
// [1, 2, 3, 4, 5]

console.log('考试名称:', trendData.exam_names);
// ['第1期', '第2期', '第3期', '第4期', '第5期']

console.log('模块数据:');
trendData.modules.forEach(module => {
  console.log(`${module.module_name}:`, module.data);
  // 政治理论: [75, 80, 78, 82, 85]
});

// 用于ECharts
const option = {
  xAxis: {
    data: trendData.exam_names,
  },
  series: trendData.modules.map(module => ({
    name: module.module_name,
    type: 'line',
    data: module.data,
  })),
};
```

**SQL查询**:
```sql
-- 查询考试记录
SELECT id, exam_number, exam_name, exam_date, sort_order
FROM exam_records
ORDER BY sort_order ASC;

-- 查询模块得分
SELECT exam_record_id, module_name, accuracy_rate
FROM module_scores
WHERE parent_module IS NULL
ORDER BY module_name ASC;

-- 在应用层组织数据
```

---

#### 2.6 获取模块用时趋势数据

**函数签名**:
```typescript
getModuleTimeTrendData(): Promise<{
  exam_numbers: number[];
  exam_names: string[];
  exam_dates: (string | null)[];
  modules: { module_name: string; data: (number | null)[] }[];
}>
```

**描述**: 获取所有大模块的用时趋势数据，用于绘制折线图。

**参数**: 无

**返回值**: 
```typescript
{
  exam_numbers: number[];           // 考试期数数组
  exam_names: string[];             // 考试名称数组
  exam_dates: (string | null)[];    // 考试日期数组
  modules: Array<{
    module_name: string;            // 模块名称
    data: (number | null)[];        // 用时数据（分钟，对应每期考试）
  }>;
}
```

**说明**: 
- 用时单位为分钟（自动从秒转换）
- 保留1位小数

**异常**: 
- 数据库查询失败时抛出Error

**使用示例**:
```typescript
import { getModuleTimeTrendData } from '@/db/api';

const timeData = await getModuleTimeTrendData();

console.log('模块用时趋势:');
timeData.modules.forEach(module => {
  console.log(`${module.module_name}:`, module.data);
  // 政治理论: [28.0, 25.5, 27.0, 24.0, 23.5] (分钟)
});

// 用于ECharts
const option = {
  xAxis: {
    data: timeData.exam_names,
  },
  yAxis: {
    name: '用时（分钟）',
  },
  series: timeData.modules.map(module => ({
    name: module.module_name,
    type: 'line',
    data: module.data,
  })),
};
```

**SQL查询**:
```sql
-- 查询考试记录
SELECT id, exam_number, exam_name, exam_date, sort_order
FROM exam_records
ORDER BY sort_order ASC;

-- 查询模块用时
SELECT exam_record_id, module_name, time_used
FROM module_scores
WHERE parent_module IS NULL
ORDER BY module_name ASC;

-- 在应用层转换单位（秒 → 分钟）
```

---

### 3. 用户设置管理

#### 3.1 获取用户设置

**函数签名**:
```typescript
getUserSettings(userId: string = 'default'): Promise<UserSetting[]>
```

**描述**: 获取指定用户的所有模块目标设置。

**参数**:
| 参数名 | 类型 | 说明 | 必填 | 默认值 |
|--------|------|------|------|--------|
| userId | string | 用户ID | 否 | 'default' |

**返回值**: 
```typescript
UserSetting[] // 用户设置数组
```

**异常**: 
- 数据库查询失败时抛出Error

**使用示例**:
```typescript
import { getUserSettings } from '@/db/api';

const settings = await getUserSettings();

settings.forEach(s => {
  console.log(`${s.module_name}: 目标${s.target_accuracy}%`);
});

// 转换为Map方便查找
const settingsMap = new Map(
  settings.map(s => [s.module_name, s.target_accuracy])
);

const target = settingsMap.get('政治理论') || 70;
console.log('政治理论目标正确率:', target);
```

**SQL查询**:
```sql
SELECT * FROM user_settings 
WHERE user_id = $1 
ORDER BY module_name ASC;
```

---

#### 3.2 更新或创建用户设置

**函数签名**:
```typescript
upsertUserSetting(
  userId: string = 'default',
  moduleName: string,
  targetAccuracy: number
): Promise<void>
```

**描述**: 更新或创建单个模块的目标设置。如果记录已存在则更新，否则创建新记录。

**参数**:
| 参数名 | 类型 | 说明 | 必填 | 默认值 |
|--------|------|------|------|--------|
| userId | string | 用户ID | 否 | 'default' |
| moduleName | string | 模块名称 | 是 | - |
| targetAccuracy | number | 目标正确率（0-100） | 是 | - |

**返回值**: 无

**异常**: 
- 数据库操作失败时抛出Error

**使用示例**:
```typescript
import { upsertUserSetting } from '@/db/api';

await upsertUserSetting('default', '政治理论', 80);
console.log('设置已保存');
```

**SQL查询**:
```sql
INSERT INTO user_settings (user_id, module_name, target_accuracy, updated_at)
VALUES ($1, $2, $3, now())
ON CONFLICT (user_id, module_name)
DO UPDATE SET 
  target_accuracy = EXCLUDED.target_accuracy,
  updated_at = now();
```

---

#### 3.3 批量更新用户设置

**函数签名**:
```typescript
batchUpsertUserSettings(
  settings: Array<{ module_name: string; target_accuracy: number }>,
  userId: string = 'default'
): Promise<void>
```

**描述**: 批量更新或创建多个模块的目标设置。

**参数**:
| 参数名 | 类型 | 说明 | 必填 | 默认值 |
|--------|------|------|------|--------|
| settings | array | 设置数组 | 是 | - |
| settings[].module_name | string | 模块名称 | 是 | - |
| settings[].target_accuracy | number | 目标正确率 | 是 | - |
| userId | string | 用户ID | 否 | 'default' |

**返回值**: 无

**异常**: 
- 数据库操作失败时抛出Error

**使用示例**:
```typescript
import { batchUpsertUserSettings } from '@/db/api';

await batchUpsertUserSettings([
  { module_name: '政治理论', target_accuracy: 80 },
  { module_name: '常识判断', target_accuracy: 75 },
  { module_name: '言语理解与表达', target_accuracy: 85 },
  { module_name: '数量关系', target_accuracy: 70 },
  { module_name: '判断推理', target_accuracy: 80 },
  { module_name: '资料分析', target_accuracy: 85 },
]);

console.log('批量设置已保存');
```

**SQL查询**:
```sql
INSERT INTO user_settings (user_id, module_name, target_accuracy, updated_at)
VALUES 
  ($1, $2, $3, now()),
  ($4, $5, $6, now()),
  ($7, $8, $9, now())
ON CONFLICT (user_id, module_name)
DO UPDATE SET 
  target_accuracy = EXCLUDED.target_accuracy,
  updated_at = now();
```

---

### 4. 考试配置管理

#### 4.1 获取考试配置

**函数签名**:
```typescript
getExamConfig(): Promise<{
  exam_type?: string;
  exam_name?: string;
  exam_date?: string;
  grade_label_theme?: string;
} | null>
```

**描述**: 获取全局考试配置信息。

**参数**: 无

**返回值**: 
```typescript
{
  exam_type?: string;           // 考试类型
  exam_name?: string;           // 考试名称
  exam_date?: string;           // 考试日期
  grade_label_theme?: string;   // 成绩等级标签主题
} | null
```

**异常**: 
- 数据库查询失败时返回null（不抛出异常）

**使用示例**:
```typescript
import { getExamConfig } from '@/db/api';

const config = await getExamConfig();

if (config) {
  console.log('考试类型:', config.exam_type);
  console.log('考试名称:', config.exam_name);
  console.log('考试日期:', config.exam_date);
  console.log('等级标签主题:', config.grade_label_theme);
} else {
  console.log('未配置考试信息');
}
```

**SQL查询**:
```sql
SELECT exam_type, exam_name, exam_date, grade_label_theme
FROM exam_config
LIMIT 1;
```

---

#### 4.2 保存考试配置

**函数签名**:
```typescript
saveExamConfig(
  examType: string,
  examDate: string,
  gradeLabelTheme: string = 'theme4',
  examName: string = ''
): Promise<void>
```

**描述**: 保存全局考试配置信息。如果配置已存在则更新，否则创建新配置。

**参数**:
| 参数名 | 类型 | 说明 | 必填 | 默认值 |
|--------|------|------|------|--------|
| examType | string | 考试类型 | 是 | - |
| examDate | string | 考试日期（YYYY-MM-DD） | 是 | - |
| gradeLabelTheme | string | 成绩等级标签主题 | 否 | 'theme4' |
| examName | string | 考试名称 | 否 | '' |

**考试类型选项**:
- `国考真题`
- `国考模考`
- `省考真题`
- `省考模考`
- `其他`

**等级标签主题选项**:
- `theme1`: 优秀、良好、及格、不及格
- `theme2`: A+、A、B、C、D
- `theme3`: 卓越、优秀、良好、合格、待提高
- `theme4`: ⭐⭐⭐⭐⭐、⭐⭐⭐⭐、⭐⭐⭐、⭐⭐、⭐

**返回值**: 无

**异常**: 
- 数据库操作失败时抛出Error

**使用示例**:
```typescript
import { saveExamConfig } from '@/db/api';

await saveExamConfig(
  '国考模考',
  '2024-12-15',
  'theme4',
  '2024年国家公务员考试模拟考试'
);

console.log('配置已保存');
```

**SQL查询**:
```sql
-- 检查是否存在配置
SELECT id FROM exam_config LIMIT 1;

-- 如果存在，更新
UPDATE exam_config 
SET 
  exam_type = $1,
  exam_name = $2,
  exam_date = $3,
  grade_label_theme = $4,
  updated_at = now()
WHERE id = $5;

-- 如果不存在，创建
INSERT INTO exam_config (exam_type, exam_name, exam_date, grade_label_theme)
VALUES ($1, $2, $3, $4);
```

---

### 5. 统计分析API

#### 5.1 获取模块详细统计数据

**函数签名**:
```typescript
getModuleDetailedStats(): Promise<Array<{
  exam_number: number;
  exam_name: string;
  exam_date: string | null;
  module_name: string;
  parent_module: string | null;
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  time_used: number;
}>>
```

**描述**: 获取所有模块和子模块的详细统计数据，按期数分组。

**参数**: 无

**返回值**: 
```typescript
Array<{
  exam_number: number;        // 考试期数
  exam_name: string;          // 考试名称
  exam_date: string | null;   // 考试日期
  module_name: string;        // 模块名称
  parent_module: string | null; // 父模块名称
  total_questions: number;    // 总题数
  correct_answers: number;    // 答对题数
  accuracy: number;           // 正确率
  time_used: number;          // 用时（秒）
}>
```

**异常**: 
- 数据库查询失败时抛出Error

**使用示例**:
```typescript
import { getModuleDetailedStats } from '@/db/api';

const stats = await getModuleDetailedStats();

// 按考试期数分组
const groupedByExam = stats.reduce((acc, item) => {
  if (!acc[item.exam_number]) {
    acc[item.exam_number] = [];
  }
  acc[item.exam_number].push(item);
  return acc;
}, {} as Record<number, typeof stats>);

console.log('第1期考试模块统计:');
groupedByExam[1]?.forEach(item => {
  console.log(`${item.module_name}: ${item.accuracy}%`);
});
```

**SQL查询**:
```sql
SELECT 
  er.exam_number,
  er.exam_name,
  er.exam_date,
  ms.module_name,
  ms.parent_module,
  ms.total_questions,
  ms.correct_answers,
  ms.accuracy_rate as accuracy,
  ms.time_used
FROM module_scores ms
JOIN exam_records er ON er.id = ms.exam_record_id
ORDER BY er.sort_order ASC, ms.module_name ASC;
```

---

## OCR识别API

### 1. 识别图片中的文字

**函数签名**:
```typescript
recognizeText(request: OcrRequest): Promise<string>
```

**描述**: 调用OCR API识别图片中的文字。

**参数**:
| 参数名 | 类型 | 说明 | 必填 | 默认值 |
|--------|------|------|------|--------|
| request | object | OCR请求对象 | 是 | - |
| request.image | string | Base64编码的图片 | 是 | - |
| request.language_type | string | 识别语言类型 | 否 | 'CHN_ENG' |

**返回值**: 
```typescript
string // 识别出的文本（每行用\n分隔）
```

**异常**: 
- OCR API调用失败时抛出Error
- 图片格式不支持时抛出Error
- 图片大小超限时抛出Error

**使用示例**:
```typescript
import { recognizeText, fileToBase64 } from '@/services/imageRecognition';

// 1. 将文件转换为Base64
const base64 = await fileToBase64(file);

// 2. 调用OCR识别
const text = await recognizeText({
  image: base64,
  language_type: 'CHN_ENG',
});

console.log('识别结果:');
console.log(text);

// 3. 解析数据
import { parseExamData } from '@/services/dataParser';
const { examRecord, moduleScores } = parseExamData(text, 1, 7200);

console.log('总分:', examRecord.total_score);
console.log('模块数量:', moduleScores.length);
```

**API调用**:
```typescript
const response = await fetch(`${API_BASE_URL}/6KmAKxK9aE29irAwt32QRk`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-App-Id': APP_ID,
  },
  body: formData.toString(),
});
```

---

### 2. 文件转Base64

**函数签名**:
```typescript
fileToBase64(file: File): Promise<string>
```

**描述**: 将File对象转换为Base64编码字符串。

**参数**:
| 参数名 | 类型 | 说明 | 必填 |
|--------|------|------|------|
| file | File | 文件对象 | 是 |

**返回值**: 
```typescript
string // Base64编码字符串（不包含data:image/xxx;base64,前缀）
```

**异常**: 
- 文件读取失败时抛出Error

**使用示例**:
```typescript
import { fileToBase64 } from '@/services/imageRecognition';

const input = document.querySelector('input[type="file"]');
const file = input.files[0];

const base64 = await fileToBase64(file);
console.log('Base64长度:', base64.length);
console.log('Base64前100字符:', base64.substring(0, 100));
```

---

### 3. 压缩图片

**函数签名**:
```typescript
compressImage(
  file: File, 
  maxWidth: number = 2400,
  quality: number = 0.95
): Promise<File>
```

**描述**: 压缩和增强图片，提高OCR识别准确率。

**参数**:
| 参数名 | 类型 | 说明 | 必填 | 默认值 |
|--------|------|------|------|--------|
| file | File | 原始图片文件 | 是 | - |
| maxWidth | number | 最大宽度（像素） | 否 | 2400 |
| quality | number | 压缩质量（0-1） | 否 | 0.95 |

**返回值**: 
```typescript
File // 处理后的图片文件
```

**异常**: 
- 处理失败时返回原文件（不抛出异常）

**使用示例**:
```typescript
import { compressImage } from '@/services/imageRecognition';

const input = document.querySelector('input[type="file"]');
const file = input.files[0];

console.log('原始文件大小:', (file.size / 1024 / 1024).toFixed(2), 'MB');

const compressed = await compressImage(file, 2400, 0.95);

console.log('压缩后大小:', (compressed.size / 1024 / 1024).toFixed(2), 'MB');
console.log('压缩率:', ((1 - compressed.size / file.size) * 100).toFixed(2), '%');
```

**处理流程**:
1. 读取图片文件
2. 创建Canvas元素
3. 检测是否为长截图（高宽比>2.5）
4. 按比例缩放到最大宽度
5. 增强对比度
6. 锐化处理
7. 降噪处理（仅长截图）
8. 转换为JPEG格式
9. 返回新的File对象

---

### 4. 解析考试数据

**函数签名**:
```typescript
parseExamData(
  ocrText: string,
  examNumber: number,
  timeUsedSeconds: number = 0
): {
  examRecord: Omit<ExamRecord, 'id' | 'created_at' | 'updated_at'>;
  moduleScores: Omit<ModuleScore, 'id' | 'exam_record_id' | 'created_at'>[];
}
```

**描述**: 解析OCR识别的文本，提取考试数据。

**参数**:
| 参数名 | 类型 | 说明 | 必填 | 默认值 |
|--------|------|------|------|--------|
| ocrText | string | OCR识别出的文本 | 是 | - |
| examNumber | number | 考试期数 | 是 | - |
| timeUsedSeconds | number | 总用时（秒） | 否 | 0 |

**返回值**: 
```typescript
{
  examRecord: Omit<ExamRecord, 'id' | 'created_at' | 'updated_at'>;
  moduleScores: Omit<ModuleScore, 'id' | 'exam_record_id' | 'created_at'>[];
}
```

**异常**: 
- 解析失败时不抛出异常，返回空数据

**使用示例**:
```typescript
import { parseExamData } from '@/services/dataParser';

const ocrText = `
我的得分: 75.5
最高分: 100
平均分: 62.1
难度: 4.9
已击败考生: 48.9%

政治理论
共20题，答对15题，正确率75%，用时28分

马克思主义
共3题，答对2题，正确率67%，用时3分
`;

const { examRecord, moduleScores } = parseExamData(ocrText, 1, 7200);

console.log('考试记录:');
console.log('  总分:', examRecord.total_score);
console.log('  最高分:', examRecord.max_score);
console.log('  平均分:', examRecord.average_score);
console.log('  难度:', examRecord.difficulty);
console.log('  击败百分比:', examRecord.beat_percentage);

console.log('\n模块得分:');
moduleScores.forEach(score => {
  const prefix = score.parent_module ? '  - ' : '';
  console.log(`${prefix}${score.module_name}: ${score.accuracy_rate}% (${score.time_used}秒)`);
});
```

**解析流程**:
1. 文本预处理（统一标点、清理空白、修复错误）
2. 提取总体信息（总分、最高分、平均分、难度、击败百分比）
3. 遍历模块结构
4. 对每个模块尝试三种格式匹配：
   - 手机端格式
   - 网页版格式
   - 简化格式
5. 提取子模块数据
6. 数据验证
7. 返回结果

---

## 数据类型

### ExamRecord - 考试记录

```typescript
export interface ExamRecord {
  id: string;                    // 记录ID（UUID）
  exam_number: number;           // 考试期数
  exam_name: string;             // 考试名称
  exam_type?: string;            // 考试类型
  index_number: number;          // 索引项（唯一）
  rating: number;                // 星级评分（0-5）
  total_score: number;           // 总分
  max_score?: number;            // 最高分
  average_score?: number;        // 平均分
  pass_rate?: number;            // 通过率
  difficulty?: number;           // 难度系数（0-5）
  beat_percentage?: number;      // 已击败考生百分比
  time_used?: number;            // 用时（秒）
  image_url?: string;            // 图片URL
  improvements?: string;         // 有进步的地方
  mistakes?: string;             // 出错的地方
  exam_date?: string;            // 考试日期（YYYY-MM-DD）
  report_url?: string;           // 考试报告链接
  sort_order: number;            // 排序顺序
  created_at: string;            // 创建时间（ISO 8601）
  updated_at: string;            // 更新时间（ISO 8601）
}
```

**字段说明**:

- **id**: 系统自动生成的UUID
- **exam_number**: 考试期数，用于显示"第X期"
- **exam_name**: 考试名称，如"2024年国考模拟考试"
- **exam_type**: 考试类型，可选值：国考真题、国考模考、省考真题、省考模考、其他
- **index_number**: 索引项，必须唯一，用于排序
- **rating**: 星级评分，支持半星，范围0-5
- **total_score**: 总分
- **max_score**: 最高分（从OCR识别）
- **average_score**: 平均分（从OCR识别）
- **difficulty**: 难度系数，范围0-5
- **beat_percentage**: 已击败考生百分比
- **time_used**: 总用时（秒）
- **image_url**: 上传的成绩截图URL
- **improvements**: 有进步的地方（用户填写）
- **mistakes**: 出错的地方（用户填写）
- **exam_date**: 考试日期
- **report_url**: 考试报告链接（用户填写）
- **sort_order**: 排序顺序，用于自定义排序
- **created_at**: 创建时间
- **updated_at**: 更新时间

---

### ModuleScore - 模块得分

```typescript
export interface ModuleScore {
  id: string;                    // 记录ID（UUID）
  exam_record_id: string;        // 关联考试记录ID
  module_name: string;           // 模块名称
  parent_module?: string;        // 父模块名称
  total_questions: number;       // 总题数
  correct_answers: number;       // 答对题数
  wrong_answers: number;         // 答错题数
  unanswered: number;            // 未答题数
  accuracy_rate?: number;        // 正确率
  time_used?: number;            // 用时（秒）
  created_at: string;            // 创建时间（ISO 8601）
}
```

**字段说明**:

- **id**: 系统自动生成的UUID
- **exam_record_id**: 关联的考试记录ID
- **module_name**: 模块名称，如"政治理论"、"马克思主义"
- **parent_module**: 父模块名称，NULL表示大模块，否则为子模块
- **total_questions**: 总题数
- **correct_answers**: 答对题数
- **wrong_answers**: 答错题数
- **unanswered**: 未答题数
- **accuracy_rate**: 正确率（百分比）
- **time_used**: 用时（秒）
- **created_at**: 创建时间

**层级关系**:
- 大模块: `parent_module = NULL`
- 子模块: `parent_module = '大模块名'`

**示例**:
```typescript
// 大模块
{
  module_name: '政治理论',
  parent_module: null,
  total_questions: 20,
  correct_answers: 15,
  accuracy_rate: 75,
}

// 子模块
{
  module_name: '马克思主义',
  parent_module: '政治理论',
  total_questions: 3,
  correct_answers: 2,
  accuracy_rate: 67,
}
```

---

### ExamRecordDetail - 考试记录详情

```typescript
export interface ExamRecordDetail extends ExamRecord {
  module_scores: ModuleScore[];  // 模块得分数组
}
```

**说明**: 包含考试记录的所有信息和相关的模块得分。

**使用示例**:
```typescript
const detail: ExamRecordDetail = {
  id: 'uuid-123',
  exam_number: 1,
  exam_name: '第1期',
  total_score: 75.5,
  // ... 其他字段 ...
  module_scores: [
    {
      id: 'uuid-456',
      exam_record_id: 'uuid-123',
      module_name: '政治理论',
      parent_module: null,
      total_questions: 20,
      correct_answers: 15,
      accuracy_rate: 75,
      // ... 其他字段 ...
    },
    // ... 更多模块 ...
  ],
};
```

---

### UserSetting - 用户设置

```typescript
export interface UserSetting {
  id: string;                    // 记录ID（UUID）
  user_id: string;               // 用户ID
  module_name: string;           // 模块名称
  target_accuracy: number;       // 目标正确率
  created_at: string;            // 创建时间（ISO 8601）
  updated_at: string;            // 更新时间（ISO 8601）
}
```

**字段说明**:

- **id**: 系统自动生成的UUID
- **user_id**: 用户ID，默认为'default'
- **module_name**: 模块名称
- **target_accuracy**: 目标正确率（百分比）
- **created_at**: 创建时间
- **updated_at**: 更新时间

---

### OcrRequest - OCR请求

```typescript
export interface OcrRequest {
  image: string;                 // Base64编码的图片
  language_type?: string;        // 识别语言类型
  detect_direction?: boolean;    // 是否检测图像朝向
  probability?: boolean;         // 是否返回置信度
}
```

**字段说明**:

- **image**: Base64编码的图片（不包含前缀）
- **language_type**: 识别语言类型，可选值：
  - `CHN_ENG`: 中英文混合（默认）
  - `ENG`: 英文
  - `JAP`: 日文
  - `KOR`: 韩文
  - `FRE`: 法文
  - `SPA`: 西班牙文
  - `POR`: 葡萄牙文
  - `GER`: 德文
  - `ITA`: 意大利文
  - `RUS`: 俄文
- **detect_direction**: 是否检测图像朝向
- **probability**: 是否返回置信度

---

### OcrResponse - OCR响应

```typescript
export interface OcrResponse {
  status: number;                // 状态码（0表示成功）
  msg: string;                   // 消息
  data: {
    log_id: number;              // 日志ID
    direction?: number;          // 图像方向
    words_result_num: number;    // 识别到的文字行数
    words_result: Array<{
      words: string;             // 识别出的文字
      probability?: {
        average: number;         // 平均置信度
        variance: number;        // 方差
        min: number;             // 最小置信度
      };
    }>;
  };
}
```

**字段说明**:

- **status**: 状态码
  - `0`: 成功
  - `非0`: 失败
- **msg**: 消息
  - 成功时为 "success"
  - 失败时为错误信息
- **data.log_id**: 日志ID，用于追踪
- **data.direction**: 图像方向
  - `0`: 正向
  - `1`: 逆时针90度
  - `2`: 逆时针180度
  - `3`: 逆时针270度
- **data.words_result_num**: 识别到的文字行数
- **data.words_result**: 识别结果数组
  - **words**: 识别出的文字
  - **probability**: 置信度信息（如果请求时设置了probability=true）
    - **average**: 平均置信度（0-1）
    - **variance**: 方差
    - **min**: 最小置信度

---

## 错误处理

### 错误类型

#### 1. 数据库错误

**错误码**: `PGRST`开头

**常见错误**:
- `PGRST116`: 记录不存在
- `23505`: 唯一约束冲突
- `23503`: 外键约束冲突

**处理方式**:
```typescript
try {
  const record = await createExamRecord(data);
} catch (error: any) {
  if (error.code === '23505') {
    console.error('索引项已存在，请使用不同的索引项');
  } else {
    console.error('创建失败:', error.message);
  }
}
```

#### 2. OCR识别错误

**错误码**: 
- `216015`: 模块关闭
- `216100`: 非法参数
- `216101`: 图片格式错误
- `216102`: 图片大小超限
- `216200`: 空图片
- `216201`: 图片中无文字
- `216202`: 识别超时
- `216630`: 识别错误
- `282000`: 内部错误

**处理方式**:
```typescript
try {
  const text = await recognizeText(request);
} catch (error: any) {
  if (error.message.includes('图片格式')) {
    console.error('图片格式不支持，请使用JPG、PNG或BMP格式');
  } else if (error.message.includes('图片大小')) {
    console.error('图片大小超过4MB，请压缩后重试');
  } else {
    console.error('识别失败:', error.message);
  }
}
```

#### 3. 网络错误

**错误类型**:
- `TypeError: Failed to fetch`: 网络连接失败
- `TimeoutError`: 请求超时

**处理方式**:
```typescript
try {
  const result = await fetch(url);
} catch (error: any) {
  if (error.name === 'TypeError') {
    console.error('网络连接失败，请检查网络设置');
  } else if (error.name === 'TimeoutError') {
    console.error('请求超时，请稍后重试');
  } else {
    console.error('请求失败:', error.message);
  }
}
```

### 错误处理最佳实践

#### 1. 使用try-catch

```typescript
async function handleUpload(file: File) {
  try {
    // 1. 压缩图片
    const compressed = await compressImage(file);
    
    // 2. 转换Base64
    const base64 = await fileToBase64(compressed);
    
    // 3. OCR识别
    const text = await recognizeText({ image: base64 });
    
    // 4. 解析数据
    const { examRecord, moduleScores } = parseExamData(text, 1, 7200);
    
    // 5. 保存到数据库
    const record = await createExamRecord(examRecord);
    await createModuleScores(
      moduleScores.map(s => ({ ...s, exam_record_id: record.id }))
    );
    
    console.log('上传成功');
  } catch (error: any) {
    console.error('上传失败:', error.message);
    // 显示错误提示
    alert(`上传失败: ${error.message}`);
  }
}
```

#### 2. 使用Toast通知

```typescript
import { toast } from '@/components/ui/use-toast';

async function handleUpload(file: File) {
  try {
    // ... 处理逻辑 ...
    
    toast({
      title: '上传成功',
      description: '考试成绩已保存',
    });
  } catch (error: any) {
    toast({
      title: '上传失败',
      description: error.message,
      variant: 'destructive',
    });
  }
}
```

#### 3. 错误日志记录

```typescript
function logError(context: string, error: any) {
  console.error(`[${context}] 错误:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    stack: error.stack,
  });
}

try {
  await createExamRecord(data);
} catch (error) {
  logError('创建考试记录', error);
  throw error;
}
```

---

## 使用示例

### 完整的上传流程

```typescript
import { compressImage, fileToBase64, recognizeText } from '@/services/imageRecognition';
import { parseExamData } from '@/services/dataParser';
import { createExamRecord, createModuleScores } from '@/db/api';
import { toast } from '@/components/ui/use-toast';

async function uploadExamImage(
  file: File,
  examName: string,
  indexNumber: number,
  timeUsedSeconds: number
) {
  try {
    // 1. 显示加载提示
    toast({
      title: '正在处理',
      description: '正在压缩图片...',
    });

    // 2. 压缩图片
    const compressed = await compressImage(file);
    console.log('图片压缩完成');

    // 3. 转换Base64
    toast({
      title: '正在处理',
      description: '正在识别文字...',
    });
    
    const base64 = await fileToBase64(compressed);
    console.log('Base64转换完成');

    // 4. OCR识别
    const text = await recognizeText({
      image: base64,
      language_type: 'CHN_ENG',
    });
    console.log('OCR识别完成，识别到', text.split('\n').length, '行文字');

    // 5. 解析数据
    toast({
      title: '正在处理',
      description: '正在解析数据...',
    });
    
    const { examRecord, moduleScores } = parseExamData(
      text,
      indexNumber,
      timeUsedSeconds
    );
    
    console.log('数据解析完成，解析到', moduleScores.length, '个模块');

    // 6. 验证数据
    if (moduleScores.length === 0) {
      throw new Error('未能解析出模块数据，请检查图片是否清晰');
    }

    // 7. 保存到数据库
    toast({
      title: '正在处理',
      description: '正在保存数据...',
    });
    
    // 设置考试名称
    examRecord.exam_name = examName;
    
    // 创建考试记录
    const record = await createExamRecord(examRecord);
    console.log('考试记录创建成功，ID:', record.id);

    // 创建模块得分
    const scoresWithExamId = moduleScores.map(s => ({
      ...s,
      exam_record_id: record.id,
    }));
    
    await createModuleScores(scoresWithExamId);
    console.log('模块得分创建成功');

    // 8. 显示成功提示
    toast({
      title: '上传成功',
      description: `已保存考试记录：${examName}`,
    });

    return record;
  } catch (error: any) {
    console.error('上传失败:', error);
    
    // 显示错误提示
    toast({
      title: '上传失败',
      description: error.message || '未知错误',
      variant: 'destructive',
    });
    
    throw error;
  }
}
```

### 查询和展示数据

```typescript
import { getAllExamRecords, getModuleTrendData } from '@/db/api';

async function loadDashboardData() {
  try {
    // 1. 获取所有考试记录
    const records = await getAllExamRecords();
    console.log('考试记录数量:', records.length);

    if (records.length === 0) {
      console.log('暂无考试记录');
      return;
    }

    // 2. 计算统计数据
    const totalExams = records.length;
    const avgScore = records.reduce((sum, r) => sum + r.total_score, 0) / totalExams;
    const maxScore = Math.max(...records.map(r => r.total_score));
    const minScore = Math.min(...records.map(r => r.total_score));

    console.log('统计数据:');
    console.log('  考试次数:', totalExams);
    console.log('  平均分:', avgScore.toFixed(2));
    console.log('  最高分:', maxScore);
    console.log('  最低分:', minScore);

    // 3. 获取模块趋势数据
    const trendData = await getModuleTrendData();
    
    // 4. 绘制图表
    const option = {
      title: {
        text: '模块正确率趋势',
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: trendData.modules.map(m => m.module_name),
      },
      xAxis: {
        type: 'category',
        data: trendData.exam_names,
      },
      yAxis: {
        type: 'value',
        name: '正确率（%）',
        min: 0,
        max: 100,
      },
      series: trendData.modules.map(module => ({
        name: module.module_name,
        type: 'line',
        data: module.data,
        smooth: true,
      })),
    };

    // 使用ECharts渲染
    const chart = echarts.init(document.getElementById('chart'));
    chart.setOption(option);
  } catch (error) {
    console.error('加载数据失败:', error);
  }
}
```

### 更新考试记录

```typescript
import { updateExamRecord } from '@/db/api';
import { toast } from '@/components/ui/use-toast';

async function updateExamNotes(
  examId: string,
  rating: number,
  improvements: string,
  mistakes: string
) {
  try {
    await updateExamRecord(examId, {
      rating,
      improvements,
      mistakes,
    });

    toast({
      title: '保存成功',
      description: '考试记录已更新',
    });
  } catch (error: any) {
    toast({
      title: '保存失败',
      description: error.message,
      variant: 'destructive',
    });
  }
}
```

### 删除考试记录

```typescript
import { deleteExamRecord } from '@/db/api';
import { toast } from '@/components/ui/use-toast';

async function handleDelete(examId: string) {
  // 1. 确认删除
  const confirmed = window.confirm('确定要删除这条考试记录吗？此操作不可恢复。');
  
  if (!confirmed) {
    return;
  }

  try {
    // 2. 删除记录
    await deleteExamRecord(examId);

    // 3. 显示成功提示
    toast({
      title: '删除成功',
      description: '考试记录已删除',
    });

    // 4. 刷新列表
    await loadExamList();
  } catch (error: any) {
    toast({
      title: '删除失败',
      description: error.message,
      variant: 'destructive',
    });
  }
}
```

---

## 性能优化建议

### 1. 批量操作

**不推荐**:
```typescript
// 逐个创建（多次数据库调用）
for (const score of moduleScores) {
  await createModuleScore(score);
}
```

**推荐**:
```typescript
// 批量创建（一次数据库调用）
await createModuleScores(moduleScores);
```

### 2. 数据缓存

```typescript
// 缓存考试记录列表
let cachedRecords: ExamRecord[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

async function getAllExamRecordsCached(): Promise<ExamRecord[]> {
  const now = Date.now();
  
  if (cachedRecords && (now - cacheTime) < CACHE_DURATION) {
    console.log('使用缓存数据');
    return cachedRecords;
  }
  
  console.log('从数据库加载数据');
  cachedRecords = await getAllExamRecords();
  cacheTime = now;
  
  return cachedRecords;
}

// 清除缓存
function clearCache() {
  cachedRecords = null;
  cacheTime = 0;
}
```

### 3. 分页加载

```typescript
async function getExamRecordsPaginated(
  page: number = 1,
  pageSize: number = 10
): Promise<{ data: ExamRecord[]; total: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('exam_records')
    .select('*', { count: 'exact' })
    .order('sort_order', { ascending: true })
    .range(from, to);

  if (error) {
    throw error;
  }

  return {
    data: Array.isArray(data) ? data : [],
    total: count || 0,
  };
}
```

### 4. 并发控制

```typescript
// 限制并发OCR请求数量
class OcrQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent = 2;

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const task = this.queue.shift();
    
    if (task) {
      await task();
    }
    
    this.running--;
    this.process();
  }
}

const ocrQueue = new OcrQueue();

// 使用队列
const result = await ocrQueue.add(() => recognizeText(request));
```

---

## 安全建议

### 1. 输入验证

```typescript
function validateExamRecord(record: any): boolean {
  // 验证必填字段
  if (!record.exam_number || !record.total_score) {
    throw new Error('缺少必填字段');
  }

  // 验证数据范围
  if (record.total_score < 0 || record.total_score > 100) {
    throw new Error('总分必须在0-100之间');
  }

  if (record.rating !== undefined && (record.rating < 0 || record.rating > 5)) {
    throw new Error('星级评分必须在0-5之间');
  }

  if (record.difficulty !== undefined && (record.difficulty < 0 || record.difficulty > 5)) {
    throw new Error('难度系数必须在0-5之间');
  }

  return true;
}
```

### 2. SQL注入防护

**不推荐**:
```typescript
// 直接拼接SQL（存在SQL注入风险）
const sql = `SELECT * FROM exam_records WHERE exam_name = '${examName}'`;
```

**推荐**:
```typescript
// 使用参数化查询
const { data } = await supabase
  .from('exam_records')
  .select('*')
  .eq('exam_name', examName);
```

### 3. XSS防护

```typescript
// 对用户输入进行转义
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 使用
const safeText = escapeHtml(userInput);
```

### 4. 文件上传安全

```typescript
function validateImageFile(file: File): boolean {
  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/bmp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('只支持JPG、PNG、BMP格式的图片');
  }

  // 验证文件大小（10MB）
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('图片大小不能超过10MB');
  }

  return true;
}
```

---

## 测试

### 单元测试示例

```typescript
import { describe, it, expect } from 'vitest';
import { parseExamData } from '@/services/dataParser';

describe('parseExamData', () => {
  it('应该正确解析手机端格式', () => {
    const ocrText = `
      我的得分: 75.5
      政治理论
      共20题，答对15题，正确率75%，用时28分
    `;

    const { examRecord, moduleScores } = parseExamData(ocrText, 1, 7200);

    expect(examRecord.total_score).toBe(75.5);
    expect(moduleScores.length).toBeGreaterThan(0);
    expect(moduleScores[0].module_name).toBe('政治理论');
    expect(moduleScores[0].total_questions).toBe(20);
    expect(moduleScores[0].correct_answers).toBe(15);
    expect(moduleScores[0].accuracy_rate).toBe(75);
  });

  it('应该正确解析网页版格式', () => {
    const ocrText = `
      我的得分: 75.5
      政治理论
      总题数 20题  答对 15题  正确率 75%  用时 28分
    `;

    const { examRecord, moduleScores } = parseExamData(ocrText, 1, 7200);

    expect(examRecord.total_score).toBe(75.5);
    expect(moduleScores.length).toBeGreaterThan(0);
  });

  it('应该正确解析简化格式', () => {
    const ocrText = `
      我的得分: 75.5
      政治理论
      20
      75%
      28
    `;

    const { examRecord, moduleScores } = parseExamData(ocrText, 1, 7200);

    expect(examRecord.total_score).toBe(75.5);
    expect(moduleScores.length).toBeGreaterThan(0);
    expect(moduleScores[0].total_questions).toBe(20);
    expect(moduleScores[0].accuracy_rate).toBe(75);
  });
});
```

### 集成测试示例

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createExamRecord, getExamRecordById, deleteExamRecord } from '@/db/api';

describe('考试记录API集成测试', () => {
  let testRecordId: string;

  beforeAll(async () => {
    // 创建测试数据
    const record = await createExamRecord({
      exam_number: 999,
      exam_name: '测试考试',
      index_number: 999,
      rating: 0,
      total_score: 75.5,
      sort_order: 999,
    });
    testRecordId = record.id;
  });

  afterAll(async () => {
    // 清理测试数据
    await deleteExamRecord(testRecordId);
  });

  it('应该能够获取考试记录', async () => {
    const record = await getExamRecordById(testRecordId);
    expect(record).not.toBeNull();
    expect(record?.exam_name).toBe('测试考试');
  });

  it('应该能够更新考试记录', async () => {
    await updateExamRecord(testRecordId, {
      rating: 5,
    });

    const updated = await getExamRecordById(testRecordId);
    expect(updated?.rating).toBe(5);
  });
});
```

---

## 附录

### A. 完整的TypeScript类型定义

参见 `src/types/index.ts` 文件。

### B. 数据库Schema

参见 `supabase/migrations/` 目录下的SQL文件。

### C. API调用流程图

```
用户操作
   ↓
前端组件
   ↓
API函数 (src/db/api.ts)
   ↓
Supabase Client (src/db/supabase.ts)
   ↓
Supabase服务器
   ↓
PostgreSQL数据库
```

### D. 错误码对照表

| 错误码 | 说明 | 处理方式 |
|--------|------|----------|
| 0 | 成功 | - |
| 216015 | 模块关闭 | 检查API配置 |
| 216100 | 非法参数 | 检查请求参数 |
| 216101 | 图片格式错误 | 使用JPG/PNG/BMP格式 |
| 216102 | 图片大小超限 | 压缩图片到4MB以下 |
| 216200 | 空图片 | 检查图片内容 |
| 216201 | 图片中无文字 | 检查图片是否包含文字 |
| 216202 | 识别超时 | 重试或减小图片大小 |
| 216630 | 识别错误 | 重试或更换图片 |
| 282000 | 内部错误 | 联系技术支持 |
| 23505 | 唯一约束冲突 | 修改重复的字段值 |
| 23503 | 外键约束冲突 | 检查关联记录是否存在 |

---

## 更新日志

### v1.0.0 (2024-12-09)
- 初始版本
- 完整的数据库API
- OCR识别集成
- 数据解析功能

### v1.1.0 (2024-12-10)
- 添加简化格式支持
- 优化图片预处理
- 改进错误处理
- 添加详细日志

---

## 联系方式

如有问题或建议，请联系：

- 项目仓库: [GitHub](https://github.com/your-repo)
- 问题反馈: [Issues](https://github.com/your-repo/issues)
- 邮箱: support@example.com
