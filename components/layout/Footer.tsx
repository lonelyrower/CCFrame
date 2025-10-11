export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-50 dark:bg-neutral-950 border-t border-stone-200/50 dark:border-neutral-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center gap-6">
          {/* Brand */}
          <div className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-50 tracking-tighter">
            CCFrame
          </div>

          {/* Divider */}
          <div className="w-16 h-px bg-stone-300 dark:bg-neutral-700" />

          {/* Copyright */}
          <p className="text-sm text-stone-500 dark:text-stone-400 tracking-wide">
            © {currentYear} CCFrame. Built with Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}
