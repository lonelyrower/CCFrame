import { ReactNode } from 'react';

type EmptyTone = 'accent' | 'luxury' | 'neutral';
type EmptySize = 'sm' | 'md' | 'lg';
type EmptyVariant = 'card' | 'plain';

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  tone?: EmptyTone;
  size?: EmptySize;
  variant?: EmptyVariant;
  className?: string;
}

const toneStyles: Record<EmptyTone, { panel: string; ring: string; iconBg: string; iconRing: string; iconText: string }> = {
  accent: {
    panel:
      'bg-gradient-to-br from-[color:var(--ds-accent-5)] via-[color:var(--ds-accent-10)] to-transparent dark:from-[color:var(--ds-accent-10)] dark:via-[color:var(--ds-accent-5)]',
    ring: 'ring-[color:var(--ds-accent-20)]',
    iconBg: 'bg-[color:var(--ds-accent-10)]',
    iconRing: 'ring-[color:var(--ds-accent-20)]',
    iconText: 'text-[color:var(--ds-accent)]',
  },
  luxury: {
    panel:
      'bg-gradient-to-br from-[color:var(--ds-luxury-10)] via-[color:var(--ds-luxury-5)] to-transparent dark:from-[color:var(--ds-luxury-15)] dark:via-[color:var(--ds-luxury-8)]',
    ring: 'ring-[color:var(--ds-luxury-15)]',
    iconBg: 'bg-[color:var(--ds-luxury-10)]',
    iconRing: 'ring-[color:var(--ds-luxury-15)]',
    iconText: 'text-[color:var(--ds-luxury)]',
  },
  neutral: {
    panel: 'bg-[color:rgb(var(--ds-ink-strong-rgb)/0.03)]',
    ring: 'ring-[color:rgb(var(--ds-ink-strong-rgb)/0.08)]',
    iconBg: 'bg-[color:rgb(var(--ds-ink-strong-rgb)/0.06)]',
    iconRing: 'ring-[color:rgb(var(--ds-ink-strong-rgb)/0.12)]',
    iconText: 'text-[color:var(--ds-muted)]',
  },
};

const sizeStyles: Record<EmptySize, { wrapper: string; panel: string; icon: string; title: string; desc: string }> = {
  sm: {
    wrapper: 'py-12',
    panel: 'px-6 py-8',
    icon: 'w-12 h-12',
    title: 'text-xl md:text-2xl',
    desc: 'text-sm md:text-base',
  },
  md: {
    wrapper: 'py-20',
    panel: 'px-8 py-10',
    icon: 'w-16 h-16',
    title: 'text-2xl md:text-3xl',
    desc: 'text-base md:text-lg',
  },
  lg: {
    wrapper: 'py-28',
    panel: 'px-10 py-12',
    icon: 'w-20 h-20',
    title: 'text-3xl md:text-4xl',
    desc: 'text-lg md:text-xl',
  },
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  tone = 'neutral',
  size = 'md',
  variant = 'card',
  className = '',
}: EmptyStateProps) {
  const toneStyle = toneStyles[tone];
  const sizeStyle = sizeStyles[size];
  const isCard = variant === 'card';

  return (
    <div className={`text-center ${sizeStyle.wrapper} ${className}`}>
      <div
        className={`mx-auto max-w-2xl ${isCard ? `rounded-3xl ring-1 ${toneStyle.ring} ${toneStyle.panel} ${sizeStyle.panel}` : ''}`}
      >
        <div className="flex flex-col items-center">
          {icon && (
            <div
              className={`flex items-center justify-center rounded-2xl ring-1 ${toneStyle.iconRing} ${toneStyle.iconBg} ${sizeStyle.icon} mb-6`}
              aria-hidden="true"
            >
              <span className={`${toneStyle.iconText}`}>{icon}</span>
            </div>
          )}
          <h3 className={`${sizeStyle.title} font-serif font-semibold text-[color:var(--foreground)] tracking-tight text-balance`}>
            {title}
          </h3>
          {description && (
            <p className={`mt-3 ${sizeStyle.desc} text-[color:var(--ds-muted)] font-light leading-relaxed text-balance`}>
              {description}
            </p>
          )}
          {action && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
