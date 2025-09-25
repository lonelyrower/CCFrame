'use client'

import { Suspense } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, Settings, AlertTriangle, CheckCircle2, Clock,
  Server, Database, HardDrive, Zap, FileText, Construction
} from 'lucide-react'

function getSystemHealthData() {
  // Mock data for client-side rendering
  return {
    database: {
      status: 'healthy',
      error: null
    },
    configuration: {
      siteTitle: 'CC Frame',
      storageProvider: 'local',
      semanticEnabled: false,
      defaultVisibility: 'public'
    }
  }
}

function HealthLoading() {
  return (
    <div className="relative space-y-8 pb-20 pt-6 text-text-primary">
      <div className="animate-pulse space-y-6">
        <div className="h-20 rounded-[24px] bg-white/10"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-[16px] bg-white/10"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HealthContent() {
  const healthData = getSystemHealthData()

  return (
    <div className="relative space-y-8 pb-20 pt-6 text-text-primary">
      {/* Film grain background */}
      <div
        className="fixed inset-0 opacity-5 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}
      />

      <header className="relative space-y-3">
        <h1
          className="text-3xl font-light tracking-tight text-text-primary"
          style={{ fontFamily: 'var(--token-typography-display-font-family)' }}
        >
          系统健康
        </h1>
        <p className="font-light leading-relaxed text-text-secondary">
          查看系统基本状态与配置信息。详细监控功能正在开发中。
        </p>
      </header>

      {/* Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.25, 0.25, 1] }}
        className="relative overflow-hidden rounded-[24px] border border-surface-outline/40 bg-surface-panel/85 dark:border-white/10 dark:bg-black/40 p-6 backdrop-blur-xl shadow-xl"
      >
        <div
          className="absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px'
          }}
        />

        <div className="relative flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-[12px] bg-emerald-400/20 p-3">
              <Activity className="h-6 w-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-text-primary mb-2">
                系统状态概览
              </h2>
              <p className="text-sm font-light text-text-secondary">
                基础系统运行正常，配置检查通过
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-[8px] border border-emerald-400/30 bg-emerald-400/20 px-2 py-1 text-xs font-medium text-emerald-200">
              <CheckCircle2 className="h-3 w-3" />
              运行中
            </span>
          </div>
        </div>
      </motion.div>

      {/* System Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Database Status */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.25, 0.25, 1] }}
          className="relative overflow-hidden rounded-[20px] border border-surface-outline/40 bg-surface-panel/80 dark:border-white/10 dark:bg-black/40 p-5 backdrop-blur-xl shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-[10px] bg-blue-400/20 p-2">
              <Database className="h-5 w-5 text-blue-200" />
            </div>
            <div className="flex items-center gap-1">
              {healthData.database.status === 'healthy' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-200" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-200" />
              )}
            </div>
          </div>
          <h3 className="text-sm font-medium text-text-primary mb-1">数据库</h3>
          <p className={`text-sm font-light mb-2 ${
            healthData.database.status === 'healthy' ? 'text-emerald-200' : 'text-red-200'
          }`}>
            {healthData.database.status === 'healthy' ? '连接正常' : '连接异常'}
          </p>
          {healthData.database.error && (
            <p className="text-xs text-text-muted break-words">{healthData.database.error}</p>
          )}
        </motion.div>

        {/* Configuration Status */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.25, 0.25, 1] }}
          className="relative overflow-hidden rounded-[20px] border border-surface-outline/40 bg-surface-panel/80 dark:border-white/10 dark:bg-black/40 p-5 backdrop-blur-xl shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-[10px] bg-amber-100/20 p-2">
              <Settings className="h-5 w-5 text-amber-200" />
            </div>
            <CheckCircle2 className="h-4 w-4 text-emerald-200" />
          </div>
          <h3 className="text-sm font-medium text-text-primary mb-1">系统配置</h3>
          <p className="text-sm font-light text-emerald-200 mb-2">配置已加载</p>
          <div className="space-y-1 text-xs text-text-muted">
            <p>站点: {healthData.configuration.siteTitle}</p>
            <p>存储: {healthData.configuration.storageProvider}</p>
            <p>语义检索: {healthData.configuration.semanticEnabled ? '已启用' : '已关闭'}</p>
          </div>
        </motion.div>

        {/* Development Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3, ease: [0.25, 0.25, 0.25, 1] }}
          className="relative overflow-hidden rounded-[20px] border border-amber-200/30 bg-amber-100/10 p-5 backdrop-blur-xl shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-[10px] bg-amber-100/20 p-2">
              <Construction className="h-5 w-5 text-amber-200" />
            </div>
            <Clock className="h-4 w-4 text-amber-200" />
          </div>
          <h3 className="text-sm font-medium text-text-primary mb-1">监控功能</h3>
          <p className="text-sm font-light text-amber-200 mb-2">开发中</p>
          <p className="text-xs text-text-muted">
            详细的系统监控、性能指标和告警功能正在开发中
          </p>
        </motion.div>
      </div>

      {/* Future Features Notice */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.25, 0.25, 0.25, 1] }}
        className="relative overflow-hidden rounded-[24px] border border-surface-outline/40 bg-surface-panel/85 dark:border-white/10 dark:bg-black/40 p-8 text-center backdrop-blur-xl shadow-xl"
      >
        <div className="relative space-y-4">
          <div className="rounded-[16px] bg-blue-400/20 p-4 inline-block">
            <Zap className="h-8 w-8 text-blue-200" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-text-primary mb-2">
              高级监控功能开发中
            </h2>
            <p className="font-light text-text-secondary mb-4 max-w-2xl mx-auto">
              未来版本将提供服务器性能监控、存储使用统计、用户活动分析、错误日志追踪等功能。
              敬请期待更完整的系统健康监控体验。
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-xs">
              {['性能监控', 'API 状态', '存储分析', '用户统计', '错误追踪'].map((feature) => (
                <span
                  key={feature}
                  className="inline-flex items-center rounded-[6px] border border-surface-outline/40 bg-surface-panel/70 px-3 py-1 text-text-secondary dark:border-white/20 dark:bg-white/10 dark:text-white/70"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function SystemHealthPage() {
  return (
    <Suspense fallback={<HealthLoading />}>
      <HealthContent />
    </Suspense>
  )
}