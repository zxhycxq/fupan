import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BarChartOutlined } from "@ant-design/icons";
import { getExamConfig } from "@/db/api";

const Header: React.FC = () => {
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
    <header className="bg-white shadow-md sticky top-0 z-50 border-b">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo和标题 */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <BarChartOutlined className="text-2xl sm:text-3xl text-blue-600" />
              <span className="text-base sm:text-xl font-bold text-blue-600 whitespace-nowrap">
                考试成绩分析系统
              </span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
