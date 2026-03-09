'use client';

import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  hoverEffect?: boolean;
}

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
};

export function GlassCard({
  children,
  className,
  rounded = '2xl',
  hoverEffect = false
}: GlassCardProps) {
  return (
    <div className={cn(
      'bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl',
      roundedClasses[rounded],
      hoverEffect && 'transition-all duration-300 hover:bg-black/50 hover:border-white/20 hover:shadow-2xl hover:scale-[1.02]',
      className
    )}>
      {children}
    </div>
  );
}
