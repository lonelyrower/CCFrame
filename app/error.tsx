'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, Terminal, Copy } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Page Error:', error)
  }, [error])

  const copyErrorInfo = () => {
    const errorInfo = `
Error: ${error.message}
Digest: ${error.digest || 'N/A'}
Stack: ${error.stack || 'N/A'}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
    `.trim()
    
    navigator.clipboard.writeText(errorInfo).then(() => {
      alert('错误信息已复制到剪贴板')
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              页面加载出错
            </h1>
            <p className="text-gray-600">
              CCFrame 在处理您的请求时遇到了问题
            </p>
          </div>

          {/* 错误摘要 */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2 flex items-center">
                <Terminal className="h-4 w-4 mr-2" />
                错误详情
              </h3>
              <div className="text-sm text-red-700 space-y-2">
                <div>
                  <strong>消息:</strong> {error.message || '未知错误'}
                </div>
                {error.digest && (
                  <div>
                    <strong>错误ID:</strong> 
                    <code className="ml-2 bg-red-100 px-2 py-1 rounded text-xs">
                      {error.digest}
                    </code>
                  </div>
                )}
                <div>
                  <strong>时间:</strong> {new Date().toLocaleString('zh-CN')}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">可能原因</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 数据库连接失败</li>
                <li>• 环境变量配置错误</li>
                <li>• 依赖服务不可用</li>
                <li>• 服务器资源不足</li>
                <li>• 网络连接问题</li>
              </ul>
            </div>
          </div>

          {/* 生产环境诊断 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-3">生产环境检查清单</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-yellow-700">
              <div>
                <h4 className="font-medium mb-2">数据库</h4>
                <ul className="space-y-1">
                  <li>□ PostgreSQL 服务是否运行</li>
                  <li>□ DATABASE_URL 是否正确</li>
                  <li>□ 数据库连接池是否正常</li>
                  <li>□ Prisma 迁移是否完成</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">环境配置</h4>
                <ul className="space-y-1">
                  <li>□ NEXTAUTH_SECRET 是否设置</li>
                  <li>□ NEXTAUTH_URL 是否正确</li>
                  <li>□ Redis 连接是否正常</li>
                  <li>□ 文件存储是否可访问</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <button
              onClick={reset}
              className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              重新尝试
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              返回首页
            </button>
            
            <button
              onClick={() => window.location.href = '/admin'}
              className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              管理后台
            </button>

            <button
              onClick={copyErrorInfo}
              className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Copy className="h-4 w-4 mr-2" />
              复制错误信息
            </button>
          </div>

          {/* 技术细节（开发模式或管理员） */}
          {(process.env.NODE_ENV === 'development' || error.stack) && (
            <details className="bg-gray-50 border rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                技术细节 (点击展开)
              </summary>
              <pre className="text-xs text-gray-600 overflow-auto max-h-60 bg-white p-3 rounded border">
                <strong>Error Stack:</strong>
                {error.stack || 'No stack trace available'}
                
                <strong>Environment:</strong>
                NODE_ENV: {process.env.NODE_ENV || 'unknown'}
                
                <strong>Browser Info:</strong>
                User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}
                URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}