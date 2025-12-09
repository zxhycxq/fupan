import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import routes from "../../routes";
import { BarChartOutlined, MenuOutlined, CloseOutlined } from "@ant-design/icons";
import { getExamConfig } from "@/db/api";

const Header: React.FC = () => {
  const location = useLocation();
  const navigation = routes.filter((route) => route.visible !== false);
  const [examConfig, setExamConfig] = useState<{ exam_type?: string; exam_date?: string } | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadExamConfig();
  }, []);

  const loadExamConfig = async () => {
    const config = await getExamConfig();
    if (config && config.exam_type && config.exam_date) {
      setExamConfig(config);
      calculateDaysLeft(config.exam_date);
    }
  };

  const calculateDaysLeft = (examDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate);
    exam.setHours(0, 0, 0, 0);
    const diff = exam.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    setDaysLeft(days);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 border-b">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 左侧：Logo和标题 */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <BarChartOutlined className="text-2xl sm:text-3xl text-blue-600" />
              <span className="text-base sm:text-xl font-bold text-blue-600 whitespace-nowrap">
                考试成绩分析系统
              </span>
            </Link>
          </div>

          {/* 右侧：桌面端导航菜单 */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 lg:px-4 py-2 text-sm lg:text-base font-medium rounded-md whitespace-nowrap ${
                  location.pathname === item.path
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                } transition duration-300`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* 右侧：移动端菜单按钮 */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              aria-label="菜单"
            >
              {mobileMenuOpen ? (
                <CloseOutlined className="text-xl" />
              ) : (
                <MenuOutlined className="text-xl" />
              )}
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-base font-medium rounded-md ${
                  location.pathname === item.path
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                } transition duration-300`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
