import { Container } from '@/components/layout/container'
import { Heading, Text } from '@/components/ui/typography'
import { Surface } from '@/components/ui/surface'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import { fadeInScale, listItemRise, createStaggerPreset } from '@/lib/motion/presets'
import {
  BookOpen, Upload, Tags, Settings, Database,
  Workflow, AlertTriangle, HelpCircle, Users, Shield
} from 'lucide-react'

const guideStagger = createStaggerPreset({ amount: 0.06, delayChildren: 0.04 })

const operationalGuides = [
  {
    id: 'getting-started',
    title: '快速入门指南',
    description: '系统初始化设置和基本操作流程',
    icon: BookOpen,
    difficulty: '入门',
    duration: '15 分钟',
    topics: ['系统初始化', '用户账户设置', '基础配置', '界面介绍']
  },
  {
    id: 'photo-management',
    title: '照片管理实践',
    description: '高效的照片上传、整理和分类方法',
    icon: Upload,
    difficulty: '中级',
    duration: '30 分钟',
    topics: ['批量上传技巧', '文件命名规范', '目录结构规划', '质量控制']
  },
  {
    id: 'tagging-strategy',
    title: '标签策略指南',
    description: '建立一致的标签体系和分类标准',
    icon: Tags,
    difficulty: '中级',
    duration: '25 分钟',
    topics: ['标签体系设计', '命名规范', '层级结构', '维护策略']
  },
  {
    id: 'system-config',
    title: '系统配置最佳实践',
    description: '存储、性能和安全配置建议',
    icon: Settings,
    difficulty: '高级',
    duration: '45 分钟',
    topics: ['存储配置', '性能优化', '安全设置', '备份策略']
  },
  {
    id: 'database-maintenance',
    title: '数据库维护手册',
    description: '定期维护任务和数据清理操作',
    icon: Database,
    difficulty: '高级',
    duration: '35 分钟',
    topics: ['数据备份', '索引优化', '清理操作', '性能监控']
  },
  {
    id: 'troubleshooting',
    title: '常见问题排查',
    description: '问题诊断流程和解决方案',
    icon: AlertTriangle,
    difficulty: '中级',
    duration: '40 分钟',
    topics: ['错误诊断', '日志分析', '性能问题', '恢复操作']
  }
]

const faqItems = [
  {
    question: '如何进行系统备份？',
    answer: '定期备份数据库和上传文件目录，建议每日自动备份关键数据。'
  },
  {
    question: '系统性能优化有哪些方法？',
    answer: '包括图片缓存优化、数据库索引调优、CDN 配置等多种方式。'
  },
  {
    question: '如何处理存储空间不足？',
    answer: '可以配置外部存储（如 S3），或者清理重复和低质量照片。'
  }
]

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case '入门': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
    case '中级': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
    case '高级': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
    default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
  }
}

export const dynamic = 'force-dynamic'

export default function AdminOperationalPlaybookPage() {
  return (
    <div className="pb-20 pt-6">
      <Container size="xl" bleed="none" className="flex flex-col gap-8">
        <AnimateOnScroll variants={fadeInScale}>
          <div className="space-y-2">
            <Heading size="lg">操作指南</Heading>
            <Text tone="secondary">
              后台培训手册与常见问题解答。帮助管理员掌握系统使用和维护技能。
            </Text>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll variants={fadeInScale} delay={0.08}>
          <Surface tone="panel" padding="lg" className="shadow-subtle">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <Heading size="sm" className="mb-2">操作手册概览</Heading>
                <Text tone="secondary" size="sm" className="mb-4">
                  涵盖从基础操作到高级维护的完整指南，帮助您更好地管理摄影作品系统。
                </Text>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-text-secondary">适用所有管理员</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-text-secondary">涵盖安全最佳实践</span>
                  </div>
                </div>
              </div>
            </div>
          </Surface>
        </AnimateOnScroll>

        <div className="space-y-6">
          <AnimateOnScroll variants={fadeInScale} delay={0.12}>
            <Heading size="md">操作指南</Heading>
          </AnimateOnScroll>

          <AnimateOnScroll variants={guideStagger} className="grid gap-6 md:grid-cols-2">
            {operationalGuides.map((guide) => {
              const IconComponent = guide.icon
              return (
                <AnimateOnScroll key={guide.id} variants={listItemRise}>
                  <Surface tone="canvas" padding="lg" className="h-full border border-surface-outline/20 hover:shadow-subtle transition-shadow">
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="rounded-lg bg-primary/10 p-3">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getDifficultyColor(guide.difficulty)}`}>
                            {guide.difficulty}
                          </span>
                          <span className="text-xs text-text-muted">{guide.duration}</span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <Heading size="sm" className="mb-2">{guide.title}</Heading>
                        <Text tone="secondary" size="sm" className="mb-4">
                          {guide.description}
                        </Text>

                        <div className="space-y-2">
                          <Text size="xs" tone="muted" weight="medium">主要内容：</Text>
                          <ul className="space-y-1">
                            {guide.topics.map((topic, index) => (
                              <li key={index} className="flex items-center gap-2 text-xs text-text-secondary">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                                {topic}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-surface-outline/20">
                        <Text size="xs" tone="muted" className="text-center">
                          详细内容正在编写中...
                        </Text>
                      </div>
                    </div>
                  </Surface>
                </AnimateOnScroll>
              )
            })}
          </AnimateOnScroll>
        </div>

        <div className="space-y-6">
          <AnimateOnScroll variants={fadeInScale} delay={0.16}>
            <Heading size="md">常见问题</Heading>
          </AnimateOnScroll>

          <AnimateOnScroll variants={guideStagger} className="space-y-4">
            {faqItems.map((faq, index) => (
              <AnimateOnScroll key={index} variants={listItemRise}>
                <Surface tone="canvas" padding="lg" className="border border-surface-outline/20">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-2 mt-1">
                      <HelpCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Heading size="sm" className="mb-2">{faq.question}</Heading>
                      <Text tone="secondary" size="sm">{faq.answer}</Text>
                    </div>
                  </div>
                </Surface>
              </AnimateOnScroll>
            ))}
          </AnimateOnScroll>
        </div>

        <AnimateOnScroll variants={fadeInScale} delay={0.2}>
          <Surface tone="panel" padding="lg" className="shadow-subtle text-center">
            <Heading size="sm" className="mb-2">需要更多帮助？</Heading>
            <Text tone="secondary" size="sm">
              如果您在使用过程中遇到问题，可以查看系统健康页面或提交异常报告。
            </Text>
          </Surface>
        </AnimateOnScroll>
      </Container>
    </div>
  )
}