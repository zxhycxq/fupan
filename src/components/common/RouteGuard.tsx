import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 公开路由列表（不需要登录即可访问）
 */
const PUBLIC_ROUTES = ['/login', '/register'];

/**
 * 路由守卫组件
 * 用于保护需要登录才能访问的路由
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 等待加载完成
    if (loading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

    // 未登录且访问受保护路由，重定向到登录页
    if (!user && !isPublicRoute) {
      navigate('/login', { state: { from: location.pathname } });
    }

    // 已登录且访问登录/注册页，重定向到首页
    if (user && isPublicRoute) {
      navigate('/');
    }
  }, [user, loading, location.pathname, navigate]);

  // 加载中显示空白
  if (loading) {
    return null;
  }

  return <>{children}</>;
}
