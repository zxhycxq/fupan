import { DatePicker, Button } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface DateRangeFilterProps {
  value: [Dayjs, Dayjs] | null;
  onChange: (dates: [Dayjs, Dayjs] | null) => void;
  className?: string;
  minDate?: Dayjs | null; // 最早可选日期
  maxDate?: Dayjs | null; // 最晚可选日期
}

/**
 * 日期范围筛选器组件
 * 提供快捷时间范围选择和自定义日期范围选择功能
 */
export default function DateRangeFilter({ 
  value, 
  onChange, 
  className = '',
  minDate = null,
  maxDate = null,
}: DateRangeFilterProps) {
  // 禁用日期的函数
  const disabledDate = (current: Dayjs) => {
    if (!current) return false;
    
    // 如果设置了最早日期，禁用早于该日期的日期
    if (minDate && current.isBefore(minDate, 'day')) {
      return true;
    }
    
    // 如果设置了最晚日期，禁用晚于该日期的日期
    if (maxDate && current.isAfter(maxDate, 'day')) {
      return true;
    }
    
    return false;
  };

  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">时间筛选：</span>
        <RangePicker
            value={value}
            onChange={(dates) => onChange(dates)}
            placeholder={['开始日期', '结束日期']}
            format="YYYY-MM-DD"
            allowClear
            className="flex-1 max-w-md"
            disabledDate={disabledDate}
            size="middle"
            getPopupContainer={(trigger) => trigger.parentElement || document.body}
            renderExtraFooter={() => (
              <div className="flex gap-2 p-2 border-t">
                <Button
                  size="small"
                  onClick={() => {
                    const end = maxDate || dayjs();
                    const start = end.subtract(1, 'month');
                    // 确保开始日期不早于最早日期
                    const finalStart = minDate && start.isBefore(minDate, 'day') ? minDate : start;
                    onChange([finalStart, end]);
                  }}
                >
                  最近一个月
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    const end = maxDate || dayjs();
                    const start = end.subtract(3, 'month');
                    // 确保开始日期不早于最早日期
                    const finalStart = minDate && start.isBefore(minDate, 'day') ? minDate : start;
                    onChange([finalStart, end]);
                  }}
                >
                  最近三个月
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    const end = maxDate || dayjs();
                    const start = end.subtract(6, 'month');
                    // 确保开始日期不早于最早日期
                    const finalStart = minDate && start.isBefore(minDate, 'day') ? minDate : start;
                    onChange([finalStart, end]);
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
    );
  }
