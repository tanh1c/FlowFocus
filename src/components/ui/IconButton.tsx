'use client';

import { Tooltip } from 'antd';
import { cn } from '@/lib/utils';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  tooltip?: string;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

export function IconButton({
  icon,
  onClick,
  tooltip,
  isActive = false,
  size = 'md',
  className,
}: IconButtonProps) {
  const button = (
    <button
      onClick={onClick}
      className={cn(
        'glass-card flex items-center justify-center rounded-full cursor-pointer',
        'transition-all duration-200 group',
        'hover:bg-white/10 hover:scale-105',
        'active:scale-95',
        isActive && 'text-primary',
        sizeClasses[size],
        className
      )}
    >
      <span className={cn(
        'transition-colors duration-200',
        isActive ? 'text-primary' : 'text-white group-hover:text-white/90'
      )}>
        {icon}
      </span>
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="bottom">
        {button}
      </Tooltip>
    );
  }

  return button;
}
