# Task: 为考试记录列表添加星级列，修改期数为考试名称和索引号

## Plan
- [x] Step 1: 创建数据库迁移文件，添加 rating、exam_name 和 index_number 字段
- [x] Step 2: 应用数据库迁移，设置约束和索引
- [x] Step 3: 更新 ExamRecord 类型定义，添加新字段
- [x] Step 4: 更新 UploadFormData 和其他相关类型
- [x] Step 5: 添加 API 函数：updateExamRating、checkIndexNumberExists、updateExamIndexNumber、getNextIndexNumber
- [x] Step 6: 修改 getAllExamRecords 函数，按索引号排序
- [x] Step 7: 更新 Upload 页面，将期数改为考试名称和索引号
- [x] Step 8: 修改 ExamList 页面，添加星级列
- [x] Step 9: 修改 ExamDetail 页面，显示考试名称和索引
- [x] Step 10: 修改 Dashboard 页面，更新图表显示
- [x] Step 11: 修复 dataParser.ts 和 generateTestData.ts 的类型错误
- [x] Step 12: 运行 lint 检查
- [x] Step 13: 优化列宽和布局
  - [x] 缩小总分、平均分、击败率列宽（90px）
  - [x] 星级列移到倒数第二列
  - [x] 星级列设置最小宽度150px
  - [x] 操作列固定在右侧
  - [x] 添加横向滚动支持
- [x] Step 14: 将内联编辑改为抽屉形式
  - [x] 移除内联编辑逻辑
  - [x] 添加 Drawer 组件
  - [x] 使用 Form 组件管理表单
  - [x] 添加移动端响应式支持
  - [x] 修复焦点问题

## Notes
- 星级功能使用 Ant Design 的 Rate 组件，支持半星，范围 0-5
- 索引号用于排序，设置唯一约束，不能重复
- 考试名称替代原来的期数概念
- 所有相关页面都已更新以使用新的字段
- 数据库迁移已成功应用
- 所有类型定义已更新
- Lint 检查通过，无错误
- 列布局已优化，星级列在倒数第二列，操作列固定
- 编辑功能已改为抽屉形式，提供更好的用户体验
- 移动端响应式已实现，抽屉在移动端全屏显示

## Completed
1. 数据库添加了 rating、exam_name 和 index_number 字段
2. 添加了相关的 API 函数
3. Upload 页面支持输入考试名称和索引号
4. ExamList 页面添加了星级列，可以直接点击星星评分
5. ExamList 页面将期数改为索引号和考试名称
6. ExamDetail 页面显示考试名称和索引号
7. Dashboard 页面的图表使用考试名称
8. 所有相关文件的类型定义已更新
9. Lint 检查通过
10. 列布局优化完成：
    - 总分、平均分、击败率列宽缩小到90px
    - 星级列移到倒数第二列，宽度150px
    - 操作列固定在右侧
    - 添加横向滚动支持
11. 编辑功能改为抽屉形式：
    - 移除了表格内联编辑
    - 使用 Drawer + Form 组件
    - 完善的表单验证
    - 移动端全屏显示
    - 桌面端固定宽度480px
    - 响应式布局适配
