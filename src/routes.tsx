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
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import OrderConfirm from './pages/OrderConfirm';
import OrderDetail from './pages/OrderDetail';
import TestLearningJourney from './pages/TestLearningJourney';
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
    name: '用户条款',
    path: '/terms',
    element: <Terms />,
    visible: false,
  },
  {
    name: '隐私协议',
    path: '/privacy',
    element: <Privacy />,
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
  {
    name: '订单确认',
    path: '/order-confirm',
    element: <OrderConfirm />,
    visible: false,
  },
  {
    name: '订单详情',
    path: '/order-detail/:orderNo',
    element: <OrderDetail />,
    visible: false,
  },
  {
    name: '学习历程测试',
    path: '/test-learning-journey',
    element: <TestLearningJourney />,
    visible: false,
  },
];

export default routes;