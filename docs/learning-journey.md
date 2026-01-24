# 学习历程功能说明

## 功能概述
"我的来时路"功能记录用户的学习历程，展示学习成长轨迹。

## 数据统计

### 1. 参与考试
- 统计：所有考试记录的总数
- 来源：`exam_records`表的记录数

### 2. 备考天数
- 统计：从第一次考试到当前时间的天数
- 计算：`NOW() - 第一次考试日期`
- 示例：如果第一次考试是2025-11-22，今天是2026-01-23，则备考天数为62天

### 3. 累计做题
- 统计：所有考试的题目总数
- 来源：`exam_records.question_count`字段的总和
- 计算：从`module_scores`表中统计一级模块的`total_questions`之和
- 注意：只统计一级模块（`parent_module IS NULL`），避免重复计数

### 4. 累计时长
- 统计：所有考试时间的总和（小时）
- 来源：`exam_records.duration_seconds`字段的总和
- 计算：`SUM(duration_seconds) / 3600`
- 示例：如果总时长是486074秒，则显示135.0小时

## 里程碑记录

系统自动记录以下里程碑事件：

1. **第一次考试**：记录用户开启备考之路的日期
2. **首次突破60分**：记录第一次达到60分的日期和分数
3. **首次突破70分**：记录第一次达到70分的日期和分数
4. **首次突破80分**：记录第一次达到80分的日期和分数
5. **首次突破90分**：记录第一次达到90分的日期和分数

## 数据更新

### 新上传的成绩
- 上传成绩时，`dataParser.ts`会自动计算并保存：
  - `question_count`：从模块数据汇总
  - `duration_seconds`：用户输入的考试时长（秒）

### 现有数据
- 迁移脚本会自动更新现有数据：
  - `duration_seconds`：从`time_used`字段复制
  - `question_count`：从`module_scores`表汇总计算

## 技术实现

### 数据库层
- `exam_records`表新增字段：
  - `question_count`：做题数量
  - `duration_seconds`：考试时长（秒）
- `user_milestones`表：记录学习里程碑
- 触发器：自动记录里程碑事件

### API层
- `getLearningJourney()`：获取学习历程数据
- 返回数据结构：
  ```typescript
  {
    firstExamDate: string | null;
    milestones: {
      score60?: { date: string; score: number };
      score70?: { date: string; score: number };
      score80?: { date: string; score: number };
      score90?: { date: string; score: number };
    };
    examCount: number;
    studyDays: number;
    totalQuestions: number;
    totalHours: number;
  }
  ```

### 前端组件
- `LearningJourney.tsx`：展示学习历程
  - 统计卡片：考试次数、备考天数、做题数、时长
  - 时间线：里程碑事件
  - 鼓励语：根据学习数据生成

## 示例数据

假设用户有以下考试记录：
- 第一次考试：2025-11-22，得分45分，120道题，120分钟
- 第二次考试：2025-12-01，得分62分，130道题，117分钟
- 第三次考试：2026-01-05，得分74分，120道题，120分钟
- ...共68次考试

统计结果：
- 参与考试：68次
- 备考天数：63天（2025-11-22到2026-01-23）
- 累计做题：9589道（所有考试题目总和）
- 累计时长：135.0小时（所有考试时间总和）

里程碑：
- 2025-11-22：第一次考试
- 2025-12-01：首次突破60分（62分）
- 2026-01-05：首次突破70分（74分）
