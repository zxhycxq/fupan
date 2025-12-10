/*
# 添加等级称谓主题配置

## 1. 修改表
- `exam_config` 表
  - 添加 `grade_label_theme` (text, 等级称谓主题, 默认: 'theme4')

## 2. 说明
- grade_label_theme 用于存储用户选择的等级称谓主题
- 可选值：
  - 'theme1': 潜龙勿用、见龙在田、终日乾乾、或跃在渊、飞龙在天
  - 'theme2': 启蒙之境、登堂之境、入室之境、精研之境、大成之境
  - 'theme3': 萌芽初醒、新苗成长、含苞待放、花开锦绣、硕果满枝
  - 'theme4': 默默无闻、小有所成、初露锋芒、卓然不群、名满天下
*/

-- 添加等级称谓主题字段
ALTER TABLE exam_config 
ADD COLUMN IF NOT EXISTS grade_label_theme text DEFAULT 'theme4';

-- 添加注释
COMMENT ON COLUMN exam_config.grade_label_theme IS '等级称谓主题(theme1-theme4)';

-- 更新现有记录
UPDATE exam_config 
SET grade_label_theme = 'theme4' 
WHERE grade_label_theme IS NULL;
