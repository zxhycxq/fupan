/**
 * 渐变色配置
 * 用于数据指标卡片的背景渐变效果
 */

export interface GradientColor {
  from: string;
  to: string;
}

/**
 * 渐变色数组
 * 每个元素包含起始色(from)和结束色(to)
 */
export const GRADIENT_COLORS: GradientColor[] = [
  { from: '#A531DC', to: '#4300B1' },
  { from: '#FF896D', to: '#D02020' },
  { from: '#3793FF', to: '#0017E4' },
  { from: '#FFD439', to: '#FF7A00' },
  { from: '#7CF7FF', to: '#4B73FF' },
  { from: '#FFED46', to: '#FF7EC7' },
  { from: '#8FFF85', to: '#39A0FF' },
  { from: '#8A88FB', to: '#D079EE' },
  { from: '#EAEAEA', to: '#8B8B8B' },
  { from: '#FFEB3A', to: '#4DEF8E' },
  { from: '#565656', to: '#181818' },
  { from: '#FFBB89', to: '#7B6AE0' },
  { from: '#FFF500', to: '#FFB800' },
  { from: '#FFEAF6', to: '#FF9DE4' },
  { from: '#00B960', to: '#00552C' },
  { from: '#FFE6A4', to: '#AD8211' },
  { from: '#C5EDF5', to: '#4A879A' },
  { from: '#FFF6EB', to: '#DFD1C5' },
  { from: '#FF9D7E', to: '#4D6AD0' },
  { from: '#DD7BFF', to: '#FF6C6C' },
  { from: '#E0FF87', to: '#8FB85B' },
  { from: '#FFDC99', to: '#FF62C0' },
  { from: '#DDE4FF', to: '#8DA2EE' },
  { from: '#97E8B5', to: '#5CB67F' },
  { from: '#24CFC5', to: '#001C63' },
  { from: '#FF3F3F', to: '#063CFF' },
  { from: '#5D85A6', to: '#0E2C5E' },
  { from: '#DEB5FF', to: '#6F00B3' },
  { from: '#FF5EEF', to: '#456EFF' },
  { from: '#AFCCCB', to: '#616566' },
  { from: '#4063BC', to: '#6B0013' },
  { from: '#FFF500', to: '#FF00B8' },
  { from: '#FF5E98', to: '#0F213E' },
  { from: '#FFC328', to: '#E20000' },
  { from: '#FFE70B', to: '#27B643' },
  { from: '#FFADF7', to: '#B1FF96' },
  { from: '#61C695', to: '#133114' },
  { from: '#B7DCFF', to: '#FFA4F6' },
  { from: '#9F25FF', to: '#FF7A00' },
  { from: '#5EE2FF', to: '#00576A' },
  { from: '#FF0000', to: '#470000' },
  { from: '#4643DF', to: '#0B0A47' },
  { from: '#D7003A', to: '#19087E' },
  { from: '#FADD76', to: '#9F3311' },
  { from: '#00E0EE', to: '#AD00FE' },
  { from: '#D0004B', to: '#88069D' },
  { from: '#FF8570', to: '#418CB7' },
  { from: '#B9A14C', to: '#000000' }
];

/**
 * 获取指定索引的渐变色
 * @param index 索引值
 * @returns 渐变色对象
 */
export function getGradientColor(index: number): GradientColor {
  return GRADIENT_COLORS[index % GRADIENT_COLORS.length];
}

/**
 * 生成CSS渐变背景样式
 * @param gradient 渐变色对象
 * @param angle 渐变角度，默认135度
 * @returns CSS background 属性值
 */
export function generateGradientStyle(gradient: GradientColor, angle: number = 135): string {
  return `linear-gradient(${angle}deg, ${gradient.from}, ${gradient.to})`;
}

/**
 * 为Dashboard页面的统计卡片预定义渐变色
 * 顺序：考试次数、平均分、最高分、平均用时
 * 使用更柔和的颜色，与整体风格协调
 */
export const DASHBOARD_GRADIENTS = [
  { from: '#E8D5F2', to: '#C8A8E0' },  // 考试次数 - 淡紫色渐变
  { from: '#FFD4C4', to: '#FFB8A0' },  // 平均分 - 淡橙色渐变
  { from: '#C4DFFF', to: '#A0C8FF' },  // 最高分 - 淡蓝色渐变
  { from: '#FFF4C4', to: '#FFE8A0' },  // 平均用时 - 淡黄色渐变
];

/**
 * 为ExamDetail页面的统计卡片预定义渐变色
 * 顺序：总分、用时、平均分、难度、击败率
 * 注意：不包含最高分
 */
export const EXAM_DETAIL_GRADIENTS = [
  GRADIENT_COLORS[4],  // 总分 - 青蓝渐变
  GRADIENT_COLORS[5],  // 用时 - 黄粉渐变
  GRADIENT_COLORS[6],  // 平均分 - 绿蓝渐变
  GRADIENT_COLORS[7],  // 难度 - 紫色渐变
  GRADIENT_COLORS[8],  // 击败率 - 灰色渐变
];
