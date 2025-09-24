import { Container } from '@/components/layout/container'
import { Heading, Text } from '@/components/ui/typography'
import { Surface } from '@/components/ui/surface'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import { fadeInScale, listItemRise, createStaggerPreset } from '@/lib/motion/presets'
import { Workflow, Clock, Users, Zap, Camera, Tags, Upload } from 'lucide-react'

const workflowStagger = createStaggerPreset({ amount: 0.06, delayChildren: 0.04 })

const plannedWorkflows = [
  {
    id: 'batch-upload',
    title: '批量上传工作流',
    description: '自动化批量照片上传、处理和分类流程',
    icon: Upload,
    status: '规划中',
    features: ['自动重命名', '智能分类', '元数据提取', '缩略图生成']
  },
  {
    id: 'photo-organization',
    title: '照片整理工作流',
    description: '基于拍摄时间、地点和内容自动整理照片',
    icon: Camera,
    status: '规划中',
    features: ['时间线分组', '地理位置分类', 'AI 内容识别', '重复检测']
  },
  {
    id: 'tag-management',
    title: '标签管理工作流',
    description: '自动化标签生成、清理和优化流程',
    icon: Tags,
    status: '规划中',
    features: ['智能标签建议', '批量标签操作', '标签关系分析', '冗余标签清理']
  }
]

export const dynamic = 'force-dynamic'

export default function WorkflowsPage() {
  return (
    <div className="pb-20 pt-6">
      <Container size="xl" bleed="none" className="flex flex-col gap-8">
        <AnimateOnScroll variants={fadeInScale}>
          <div className="space-y-2">
            <Heading size="lg">工作流模板</Heading>
            <Text tone="secondary">
              常用后台流程的自动化模版，提高管理效率，减少重复操作。
            </Text>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll variants={fadeInScale} delay={0.08}>
          <Surface tone="panel" padding="lg" className="shadow-subtle">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3">
                <Workflow className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <Heading size="sm" className="mb-2">自动化工作流</Heading>
                <Text tone="secondary" size="sm">
                  工作流功能将帮助您自动化常见的照片管理任务，提高工作效率。预计在未来版本中推出。
                </Text>
              </div>
            </div>
          </Surface>
        </AnimateOnScroll>

        <AnimateOnScroll variants={workflowStagger} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plannedWorkflows.map((workflow) => {
            const IconComponent = workflow.icon
            return (
              <AnimateOnScroll key={workflow.id} variants={listItemRise}>
                <Surface tone="canvas" padding="lg" className="h-full border border-surface-outline/20 hover:shadow-subtle transition-shadow">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                        {workflow.status}
                      </span>
                    </div>

                    <div className="flex-1">
                      <Heading size="sm" className="mb-2">{workflow.title}</Heading>
                      <Text tone="secondary" size="sm" className="mb-4">
                        {workflow.description}
                      </Text>

                      <div className="space-y-2">
                        <Text size="xs" tone="muted" weight="medium">主要特性：</Text>
                        <ul className="space-y-1">
                          {workflow.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-xs text-text-secondary">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </Surface>
              </AnimateOnScroll>
            )
          })}
        </AnimateOnScroll>

        <AnimateOnScroll variants={fadeInScale} delay={0.16}>
          <Surface tone="canvas" padding="lg" className="border border-surface-outline/20">
            <div className="flex items-center gap-3 text-center justify-center">
              <Clock className="h-4 w-4 text-text-muted" />
              <Text size="sm" tone="muted">
                工作流功能正在开发中，敬请期待后续版本更新
              </Text>
            </div>
          </Surface>
        </AnimateOnScroll>
      </Container>
    </div>
  )
}