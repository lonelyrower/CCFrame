'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 记录错误到控制台（生产环境也会记录）
    console.error('Global Error:', error)
    
    // 如果有错误报告服务，可以在这里发送错误报告
    // reportError(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                服务暂时不可用
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                网站遇到了一个意外的错误，我们正在努力修复中。
              </p>

              {/* 显示错误ID，方便排查 */}
              {error.digest && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-500 mb-2">错误标识符 (请告知管理员):</p>
                  <code className="text-sm font-mono bg-gray-200 px-2 py-1 rounded">
                    {error.digest}
                  </code>
                </div>
              )}

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">可能的原因：</h3>
                  <ul className="text-sm text-blue-700 text-left space-y-1">
                    <li>• 数据库连接问题</li>
                    <li>• 服务器配置错误</li>
                    <li>• 依赖服务不可用</li>
                    <li>• 临时的网络问题</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={reset}
                    className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    重试
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
                    className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Bug className="h-4 w-4 mr-2" />
                    管理后台
                  </button>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  如果问题持续存在，请联系网站管理员
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  错误时间: {new Date().toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}