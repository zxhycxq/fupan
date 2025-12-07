# 删除索引列功能总结

## 修改概述

根据用户需求，由于已经实现了拖拽排序功能，索引列变得冗余。本次修改删除了索引列及其相关的所有逻辑，改为使用 `sort_order` 字段来管理考试记录的排序。

## 主要变更

### 1. 数据模型变更

**文件：`src/types/index.ts`**
- 将 `index_number` 字段标记为可选（保留向后兼容）
- 将 `sort_order` 字段标记为必填
- 修改 `ChartData` 接口，使用 `sort_order` 替代 `index_number`

```typescript
export interface ExamRecord {
  // ...
  index_number?: number; // 索引项(已废弃，保留用于向后兼容)
  sort_order: number; // 排序顺序
  // ...
}

export interface ChartData {
  exam_number: number;
  exam_name: string;
  sort_order: number; // 使用 sort_order 替代 index_number
  total_score: number;
  time_used?: number;
  created_at: string;
}
```

### 2. 考试列表页面 (ExamList.tsx)

**删除的功能：**
- 表格中的"索引"列
- 编辑抽屉中的"索引号"输入字段
- 索引号验证逻辑
- `openEditDrawer` 中设置 `index_number` 的代码
- `handleSaveEdit` 中验证和更新 `index_number` 的逻辑

**修改的功能：**
- `handleSaveSort` 函数现在使用 `sort_order` 字段更新排序
- 数据查询按 `sort_order` 排序

### 3. 上传页面 (Upload.tsx)

**删除的功能：**
- 图片上传标签页中的"索引号"输入框
- 表单输入标签页中的"索引号"输入框
- 索引号验证逻辑（包括检查索引号是否已存在）

**修改的功能：**
- 状态变量从 `indexNumber` 改为 `sortOrder`
- `useEffect` 中调用 `getNextSortOrder()` 而非 `getNextIndexNumber()`
- `parseExamData` 调用使用 `sortOrder` 参数
- 创建记录时使用 `sort_order` 字段
- 传递给 `FormInputTab` 的 props 改为 `sortOrder`

### 4. 表单输入组件 (FormInputTab.tsx)

**修改的功能：**
- Props 接口中将 `indexNumber` 改为 `sortOrder`
- 删除了索引号验证逻辑
- 创建记录时使用 `sort_order` 字段

### 5. API 层 (api.ts)

**删除的函数：**
- `checkIndexNumberExists()` - 检查索引号是否已存在
- `updateExamIndexNumber()` - 更新考试记录的索引号
- `getNextIndexNumber()` - 获取下一个可用的索引号

**新增的函数：**
- `getNextSortOrder()` - 获取下一个可用的排序号

**修改的函数：**
- `getAllExamRecords()` - 按 `sort_order` 排序而非 `index_number`
- `getModuleAverageScores()` - 查询和排序使用 `sort_order`
- `getModuleTrendData()` - 查询和排序使用 `sort_order`
- `getModuleTimeTrendData()` - 查询和排序使用 `sort_order`
- `getModuleDetailedStats()` - 查询和排序使用 `sort_order`

### 6. 数据解析服务 (dataParser.ts)

**修改的功能：**
- 创建 `examRecord` 对象时使用 `sort_order` 字段

### 7. 测试数据生成 (generateTestData.ts)

**修改的功能：**
- 生成测试数据时使用 `sort_order` 字段

### 8. 首页/仪表盘 (Dashboard.tsx)

**修改的功能：**
- 所有使用 `index_number` 的地方都改为使用 `sort_order`
- 考试记录的排序、查找、显示都基于 `sort_order`
- 图表数据的生成使用 `sort_order`

### 9. 模块分析页面 (ModuleAnalysis.tsx)

**修改的功能：**
- 查询考试记录时按 `sort_order` 排序
- 查询模块分数时关联的 `exam_records` 使用 `sort_order`
- 趋势数据生成使用 `sort_order`

### 10. 考试详情页面 (ExamDetail.tsx)

**修改的功能：**
- 页面头部显示"排序"而非"索引号"
- 使用 `sort_order` 字段显示排序信息

## 排序逻辑说明

### 拖拽排序
用户可以通过拖拽考试记录列表中的"排序"列（拖拽手柄）来调整顺序。拖拽完成后，系统会自动更新所有记录的 `sort_order` 字段，确保顺序正确。

### 首页排序
首页和其他所有显示考试记录的地方都会按照 `sort_order` 字段进行排序，确保与考试记录列表的顺序保持一致。

### 新增记录
当用户上传新的考试记录时，系统会自动调用 `getNextSortOrder()` 函数获取下一个可用的排序号，确保新记录排在最后。

## 向后兼容性

为了保持向后兼容性，`index_number` 字段在类型定义中被标记为可选字段，而不是完全删除。这样可以确保：
1. 旧数据仍然可以正常读取
2. 不会因为缺少字段而导致类型错误
3. 未来如果需要迁移旧数据，可以有足够的灵活性

## 数据库注意事项

虽然代码层面已经完全切换到使用 `sort_order` 字段，但数据库中的 `index_number` 列仍然存在。如果需要完全清理，可以考虑：
1. 创建数据迁移脚本，将所有 `index_number` 的值复制到 `sort_order`
2. 删除 `index_number` 列（可选）

但目前保留该列不会影响系统功能，因为所有代码都已经切换到使用 `sort_order`。

## 测试建议

建议测试以下场景：
1. ✅ 拖拽排序功能是否正常工作
2. ✅ 首页的考试记录顺序是否与列表页一致
3. ✅ 上传新记录后，排序是否正确
4. ✅ 编辑现有记录时，排序是否保持不变
5. ✅ 表单输入方式创建记录时，排序是否正确
6. ✅ 模块分析页面的趋势图是否按正确顺序显示
7. ✅ 考试详情页面是否正确显示排序信息

## 修改文件清单

以下是所有被修改的文件：

1. `src/types/index.ts` - 类型定义
2. `src/pages/ExamList.tsx` - 考试列表页面
3. `src/pages/Upload.tsx` - 上传页面
4. `src/pages/Dashboard.tsx` - 首页/仪表盘
5. `src/pages/ModuleAnalysis.tsx` - 模块分析页面
6. `src/pages/ExamDetail.tsx` - 考试详情页面
7. `src/components/exam/FormInputTab.tsx` - 表单输入组件
8. `src/db/api.ts` - API 层
9. `src/services/dataParser.ts` - 数据解析服务
10. `src/utils/generateTestData.ts` - 测试数据生成

## 总结

本次修改成功删除了冗余的索引列功能，简化了用户界面和代码逻辑。通过使用 `sort_order` 字段统一管理排序，使得系统更加简洁和易于维护。拖拽排序功能现在是唯一的排序方式，用户体验更加直观。

所有页面（首页、考试列表、模块分析、考试详情）都已经更新为使用 `sort_order` 字段，确保了数据的一致性和正确性。
