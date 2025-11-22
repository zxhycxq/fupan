import React from "react";
import { Link, useLocation } from "react-router-dom";
import routes from "../../routes";
import { BarChart3 } from "lucide-react";

const Header: React.FC = () => {
  const location = useLocation();
  const navigation = routes.filter((route) => route.visible !== false);

  return (
    <header className="bg-white shadow-md sticky top-0 z-10 border-b">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-blue-600">
                考试成绩分析系统
              </span>
            </Link>
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
