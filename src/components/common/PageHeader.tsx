import { Link, useLocation } from 'react-router-dom';
import { BarChartOutlined } from '@ant-design/icons';
import routes from '@/routes';

/**
 * 页面头部组件
 * 包含页面标题和导航菜单
 */
export default function PageHeader() {
  const location = useLocation();
  const navigation = routes.filter((route) => route.visible !== false);

  return (
    <div className="mb-6 pb-4 border-b">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* 左侧：页面标题 */}
        <div className="flex items-center gap-2">
          <BarChartOutlined className="text-2xl text-blue-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-blue-600">
            考试成绩分析系统
          </h1>
        </div>

        {/* 右侧：导航菜单 */}
        <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                location.pathname === item.path
                  ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
