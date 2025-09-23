import type { ReactNode } from 'react'

export default function ThemesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[1280px] px-4 pb-32 pt-10 sm:px-6 md:px-10 lg:px-16">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#0f0f25] via-[#1b1533] to-[#090b17]" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 -z-[9] bg-[radial-gradient(circle_at_top,#3b2f6e_0%,rgba(9,11,23,0)_55%)] opacity-70" aria-hidden="true" />
      <div className="relative z-10 space-y-16 pb-16">{children}</div>
    </div>
  )
}
