import { Container } from '@/components/layout/container'
import { Heading, Text } from '@/components/ui/typography'
import { Surface } from '@/components/ui/surface'
import { Button } from '@/components/ui/button'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'
import { fadeInScale, listItemRise, createStaggerPreset } from '@/lib/motion/presets'
import {
  Activity, AlertTriangle, CheckCircle2, Clock,
  Server, Database, HardDrive, Zap, FileText, Bug
} from 'lucide-react'

const metricsStagger = createStaggerPreset({ amount: 0.06, delayChildren: 0.04 })

const healthMetrics = [
  {
    id: 'server',
    title: '服务器状态',
    icon: Server,
    status: 'healthy',
    value: '运行正常',
    details: 'CPU: 15% | 内存: 2.1GB/8GB | 负载: 0.8'
  },
  {
    id: 'database',
    title: '数据库',
    icon: Database,
    status: 'healthy',
    value: '连接正常',
    details: '查询响应时间: 12ms | 活跃连接: 8/100'
  },
  {
    id: 'storage',
    title: '存储空间',
    icon: HardDrive,
    status: 'warning',
    value: '78% 已使用',
    details: '已用: 156GB / 总计: 200GB | 剩余: 44GB'
  },
  {
    id: 'performance',
    title: '系统性能',
    icon: Zap,
    status: 'healthy',
    value: '良好',
    details: '平均响应时间: 150ms | 吞吐量: 85 req/s'
  }
]

const recentAlerts = [
  {
    id: 1,
    type: 'warning',
    title: '存储空间告警',
    message: '系统存储空间使用率超过 75%，建议清理或扩容',
    timestamp: '2小时前',
    resolved: false
  },
  {
    id: 2,
    type: 'info',
    title: '计划维护提醒',
    message: '系统将于本周日凌晨 2:00 进行例行维护，预计耗时 30 分钟',
    timestamp: '6小时前',
    resolved: false
  },
  {
    id: 3,
    type: 'error',
    title: '上传队列异常',
    message: '检测到上传队列处理异常，已自动恢复',
    timestamp: '1天前',
    resolved: true
  }
]

function getStatusColor(status: string) {
  switch (status) {
    case 'healthy':
      return 'text-green-600 dark:text-green-400'
    case 'warning':
      return 'text-amber-600 dark:text-amber-400'
    case 'error':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'healthy':
      return CheckCircle2
    case 'warning':
      return AlertTriangle
    case 'error':
      return AlertTriangle
    default:
      return Clock
  }
}

function getAlertTypeColor(type: string) {
  switch (type) {
    case 'error':
      return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-300'
    case 'warning':
      return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-300'
    case 'info':
      return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-300'
    default:
      return 'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800/30 text-gray-700 dark:text-gray-300'
  }
}

export const dynamic = 'force-dynamic'

export default function SystemHealthPage() {
  return (
    <div className="pb-20 pt-6">
      <Container size="xl" bleed="none" className="flex flex-col gap-8">
        <AnimateOnScroll variants={fadeInScale}>
          <div className="space-y-2">
            <Heading size="lg">系统健康</Heading>
            <Text tone="secondary">
              监控系统状态、性能指标和错误日志。及时发现并解决潜在问题。
            </Text>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll variants={fadeInScale} delay={0.08}>
          <Surface tone="panel" padding="lg" className="shadow-subtle">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3">
                  <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <Heading size="sm" className="mb-2">系统状态总览</Heading>
                  <Text tone="secondary" size="sm">
                    系统运行正常，1 个警告需要关注
                  </Text>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  导出报告
                </Button>
                <Button size="sm">
                  <Bug className="h-4 w-4 mr-2" />
                  上报异常
                </Button>
              </div>
            </div>
          </Surface>
        </AnimateOnScroll>

        <div className="space-y-6">
          <AnimateOnScroll variants={fadeInScale} delay={0.12}>
            <Heading size="md">系统指标</Heading>
          </AnimateOnScroll>

          <AnimateOnScroll variants={metricsStagger} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {healthMetrics.map((metric) => {
              const IconComponent = metric.icon
              const StatusIcon = getStatusIcon(metric.status)
              return (
                <AnimateOnScroll key={metric.id} variants={listItemRise}>
                  <Surface tone="canvas" padding="lg" className="border border-surface-outline/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <StatusIcon className={`h-5 w-5 ${getStatusColor(metric.status)}`} />
                    </div>

                    <Heading size="sm" className="mb-1">{metric.title}</Heading>
                    <Text weight="medium" className={`mb-2 ${getStatusColor(metric.status)}`}>
                      {metric.value}
                    </Text>
                    <Text size="xs" tone="muted">
                      {metric.details}
                    </Text>
                  </Surface>
                </AnimateOnScroll>
              )
            })}
          </AnimateOnScroll>
        </div>

        <div className="space-y-6">
          <AnimateOnScroll variants={fadeInScale} delay={0.16}>
            <div className="flex items-center justify-between">
              <Heading size="md">系统告警</Heading>
              <Button variant="ghost" size="sm">查看全部</Button>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll variants={metricsStagger} className="space-y-4">
            {recentAlerts.map((alert) => (
              <AnimateOnScroll key={alert.id} variants={listItemRise}>
                <Surface
                  tone="canvas"
                  padding="lg"
                  className={`border ${getAlertTypeColor(alert.type)} ${alert.resolved ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Heading size="sm">{alert.title}</Heading>
                        {alert.resolved && (
                          <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400">
                            已解决
                          </span>
                        )}
                      </div>
                      <Text tone="secondary" size="sm" className="mb-2">
                        {alert.message}
                      </Text>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <Clock className="h-3 w-3" />
                        {alert.timestamp}
                      </div>
                    </div>
                    {!alert.resolved && (
                      <Button variant="outline" size="sm">
                        处理
                      </Button>
                    )}
                  </div>
                </Surface>
              </AnimateOnScroll>
            ))}
          </AnimateOnScroll>
        </div>

        <AnimateOnScroll variants={fadeInScale} delay={0.2}>
          <Surface tone="canvas" padding="lg" className="border border-surface-outline/20 text-center">
            <div className="space-y-3">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 inline-block">
                <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <Heading size="sm" className="mb-2">系统监控功能</Heading>
                <Text tone="secondary" size="sm" className="mb-4">
                  实时监控功能正在开发中，将提供更详细的性能指标和自动化告警。
                </Text>
                <Text size="xs" tone="muted">
                  当前显示的是模拟数据，实际部署时将连接真实监控系统
                </Text>
              </div>
            </div>
          </Surface>
        </AnimateOnScroll>
      </Container>
    </div>
  )
}