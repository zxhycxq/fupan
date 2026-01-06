import { Link, useLocation } from 'react-router-dom';
import { 
  BarChartOutlined, 
  MenuOutlined, 
  CloseOutlined,
  DashboardOutlined,
  FileTextOutlined,
  CloudUploadOutlined,
  LineChartOutlined,
  UserOutlined,
  SettingOutlined,
  ToolOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import routes from '@/routes';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { message } from 'antd';

// 菜单图标映射
const menuIcons: Record<string, React.ReactNode> = {
  '/': <DashboardOutlined />,
  '/module-analysis': <LineChartOutlined />,
  '/upload': <CloudUploadOutlined />,
  '/exams': <FileTextOutlined />,
  '/tools': <ToolOutlined />,
  '/settings': <SettingOutlined />,
  '/profile': <UserOutlined />,
};

/**
 * 侧边栏导航组件
 * 左侧固定导航菜单，支持响应式设计
 */
export default function Sidebar() {
  const location = useLocation();
  const navigation = routes.filter((route) => route.visible !== false);
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  /**
   * 退出登录
   */
  const handleSignOut = async () => {
    try {
      await signOut();
      message.success('已退出登录');
      setIsOpen(false);
    } catch (error: any) {
      message.error(error.message || '退出登录失败');
    }
  };

  return (
    <>
      {/* 移动端菜单按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 rounded-md bg-blue-600 text-white shadow-lg"
        aria-label="菜单"
      >
        {isOpen ? <CloseOutlined className="text-xl" /> : <MenuOutlined className="text-xl" />}
      </button>

      {/* 遮罩层（移动端） */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[100]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-[110]
          w-32 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo 和标题 */}
        <div className="h-20 flex flex-col items-center justify-center gap-1 px-2 border-b border-gray-200 dark:border-gray-700">
          <Link to="/" className="flex flex-col items-center gap-1" onClick={() => setIsOpen(false)}>
            <BarChartOutlined className="text-3xl text-blue-600" />
            <span className="text-sm font-bold text-blue-600 text-center leading-tight">
              考公复盘记
            </span>
          </Link>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`
                  flex flex-col items-center gap-1 px-2 py-3 rounded-lg text-xs font-medium
                  transition-colors duration-200
                  ${
                    location.pathname === item.path
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                `}
              >
                <span className="text-lg">{menuIcons[item.path]}</span>
                <span className="text-center leading-tight">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* 底部信息 */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {user && (
            <>
              <div className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight px-1">
                <div className="truncate" title={profile?.username || (profile?.phone ? `用户_${profile.phone.replace(/^\+?86/, '').slice(-4)}` : '默认用户')}>
                  {(() => {
                    const displayName = profile?.username || (profile?.phone ? `用户_${profile.phone.replace(/^\+?86/, '').slice(-4)}` : '默认用户');
                    return displayName.length > 8 ? `${displayName.slice(0, 8)}...` : displayName;
                  })()}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                <LogoutOutlined className="text-lg" />
                <span>退出</span>
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
