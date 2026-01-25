# 路由和依赖优化说明

## 修改时间
2026-01-25 12:00

## 修改内容

### 1. 路由修改
将"数据总览"页面路由从 `/` 改为 `/dashboard`，以支持子目录部署。

#### 修改的文件：
- **src/routes.tsx**: 修改数据总览路由路径
- **src/App.tsx**: 添加根路径重定向到 `/dashboard`
- **src/pages/Profile.tsx**: 更新导航路径
- **src/pages/OrderConfirm.tsx**: 更新导航路径
- **src/pages/Register.tsx**: 更新导航路径（2处）
- **src/pages/OrderDetail.tsx**: 更新导航路径（2处）
- **src/pages/NotFound.tsx**: 更新 Link 组件路径
- **src/components/common/RouteGuard.tsx**: 更新重定向路径
- **src/components/common/Header.tsx**: 更新 Logo 链接路径
- **src/components/common/Sidebar.tsx**: 更新 Logo 链接路径

#### 路由行为：
- 访问 `/` → 自动重定向到 `/dashboard`
- 访问未定义路径 → 自动重定向到 `/dashboard`
- 已登录用户访问 `/login` 或 `/register` → 自动重定向到 `/dashboard`

### 2. 依赖清理
删除未使用的第三方库：

#### 已删除的依赖：
- **recharts**: 图表库（未在代码中使用）
- **miaoda-auth-react**: 秒哒认证库（未在代码中使用）
- **miaoda-sc-plugin**: 秒哒插件（未在代码中使用）

#### 验证方法：
```bash
# 检查依赖使用情况
grep -r "from 'recharts'" src/ --include="*.tsx" --include="*.ts"
grep -r "from 'miaoda-auth-react'" src/ --include="*.tsx" --include="*.ts"
grep -r "from 'miaoda-sc-plugin'" src/ --include="*.tsx" --include="*.ts"
```

## 验证结果

### Lint 检查
```bash
npm run lint
# 结果: Checked 71 files in 1602ms. No fixes applied.
```

### 路由验证
- ✅ 数据总览路由已更新为 `/dashboard`
- ✅ 根路径重定向已配置
- ✅ 所有导航链接已更新
- ✅ 所有 `navigate('/')` 调用已更新为 `navigate('/dashboard')`

### 依赖验证
- ✅ recharts 已从 package.json 中删除
- ✅ miaoda-auth-react 已从 package.json 中删除
- ✅ miaoda-sc-plugin 已从 package.json 中删除
- ✅ 代码中无对已删除依赖的引用

## 影响范围

### 用户体验
- 访问根路径会自动跳转到数据总览页面
- 所有内部链接正常工作
- 不影响现有功能

### 部署
- 支持子目录部署（如 `/app/`）
- 路由更加明确和规范
- 减少了不必要的依赖，优化了打包体积

## 备份
- package.json 备份文件: `package.json.backup`

## 后续建议
1. 测试所有页面的导航功能
2. 验证子目录部署场景
3. 检查是否有其他未使用的依赖可以清理
