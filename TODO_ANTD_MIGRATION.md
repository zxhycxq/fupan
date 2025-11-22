# Antd 组件迁移计划

## 目标
--------的 radix-ui (shadcn/ui) 组件替换为 antd 组件，保证功能可用，交互功能尽量不变。

## 迁移步骤

### 1. ✅ 准备工作
- [x] 创建迁移计划文档
- [x] 确认 antd 已安装
- [x] 确认 @ant-design/icons 已安装

### 2. ✅ 修复 App.tsx React 导入错误
- [x] 添加 React 默认导入
- [x] 保持 useEffect 的命名导入
- [x] 确保代码通过 lint 检查

### 3. ✅ 迁移 Settings 页面
- [x] 替换 Card 组件
- [x] 替换 Button 组件
- [x] 替换 Input 组件
- [x] 替换 Label 组件
- [x] 替换 useToast 为 antd message
- [x] 测试功能

### 4. ✅ 迁移 Upload 页面
- [x] 替换 Button 组件
- [x] 替换 Card 组件
- [x] 替换 Input 组件
- [x] 替换 Label 组件
- [x] 替换 Progress 组件
- [x] 替换 useToast 为 antd message
- [x] 替换图片预览为 antd Image
- [x] 替换图标为 @ant-design/icons
- [x] 测试功能

### 5. ✅ 迁移 ExamList 页面
- [x] 替换 Card 组件
- [x] 替换 Button 组件
- [x] 替换 Skeleton 组件
- [x] 替换 Input 组件
- [x] 替换 Alert 组件
- [x] 替换 useToast 为 antd message
- [x] 替换图标为 @ant-design/icons
- [x] 使用 antd Space 组件优化布局
- [x] 测试功能

### 6. ✅ 删除 GenerateData.tsx
- [x] 删除文件（功能暂时不需要）
- [x] 确认路由中没有引用

### 7. ✅ 迁移 Dashboard 页面
- [x] 替换 Card 组件
- [x] 替换 Skeleton 组件
- [x] 使用 antd Statistic 组件展示统计数据
- [x] 使用 antd Row/Col 布局替代 grid
- [x] 替换图标为 @ant-design/icons
- [x] 测试功能

### 8. ✅ 迁移 ExamDetail 页面
- [x] 替换 Card 组件
- [x] 替换 Button 组件
- [x] 替换 Skeleton 组件
- [x] 替换 Badge 为 Tag 组件
- [x] 替换 Input 组件
- [x] 替换 Textarea 为 TextArea 组件
- [x] 替换 Dialog 为 Modal 组件
- [x] 替换 Tooltip 组件
- [x] 替换 useToast 为 antd message
- [x] 替换图标为 @ant-design/icons
- [x] 测试功能

### 9. ✅ 迁移 Header 组件
- [x] 替换图标为 @ant-design/icons
- [x] 保持原有布局和交互
- [x] 测试功能

### 10. ⏳ 清理未使用的 shadcn/ui 组件
- [ ] 删除 src/components/ui 目录下未使用的组件
- [ ] 保留 toaster.tsx（可能还在使用）

### 11. ⏳ 清理依赖
- [ ] 移除 @radix-ui 相关依赖
- [ ] 移除 lucide-react
- [ ] 移除 date-fns（如果未使用）
- [ ] 确认 dayjs 正常工作

### 12. ⏳ 最终测试
- [ ] 测试所有页面功能
- [ ] 测试响应式布局
- [ ] 测试深色模式（如果有）
- [ ] 运行 lint 检查
- [ ] 运行构建测试

## 注意事项

1. **日期处理**：统一使用 dayjs，移除 date-fns
2. **图标**：使用 @ant-design/icons 替代 lucide-react
3. **消息提示**：使用 antd message 替代 useToast
4. **表单**：使用 antd Form 组件（如需要）
5. **布局**：使用 antd Row/Col 替代 grid（适当情况下）
6. **功能保持**：确保所有交互功能不变

## 进度

- 已完成：9/12 步骤 (75%)
- 剩余：3 步骤
  - 清理未使用的 shadcn/ui 组件
  - 清理依赖
  - 最终测试

## 当前状态

 所有页面组件已完成迁移
   正在进行清理工作
