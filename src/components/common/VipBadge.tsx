import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VipBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  showText?: boolean
}

/**
 * VIP 标识组件
 * 用于标识需要 VIP 权限的功能
 */
export function VipBadge({ 
  size = 'sm', 
  className,
  onClick,
  showText = false 
}: VipBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-500',
        onClick && 'cursor-pointer hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors',
        className
      )}
      onClick={onClick}
      title="VIP专属功能"
    >
      <Crown className={cn(sizeClasses[size], 'fill-yellow-500')} />
      {showText && (
        <span className={cn('font-medium', textSizeClasses[size])}>
          VIP
        </span>
      )}
    </span>
  )
}
