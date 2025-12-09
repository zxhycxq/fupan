import { Card, Statistic } from 'antd';
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
      <Statistic
        title={<span className="stat-title text-gray-900 dark:text-gray-100 text-sm font-semibold">{title}</span>}
        value={value}
        suffix={suffix}
        prefix={prefix}
        valueStyle={{ color: '#1f2937', fontSize: '24px', fontWeight: 600 }}
      />
      {description && <div className="text-xs opacity-80 mt-1 text-gray-800 dark:text-gray-200">{description}</div>}
    </Card>
  );
}
