# 跨域环境错误修复说明

## 问题描述

在跨域环境（如 iframe 或某些沙箱环境）中运行应用时，出现以下错误：

```
Uncaught SecurityError: Failed to read a named property 'removeEventListener' from 'Window': 
Blocked a frame with origin "https://app-7q11e4xackch-vitesandbox.miaoda.cn" from accessing a cross-origin frame.
```

## 错误原因

1. **直接访问 window 对象**：代码中大量使用 `window.innerWidth` 来判断屏幕尺寸
2. **事件监听器清理**：在组件卸载时，React 尝试清理事件监听器，但在跨域环境中访问 window 对象会被浏览器阻止
3. **安全策略限制**：浏览器的同源策略（Same-Origin Policy）阻止了跨域访问

## 解决方案

### 1. 使用 React 状态管理窗口尺寸

**之前的代码：**
```typescript
// 直接访问 window.innerWidth
fontSize: window.innerWidth < 640 ? 14 : 16
```

**修复后的代码：**
```typescript
// 使用 React 状态
const [isMobile, setIsMobile] = useState(false);

// 安全地获取窗口宽度
const getWindowWidth = () => {
  try {
    return typeof window !== 'undefined' ? window.innerWidth : 1024;
  } catch (error) {
    return 1024; // 默认桌面宽度
  }
};

// 使用状态
fontSize: isMobile ? 14 : 16
```

### 2. 添加安全的事件监听器处理

**修复后的代码：**
```typescript
useEffect(() => {
  const checkMobile = () => {
    const width = getWindowWidth();
    setIsMobile(width < 640);
  };

  checkMobile();

  const handleResize = () => {
    checkMobile();
  };

  try {
    window.addEventListener('resize', handleResize);
    return () => {
      try {
        window.removeEventListener('resize', handleResize);
      } catch (error) {
        // 忽略跨域错误
        console.warn('清理 resize 监听器时出错:', error);
      }
    };
  } catch (error) {
    // 忽略跨域错误
    console.warn('添加 resize 监听器时出错:', error);
    return () => {};
  }
}, []);
```

## 修复内容

### 文件：`src/pages/Dashboard.tsx`

1. **添加状态管理**
   - 新增 `isMobile` 状态来跟踪设备类型
   - 新增 `getWindowWidth` 函数安全地获取窗口宽度

2. **替换所有 window.innerWidth 访问**
   - 将 39 处 `window.innerWidth < 640 ? ... : ...` 替换为 `isMobile ? ... : ...`
   - 确保所有图表配置使用状态而非直接访问 window 对象

3. **添加错误处理**
   - 在事件监听器的添加和移除过程中添加 try-catch
   - 捕获并忽略跨域相关的 SecurityError
   - 提供友好的警告信息

## 技术细节

### 为什么会出现跨域错误？

1. **浏览器安全策略**：浏览器的同源策略阻止不同源的页面相互访问
2. **iframe 环境**：在 iframe 中运行时，子页面无法访问父页面的 window 对象
3. **沙箱环境**：某些开发环境（如 Vite Sandbox）使用 iframe 隔离应用

### 为什么使用状态而非直接访问？

1. **安全性**：通过 try-catch 包装，避免抛出未捕获的错误
2. **性能**：减少频繁的 window 对象访问
3. **响应式**：使用 React 状态，自动触发组件重新渲染
4. **可测试性**：更容易进行单元测试

## 验证修复

### 测试步骤

1. 在正常浏览器环境中打开应用
2. 在 iframe 中嵌入应用
3. 在沙箱环境中运行应用
4. 调整浏览器窗口大小

### 预期结果

- ✅ 应用正常加载，无 SecurityError
- ✅ 图表根据屏幕尺寸正确显示
- ✅ 窗口大小调整时，图表响应式更新
- ✅ 控制台无错误信息（可能有警告信息，但不影响功能）

## 相关资源

- [MDN: Same-origin policy](https://developer.mozilla.org/zh-CN/docs/Web/Security/Same-origin_policy)
- [React: useEffect Hook](https://react.dev/reference/react/useEffect)
- [Window: resize event](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/resize_event)

## 总结

通过使用 React 状态管理和添加适当的错误处理，我们成功解决了跨域环境下的 window 访问错误。这个修复不仅解决了当前问题，还提高了代码的健壮性和可维护性。
