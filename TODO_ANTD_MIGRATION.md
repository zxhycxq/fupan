# Antd 组件迁移任务

## 目标
将应用中的 radix-ui (shadcn/ui) 组件替换为 antd 组件，保持功能和交互不变。

## 需要替换的组件

### 核心组件
- [ ] Card -> antd Card
- [ ] Button -> antd Button  
- [ ] Input -> antd Input
- [ ] Select -> antd Select
- [ ] Label -> antd Form.Item label
- [ ] Progress -> antd Progress
- [ ] Alert -> antd Alert
- [ ] Skeleton -> antd Skeleton
- [ ] RadioGroup -> antd Radio.Group
- [ ] Textarea -> antd Input.TextArea
- [ ] Dialog -> antd Modal
- [ ] Tooltip -> antd Tooltip
- [ ] Badge -> antd Badge

### Toast 替换
- [ ] useToast -> antd message/notification

### 其他
- [ ] 移除 date-fns，统一使用 dayjs
- [ ] 更新 package.json 依赖

## 迁移步骤

1. ✓ 创建迁移计划
2. [ ] 替换 Dashboard.tsx
3. [ ] 替换 ExamList.tsx
4. [ ] 替换 ExamDetail.tsx
5. [ ] 替换 Upload.tsx
6. [ ] 替换 Settings.tsx
7. [ ] 替换 GenerateData.tsx
8. [ ] 替换 Header.tsx
9. [ ] 移除未使用的 shadcn/ui 组件
10. [ ] 测试所有功能
11. [ ] 清理依赖

## 注意事项
- 保持所有功能可用
- 交互尽量不变
- 使用 antd 的中文语言包
- 统一使用 dayjs 处理日期
