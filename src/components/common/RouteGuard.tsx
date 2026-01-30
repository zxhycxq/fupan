import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 公开路由列表（不需要登录即可访问）
 */
const PUBLIC_ROUTES = ['/login', '/register', '/tools'];

/**
 * 认证相关路由（已登录用户不应访问）
 */
const AUTH_ROUTES = ['/login', '/register'];

/**
 * 路由守卫组件
 * 用于保护需要登录才能访问的路由
 *
 * 优化说明：
 * 1. 未登录访问受保护路由时，不渲染页面组件，避免触发 API 请求
 * 2. 直接重定向到登录页，提供更好的用户体验
 * 3. 加载中显示 Loading 状态，而不是空白页面
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // 等待加载完成
        if (loading) return;

        const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
        const isAuthRoute = AUTH_ROUTES.includes(location.pathname);

        // 未登录且访问受保护路由，重定向到登录页
        if (!user && !isPublicRoute) {
            console.log('[RouteGuard] 未登录，重定向到登录页:', location.pathname);
            navigate('/login', {
                state: { from: location.pathname },
                replace: true // 使用 replace 避免在历史记录中留下记录
            });
        }

        // 已登录且访问登录/注册页，重定向到首页
        if (user && isAuthRoute) {
            console.log('[RouteGuard] 已登录，重定向到首页');
            navigate('/dashboard', { replace: true });
        }
    }, [user, loading, location.pathname, navigate]);

    // 加载中显示 Loading
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spin size="large" tip="加载中..." />
            </div>
        );
    }

    // 检查是否为公开路由
    const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
    const isAuthRoute = AUTH_ROUTES.includes(location.pathname);

    // 未登录且访问受保护路由，不渲染子组件，避免触发 API 请求
    if (!user && !isPublicRoute) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spin size="large" tip="跳转到登录页..." />
            </div>
        );
    }

    // 已登录且访问登录/注册页，不渲染子组件
    if (user && isAuthRoute) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spin size="large" tip="跳转到首页..." />
            </div>
        );
    }

    return <>{children}</>;
}
