import React, { useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme, FloatButton } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import Sidebar from '@/components/common/Sidebar';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import routes from './routes';
import { useTheme } from '@/hooks/use-theme';

// 设置 dayjs 为中文
dayjs.locale('zh-cn');

// 主题颜色配置
const themeColors = {
  default: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
  },
  blue: {
    colorPrimary: '#3b82f6', // 蓝色主题
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',
  },
  green: {
    colorPrimary: '#22c55e', // 绿色主题
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#06b6d4',
  },
  purple: {
    colorPrimary: '#a855f7', // 紫色主题
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#8b5cf6',
  },
  orange: {
    colorPrimary: '#f97316', // 橙色主题
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#f97316',
  },
};

function App() {
  const { theme: currentTheme } = useTheme();

  // 初始化主题
  useEffect(() => {
    const root = document.documentElement;
    
    // 移除所有主题类
    root.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-orange');
    
    // 添加主题类（除了默认主题）
    if (currentTheme !== 'default') {
      root.classList.add(`theme-${currentTheme}`);
    }
  }, [currentTheme]);

  // 根据当前主题生成 Ant Design 主题配置
  const antdThemeConfig = useMemo(() => ({
    algorithm: antdTheme.defaultAlgorithm,
    token: {
      ...themeColors[currentTheme],
      borderRadius: 8,
      fontSize: 14,
    },
    components: {
      Button: {
        controlHeight: 36,
        borderRadius: 6,
      },
      Input: {
        controlHeight: 36,
        borderRadius: 6,
      },
      Select: {
        controlHeight: 36,
        borderRadius: 6,
      },
      Card: {
        borderRadius: 12,
      },
    },
  }), [currentTheme]);

  return (
    <ConfigProvider 
      locale={zhCN}
      theme={antdThemeConfig}
    >
      <ErrorBoundary>
        <div className="flex h-screen overflow-hidden bg-gray-50">
          {/* 左侧导航栏 */}
          <Sidebar />
          
          {/* 右侧主内容区域 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 主内容 */}
            <main className="flex-1 overflow-auto">
              <Routes>
                {routes.map((route, index) => (
                  <Route
                    key={index}
                    path={route.path}
                    element={route.element}
                  />
                ))}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
          
          {/* 全局返回顶部按钮 */}
          <FloatButton.BackTop
            tooltip="返回顶部"
            visibilityHeight={300}
            style={{
              right: 24,
              bottom: 24,
            }}
          />
        </div>
      </ErrorBoundary>
    </ConfigProvider>
  );
}

export default App;
