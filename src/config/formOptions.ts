/**
 * 表单选项配置
 * 用于各个页面的筛选表单
 */

// 百分比区间选项（用于正确率、击败率等筛选）
export const PERCENTAGE_RANGE_OPTIONS = [
  { value: '0-10', label: '>0-10%' },
  { value: '11-20', label: '>11-20%' },
  { value: '21-30', label: '>21-30%' },
  { value: '31-40', label: '>31-40%' },
  { value: '41-50', label: '>41-50%' },
  { value: '51-60', label: '>51-60%' },
  { value: '61-70', label: '>61-70%' },
  { value: '71-80', label: '>71-80%' },
  { value: '81-90', label: '>81-90%' },
  { value: '91-100', label: '>91-100%' },
];

// 星级选项（用于难度、评分等筛选）
export const RATING_OPTIONS = [
  { value: 'unrated', label: '⭕ 未评定' },
  { value: 1, label: '⭐ 1星' },
  { value: 2, label: '⭐ 2星' },
  { value: 3, label: '⭐ 3星' },
  { value: 4, label: '⭐ 4星' },
  { value: 5, label: '⭐ 5星' },
];

// 考试类型选项
export const EXAM_TYPE_OPTIONS = [
  { value: 'practice', label: '练习' },
  { value: 'mock', label: '模拟考试' },
  { value: 'real', label: '真实考试' },
];

// 排序选项
export const SORT_OPTIONS = [
  { value: 'date_desc', label: '日期降序' },
  { value: 'date_asc', label: '日期升序' },
  { value: 'score_desc', label: '分数降序' },
  { value: 'score_asc', label: '分数升序' },
];

// 每页显示数量选项
export const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];

// 默认每页显示数量
export const DEFAULT_PAGE_SIZE = 20;
