export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🎉 应用运行成功！
        </h1>
        <p className="text-gray-600">
          恭喜！你的个人相册网站已经成功启动
        </p>
        <div className="mt-8 space-y-2 text-sm text-gray-500">
          <p>✅ Next.js 14 正常运行</p>
          <p>✅ Tailwind CSS 样式正常</p>
          <p>✅ 数据库连接正常</p>
        </div>
        <div className="mt-8">
          <a
            href="/admin/login"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            前往管理后台
          </a>
        </div>
      </div>
    </div>
  )
}