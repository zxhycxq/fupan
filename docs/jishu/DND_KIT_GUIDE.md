# @dnd-kit 拖拽排序库使用指南

## 📚 目录

1. [简介](#简介)
2. [为什么选择 @dnd-kit](#为什么选择-dnd-kit)
3. [核心概念](#核心概念)
4. [在本项目中的应用](#在本项目中的应用)
5. [完整示例](#完整示例)
6. [常见问题](#常见问题)
7. [最佳实践](#最佳实践)
8. [API 参考](#api-参考)

---

## 简介

@dnd-kit 是一个现代化的、轻量级的、高性能的 React 拖拽排序库。本项目已全面采用 @dnd-kit 替代已停止维护的 react-sortable-hoc。

### 项目中的使用场景

- **ExamTimer 组件**：小工具拖拽排序（`src/components/tools/ExamTimer.tsx`）
- **ExamList 页面**：考试记录列表拖拽排序（`src/pages/ExamList.tsx`）

---

## 为什么选择 @dnd-kit

### 与 react-sortable-hoc 对比

| 特性 | @dnd-kit | react-sortable-hoc |
|------|----------|-------------------|
| 维护状态 | ✅ 活跃维护 | ❌ 5年未更新 |
| TypeScript 支持 | ✅ 原生支持 | ⚠️ 需要额外类型包 |
| 性能 | ✅ 高性能 | ⚠️ 一般 |
| 灵活性 | ✅ 高度可定制 | ⚠️ 有限 |
| 包大小 | ✅ 模块化，按需引入 | ⚠️ 较大 |
| 无障碍支持 | ✅ 内置支持 | ❌ 无 |
| 触摸设备支持 | ✅ 完善 | ⚠️ 有限 |

### 主要优势

1. **现代化架构**：基于 React Hooks，API 设计简洁
2. **高性能**：使用 CSS transforms 和 GPU 加速
3. **灵活性**：支持多种拖拽场景（列表、网格、多容器等）
4. **可访问性**：内置键盘导航和屏幕阅读器支持
5. **TypeScript**：完整的类型定义
6. **移动端友好**：完善的触摸设备支持

---

## 核心概念

### 1. DndContext（拖拽上下文）

`DndContext` 是所有拖拽功能的根组件，提供拖拽状态管理。

```tsx
import { DndContext } from '@dnd-kit/core';

<DndContext
  sensors={sensors}              // 传感器配置
  collisionDetection={closestCenter}  // 碰撞检测算法
  onDragEnd={handleDragEnd}      // 拖拽结束回调
>
  {/* 可拖拽内容 */}
</DndContext>
```

**关键属性：**
- `sensors`：定义如何触发拖拽（鼠标、触摸、键盘等）
- `collisionDetection`：决定拖拽元素与目标元素的碰撞检测方式
- `onDragEnd`：拖拽结束时的回调函数

### 2. SortableContext（排序上下文）

`SortableContext` 定义可排序的元素集合。

```tsx
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

<SortableContext
  items={items.map(item => item.id)}  // 元素ID数组
  strategy={verticalListSortingStrategy}  // 排序策略
>
  {/* 可排序元素 */}
</SortableContext>
```

**排序策略：**
- `verticalListSortingStrategy`：垂直列表（默认）
- `horizontalListSortingStrategy`：水平列表
- `rectSortingStrategy`：网格布局

### 3. useSortable（排序钩子）

`useSortable` 让元素变得可拖拽和可排序。

```tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableItem = ({ id }) => {
  const {
    attributes,      // 拖拽属性
    listeners,       // 拖拽事件监听器
    setNodeRef,      // 设置DOM引用
    transform,       // 变换矩阵
    transition,      // 过渡动画
    isDragging,      // 是否正在拖拽
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* 内容 */}
    </div>
  );
};
```

### 4. Sensors（传感器）

传感器定义如何触发拖拽操作。

```tsx
import { useSensor, useSensors, PointerSensor } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 1,  // 移动1px后才开始拖拽
    },
  })
);
```

**常用传感器：**
- `PointerSensor`：鼠标和触摸（推荐）
- `MouseSensor`：仅鼠标
- `TouchSensor`：仅触摸
- `KeyboardSensor`：键盘导航

### 5. arrayMove（数组移动）

`arrayMove` 用于重新排列数组元素。

```tsx
import { arrayMove } from '@dnd-kit/sortable';

const newArray = arrayMove(oldArray, oldIndex, newIndex);
```

---

## 在本项目中的应用

### 场景一：ExamTimer 小工具排序

**文件位置：** `src/components/tools/ExamTimer.tsx`

**功能描述：** 用户可以拖拽小工具卡片进行排序，排序结果自动保存到 localStorage。

**核心代码：**

```tsx
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 1. 配置传感器
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // 移动8px后才开始拖拽，避免误触发
    },
  })
);

// 2. 拖拽结束处理
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (over && active.id !== over.id) {
    const oldIndex = widgets.findIndex((w) => w.id === active.id);
    const newIndex = widgets.findIndex((w) => w.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newWidgets = arrayMove(widgets, oldIndex, newIndex);
      setWidgets(newWidgets);
      // 保存到 localStorage
      localStorage.setItem('examTimerWidgets', JSON.stringify(newWidgets));
    }
  }
};

// 3. 可排序卡片组件
const SortableWidgetCard = ({ widget }: { widget: Widget }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* 卡片内容 */}
    </div>
  );
};

// 4. 渲染
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={widgets.map((w) => w.id)}
    strategy={verticalListSortingStrategy}
  >
    {widgets.map((widget) => (
      <SortableWidgetCard key={widget.id} widget={widget} />
    ))}
  </SortableContext>
</DndContext>
```

**特点：**
- 使用 `PointerSensor` 支持鼠标和触摸
- 设置 `activationConstraint.distance = 8` 避免点击误触发拖拽
- 拖拽时降低透明度（`opacity: 0.5`）提供视觉反馈
- 排序结果自动保存到 localStorage

---

### 场景二：ExamList 表格行排序

**文件位置：** `src/pages/ExamList.tsx`

**功能描述：** 用户可以拖拽表格行进行排序，点击"保存排序"按钮后将排序结果保存到数据库。

**核心代码：**

```tsx
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 1. 配置传感器
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 1, // 移动1px后才开始拖拽
    },
  })
);

// 2. 拖拽结束处理
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (over && active.id !== over.id) {
    const oldIndex = examRecords.findIndex((record) => record.id === active.id);
    const newIndex = examRecords.findIndex((record) => record.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newData = arrayMove(examRecords, oldIndex, newIndex);
      setExamRecords(newData);
      setHasUnsavedSort(true); // 标记有未保存的排序
    }
  }
};

// 3. 可排序的表格行组件
interface SortableRowProps {
  'data-row-key': string;
  [key: string]: any;
}

const SortableRow = (props: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props['data-row-key'],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'move',
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  };

  return (
    <tr
      {...props}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    />
  );
};

// 4. 表格行包装器
const DraggableBodyRow = (props: SortableRowProps) => {
  // 如果没有data-row-key，返回普通行
  if (!props['data-row-key']) {
    return <tr {...props} />;
  }
  
  return <SortableRow {...props} />;
};

// 5. 渲染
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={filteredRecords.map((record) => record.id)}
    strategy={verticalListSortingStrategy}
  >
    <Table
      columns={columns}
      dataSource={filteredRecords}
      rowKey="id"
      components={{
        body: {
          row: DraggableBodyRow,
        },
      }}
    />
  </SortableContext>
</DndContext>
```

**特点：**
- 使用 `PointerSensor` 支持鼠标和触摸
- 设置 `activationConstraint.distance = 1` 快速响应拖拽
- 拖拽时提升 `zIndex` 确保行在最上层
- 排序后显示"保存排序"按钮，用户确认后才保存到数据库
- 支持 Ant Design Table 组件的自定义行渲染

---

## 完整示例

### 示例一：简单列表排序

```tsx
import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Item {
  id: string;
  content: string;
}

const SortableItem = ({ id, content }: Item) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '16px',
    margin: '8px 0',
    backgroundColor: isDragging ? '#f0f0f0' : '#fff',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    cursor: 'move',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {content}
    </div>
  );
};

const SimpleList = () => {
  const [items, setItems] = useState<Item[]>([
    { id: '1', content: '项目 1' },
    { id: '2', content: '项目 2' },
    { id: '3', content: '项目 3' },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setItems(arrayMove(items, oldIndex, newIndex));
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item) => (
          <SortableItem key={item.id} {...item} />
        ))}
      </SortableContext>
    </DndContext>
  );
};

export default SimpleList;
```

---

### 示例二：带拖拽手柄的列表

```tsx
import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MenuOutlined } from '@ant-design/icons';

interface Item {
  id: string;
  content: string;
}

const SortableItemWithHandle = ({ id, content }: Item) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '16px',
    margin: '8px 0',
    backgroundColor: isDragging ? '#f0f0f0' : '#fff',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* 拖拽手柄 */}
      <div
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', color: '#999' }}
      >
        <MenuOutlined />
      </div>
      {/* 内容 */}
      <div style={{ flex: 1 }}>{content}</div>
    </div>
  );
};

const ListWithHandle = () => {
  const [items, setItems] = useState<Item[]>([
    { id: '1', content: '项目 1' },
    { id: '2', content: '项目 2' },
    { id: '3', content: '项目 3' },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setItems(arrayMove(items, oldIndex, newIndex));
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item) => (
          <SortableItemWithHandle key={item.id} {...item} />
        ))}
      </SortableContext>
    </DndContext>
  );
};

export default ListWithHandle;
```

---

## 常见问题

### 1. 拖拽时元素闪烁或跳动

**原因：** 可能是 CSS 样式冲突或 transform 计算问题。

**解决方案：**
```tsx
const style: React.CSSProperties = {
  transform: CSS.Transform.toString(transform),
  transition,
  // 添加以下样式
  touchAction: 'none', // 禁用触摸滚动
  userSelect: 'none',  // 禁用文本选择
};
```

---

### 2. 点击元素时误触发拖拽

**原因：** 传感器的激活距离设置过小。

**解决方案：**
```tsx
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // 增加激活距离
    },
  })
);
```

---

### 3. 拖拽时元素被其他元素遮挡

**原因：** z-index 设置不当。

**解决方案：**
```tsx
const style: React.CSSProperties = {
  transform: CSS.Transform.toString(transform),
  transition,
  ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
};
```

---

### 4. 在 Ant Design Table 中使用拖拽

**问题：** Table 组件的行渲染需要特殊处理。

**解决方案：**
```tsx
// 1. 创建可排序的行组件
const SortableRow = (props: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props['data-row-key'],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'move',
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  };

  return (
    <tr
      {...props}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    />
  );
};

// 2. 在 Table 中使用
<Table
  components={{
    body: {
      row: SortableRow,
    },
  }}
/>
```

---

### 5. 拖拽在移动端不工作

**原因：** 可能是触摸事件被阻止。

**解决方案：**
```tsx
// 使用 PointerSensor 而不是 MouseSensor
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  })
);

// 添加 CSS
const style: React.CSSProperties = {
  touchAction: 'none', // 禁用触摸滚动
};
```

---

### 6. 拖拽后数据没有更新

**原因：** 可能是状态更新问题或 items 数组没有正确传递。

**解决方案：**
```tsx
// 确保 items 是最新的
<SortableContext
  items={items.map((item) => item.id)} // 使用 ID 数组
  strategy={verticalListSortingStrategy}
>
  {items.map((item) => (
    <SortableItem key={item.id} {...item} />
  ))}
</SortableContext>

// 确保 handleDragEnd 正确更新状态
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (over && active.id !== over.id) {
    setItems((prevItems) => {
      const oldIndex = prevItems.findIndex((item) => item.id === active.id);
      const newIndex = prevItems.findIndex((item) => item.id === over.id);
      return arrayMove(prevItems, oldIndex, newIndex);
    });
  }
};
```

---

## 最佳实践

### 1. 传感器配置

```tsx
// ✅ 推荐：使用 PointerSensor 支持鼠标和触摸
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // 根据场景调整（1-10px）
    },
  })
);

// ❌ 不推荐：分别配置鼠标和触摸传感器
const sensors = useSensors(
  useSensor(MouseSensor),
  useSensor(TouchSensor)
);
```

---

### 2. 性能优化

```tsx
// ✅ 使用 useMemo 缓存 items 数组
const itemIds = useMemo(() => items.map((item) => item.id), [items]);

<SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
  {items.map((item) => (
    <SortableItem key={item.id} {...item} />
  ))}
</SortableContext>
```

---

### 3. 样式处理

```tsx
// ✅ 使用 CSS.Transform.toString 转换 transform
const style: React.CSSProperties = {
  transform: CSS.Transform.toString(transform),
  transition,
  // 添加必要的样式
  touchAction: 'none',
  userSelect: 'none',
};

// ❌ 不推荐：手动拼接 transform 字符串
const style: React.CSSProperties = {
  transform: `translate3d(${transform?.x}px, ${transform?.y}px, 0)`,
};
```

---

### 4. 拖拽手柄

```tsx
// ✅ 推荐：只在手柄上绑定拖拽事件
<div ref={setNodeRef} style={style}>
  <div {...attributes} {...listeners} style={{ cursor: 'grab' }}>
    <MenuOutlined />
  </div>
  <div>{content}</div>
</div>

// ❌ 不推荐：整个元素都可拖拽
<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
  <div>{content}</div>
</div>
```

---

### 5. 错误处理

```tsx
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  // ✅ 添加边界检查
  if (!over || active.id === over.id) {
    return;
  }

  const oldIndex = items.findIndex((item) => item.id === active.id);
  const newIndex = items.findIndex((item) => item.id === over.id);

  // ✅ 检查索引有效性
  if (oldIndex === -1 || newIndex === -1) {
    console.error('Invalid drag operation');
    return;
  }

  setItems(arrayMove(items, oldIndex, newIndex));
};
```

---

### 6. 可访问性

```tsx
// ✅ 添加 aria 属性
const SortableItem = ({ id, content }: Item) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      aria-label={`拖拽 ${content}`}
      tabIndex={0}
    >
      {content}
    </div>
  );
};
```

---

## API 参考

### DndContext

| 属性 | 类型 | 说明 |
|------|------|------|
| `sensors` | `SensorDescriptor[]` | 传感器配置 |
| `collisionDetection` | `CollisionDetection` | 碰撞检测算法 |
| `onDragStart` | `(event: DragStartEvent) => void` | 拖拽开始回调 |
| `onDragMove` | `(event: DragMoveEvent) => void` | 拖拽移动回调 |
| `onDragOver` | `(event: DragOverEvent) => void` | 拖拽悬停回调 |
| `onDragEnd` | `(event: DragEndEvent) => void` | 拖拽结束回调 |
| `onDragCancel` | `() => void` | 拖拽取消回调 |

---

### SortableContext

| 属性 | 类型 | 说明 |
|------|------|------|
| `items` | `string[]` | 可排序元素的 ID 数组 |
| `strategy` | `SortingStrategy` | 排序策略 |

**排序策略：**
- `verticalListSortingStrategy`：垂直列表
- `horizontalListSortingStrategy`：水平列表
- `rectSortingStrategy`：网格布局

---

### useSortable

**返回值：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `attributes` | `object` | 拖拽属性（aria-*等） |
| `listeners` | `object` | 拖拽事件监听器 |
| `setNodeRef` | `(node: HTMLElement \| null) => void` | 设置 DOM 引用 |
| `transform` | `Transform \| null` | 变换矩阵 |
| `transition` | `string \| undefined` | 过渡动画 |
| `isDragging` | `boolean` | 是否正在拖拽 |
| `isSorting` | `boolean` | 是否正在排序 |
| `over` | `Over \| null` | 当前悬停的目标 |

---

### useSensor / useSensors

**常用传感器：**

| 传感器 | 说明 | 适用场景 |
|--------|------|----------|
| `PointerSensor` | 鼠标和触摸 | 推荐，支持所有设备 |
| `MouseSensor` | 仅鼠标 | 桌面端专用 |
| `TouchSensor` | 仅触摸 | 移动端专用 |
| `KeyboardSensor` | 键盘导航 | 无障碍支持 |

**配置选项：**

```tsx
useSensor(PointerSensor, {
  activationConstraint: {
    distance: 8,        // 激活距离（px）
    delay: 0,           // 激活延迟（ms）
    tolerance: 5,       // 容差（px）
  },
});
```

---

### arrayMove

```tsx
import { arrayMove } from '@dnd-kit/sortable';

const newArray = arrayMove(array, oldIndex, newIndex);
```

**参数：**
- `array`：原数组
- `oldIndex`：旧索引
- `newIndex`：新索引

**返回值：** 新数组（不修改原数组）

---

### CSS.Transform

```tsx
import { CSS } from '@dnd-kit/utilities';

const style = {
  transform: CSS.Transform.toString(transform),
};
```

**说明：** 将 transform 对象转换为 CSS transform 字符串。

---

## 总结

@dnd-kit 是一个功能强大、灵活且现代化的拖拽排序库。本项目已全面采用 @dnd-kit 替代 react-sortable-hoc，提供了更好的性能、更完善的 TypeScript 支持和更友好的移动端体验。

**关键要点：**
1. 使用 `DndContext` 提供拖拽上下文
2. 使用 `SortableContext` 定义可排序元素
3. 使用 `useSortable` 让元素可拖拽
4. 使用 `PointerSensor` 支持鼠标和触摸
5. 使用 `arrayMove` 重新排列数组
6. 使用 `CSS.Transform.toString` 转换 transform

**参考资源：**
- [官方文档](https://docs.dndkit.com/)
- [GitHub 仓库](https://github.com/clauderic/dnd-kit)
- [示例集合](https://master--5fc05e08a4a65d0021ae0bf2.chromatic.com/)
