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
  SettingOutlined
} from '@ant-design/icons';
import routes from '@/routes';
import { useState } from 'react';

// 菜单图标映射
const menuIcons: Record<string, React.ReactNode> = {
  '/': <DashboardOutlined />,
  '/exam-list': <FileTextOutlined />,
  '/upload': <CloudUploadOutlined />,
  '/module-analysis': <LineChartOutlined />,
  '/profile': <UserOutlined />,
  '/settings': <SettingOutlined />,
};

/**
 * 侧边栏导航组件
 * 左侧固定导航菜单，支持响应式设计
 */
export default function Sidebar() {
  const location = useLocation();
  const navigation = routes.filter((route) => route.visible !== false);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 移动端菜单按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-blue-600 text-white shadow-lg"
        aria-label="菜单"
      >
        {isOpen ? <CloseOutlined className="text-xl" /> : <MenuOutlined className="text-xl" />}
      </button>

      {/* 遮罩层（移动端） */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
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
              复盘啦
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
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight">
            © 2025
          </div>
        </div>
      </aside>
    </>
  );
}
