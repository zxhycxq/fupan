import { DatePicker, Button } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface DateRangeFilterProps {
  value: [Dayjs, Dayjs] | null;
  onChange: (dates: [Dayjs, Dayjs] | null) => void;
  className?: string;
}

/**
 * 日期范围筛选器组件
 * 提供快捷时间范围选择和自定义日期范围选择功能
 */
export default function DateRangeFilter({ value, onChange, className = '' }: DateRangeFilterProps) {
  return (
    <div className={`sticky top-16 z-10 mb-6 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-sm border-b ${className}`}>
      <div className="container mx-auto">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">时间筛选：</span>
          <RangePicker
            value={value}
            onChange={(dates) => onChange(dates)}
            placeholder={['开始日期', '结束日期']}
            format="YYYY-MM-DD"
            allowClear
            className="flex-1 max-w-md"
            renderExtraFooter={() => (
              <div className="flex gap-2 p-2 border-t">
                <Button
                  size="small"
                  onClick={() => {
                    const end = dayjs();
                    const start = end.subtract(1, 'month');
                    onChange([start, end]);
                  }}
                >
                  最近一个月
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    const end = dayjs();
                    const start = end.subtract(3, 'month');
                    onChange([start, end]);
                  }}
                >
                  最近三个月
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    const end = dayjs();
                    const start = end.subtract(6, 'month');
                    onChange([start, end]);
                  }}
                >
                  最近半年
                </Button>
                <Button size="small" onClick={() => onChange(null)}>
                  全部
                </Button>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
