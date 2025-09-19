import { Navigation } from '@/components/navigation'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navigation />
      <main className="pt-16">
        {children}
      </main>
    </>
  )
}
