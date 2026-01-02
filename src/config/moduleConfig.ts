/**
 * 模块配置
 * 定义考试各个模块的名称、颜色和子模块
 */

// 子模块颜色配置 - 使用明显区分的颜色
export const SUB_MODULE_COLORS: Record<string, string> = {
  // 常识判断
  '地理国情': '#1890ff',
  '法律常识': '#52c41a',
  '经济常识': '#faad14',
  '科技常识': '#f5222d',
  '人文常识': '#722ed1',
  
  // 判断推理
  '图形推理': '#13c2c2',
  '定义判断': '#eb2f96',
  '类比推理': '#fa8c16',
  '逻辑判断': '#a0d911',
  
  // 数量关系
  '数学运算': '#fadb14',
  
  // 言语理解与表达
  '逻辑填空': '#2f54eb',
  '片段阅读': '#52c41a',
  '语句表达': '#fa541c',
  
  // 政治理论
  '马克思主义': '#eb2f96',
  '理论与政策': '#722ed1',
  '时政热点': '#f5222d',
  
  // 资料分析
  '文字资料': '#1890ff',
  '综合资料': '#52c41a',
  '简单计算': '#faad14',
  '基期与现期': '#f5222d',
  '增长率': '#722ed1',
  '增长量': '#13c2c2',
  '比重问题': '#eb2f96',
  '平均数问题': '#fa8c16'
};

// 模块配置接口
export interface ModuleConfig {
  name: string;
  color: string;
  subModules: string[];
}

// 模块配置：定义一级模块和二级模块
export const MODULE_CONFIG: ModuleConfig[] = [
  {
    name: '常识判断',
    color: '#1890ff',
    subModules: ['地理国情', '法律常识', '经济常识', '科技常识', '人文常识']
  },
  {
    name: '判断推理',
    color: '#52c41a',
    subModules: ['图形推理', '定义判断', '类比推理', '逻辑判断']
  },
  {
    name: '数量关系',
    color: '#faad14',
    subModules: ['数学运算']
  },
  {
    name: '言语理解与表达',
    color: '#13c2c2',
    subModules: ['逻辑填空', '片段阅读', '语句表达']
  },
  {
    name: '政治理论',
    color: '#eb2f96',
    subModules: ['马克思主义', '理论与政策', '时政热点']
  },
  {
    name: '资料分析',
    color: '#722ed1',
    subModules: ['文字资料', '综合资料', '简单计算', '基期与现期', '增长率', '增长量', '比重问题', '平均数问题']
  }
];

// 获取所有模块名称（包括一级和二级）
export const getAllModuleNames = (): string[] => {
  const names: string[] = [];
  MODULE_CONFIG.forEach(module => {
    names.push(module.name);
    names.push(...module.subModules);
  });
  return names;
};

// 根据模块名称获取颜色
export const getModuleColor = (moduleName: string): string => {
  // 先查找是否是一级模块
  const parentModule = MODULE_CONFIG.find(m => m.name === moduleName);
  if (parentModule) {
    return parentModule.color;
  }
  
  // 再查找是否是二级模块
  return SUB_MODULE_COLORS[moduleName] || '#8c8c8c';
};

// 根据子模块名称获取父模块
export const getParentModule = (subModuleName: string): ModuleConfig | null => {
  for (const module of MODULE_CONFIG) {
    if (module.subModules.includes(subModuleName)) {
      return module;
    }
  }
  return null;
};
