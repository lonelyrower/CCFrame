export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-stone-50 dark:bg-neutral-950 border-t border-stone-200/50 dark:border-neutral-800/50 overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--ds-accent-5)] to-transparent dark:from-[var(--ds-accent-10)] pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center gap-8">
          {/* Brand with subtle animation */}
          <div className="group flex flex-col items-center gap-2">
            <span className="text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 tracking-tighter transition-colors duration-300 group-hover:text-[color:var(--ds-accent)]">
              CCFrame
            </span>
            <span className="text-xs uppercase tracking-[0.3em] text-stone-500 dark:text-stone-400 font-medium">
              Photo Gallery
            </span>
          </div>

          {/* Elegant divider */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-stone-300 dark:to-neutral-700" />
            <div className="w-2 h-2 rounded-full bg-[color:var(--ds-accent-30)] animate-pulse" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-stone-300 dark:to-neutral-700" />
          </div>

          {/* Copyright with subtle styling */}
          <div className="text-center">
            <p className="text-sm text-stone-500 dark:text-stone-400 tracking-wide mb-2">
              © {currentYear} CCFrame
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              Built with <span className="text-[color:var(--ds-accent)]">♥</span> using Next.js
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
