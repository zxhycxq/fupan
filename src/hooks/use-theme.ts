import { useEffect, useState } from 'react';

export type Theme = 'default' | 'blue' | 'green' | 'purple' | 'orange';

export const themes = [
  { value: 'default', label: '默认主题', description: '经典深色系' },
  { value: 'blue', label: '蓝色主题', description: '专业商务风格' },
  { value: 'green', label: '绿色主题', description: '清新自然风格' },
  { value: 'purple', label: '紫色主题', description: '优雅科技风格' },
  { value: 'orange', label: '橙色主题', description: '活力温暖风格' },
] as const;

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('app-theme');
    return (stored as Theme) || 'default';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // 移除所有主题类
    root.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-orange');
    
    // 添加新主题类（除了默认主题）
    if (theme !== 'default') {
      root.classList.add(`theme-${theme}`);
    }
    
    // 保存到 localStorage
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  return { theme, setTheme: setThemeState };
}
