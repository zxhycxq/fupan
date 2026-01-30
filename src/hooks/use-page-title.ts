import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import routes from '@/routes';

/**
 * 自定义 Hook：根据当前路由自动更新页面标题
 * @param customTitle 可选的自定义标题，如果提供则使用自定义标题
 */
export const usePageTitle = (customTitle?: string) => {
  const location = useLocation();

  useEffect(() => {
    // 如果提供了自定义标题，直接使用
    if (customTitle) {
      document.title = `${customTitle} - 考试成绩分析系统`;
      return;
    }

    // 根据当前路径查找对应的路由配置
    const currentRoute = routes.find((route) => {
      // 处理动态路由（如 /exam/:id）
      const routePattern = route.path.replace(/:\w+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(location.pathname);
    });

    // 设置页面标题
    if (currentRoute) {
      document.title = `${currentRoute.name} - 考试成绩分析系统`;
    } else {
      // 如果没有找到匹配的路由，使用默认标题
      document.title = '考试成绩分析系统';
    }
  }, [location.pathname, customTitle]);
};