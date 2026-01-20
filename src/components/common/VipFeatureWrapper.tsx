import { ReactNode, useState } from 'react'
import { VipBadge } from './VipBadge'
import { VipBenefitsModal } from './VipBenefitsModal'
import { useVipFeature } from '@/hooks/useVipStatus'
import { Tooltip } from 'antd'

interface VipFeatureWrapperProps {
  featureName: string
  children: ReactNode
  showBadge?: boolean
  badgePosition?: 'left' | 'right' | 'top'
  onUpgrade?: () => void
  tooltip?: string
}

/**
 * VIP 功能包装组件
 * 用于包装需要 VIP 权限的功能，自动显示 VIP 标识和权限检查
 */
export function VipFeatureWrapper({
  featureName,
  children,
  showBadge = true,
  badgePosition = 'right',
  onUpgrade,
  tooltip = 'VIP专属功能',
}: VipFeatureWrapperProps) {
  const { requiresVip, hasAccess } = useVipFeature(featureName)
  const [showModal, setShowModal] = useState(false)

  // 如果不需要VIP或已有权限，直接渲染子组件
  if (!requiresVip || hasAccess) {
    return <>{children}</>
  }

  // 需要VIP但没有权限，显示禁用状态和VIP标识
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowModal(true)
  }

  const badge = showBadge && (
    <Tooltip title={tooltip}>
      <VipBadge onClick={() => setShowModal(true)} />
    </Tooltip>
  )

  return (
    <>
      <div className="relative inline-flex items-center gap-2">
        {badgePosition === 'left' && badge}
        
        <div
          className="opacity-50 cursor-not-allowed pointer-events-none select-none"
          onClick={handleClick}
          style={{ pointerEvents: 'none' }}
        >
          {children}
        </div>

        {/* 覆盖层，用于捕获点击事件 */}
        <div
          className="absolute inset-0 cursor-not-allowed z-10"
          onClick={handleClick}
          title={tooltip}
        />

        {badgePosition === 'right' && badge}
        {badgePosition === 'top' && (
          <div className="absolute -top-2 -right-2 z-20">
            {badge}
          </div>
        )}
      </div>

      <VipBenefitsModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onUpgrade={onUpgrade}
        currentFeature={featureName}
      />
    </>
  )
}
