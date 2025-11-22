import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/common/Header';
import routes from './routes';

const App: React.FC = () => {
  // 初始化主题
  useEffect(() => {
    const theme = localStorage.getItem('app-theme') || 'default';
    const root = document.documentElement;
    
    // 移除所有主题类
    root.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-orange');
    
    // 添加主题类（除了默认主题）
    if (theme !== 'default') {
      root.classList.add(`theme-${theme}`);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow">
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
      <Toaster />
    </div>
  );
};

export default App;
