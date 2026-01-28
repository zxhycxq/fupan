# 考试成绩分析系统 - 开发进度

### 数据库结构

#### exam_records (考试记录)
```sql
- id: uuid (主键)
- exam_number: integer (期数)
- total_score: numeric (总分)
- max_score: numeric (最高分)
- average_score: numeric (平均分)
- difficulty: numeric (难度系数)
- beat_percentage: numeric (击败百分比)
- pass_rate: numeric (通过率)
- time_used: integer (用时,秒)
- image_url: text (图片URL)
- created_at: timestamptz
- updated_at: timestamptz
```

#### module_scores (模块得分)
```sql
- id: uuid (主键)
- exam_record_id: uuid (外键)
- module_name: text (模块名称)
- parent_module: text (父模块)
- total_questions: integer (总题数)
- correct_answers: integer (答对数)
- wrong_answers: integer (答错数)
- unanswered: integer (未答数)
- accuracy_rate: numeric (正确率)
- time_used: integer (用时,秒)
- created_at: timestamptz
```

#### user_settings (用户设置)
```sql
- id: uuid (主键)
- user_id: text (用户ID)
- module_name: text (模块名称)
- target_accuracy: numeric (目标正确率)
- created_at: timestamptz
- updated_at: timestamptz
- UNIQUE(user_id, module_name)
```
