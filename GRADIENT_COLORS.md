# 渐变色配置说明

## 概述

本系统使用48组精心挑选的渐变色，为数据指标卡片提供美观的视觉效果。所有渐变色配置集中管理在 `src/config/gradients.ts` 文件中。

## 配置文件结构

### 1. 渐变色数组

```typescript
export const GRADIENT_COLORS: GradientColor[] = [
  { from: '#A531DC', to: '#4300B1' },  // 紫色渐变
  { from: '#FF896D', to: '#D02020' },  // 橙红渐变
  { from: '#3793FF', to: '#0017E4' },  // 蓝色渐变
  // ... 共48组
];
```

**特点**：
- 共48组渐变色组合
- 每组包含起始色(from)和结束色(to)
- 颜色搭配经过精心挑选
- 支持循环使用

### 2. 工具函数

#### getGradientColor
```typescript
function getGradientColor(index: number): GradientColor
```
根据索引获取渐变色，支持循环访问（使用模运算）。

#### generateGradientStyle
```typescript
function generateGradientStyle(gradient: GradientColor, angle: number = 135): string
```
生成CSS渐变背景样式，默认135度角渐变。

### 3. 预定义配置

#### Dashboard页面渐变色
```typescript
export const DASHBOARD_GRADIENTS = [
  GRADIENT_COLORS[0],  // 考试次数 - 紫色渐变
  GRADIENT_COLORS[1],  // 平均分 - 橙红渐变
  GRADIENT_COLORS[2],  // 最高分 - 蓝色渐变
  GRADIENT_COLORS[3],  // 平均用时 - 黄橙渐变
];
```

#### ExamDetail页面渐变色
```typescript
export const EXAM_DETAIL_GRADIENTS = [
  GRADIENT_COLORS[4],  // 总分 - 青蓝渐变
  GRADIENT_COLORS[5],  // 用时 - 黄粉渐变
  GRADIENT_COLORS[6],  // 平均分 - 绿蓝渐变
  GRADIENT_COLORS[7],  // 难度 - 紫色渐变
  GRADIENT_COLORS[8],  // 击败率 - 灰色渐变
];
```

## 应用场景

### 1. Dashboard页面

**位置**：`src/pages/Dashboard.tsx`

**应用的指标**：
- 考试次数：紫色渐变 (#A531DC → #4300B1)
- 平均分：橙红渐变 (#FF896D → #D02020)
- 最高分：蓝色渐变 (#3793FF → #0017E4)
- 平均用时：黄橙渐变 (#FFD439 → #FF7A00)

**使用方式**：
```tsx
<Card 
  className="stat-card"
  style={{ background: generateGradientStyle(DASHBOARD_GRADIENTS[0]) }}
>
  <span className="text-white">考试次数</span>
  <div className="text-white">{stats.totalExams}</div>
</Card>
```

### 2. ExamDetail页面

**位置**：`src/pages/ExamDetail.tsx`

**应用的指标**（已移除最高分）：
- 总分：青蓝渐变 (#7CF7FF → #4B73FF)
- 用时：黄粉渐变 (#FFED46 → #FF7EC7)
- 平均分：绿蓝渐变 (#8FFF85 → #39A0FF)
- 难度：紫色渐变 (#8A88FB → #D079EE)
- 击败率：灰色渐变 (#EAEAEA → #8B8B8B)

**使用方式**：
```tsx
<Card 
  className="exam-stat-card"
  style={{ background: generateGradientStyle(EXAM_DETAIL_GRADIENTS[0]) }}
>
  <span className="text-white">总分</span>
  <div className="text-white">{examDetail.total_score}</div>
</Card>
```

## 完整渐变色列表

| 索引 | 起始色 | 结束色 | 描述 |
|------|--------|--------|------|
| 0 | #A531DC | #4300B1 | 紫色渐变 |
| 1 | #FF896D | #D02020 | 橙红渐变 |
| 2 | #3793FF | #0017E4 | 蓝色渐变 |
| 3 | #FFD439 | #FF7A00 | 黄橙渐变 |
| 4 | #7CF7FF | #4B73FF | 青蓝渐变 |
| 5 | #FFED46 | #FF7EC7 | 黄粉渐变 |
| 6 | #8FFF85 | #39A0FF | 绿蓝渐变 |
| 7 | #8A88FB | #D079EE | 紫色渐变 |
| 8 | #EAEAEA | #8B8B8B | 灰色渐变 |
| 9 | #FFEB3A | #4DEF8E | 黄绿渐变 |
| 10 | #565656 | #181818 | 深灰渐变 |
| 11 | #FFBB89 | #7B6AE0 | 橙紫渐变 |
| 12 | #FFF500 | #FFB800 | 黄色渐变 |
| 13 | #FFEAF6 | #FF9DE4 | 粉色渐变 |
| 14 | #00B960 | #00552C | 绿色渐变 |
| 15 | #FFE6A4 | #AD8211 | 金色渐变 |
| 16 | #C5EDF5 | #4A879A | 青色渐变 |
| 17 | #FFF6EB | #DFD1C5 | 米色渐变 |
| 18 | #FF9D7E | #4D6AD0 | 橙蓝渐变 |
| 19 | #DD7BFF | #FF6C6C | 紫红渐变 |
| 20 | #E0FF87 | #8FB85B | 黄绿渐变 |
| 21 | #FFDC99 | #FF62C0 | 橙粉渐变 |
| 22 | #DDE4FF | #8DA2EE | 淡蓝渐变 |
| 23 | #97E8B5 | #5CB67F | 薄荷绿渐变 |
| 24 | #24CFC5 | #001C63 | 青蓝渐变 |
| 25 | #FF3F3F | #063CFF | 红蓝渐变 |
| 26 | #5D85A6 | #0E2C5E | 深蓝渐变 |
| 27 | #DEB5FF | #6F00B3 | 淡紫渐变 |
| 28 | #FF5EEF | #456EFF | 粉蓝渐变 |
| 29 | #AFCCCB | #616566 | 灰绿渐变 |
| 30 | #4063BC | #6B0013 | 蓝红渐变 |
| 31 | #FFF500 | #FF00B8 | 黄粉渐变 |
| 32 | #FF5E98 | #0F213E | 粉蓝渐变 |
| 33 | #FFC328 | #E20000 | 橙红渐变 |
| 34 | #FFE70B | #27B643 | 黄绿渐变 |
| 35 | #FFADF7 | #B1FF96 | 粉绿渐变 |
| 36 | #61C695 | #133114 | 绿色渐变 |
| 37 | #B7DCFF | #FFA4F6 | 蓝粉渐变 |
| 38 | #9F25FF | #FF7A00 | 紫橙渐变 |
| 39 | #5EE2FF | #00576A | 青色渐变 |
| 40 | #FF0000 | #470000 | 红色渐变 |
| 41 | #4643DF | #0B0A47 | 深蓝渐变 |
| 42 | #D7003A | #19087E | 红紫渐变 |
| 43 | #FADD76 | #9F3311 | 金橙渐变 |
| 44 | #00E0EE | #AD00FE | 青紫渐变 |
| 45 | #D0004B | #88069D | 红紫渐变 |
| 46 | #FF8570 | #418CB7 | 橙蓝渐变 |
| 47 | #B9A14C | #000000 | 金黑渐变 |

## 使用指南

### 1. 基本使用

```tsx
import { generateGradientStyle, GRADIENT_COLORS } from '@/config/gradients';

// 使用预定义渐变色
<div style={{ background: generateGradientStyle(GRADIENT_COLORS[0]) }}>
  内容
</div>

// 自定义角度
<div style={{ background: generateGradientStyle(GRADIENT_COLORS[0], 90) }}>
  内容
</div>
```

### 2. 循环使用

```tsx
import { getGradientColor, generateGradientStyle } from '@/config/gradients';

// 自动循环，索引超过47会从0开始
const items = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  gradient: getGradientColor(i)
}));

items.map(item => (
  <div key={item.id} style={{ background: generateGradientStyle(item.gradient) }}>
    {item.id}
  </div>
));
```

### 3. 文字颜色建议

使用渐变背景时，建议文字使用白色以确保可读性：

```tsx
<Card style={{ background: generateGradientStyle(GRADIENT_COLORS[0]) }}>
  <span className="text-white">标题</span>
  <div className="text-white">内容</div>
  <Icon className="text-white opacity-80" />
</Card>
```

## 设计原则

### 1. 颜色对比度
- 所有文字使用白色
- 图标使用白色 + 80%透明度
- 确保在渐变背景上清晰可读
- 符合WCAG可访问性标准

### 2. 视觉层次
- 不同指标使用不同渐变色
- 色彩丰富但不杂乱
- 保持整体协调统一
- 突出重点信息

### 3. 用户体验
- 提升视觉吸引力
- 增强信息识别度
- 现代化设计风格
- 专业的界面质感

## 扩展建议

### 1. 主题支持
```typescript
// 可以添加暗色模式渐变色
export const DARK_MODE_GRADIENTS = [
  { from: '#1a1a2e', to: '#16213e' },
  // ...
];
```

### 2. 动画效果
```css
.gradient-card {
  background: linear-gradient(135deg, #A531DC, #4300B1);
  transition: background 0.3s ease;
}

.gradient-card:hover {
  background: linear-gradient(135deg, #4300B1, #A531DC);
}
```

### 3. 更多应用场景
- 图表背景渐变
- 按钮渐变效果
- 进度条渐变填充
- 标签渐变样式
- 徽章渐变背景

## 注意事项

1. **性能考虑**
   - 渐变色使用CSS实现，性能良好
   - 避免在动画中频繁切换渐变
   - 大量元素时考虑使用CSS类而非内联样式

2. **可访问性**
   - 确保文字与背景有足够对比度
   - 不要仅依赖颜色传达信息
   - 提供替代的视觉提示

3. **浏览器兼容性**
   - linear-gradient支持所有现代浏览器
   - IE9及以下不支持，需要降级方案
   - 移动端浏览器完全支持

## 相关文件

- `src/config/gradients.ts` - 渐变色配置文件
- `src/pages/Dashboard.tsx` - 首页应用示例
- `src/pages/ExamDetail.tsx` - 详情页应用示例
