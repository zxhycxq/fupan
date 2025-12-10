/**
 * 等级称谓配置
 * 定义不同主题的等级名称
 */

export interface GradeLabel {
  value: number; // 对应的分数值
  label: string; // 等级名称
}

export interface GradeLabelTheme {
  id: string;
  name: string;
  labels: GradeLabel[];
}

// 等级称谓主题配置
export const GRADE_LABEL_THEMES: GradeLabelTheme[] = [
  {
    id: 'theme1',
    name: '易经系列',
    labels: [
      { value: 50, label: '潜龙勿用' },  // 40-59分
      { value: 65, label: '见龙在田' },  // 60-69分
      { value: 75, label: '终日乾乾' },  // 70-79分
      { value: 85, label: '或跃在渊' },  // 80-89分
      { value: 95, label: '飞龙在天' }   // 90-100分
    ]
  },
  {
    id: 'theme2',
    name: '修行系列',
    labels: [
      { value: 50, label: '启蒙之境' },  // 40-59分
      { value: 65, label: '登堂之境' },  // 60-69分
      { value: 75, label: '入室之境' },  // 70-79分
      { value: 85, label: '精研之境' },  // 80-89分
      { value: 95, label: '大成之境' }   // 90-100分
    ]
  },
  {
    id: 'theme3',
    name: '成长系列',
    labels: [
      { value: 50, label: '萌芽初醒' },  // 40-59分
      { value: 65, label: '新苗成长' },  // 60-69分
      { value: 75, label: '含苞待放' },  // 70-79分
      { value: 85, label: '花开锦绣' },  // 80-89分
      { value: 95, label: '硕果满枝' }   // 90-100分
    ]
  },
  {
    id: 'theme4',
    name: '成就系列',
    labels: [
      { value: 50, label: '默默无闻' },  // 40-59分
      { value: 65, label: '小有所成' },  // 60-69分
      { value: 75, label: '初露锋芒' },  // 70-79分
      { value: 85, label: '卓然不群' },  // 80-89分
      { value: 95, label: '名满天下' }   // 90-100分
    ]
  }
];

/**
 * 根据主题ID获取等级标签
 */
export function getGradeLabelsByTheme(themeId: string = 'theme4'): GradeLabel[] {
  const theme = GRADE_LABEL_THEMES.find(t => t.id === themeId);
  return theme ? theme.labels : GRADE_LABEL_THEMES[3].labels; // 默认返回theme4
}

/**
 * 根据主题ID获取主题名称
 */
export function getGradeLabelThemeName(themeId: string = 'theme4'): string {
  const theme = GRADE_LABEL_THEMES.find(t => t.id === themeId);
  return theme ? theme.name : GRADE_LABEL_THEMES[3].name;
}
