import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import routes from "../../routes";
import { BarChart3, Calendar } from "lucide-react";
import { getExamConfig } from "@/db/api";

const Header: React.FC = () => {
  const location = useLocation();
  const navigation = routes.filter((route) => route.visible !== false);
  const [examConfig, setExamConfig] = useState<{ exam_type?: string; exam_date?: string } | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

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
    <header className="bg-white shadow-md sticky top-0 z-10 border-b">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-blue-600">
                考试成绩分析系统
              </span>
            </Link>

            {/* 考试倒计时 */}
            {examConfig && daysLeft !== null && (
              <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {examConfig.exam_type}
                </span>
                <span className="text-sm text-blue-700">
                  {daysLeft > 0 ? `还有 ${daysLeft} 天` : daysLeft === 0 ? '今天考试' : '已过期'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 text-base font-medium rounded-md ${
                  location.pathname === item.path
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                } transition duration-300`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
