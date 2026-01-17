import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-full font-medium tracking-wide uppercase focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-out will-change-transform hover:scale-105 active:scale-100';

    const variants = {
      primary: 'bg-[color:var(--ds-accent)] text-white hover:bg-[color:var(--ds-accent-strong)] focus:ring-[color:var(--ds-accent-50)] shadow-lg hover:shadow-xl',
      secondary:
        'bg-stone-200 text-stone-900 hover:bg-stone-300 focus:ring-stone-500 dark:bg-neutral-700 dark:text-stone-100 dark:hover:bg-neutral-600',
      ghost: 'bg-transparent hover:bg-stone-100 dark:hover:bg-neutral-800 focus:ring-stone-500',
      glass: 'btn-glass focus:ring-white/40',
      outline:
        'border-2 border-stone-300 text-stone-900 bg-transparent hover:bg-stone-100 focus:ring-stone-400 dark:text-stone-100 dark:border-neutral-700 dark:hover:bg-white/5',
    } as const;

    const sizes = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
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
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
