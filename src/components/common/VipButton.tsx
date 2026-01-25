import { Button, type ButtonProps } from 'antd';
import { useState } from 'react';
import { VipBenefitsModal } from './VipBenefitsModal';
import { useVipFeature } from '@/hooks/useVipStatus';

interface VipButtonProps extends ButtonProps {
  featureName: string;
  onUpgrade?: () => void;
}

/**
 * VIP 按钮组件
 * 带有右上角 VIP 标识的按钮，非会员点击显示购买弹窗
 */
export function VipButton({
  featureName,
  onUpgrade,
  children,
  onClick,
  ...buttonProps
}: VipButtonProps) {
  const { requiresVip, hasAccess } = useVipFeature(featureName);
  const [showModal, setShowModal] = useState(false);

  // 如果不需要VIP或已有权限，渲染普通按钮
  if (!requiresVip || hasAccess) {
    return (
      <Button onClick={onClick} {...buttonProps}>
        {children}
      </Button>
    );
  }

  // 需要VIP但没有权限，显示带VIP标识的按钮
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
  };

  return (
    <>
      <div className="relative inline-block">
        <Button onClick={handleClick} {...buttonProps}>
          {children}
        </Button>
        
        {/* 右上角VIP标识 - 优惠券风格 */}
        <div 
          className="absolute -top-1 -right-1 pointer-events-none"
          style={{
            width: 0,
            height: 0,
            borderStyle: 'solid',
            borderWidth: '0 32px 32px 0',
            borderColor: 'transparent rgb(208, 146, 5) transparent transparent',
          }}
        >
          <span 
            className="absolute text-white font-bold text-[10px] leading-none"
            style={{
              top: '2px',
              right: '-28px',
              transform: 'rotate(45deg)',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            VIP
          </span>
        </div>
      </div>

      <VipBenefitsModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onUpgrade={onUpgrade}
        currentFeature={featureName}
      />
    </>
  );
}
