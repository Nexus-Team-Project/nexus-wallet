import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'pink' | 'purple' | 'emerald';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        // Variants
        variant === 'default' && 'bg-border text-text-secondary',
        variant === 'success' && 'bg-success/10 text-success',
        variant === 'warning' && 'bg-warning/10 text-warning',
        variant === 'error' && 'bg-error/10 text-error',
        variant === 'pink' && 'bg-primary-light text-primary-dark',
        variant === 'emerald' && 'bg-emerald-400/20 text-emerald-300',
        variant === 'purple' && 'bg-primary/10 text-primary',
        // Sizes
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-3 py-1 text-sm',
        className
      )}
    >
      {children}
    </span>
  );
}
