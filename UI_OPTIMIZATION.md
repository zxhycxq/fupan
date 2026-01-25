# UI 优化修改说明

## 修改时间
2026-01-25 12:15

## 修改内容

### 1. 修复数据总览图标显示问题
**问题**: 数据总览页面在侧边栏中没有显示图标

**原因**: Sidebar.tsx 中的图标映射使用的是旧路径 `/` 而不是新路径 `/dashboard`

**修复**:
- 文件: `src/components/common/Sidebar.tsx`
- 修改: 将图标映射中的 `'/'` 改为 `'/dashboard'`

```typescript
// 修改前
const menuIcons: Record<string, React.ReactNode> = {
  '/': <DashboardOutlined />,
  // ...
};

// 修改后
const menuIcons: Record<string, React.ReactNode> = {
  '/dashboard': <DashboardOutlined />,
  // ...
};
```

### 2. 移除"持久化计时器示例"标签页
**需求**: 小工具页面只保留"模考计时"功能，移除"持久化计时器示例"

**修改**:
- 文件: `src/pages/Tools.tsx`
- 删除: `PersistentTimerExample` 组件的导入
- 删除: `ExperimentOutlined` 图标的导入
- 删除: "持久化计时器示例"标签页配置

**修改前**:
```typescript
import PersistentTimerExample from '@/components/tools/PersistentTimerExample';
import { ClockCircleOutlined, ExperimentOutlined } from '@ant-design/icons';

// Tabs 包含两个标签页
items={[
  { key: 'timer', ... },
  { key: 'persistent-timer', ... }, // 持久化计时器示例
]}
```

**修改后**:
```typescript
import { ClockCircleOutlined } from '@ant-design/icons';

// Tabs 只包含一个标签页
items={[
  { key: 'timer', ... }, // 模考计时
]}
```

### 3. 注释个人中心的"我的来时路"模块
**需求**: 暂时隐藏"我的采时路"和"我的里程碑"功能模块（注释而非删除）

**修改**:
- 文件: `src/pages/Profile.tsx`
- 注释: `LearningJourney` 组件的导入
- 注释: `<LearningJourney />` 组件的使用

**修改前**:
```typescript
import LearningJourney from '@/components/profile/LearningJourney';

// ...

{/* 我的来时路 */}
<LearningJourney />
```

**修改后**:
```typescript
// import LearningJourney from '@/components/profile/LearningJourney'; // 暂时注释掉

// ...

{/* 我的来时路 - 暂时注释掉 */}
{/* <LearningJourney /> */}
```

**说明**: 
- `LearningJourney` 组件包含"我的采时路"和"我的里程碑"两个功能模块
- 代码保留，只是注释掉，方便后续恢复

## 验证结果

### Lint 检查
```bash
npm run lint
# 结果: Checked 71 files in 1539ms. No fixes applied.
```
✅ 所有文件通过检查

### 功能验证
- ✅ 数据总览图标正常显示
- ✅ 小工具页面只显示"模考计时"标签页
- ✅ 个人中心不显示"我的来时路"模块
- ✅ 代码已注释保留，未删除

## 影响范围

### 用户界面
1. **侧边栏**: 数据总览菜单项现在正确显示图标
2. **小工具页面**: 界面更简洁，只显示核心功能
3. **个人中心**: 暂时隐藏学习历程相关功能

### 代码结构
- 未删除任何组件文件
- 只是注释掉了部分功能的使用
- 保持代码完整性，方便后续恢复

## 后续恢复方法

### 恢复"我的来时路"模块
如需恢复，只需在 `src/pages/Profile.tsx` 中：
1. 取消注释第8行的导入语句
2. 取消注释第490行的组件使用

```typescript
// 取消注释这两行
import LearningJourney from '@/components/profile/LearningJourney';
// ...
<LearningJourney />
```

### 恢复"持久化计时器示例"
如需恢复，需要在 `src/pages/Tools.tsx` 中：
1. 添加 `PersistentTimerExample` 组件的导入
2. 添加 `ExperimentOutlined` 图标的导入
3. 在 Tabs 的 items 数组中添加对应的标签页配置

## 文件变更列表
- `src/components/common/Sidebar.tsx` - 修复图标映射
- `src/pages/Tools.tsx` - 移除持久化计时器示例
- `src/pages/Profile.tsx` - 注释学习历程模块

## 总结
本次修改完成了三项 UI 优化任务：
1. ✅ 修复了数据总览图标显示问题
2. ✅ 简化了小工具页面，只保留核心功能
3. ✅ 暂时隐藏了个人中心的学习历程模块

所有修改均通过 lint 检查，代码质量良好。注释的功能代码完整保留，方便后续恢复使用。
