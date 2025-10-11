import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium tracking-wide text-stone-700 dark:text-stone-300 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-5 py-3 rounded-xl border-2
            bg-white dark:bg-neutral-900
            border-stone-200 dark:border-neutral-700
            text-stone-900 dark:text-stone-100
            placeholder-stone-400 dark:placeholder-neutral-500
            focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 dark:focus:ring-[#ff6b7a]/20 focus:border-[#e63946] dark:focus:border-[#ff6b7a]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-300
            ${error ? 'border-[#e63946] dark:border-[#ff6b7a] focus:ring-[#e63946]/30 dark:focus:ring-[#ff6b7a]/30' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-[#e63946] dark:text-[#ff6b7a]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
