# 持久化计时器实现方案

## 问题分析

### 当前问题
1. **浏览器节流影响**：切换标签页时，浏览器会降低`setInterval`的执行频率，导致计时不准确
2. **页面刷新丢失状态**：虽然有localStorage保存，但基于累加的计时方式无法准确恢复
3. **长时间后台运行**：浏览器可能暂停或减慢后台标签页的JavaScript执行

### 解决方案核心思想
使用**基于时间戳的计时方式**，而不是简单的`setInterval`累加：
- 记录开始时间戳
- 每次更新时计算：`当前时间 - 开始时间 + 累计时间`
- 这样即使`setInterval`被节流，计算出的时间仍然准确

## 技术实现

### 1. usePersistentTimer Hook

已创建的Hook位于：`src/hooks/usePersistentTimer.ts`

**核心特性**：
- ✅ 基于时间戳计时，不受浏览器节流影响
- ✅ 自动保存到localStorage，关闭页面后可恢复
- ✅ 支持Page Visibility API，检测页面可见性变化
- ✅ 页面恢复时自动同步实际经过的时间
- ✅ 支持暂停/继续功能

**使用示例**：
```typescript
const timer = usePersistentTimer({
  storageKey: 'exam_timer_total',
  enableVisibilityTracking: true,
  continueWhenHidden: true,
  syncInterval: 1000,
  onRestore: (elapsedSeconds) => {
    console.log('恢复计时，已用时间：', elapsedSeconds);
  },
  onHidden: () => {
    console.log('页面隐藏');
  },
  onVisible: () => {
    console.log('页面恢复可见');
  },
});

// 使用
timer.start();      // 开始计时
timer.pause();      // 暂停
timer.resume();     // 继续
timer.stop();       // 停止并清除状态
timer.reset();      // 重置
timer.currentTime;  // 当前时间（秒）
timer.isRunning;    // 是否运行中
timer.isPaused;     // 是否暂停
```

### 2. 示例组件

已创建示例组件：`src/components/tools/PersistentTimerExample.tsx`

可以在"小工具"页面的"持久化计时器示例"标签中查看和测试。

### 3. 测试方法

#### 测试1：后台运行准确性
1. 打开"持久化计时器示例"
2. 点击"开始计时"
3. 切换到其他标签页，等待1-2分钟
4. 切回来，观察时间是否准确（应该准确到秒）

#### 测试2：页面关闭恢复
1. 点击"开始计时"
2. 等待10秒
3. 关闭或刷新页面
4. 重新打开，应该自动恢复并补偿关闭期间的时间

#### 测试3：暂停状态恢复
1. 点击"开始计时"
2. 等待10秒后点击"暂停"
3. 关闭页面
4. 重新打开，时间应该保持在暂停时的值

#### 测试4：长时间后台
1. 点击"开始计时"
2. 最小化浏览器或锁屏
3. 等待10分钟以上
4. 恢复后，时间应该准确（误差不超过1秒）

## 迁移现有ExamTimer

### 方案1：完全重写（推荐）

使用`usePersistentTimer`重写ExamTimer组件：

```typescript
// 总计时器
const totalTimer = usePersistentTimer({
  storageKey: 'exam_timer_total',
  enableVisibilityTracking: true,
  onRestore: (elapsedSeconds) => {
    message.success(`恢复计时状态，已用时间：${formatTime(elapsedSeconds)}`);
  },
});

// 每个模块的计时器
const moduleTimers = modules.map(module => 
  usePersistentTimer({
    storageKey: `exam_timer_module_${module.id}`,
    enableVisibilityTracking: true,
  })
);
```

### 方案2：渐进式改造

保留现有代码结构，只修改计时逻辑：

#### 步骤1：修改状态结构
```typescript
interface TimerState {
  // 改为时间戳
  totalStartTimestamp: number | null;  // 之前是 totalStartTime
  // 添加累计时间
  totalAccumulatedTime: number;
  // 暂停时间戳
  pauseStartTimestamp: number | null;
  // 其他保持不变
  isPaused: boolean;
  isRunning: boolean;
  modules: Module[];
}
```

#### 步骤2：修改计时逻辑
```typescript
// 之前：基于累加
setInterval(() => {
  setTotalTime(prev => prev + 1);
}, 1000);

// 改为：基于时间戳
setInterval(() => {
  if (state.totalStartTimestamp) {
    const now = Date.now();
    const elapsed = Math.floor(
      (now - state.totalStartTimestamp + state.totalAccumulatedTime) / 1000
    );
    setTotalTime(elapsed);
  }
}, 1000);
```

#### 步骤3：添加Page Visibility API
```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden && state.isRunning && !state.isPaused) {
      // 页面恢复可见，重新计算时间
      const now = Date.now();
      const elapsed = now - state.totalStartTimestamp + state.totalAccumulatedTime;
      
      setState(prev => ({
        ...prev,
        totalStartTimestamp: now,
        totalAccumulatedTime: elapsed,
      }));
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [state]);
```

#### 步骤4：修改暂停/继续逻辑
```typescript
// 暂停
const handlePause = () => {
  const now = Date.now();
  const elapsed = now - state.totalStartTimestamp + state.totalAccumulatedTime;
  
  setState(prev => ({
    ...prev,
    isPaused: true,
    pauseStartTimestamp: now,
    totalAccumulatedTime: elapsed,
  }));
};

// 继续
const handleResume = () => {
  setState(prev => ({
    ...prev,
    isPaused: false,
    totalStartTimestamp: Date.now(),
    pauseStartTimestamp: null,
  }));
};
```

#### 步骤5：修改localStorage保存/恢复
```typescript
// 保存时包含时间戳
localStorage.setItem(STORAGE_KEY, JSON.stringify({
  ...state,
  lastSaveTimestamp: Date.now(),
}));

// 恢复时补偿时间
const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY));
if (savedState && savedState.isRunning && !savedState.isPaused) {
  const now = Date.now();
  const timeSinceLastSave = now - savedState.lastSaveTimestamp;
  
  setState({
    ...savedState,
    totalStartTimestamp: now,
    totalAccumulatedTime: savedState.totalAccumulatedTime + timeSinceLastSave,
  });
}
```

## 关键技术点

### 1. 时间戳计算公式

**运行状态**：
```
当前显示时间 = (当前时间戳 - 开始时间戳 + 累计时间) / 1000
```

**暂停状态**：
```
当前显示时间 = 累计时间 / 1000
```

### 2. Page Visibility API

```typescript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // 页面隐藏
    console.log('页面隐藏，保存当前状态');
  } else {
    // 页面可见
    console.log('页面恢复，同步时间');
  }
});
```

### 3. beforeunload事件

```typescript
window.addEventListener('beforeunload', () => {
  // 页面卸载前保存状态
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
});
```

### 4. 时间同步策略

- **定期保存**：每秒保存一次状态到localStorage
- **页面隐藏时保存**：visibilitychange事件触发时保存
- **页面卸载前保存**：beforeunload事件触发时保存
- **页面恢复时同步**：重新计算实际经过的时间

## 性能优化

### 1. 减少localStorage写入频率

```typescript
// 不要每秒都写localStorage
let lastSaveTime = 0;
const SAVE_INTERVAL = 5000; // 5秒保存一次

setInterval(() => {
  const now = Date.now();
  if (now - lastSaveTime > SAVE_INTERVAL) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    lastSaveTime = now;
  }
}, 1000);
```

### 2. 使用requestAnimationFrame

对于需要高精度的场景，可以使用`requestAnimationFrame`代替`setInterval`：

```typescript
const updateTime = () => {
  if (state.isRunning && !state.isPaused) {
    const now = Date.now();
    const elapsed = Math.floor(
      (now - state.totalStartTimestamp + state.totalAccumulatedTime) / 1000
    );
    setTotalTime(elapsed);
    
    requestAnimationFrame(updateTime);
  }
};

requestAnimationFrame(updateTime);
```

### 3. 防抖保存

```typescript
import { debounce } from 'lodash';

const saveState = debounce((state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}, 1000);
```

## 常见问题

### Q1: 为什么不直接用Web Worker？

**A**: Web Worker可以在后台线程运行，但：
1. 增加了复杂度
2. 需要额外的通信机制
3. 基于时间戳的方案已经足够准确
4. Web Worker在某些浏览器中也可能被限制

如果需要更高的可靠性，可以考虑使用Service Worker。

### Q2: 如何处理系统时间被修改？

**A**: 可以使用`performance.now()`代替`Date.now()`：

```typescript
const startTime = performance.now();
const elapsed = performance.now() - startTime;
```

`performance.now()`基于页面加载时间，不受系统时间影响。

### Q3: 如何处理多标签页同步？

**A**: 使用`storage`事件监听其他标签页的变化：

```typescript
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY && e.newValue) {
    const newState = JSON.parse(e.newValue);
    setState(newState);
  }
});
```

### Q4: 移动端浏览器会杀死后台标签页怎么办？

**A**: 
1. 移动端浏览器确实会更激进地杀死后台标签页
2. 但我们的方案基于时间戳，即使被杀死，重新打开后也能准确恢复
3. 关键是在页面卸载前保存状态（beforeunload事件）

## 总结

### 核心优势
1. ✅ **准确性**：基于时间戳，不受浏览器节流影响
2. ✅ **持久性**：localStorage保存，关闭后可恢复
3. ✅ **自动同步**：Page Visibility API自动同步时间
4. ✅ **简单易用**：封装成Hook，使用方便

### 推荐方案
- **新项目**：直接使用`usePersistentTimer` Hook
- **现有项目**：渐进式改造，先修改计时逻辑，再添加Page Visibility API

### 下一步
1. 在"持久化计时器示例"中测试各种场景
2. 确认满足需求后，迁移ExamTimer组件
3. 添加更多功能（如倒计时、多计时器管理等）
