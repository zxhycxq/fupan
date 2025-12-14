// 图表样式配置
// 用于统一管理图表的颜色、形状等视觉元素

// 定义对比鲜明的颜色方案（暖色和冷色交替）
export const CHART_COLORS = [
  '#FF6B6B', // 暖色：红色
  '#4ECDC4', // 冷色：青色
  '#FFD93D', // 暖色：黄色
  '#6C5CE7', // 冷色：紫色
  '#FF8C42', // 暖色：橙色
  '#00B894', // 冷色：绿色
  '#FD79A8', // 暖色：粉色
  '#0984E3', // 冷色：蓝色
  '#FDCB6E', // 暖色：金黄色
  '#6C5CE7', // 冷色：靛蓝色
  '#E17055', // 暖色：珊瑚色
  '#00CEC9', // 冷色：青绿色
  '#FF7675', // 暖色：浅红色
  '#74B9FF', // 冷色：天蓝色
  '#FAB1A0', // 暖色：杏色
  '#A29BFE', // 冷色：淡紫色
];

// 定义多样化的符号形状
export const CHART_SYMBOLS = [
  'circle',        // 圆形 ●
  'rect',          // 方形 ■
  'triangle',      // 三角形 ▲
  'diamond',       // 菱形 ◆
  'roundRect',     // 圆角矩形
  'pin',           // 标记形状
  'arrow',         // 箭头形状
  'emptyCircle',   // 空心圆 ○
];

// 获取图表颜色（根据索引）
export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

// 获取图表符号（根据索引）
export function getChartSymbol(index: number): string {
  return CHART_SYMBOLS[index % CHART_SYMBOLS.length];
}

// 获取系列配置（包含颜色和符号）
export function getSeriesStyle(index: number) {
  return {
    color: getChartColor(index),
    symbol: getChartSymbol(index),
    symbolSize: 8,
    lineStyle: {
      width: 2.5,
    },
    itemStyle: {
      borderWidth: 2,
      borderColor: '#fff',
    },
  };
}

// 为饼图生成渐变色
export function getPieGradientColor(index: number) {
  const baseColor = getChartColor(index);
  return {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      {
        offset: 0,
        color: baseColor,
      },
      {
        offset: 1,
        color: adjustBrightness(baseColor, -20),
      },
    ],
  };
}

// 调整颜色亮度
function adjustBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

// 为柱状图生成渐变色
export function getBarGradientColor(index: number) {
  const baseColor = getChartColor(index);
  return {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      {
        offset: 0,
        color: adjustBrightness(baseColor, 20),
      },
      {
        offset: 1,
        color: baseColor,
      },
    ],
  };
}

// 图例配置
export const LEGEND_CONFIG = {
  type: 'scroll',
  orient: 'horizontal',
  bottom: 0,
  left: 'center',
  itemWidth: 20,
  itemHeight: 12,
  textStyle: {
    fontSize: 12,
  },
  pageIconSize: 12,
  pageTextStyle: {
    fontSize: 12,
  },
};

// 工具提示配置
export const TOOLTIP_CONFIG = {
  trigger: 'axis',
  axisPointer: {
    type: 'cross',
    crossStyle: {
      color: '#999',
    },
  },
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderColor: '#ddd',
  borderWidth: 1,
  textStyle: {
    color: '#333',
  },
  padding: [10, 15],
};
