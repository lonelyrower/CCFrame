import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { PreferenceProvider, usePreferenceContext } from '@/components/context/preference-provider'
import { Button } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'

const meta: Meta = {
  title: 'Motion/Preferences',
  decorators: [
    (Story) => (
      <PreferenceProvider>
        <div className="min-h-screen bg-black/90 p-10 text-white">
          <Story />
        </div>
      </PreferenceProvider>
    ),
  ],
}

export default meta

type Story = StoryObj

function PreferenceDemo() {
  const { reducedMotion, setReducedMotion, reducedMotionFromSystem, audioEnabled, setAudioEnabled } = usePreferenceContext()
  const [log, setLog] = useState<string[]>([])

  return (
    <Surface tone="panel" className="max-w-xl space-y-4 p-6 text-sm text-white">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Reduced Motion</h3>
        <p className="text-xs text-white/60">
          当前状态：{reducedMotion ? '静态' : '动效开启'}（{reducedMotionFromSystem ? '系统偏好' : '用户自定义'}）
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant={reducedMotion ? 'default' : 'secondary'} onClick={() => setReducedMotion(true)}>
            静态模式
          </Button>
          <Button size="sm" variant={!reducedMotion ? 'default' : 'secondary'} onClick={() => setReducedMotion(false)}>
            动效模式
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Audio Preference</h3>
        <p className="text-xs text-white/60">默认静音，通过按钮切换是否启用音频。</p>
        <div className="flex gap-2">
          <Button size="sm" variant={audioEnabled ? 'default' : 'secondary'} onClick={() => setAudioEnabled(true)}>
            开启音频
          </Button>
          <Button size="sm" variant={!audioEnabled ? 'default' : 'secondary'} onClick={() => setAudioEnabled(false)}>
            静音
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">日志记录</h3>
        <div className="rounded bg-black/50 p-3 text-xs text-white/70">
          {log.length === 0 ? <p>暂无操作</p> : log.map((item, index) => <p key={index}>{item}</p>)}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            setLog((prev) => [
              `${new Date().toLocaleTimeString()} · motion=${reducedMotion ? 'reduce' : 'default'}, audio=${audioEnabled ? 'on' : 'off'}`,
              ...prev,
            ])
          }
        >
          记录当前状态
        </Button>
      </div>
    </Surface>
  )
}

export const Playground: Story = {
  render: () => <PreferenceDemo />,
}
