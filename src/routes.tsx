import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import ExamList from './pages/ExamList';
import ExamDetail from './pages/ExamDetail';
import ModuleAnalysis from './pages/ModuleAnalysis';
import Settings from './pages/Settings';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
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
    name: '设置',
    path: '/settings',
    element: <Settings />,
    visible: true,
  },
  {
    name: '考试详情',
    path: '/exam/:id',
    element: <ExamDetail />,
    visible: false,
  },
];

export default routes;