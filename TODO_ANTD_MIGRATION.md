# Antd 组件迁移任务

## 目标
将应用中的 radix-ui (shadcn/ui) 组件替换为 antd 组件，保持功能和交互不变。

## 需要替换的组件

### 核心组件
- [x] Card -> antd Card
- [x] Button -> antd Button  
- [x] Input -> antd Input
- [x] Select -> antd Select
- [x] Label -> antd Form.Item label
- [x] Progress -> antd Progress
- [x] Alert -> antd Alert
- [x] Skeleton -> antd Skeleton
- [x] RadioGroup -> antd Radio.Group
- [x] Textarea -> antd Input.TextArea
- [ ] Dialog -> antd Modal
- [x] Tooltip -> antd Tooltip
- [x] Badge -> antd Badge

### Toast 替换
- [x] useToast -> antd message/notification

### 其他
- [x] 移除 date-fns，统一使用 dayjs
- [ ] 更新 package.json 依赖

## 迁移步骤

1. ✓ 创建迁移计划
2. ✓ 替换 Settings.tsx
3. ✓ 修复 React 导入错误
4. ✓ 替换 Upload.tsx
5. ✓ 替换 ExamList.tsx
6. [ ] 替换 ExamDetail.tsx
7. [ ] 替换 Dashboard.tsx
8. [ ] 替换 GenerateData.tsx
9. [ ] 替换 Header.tsx
10. [ ] 移除未使用的 shadcn/ui 组件
11. [ ] 测试所有功能
12. [ ] 清理依赖

## 注意事项
- 保持所有功能可用
- 交互尽量不变
- 使用 antd 的中文语言包
- 统一使用 dayjs 处理日期

## 已完成
- ✓ Settings 页面完全迁移到 antd
- ✓ 配置 antd ConfigProvider 和中文语言包
- ✓ 配置 dayjs 中文
- ✓ 修复 React useEffect 导入错误
- ✓ Upload 页面完全迁移到 antd
- ✓ ExamList 页面完全迁移到 antd

## 进度
已完成 5/12 步骤 (42%)


