import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Bell,
  UploadCloud,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Tags,
  Workflow,
} from 'lucide-react'

export type AdminNavigationMetricKey =
  | 'pendingTasks'
  | 'activeUploads'
  | 'failedUploads'
  | 'alerts'

export interface AdminNavigationBadge {
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'
  label: string
}

export interface AdminNavigationItem {
  id: string
  label: string
  href: string
  icon?: LucideIcon
  description?: string
  metricKey?: AdminNavigationMetricKey
  defaultBadge?: AdminNavigationBadge
  keywords?: string[]
}

export interface AdminNavigationSection {
  id: string
  title?: string
  items: AdminNavigationItem[]
}

export interface AdminQuickAction {
  id: string
  label: string
  href?: string
  icon?: LucideIcon
  intent?: 'primary' | 'secondary' | 'danger'
  shortcut?: string[]
  description?: string
  metricKey?: AdminNavigationMetricKey
}

export interface AdminNavigationMetrics {
  pendingTasks: number
  activeUploads: number
  failedUploads: number
  alerts: number
}

export const defaultAdminNavigationMetrics: AdminNavigationMetrics = {
  pendingTasks: 0,
  activeUploads: 0,
  failedUploads: 0,
  alerts: 0,
}

export const adminNavigationSections: AdminNavigationSection[] = [
  {
    id: 'workspace',
    items: [
      {
        id: 'overview',
        label: '总览',
        href: '/admin',
        icon: LayoutDashboard,
        description: '运营指标、告警与待办一览',
        metricKey: 'pendingTasks',
        keywords: ['dashboard', 'home', 'console'],
      },
      {
        id: 'upload-center',
        label: '上传中心',
        href: '/admin/upload',
        icon: UploadCloud,
        description: '批量上传、处理进度与错误诊断',
        metricKey: 'activeUploads',
        keywords: ['upload', 'queue', 'ingest'],
      },
      {
        id: 'library',
        label: '作品库',
        href: '/admin/library',
        icon: FolderKanban,
        description: '浏览、筛选与批量管理摄影作品',
        keywords: ['photos', 'library', 'assets'],
      },
      {
        id: 'tags',
        label: '标签与策展',
        href: '/admin/organize/manage-tags',
        icon: Tags,
        description: '组织标签、主题与推荐规则',
        keywords: ['tags', 'taxonomy', 'organise'],
      },
      {
        id: 'settings',
        label: '设置',
        href: '/admin/settings',
        icon: Settings,
        description: '站点信息、存储、自动化与危险操作',
        keywords: ['settings', 'configuration'],
      },
    ],
  },
  {
    id: 'operations',
    title: '运行与支撑',
    items: [
      {
        id: 'runtime',
        label: '运行时配置',
        href: '/admin/runtime-config',
        icon: SlidersHorizontal,
        description: 'Feature Flag、缓存与队列调度',
        keywords: ['runtime', 'flags', 'cache'],
      },
      {
        id: 'integrations',
        label: 'API 与集成',
        href: '/admin/api-settings',
        icon: Sparkles,
        description: '外部服务密钥、回调与验证',
        keywords: ['api', 'integration'],
      },
      {
        id: 'health',
        label: '系统健康',
        href: '/admin/system-health',
        icon: Activity,
        description: '错误日志、性能指标与巡检脚本',
        metricKey: 'alerts',
        defaultBadge: { label: 'beta', tone: 'info' },
        keywords: ['health', 'status', 'monitoring'],
      },
    ],
  },
]

export const adminSupportLinks: AdminNavigationSection = {
  id: 'support',
  title: '支持',
  items: [
    {
      id: 'help-center',
      label: '操作指南',
      href: '/docs/admin-operational-playbook',
      icon: LifeBuoy,
      description: '后台培训手册与常见问题',
      keywords: ['docs', 'guide', 'help'],
    },
    {
      id: 'workflows',
      label: '工作流模板',
      href: '/admin/workflows',
      icon: Workflow,
      description: '常用后台流程的自动化模版',
      defaultBadge: { label: 'soon', tone: 'neutral' },
      keywords: ['workflow', 'automation'],
    },
  ],
}

export const adminQuickActions: AdminQuickAction[] = [
  {
    id: 'new-upload',
    label: '新增上传任务',
    href: '/admin/upload?panel=new',
    icon: UploadCloud,
    intent: 'primary',
    shortcut: ['U'],
    description: '打开上传抽屉，快速添加照片或视频',
  },
  {
    id: 'task-center',
    label: '查看待办',
    href: '/admin?panel=tasks',
    icon: Bell,
    intent: 'secondary',
    shortcut: ['G', 'T'],
    description: '聚合待审核、失败任务与配置提醒',
    metricKey: 'pendingTasks',
  },
  {
    id: 'open-command',
    label: '命令面板',
    icon: Sparkles,
    intent: 'secondary',
    shortcut: ['⌘', 'K'],
    description: '打开命令面板，搜索页面或操作',
  },
  {
    id: 'report-issue',
    label: '上报异常',
    href: '/admin/system-health?view=alerts',
    icon: Bell,
    intent: 'danger',
    description: '提交异常报告并通知运维',
    metricKey: 'alerts',
  },
]

export function formatNavigationBadge(
  item: AdminNavigationItem,
  metrics: AdminNavigationMetrics,
): AdminNavigationBadge | undefined {
  if (item.metricKey) {
    const value = metrics[item.metricKey]
    if (value > 0) {
      const tone: AdminNavigationBadge['tone'] =
        item.metricKey === 'failedUploads' || item.metricKey === 'alerts'
          ? 'danger'
          : item.metricKey === 'pendingTasks'
            ? 'warning'
            : 'info'

      return {
        tone,
        label: value > 99 ? '99+' : String(value),
      }
    }
  }

  return item.defaultBadge
}

export function formatQuickActionBadge(
  action: AdminQuickAction,
  metrics: AdminNavigationMetrics,
): AdminNavigationBadge | undefined {
  if (!action.metricKey) return undefined
  const value = metrics[action.metricKey]
  if (value <= 0) return undefined

  const tone: AdminNavigationBadge['tone'] =
    action.metricKey === 'alerts' ? 'danger' : 'info'

  return {
    tone,
    label: value > 99 ? '99+' : String(value),
  }
}

