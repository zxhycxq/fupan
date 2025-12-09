import { Card } from 'antd';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  prefix?: ReactNode;
  description?: string;
  gradient: string;
  className?: string;
  isMobile?: boolean;
}

/**
 * 统计卡片组件
 * 用于展示关键指标数据
 */
export default function StatCard({
  title,
  value,
  suffix,
  prefix,
  description,
  gradient,
  className = '',
  isMobile = false
}: StatCardProps) {
  return (
    <Card
      className={`stat-card p-3 ${className}`}
      style={{
        background: gradient,
        height: isMobile ? 'auto' : '224px',
        minHeight: '120px'
      }}
    >
      <div className="flex flex-col h-full">
        {/* 标题和图标 */}
        <div className="flex items-center gap-2 mb-3">
          {prefix && <div className="flex-shrink-0">{prefix}</div>}
          <div className="stat-title text-gray-800 dark:text-gray-200 text-sm font-semibold">{title}</div>
        </div>
        
        {/* 数值 */}
        <div className="flex-1 flex items-center">
          <div className="text-gray-900 dark:text-gray-100 font-semibold leading-tight">
            <span className="text-3xl">{value}</span>
            {suffix && <span className="text-xl ml-1">{suffix}</span>}
          </div>
        </div>
        
        {/* 描述 */}
        {description && (
          <div className="text-xs opacity-80 mt-2 text-gray-700 dark:text-gray-300">{description}</div>
        )}
      </div>
    </Card>
  );
}
