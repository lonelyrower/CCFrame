import { Surface } from '@/components/ui/surface'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

const buttonVariants = [
  { variant: 'default' as const, label: 'Primary' },
  { variant: 'secondary' as const, label: 'Secondary' },
  { variant: 'outline' as const, label: 'Outline' },
  { variant: 'ghost' as const, label: 'Ghost' },
  { variant: 'glass' as const, label: 'Glass' },
  { variant: 'link' as const, label: 'Link' },
]

const surfaces = [
  { tone: 'canvas' as const, label: 'Canvas' },
  { tone: 'panel' as const, label: 'Panel' },
  { tone: 'glass' as const, label: 'Glass' },
]

const badges = [
  { variant: 'default' as const, label: 'Default' },
  { variant: 'brand' as const, label: 'Brand' },
  { variant: 'subtle' as const, label: 'Subtle' },
  { variant: 'destructive' as const, label: 'Destructive' },
  { variant: 'outline' as const, label: 'Outline' },
]

const swatches = [
  { name: 'Primary', className: 'bg-primary text-primary-foreground border border-surface-outline/30' },
  { name: 'Accent', className: 'bg-accent text-accent-foreground border border-surface-outline/30' },
  { name: 'Surface Canvas', className: 'bg-surface-canvas text-text-primary border border-surface-outline/30' },
  { name: 'Surface Panel', className: 'bg-surface-panel text-text-primary border border-surface-outline/30' },
  { name: 'Surface Glass', className: 'bg-surface-glass text-text-primary border border-contrast-outline/20 backdrop-blur' },
]

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="font-display text-2xl font-semibold text-text-primary">{title}</h2>
      {description && <p className="text-sm text-text-muted">{description}</p>}
    </div>
  )
}

export default function DesignSystemPage() {
  return (
    <main className="min-h-screen bg-surface-canvas px-6 py-12 text-text-primary">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <header className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm uppercase tracking-[0.2em] text-text-muted">Design System</p>
            <h1 className="font-display text-4xl font-semibold">CC Frame UI Foundations</h1>
          </div>
          <p className="max-w-3xl text-base text-text-secondary">
            该页面用于快速预览基础 tokens 与 UI 组件的视觉呈现，确保前后台共享统一的设计语言。
            可在切换明暗模式后即时观察色彩、阴影与排版的效果。
          </p>
        </header>

        <Surface padding="lg" tone="panel" interactive className="flex flex-col gap-6">
          <SectionTitle title="色彩 Swatches" description="核心品牌色与表面层的视觉演示" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {swatches.map((item) => (
              <div
                key={item.name}
                className={`flex h-32 flex-col justify-between rounded-lg ${item.className} p-4 shadow-subtle transition`}
              >
                <span className="text-xs uppercase tracking-[0.18em] text-text-muted/80">
                  {item.name}
                </span>
                <span className="text-sm font-medium">
                  {item.className.replace('bg-', '')}
                </span>
              </div>
            ))}
          </div>
        </Surface>

        <Surface padding="lg" tone="panel" interactive className="flex flex-col gap-6">
          <SectionTitle title="Buttons" description="核心按钮变体" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {buttonVariants.map(({ variant, label }) => (
              <div key={variant} className="flex flex-col gap-3 rounded-lg bg-surface-glass/40 p-4">
                <span className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</span>
                <div className="flex items-center gap-3">
                  <Button variant={variant} className="min-w-[120px] justify-center">
                    {label}
                  </Button>
                  <Button variant={variant} size="icon">
                    <span aria-hidden>★</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Surface>

        <Surface padding="lg" tone="panel" interactive className="flex flex-col gap-6">
          <SectionTitle title="Badges" description="用于展示标签与元数据的胶囊样式" />
          <div className="flex flex-wrap gap-3">
            {badges.map(({ variant, label }) => (
              <Badge key={variant} variant={variant}>
                {label}
              </Badge>
            ))}
          </div>
        </Surface>

        <Surface padding="lg" tone="panel" interactive className="flex flex-col gap-6">
          <SectionTitle title="表单控件" description="输入与辅助控件" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">文本输入</label>
              <Input placeholder="例如：暮色人像系列" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">禁用状态</label>
              <Input placeholder="不可编辑" disabled />
            </div>
          </div>
        </Surface>

        <Surface padding="lg" tone="panel" interactive className="flex flex-col gap-6">
          <SectionTitle title="Surface 层级" description="多种承载层，用于区分背景与内容" />
          <div className="grid gap-4 md:grid-cols-3">
            {surfaces.map(({ tone, label }) => (
              <Surface
                key={tone}
                tone={tone}
                padding="md"
                interactive
                className="flex h-32 flex-col justify-between"
              >
                <span className="text-xs uppercase tracking-[0.18em] text-text-muted">{label}</span>
                <span className="text-sm text-text-secondary">tone=&quot;{tone}&quot;</span>
              </Surface>
            ))}
          </div>
        </Surface>
      </div>
    </main>
  )
}
