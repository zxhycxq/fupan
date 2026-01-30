# API 请求优化指南

## 问题描述

在未登录状态下访问需要登录的页面时，会出现以下问题：

1. 页面组件开始渲染
2. 触发多个 API 请求
3. 所有请求都返回 401 错误
4. 控制台显示多个接口报错
5. 然后才跳转到登录页面

这会导致：
- 控制台出现大量错误信息
- 浪费网络资源
- 用户体验不佳

## 解决方案

我们提供了三层防护机制：

### 1. 路由守卫优化（第一层防护）

**位置**: `src/components/common/RouteGuard.tsx`

**优化内容**:
- 未登录时不渲染页面组件，避免触发 API 请求
- 显示 Loading 状态，提供更好的用户体验
- 使用 `replace: true` 避免在历史记录中留下记录

**效果**:
- 未登录用户访问受保护页面时，直接显示 Loading 并跳转到登录页
- 不会渲染页面组件，不会触发 API 请求

### 2. API 请求拦截器（第二层防护）

**位置**: `src/utils/apiInterceptor.ts`

**功能**:
- 在发送请求前检查用户登录状态
- 如果未登录，直接跳转到登录页，不发送请求
- 使用全局标志位，防止重复跳转
- 提供请求取消机制，避免多个无效请求

**使用方法**:

#### 方法一：手动检查登录状态

```typescript
import { checkAuthBeforeRequest } from '@/utils/apiInterceptor';

const loadData = async () => {
  // 在发送请求前检查登录状态
  if (!await checkAuthBeforeRequest()) {
    return; // 未登录，已自动跳转到登录页
  }
  
  // 继续加载数据
  const records = await getAllExamRecords();
  // ...
};
```

#### 方法二：使用请求组（支持批量取消）

```typescript
import { createRequestGroup } from '@/utils/apiInterceptor';

const group = createRequestGroup();

// 添加多个请求
group.add(async () => getAllExamRecords());
group.add(async () => getModuleAverageScores());

// 执行所有请求
const results = await group.execute();

// 如果需要取消，调用 cancelAll
group.cancelAll();
```

#### 方法三：包装 API 函数（最简单）

```typescript
import { withAuthCheck } from '@/utils/apiInterceptor';

// 包装 API 函数
const getAllExamRecordsWithAuth = withAuthCheck(getAllExamRecords);

// 使用时会自动检查登录状态
const records = await getAllExamRecordsWithAuth();
```

### 3. 组件级别优化（第三层防护）

**推荐做法**:

在组件的 `useEffect` 中添加登录检查：

```typescript
import { useEffect, useState } from 'react';
import { checkAuthBeforeRequest } from '@/utils/apiInterceptor';
import { getAllExamRecords } from '@/db/api';

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 手动检查登录状态（双重保护）
      if (!await checkAuthBeforeRequest()) {
        return;
      }
      
      // 加载数据
      const records = await getAllExamRecords();
      setData(records);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // ...
}
```

## 推荐方案

**结合三层防护机制**：

1. **RouteGuard**（第一层）：阻止未登录用户访问受保护页面
2. **API 拦截器**（第二层）：在发送请求前检查登录状态
3. **组件检查**（第三层）：在组件中手动检查，作为双重保护

**优点**：
- 最彻底的解决方案
- 提供最佳的用户体验
- 避免无效的 API 请求
- 控制台不会出现大量错误信息

## 迁移指南

### 步骤 1：RouteGuard 已优化

`RouteGuard` 组件已经优化完成，无需修改。

### 步骤 2：在组件中添加登录检查

对于需要加载数据的组件，在 `useEffect` 中添加登录检查：

**修改前**：

```typescript
useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  try {
    setLoading(true);
    const records = await getAllExamRecords();
    setData(records);
  } catch (error) {
    console.error('加载数据失败:', error);
  } finally {
    setLoading(false);
  }
};
```

**修改后**：

```typescript
import { checkAuthBeforeRequest } from '@/utils/apiInterceptor';

useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  try {
    setLoading(true);
    
    // 添加登录检查
    if (!await checkAuthBeforeRequest()) {
      setLoading(false);
      return;
    }
    
    const records = await getAllExamRecords();
    setData(records);
  } catch (error) {
    console.error('加载数据失败:', error);
  } finally {
    setLoading(false);
  }
};
```

### 步骤 3：测试验证

1. 退出登录
2. 直接访问需要登录的页面（如 `/dashboard`）
3. 观察控制台，应该只看到一条日志：`[RouteGuard] 未登录，重定向到登录页`
4. 不应该看到任何 API 请求错误

## 需要修改的组件列表

以下组件需要添加登录检查：

- [x] `src/components/common/RouteGuard.tsx` - 已优化
- [ ] `src/pages/Dashboard.tsx` - 需要添加登录检查
- [ ] `src/pages/ExamList.tsx` - 需要添加登录检查
- [ ] `src/pages/ExamDetail.tsx` - 需要添加登录检查
- [ ] `src/pages/ModuleAnalysis.tsx` - 需要添加登录检查
- [ ] `src/pages/Profile.tsx` - 需要添加登录检查
- [ ] `src/pages/Settings.tsx` - 需要添加登录检查
- [ ] `src/pages/admin/VipApplications.tsx` - 需要添加登录检查

## 示例代码

完整的示例代码请参考：
- `src/utils/apiInterceptor.ts` - API 拦截器工具
- `src/utils/apiOptimizationExample.ts` - 使用示例

## 常见问题

### Q1: 为什么需要三层防护？

**A**:
- **RouteGuard**：防止页面渲染，是最外层的防护
- **API 拦截器**：防止 API 请求发送，是中间层的防护
- **组件检查**：防止组件逻辑执行，是最内层的防护

三层防护确保在任何情况下都不会触发无效的 API 请求。

### Q2: 是否需要修改所有组件？

**A**:
- **必须修改**：需要加载数据的组件（如 Dashboard、ExamList 等）
- **不需要修改**：不需要加载数据的组件（如 Login、Register 等）

### Q3: 如果忘记添加登录检查会怎样？

**A**:
- RouteGuard 会阻止页面渲染，所以不会触发 API 请求
- 但是为了代码的健壮性，建议在组件中也添加检查

### Q4: 如何测试优化效果？

**A**:
1. 退出登录
2. 打开浏览器开发者工具的 Network 面板
3. 直接访问需要登录的页面（如 `/dashboard`）
4. 观察 Network 面板，应该没有任何 API 请求
5. 观察控制台，应该只有一条跳转日志

## 总结

通过三层防护机制，我们彻底解决了未登录时触发多个无效 API 请求的问题：

1. **RouteGuard**：阻止页面渲染
2. **API 拦截器**：阻止请求发送
3. **组件检查**：阻止逻辑执行

这样可以：
- ✅ 避免控制台出现大量错误信息
- ✅ 节省网络资源
- ✅ 提供更好的用户体验
- ✅ 提高代码的健壮性
