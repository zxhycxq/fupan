import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import ExamList from './pages/ExamList';
import ExamDetail from './pages/ExamDetail';
import ModuleAnalysis from './pages/ModuleAnalysis';
import Tools from './pages/Tools';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import DebugData from './pages/DebugData';
import Login from './pages/Login';
import Register from './pages/Register';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: '登录',
    path: '/login',
    element: <Login />,
    visible: false,
  },
  {
    name: '注册',
    path: '/register',
    element: <Register />,
    visible: false,
  },
  {
    name: '数据总览',
    path: '/',
    element: <Dashboard />,
    visible: true,
  },
  {
    name: '各模块分析',
    path: '/module-analysis',
    element: <ModuleAnalysis />,
    visible: true,
  },
  {
    name: '上传成绩',
    path: '/upload',
    element: <Upload />,
    visible: true,
  },
  {
    name: '考试记录',
    path: '/exams',
    element: <ExamList />,
    visible: true,
  },
  {
    name: '小工具',
    path: '/tools',
    element: <Tools />,
    visible: true,
  },
  {
    name: '设置',
    path: '/settings',
    element: <Settings />,
    visible: true,
  },
  {
    name: '个人中心',
    path: '/profile',
    element: <Profile />,
    visible: true,
  },
  {
    name: '考试详情',
    path: '/exam/:id',
    element: <ExamDetail />,
    visible: false,
  },
  {
    name: '数据调试',
    path: '/debug',
    element: <DebugData />,
    visible: false,
  },
];

export default routes;