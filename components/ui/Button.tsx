import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  /** Enable haptic feedback on supported devices */
  haptic?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, haptic = true, children, disabled, onClick, ...props }, ref) => {
    // Modern base styles with CSS containment for performance
    const baseStyles = 'group relative inline-flex items-center justify-center rounded-full font-medium tracking-wide focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none transition-all duration-300 ease-out active:scale-[0.97] select-none overflow-hidden contain-layout contain-paint';

    const variants = {
      primary: 'bg-[color:var(--ds-accent)] text-white hover:bg-[color:var(--ds-accent-strong)] focus-visible:ring-[color:var(--ds-accent-50)] shadow-md hover:shadow-lg hover:shadow-[var(--ds-accent-20)] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700',
      secondary:
        'bg-stone-200 text-stone-900 hover:bg-stone-300 focus-visible:ring-stone-500 dark:bg-neutral-700 dark:text-stone-100 dark:hover:bg-neutral-600 hover:shadow-md',
      ghost: 'bg-transparent hover:bg-stone-100 dark:hover:bg-neutral-800 focus-visible:ring-stone-500 text-[color:var(--ds-muted)]',
      glass: 'btn-glass focus-visible:ring-white/40 backdrop-blur-md',
      outline:
        'border-2 border-stone-300 text-stone-900 bg-transparent hover:bg-stone-100 hover:border-[color:var(--ds-accent-30)] focus-visible:ring-stone-400 dark:text-stone-100 dark:border-neutral-700 dark:hover:bg-white/5 dark:hover:border-[color:var(--ds-accent-30)]',
      danger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500 shadow-md hover:shadow-lg hover:shadow-red-500/20',
    } as const;

    const sizes = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-6 py-2.5 text-sm',
      lg: 'px-8 py-3.5 text-base',
    };

    // Haptic feedback handler for PWA
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (haptic && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
