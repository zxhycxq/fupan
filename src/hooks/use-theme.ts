import { useEffect, useState } from 'react';

export type Theme = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan' | 'pink';

export const themes = [
  { value: 'blue', label: '蓝色主题', description: '专业商务风格' },
  { value: 'green', label: '绿色主题', description: '清新自然风格' },
  { value: 'purple', label: '紫色主题', description: '优雅科技风格' },
  { value: 'orange', label: '橙色主题', description: '活力温暖风格' },
  { value: 'red', label: '红色主题', description: '热情激情风格' },
  { value: 'cyan', label: '青色主题', description: '清爽科技风格' },
  { value: 'pink', label: '粉色主题', description: '温柔浪漫风格' },
] as const;

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('app-theme');
    return (stored as Theme) || 'blue';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // 移除所有主题类
    root.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-red', 'theme-cyan', 'theme-pink');
    
    // 添加新主题类
    root.classList.add(`theme-${theme}`);
    
    // 保存到 localStorage
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  return { theme, setTheme: setThemeState };
}
