'use client'

export default function LoginPageSimple() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            管理员登录
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            登录功能暂时不可用，正在修复中...
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            如果您是网站管理员，请联系技术支持解决登录问题。
          </p>
          
          <div className="mt-4">
            <a 
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              ← 返回相册
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}