import { db } from '@/lib/db'
import { getUploadQueueSnapshot, getUploadActivityTimeline } from '@/lib/admin/upload-service'
import { validateSettings } from '@/lib/admin/settings-service'
import { getAdminMetricsReport, summariseUploadSnapshot, summariseValidationResults } from '@/lib/observability/metrics'
import type { SettingsValidationTarget } from '@/types/settings'

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.error('ADMIN_EMAIL 环境变量未配置，无法执行巡检。')
    process.exit(1)
  }

  const admin = await db.user.findFirst({ where: { email: adminEmail } })
  if (!admin) {
    console.error(`未找到管理员账号：${adminEmail}`)
    process.exit(1)
  }

  console.log('🔍 正在收集上传队列与配置校验信息...')
  const [snapshot, timeline] = await Promise.all([
    getUploadQueueSnapshot(),
    getUploadActivityTimeline(10),
  ])

  const validationTargets: SettingsValidationTarget[] = ['storage', 'integrations', 'semantic']
  const validationResults = []
  for (const target of validationTargets) {
    const result = await validateSettings(target, admin.id)
    validationResults.push(result)
  }

  const metrics = getAdminMetricsReport()

  const uploadSummary = summariseUploadSnapshot(snapshot)
  const validationSummary = summariseValidationResults(validationTargets, validationResults)

  console.log('\n=== 上传流水线 ===')
  console.log(`排队: ${uploadSummary.queued}, 处理中: ${uploadSummary.processing}, 失败: ${uploadSummary.failed}, 24h 完成: ${uploadSummary.completed24h}`)
  console.log(`存储使用: ${uploadSummary.storage.message}${uploadSummary.storage.approachingLimit ? ' ⚠️ 接近上限' : ''}`)

  if (timeline.length) {
    console.log('\n最近 10 条活动:')
    for (const entry of timeline) {
      console.log(`- [${new Date(entry.timestamp).toLocaleString('zh-CN')}] ${entry.severity.toUpperCase()} ${entry.title}${entry.description ? ' - ' + entry.description : ''}`)
    }
  }

  console.log('\n=== 配置校验 ===')
  let validationFailed = false
  for (const summary of validationSummary) {
    const statusIcon = summary.success ? '✅' : '❌'
    console.log(`${statusIcon} ${summary.target}: ${summary.message}`)
    if (!summary.success) {
      validationFailed = true
    }
  }

  console.log('\n=== 运维指标 ===')
  console.log(`记录的后台操作：${metrics.operations.total} 次（成功 ${metrics.operations.success}，失败 ${metrics.operations.error}）`)
  if (metrics.operations.byName.length) {
    for (const item of metrics.operations.byName.slice(0, 5)) {
      console.log(`- ${item.name}: 成功 ${item.success}，失败 ${item.error}，平均耗时 ${item.avgDurationMs.toFixed(2)} ms`)
    }
  }
  if (metrics.alerts.total) {
    console.log(`⚠️ 最近产生 ${metrics.alerts.total} 条后台告警`)
    for (const entry of metrics.alerts.recent) {
      console.log(`- [${new Date(entry.timestamp).toLocaleString('zh-CN')}] ${entry.category}: ${entry.message}`)
    }
  }

  const queueIssue = snapshot.counts.failed > 0

  if (queueIssue || validationFailed) {
    console.error('\n巡检检测到异常，请查看上方日志。')
    process.exit(1)
  }

  console.log('\n✅ 巡检通过')
}

main().catch((error) => {
  console.error('巡检脚本执行失败:', error)
  process.exit(1)
})
