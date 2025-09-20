'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  User,
  Lock,
  Database,
  Palette,
  Globe,
  Save,
  Eye,
  EyeOff,
  Shield,
  Key,
  Bug,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Settings {
  profile: {
    email: string
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }
  site: {
    title: string
    description: string
    defaultVisibility: 'PUBLIC' | 'PRIVATE'
    allowPublicAccess: boolean
  }
  storage: {
    autoDeleteFailed: boolean
    maxUploadSize: number
    compressionQuality: number
    imageFormats: string
    imageVariantNames: string
  }
  apis: {
    pixabayApiKey: string
  }
  runtime: {
    storage: {
      provider: string
      local: {
        basePath: string
      }
      minio: {
        endpoint: string
        region: string
        bucket: string
        accessKeyId: string
        secretAccessKey: string
        cdnUrl: string
        forcePathStyle: boolean
      }
      aws: {
        endpoint: string
        region: string
        bucket: string
        accessKeyId: string
        secretAccessKey: string
        cdnUrl: string
      }
    }
    semantic: {
      enabled: boolean
      mode: string
      provider: string
      model: string
      dim: number
      openaiApiKey: string
      openaiBaseUrl: string
      strictMode: boolean
      rpmLimit: number
      maxRetry: number
      queryCacheTtlMs: number
      cacheTtlMs: number
      cacheSize: number
      negativeCache: boolean
      negativeCacheTtlMs: number
    }
  }
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  const [settings, setSettings] = useState<Settings>({
    profile: {
      email: session?.user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    site: {
      title: 'CC Frame - 个人创意相册',
      description: 'CC Frame 是一个精美的个人相册网站，记录生活中的美好瞬间。',
      defaultVisibility: 'PUBLIC',
      allowPublicAccess: true
    },
    storage: {
      autoDeleteFailed: true,
      maxUploadSize: 50, // MB
      compressionQuality: 85,
      imageFormats: '',
      imageVariantNames: ''
    },
    apis: {
      pixabayApiKey: ''
    },
    runtime: {
      storage: {
        provider: 'minio',
        local: {
          basePath: './uploads'
        },
        minio: {
          endpoint: '',
          region: '',
          bucket: '',
          accessKeyId: '',
          secretAccessKey: '',
          cdnUrl: '',
          forcePathStyle: true
        },
        aws: {
          endpoint: '',
          region: '',
          bucket: '',
          accessKeyId: '',
          secretAccessKey: '',
          cdnUrl: ''
        }
      },
      semantic: {
        enabled: false,
        mode: 'off',
        provider: 'deterministic',
        model: 'deterministic-v1',
        dim: 768,
        openaiApiKey: '',
        openaiBaseUrl: '',
        strictMode: false,
        rpmLimit: 60,
        maxRetry: 3,
        queryCacheTtlMs: 30000,
        cacheTtlMs: 60000,
        cacheSize: 100,
        negativeCache: false,
        negativeCacheTtlMs: 5000
      }
    }
  })

  const [isLoading, setIsLoading] = useState(false)
  const [debugConfig, setDebugConfig] = useState<any>(null)
  const [pwaStatus, setPwaStatus] = useState<any>(null)

  useEffect(() => {
    const email = session?.user?.email || ''
    setSettings(prev => (
      prev.profile.email === email
        ? prev
        : {
            ...prev,
            profile: {
              ...prev.profile,
              email,
            },
          }
    ))
  }, [session?.user?.email])

  const handleSave = async (section: keyof Settings) => {
    setIsLoading(true)
    try {
      if (section === 'profile') {
        const email = settings.profile.email.trim()
        if (!email) {
          toast.error('请输入邮箱')
          setIsLoading(false)
          return
        }

        if (settings.profile.newPassword && settings.profile.newPassword !== settings.profile.confirmPassword) {
          toast.error('新密码和确认密码不匹配')
          setIsLoading(false)
          return
        }

        const response = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: 'profile',
            email,
            currentPassword: settings.profile.currentPassword || undefined,
            newPassword: settings.profile.newPassword || undefined,
          })
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(error.error || '保存设置失败')
        }

        toast.success('个人资料已保存')
        setSettings(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            email,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          }
        }))
        return
      }

      if (section === 'site') {
        const response = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: 'site',
            title: settings.site.title,
            description: settings.site.description,
            defaultVisibility: settings.site.defaultVisibility,
            allowPublicAccess: settings.site.allowPublicAccess,
          })
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(error.error || '网站设置保存失败')
        }

        toast.success('网站设置已保存')
        return
      }

      if (section === 'storage') {
        // Save basic storage settings
        const basicResponse = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: 'storage',
            autoDeleteFailed: settings.storage.autoDeleteFailed,
            maxUploadSize: settings.storage.maxUploadSize,
            compressionQuality: settings.storage.compressionQuality,
          })
        })

        if (!basicResponse.ok) {
          const error = await basicResponse.json().catch(() => ({}))
          throw new Error(error.error || '存储设置保存失败')
        }

        // Save image processing strategy settings
        const strategyResponse = await fetch('/api/admin/storage-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageFormats: settings.storage.imageFormats,
            imageVariantNames: settings.storage.imageVariantNames,
          })
        })

        if (!strategyResponse.ok) {
          const error = await strategyResponse.json().catch(() => ({}))
          throw new Error(error.error || '图片处理策略保存失败')
        }

        toast.success('存储设置已保存')
        return
      }

      if (section === 'apis') {
        const response = await fetch('/api/admin/api-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pixabayApiKey: settings.apis.pixabayApiKey
          }),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(error.error || 'API设置保存失败')
        }

        toast.success('API设置已保存')
        return
      }

      if (section === 'runtime') {
        await saveRuntimeConfig()
        return
      }

      throw new Error('未知的设置类型')
    } catch (error) {
      console.error('保存设置失败:', error)
      toast.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setIsLoading(false)
    }
  }

  // Load API settings when component mounts
  const loadApiSettings = async () => {
    try {
      const response = await fetch('/api/admin/api-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({
          ...prev,
          apis: {
            pixabayApiKey: data.pixabayApiKey || ''
          }
        }))
      }
    } catch (error) {
      console.error('加载API设置失败:', error)
    }
  }

  // Load runtime configuration
  const loadRuntimeConfig = async () => {
    try {
      const response = await fetch('/api/admin/runtime-config')
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({
          ...prev,
          runtime: data
        }))
      }
    } catch (error) {
      console.error('加载运行时配置失败:', error)
    }
  }

  // Save runtime configuration
  const saveRuntimeConfig = async () => {
    try {
      const response = await fetch('/api/admin/runtime-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings.runtime),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || '运行时配置保存失败')
      }

      const updatedConfig = await response.json()
      setSettings(prev => ({
        ...prev,
        runtime: updatedConfig
      }))

      toast.success('运行时配置已保存')
    } catch (error) {
      console.error('保存运行时配置失败:', error)
      toast.error(error instanceof Error ? error.message : '保存失败')
    }
  }

  // Load storage strategy settings
  const loadStorageSettings = async () => {
    try {
      const response = await fetch('/api/admin/storage-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({
          ...prev,
          storage: {
            ...prev.storage,
            imageFormats: data.imageFormats || '',
            imageVariantNames: data.imageVariantNames || ''
          }
        }))
      }
    } catch (error) {
      console.error('加载存储设置失败:', error)
    }
  }

  // Load debug configuration
  const loadDebugConfig = async () => {
    try {
      const response = await fetch('/api/admin/debug/config')
      if (response.ok) {
        const data = await response.json()
        setDebugConfig(data)
      }
    } catch (error) {
      console.error('加载配置信息失败:', error)
    }
  }

  // Check PWA status
  const checkPwaStatus = async () => {
    if (typeof window === 'undefined') return

    const status = {
      serviceWorkerSupported: 'serviceWorker' in navigator,
      serviceWorkerRegistered: false,
      serviceWorkerActive: false,
      manifestSupported: 'Notification' in window,
      pwaEnabled: typeof window !== 'undefined' &&
        (document.querySelector('meta[name="theme-color"]') !== null ||
         document.querySelector('link[rel="manifest"]') !== null),
      currentUrl: window.location.origin,
      timestamp: new Date().toISOString()
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          status.serviceWorkerRegistered = true
          status.serviceWorkerActive = !!registration.active
        }
      }
    } catch (error) {
      console.error('检查Service Worker状态失败:', error)
    }

    setPwaStatus(status)
  }

  // Load settings on component mount
  useEffect(() => {
    loadApiSettings()
    loadStorageSettings()
    loadRuntimeConfig()
    loadDebugConfig()
    checkPwaStatus()
  }, [])

  const tabs = [
    { id: 'profile', name: '个人资料', icon: User },
    { id: 'security', name: '安全设置', icon: Shield },
    { id: 'site', name: '网站设置', icon: Globe },
    { id: 'storage', name: '存储设置', icon: Database },
    { id: 'runtime', name: '运行时配置', icon: Database },
    { id: 'apis', name: 'API 配置', icon: Key },
    { id: 'debug', name: '配置检查', icon: Bug }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            设置
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            管理你的账户和网站设置
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map(tab => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <IconComponent className="w-4 h-4" />
                      <span>{tab.name}</span>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    会话管理
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    管理你的登录会话和安全设置
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        当前会话状态
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        您当前已登录。会话将在浏览器关闭或长时间不活动后自动过期。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    安全建议
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          定期更改密码，使用强密码（至少8位，包含字母、数字和特殊字符）
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          在公共设备上使用后及时退出登录
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          保持系统和浏览器的最新版本
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    隐私设置
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          允许搜索引擎索引公开内容
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          如果关闭，将在页面添加 noindex 标签
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          记录访问日志
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          用于安全分析和性能优化
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      profile: { ...prev.profile, email: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    修改密码
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        当前密码
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={settings.profile.currentPassword}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            profile: { ...prev.profile, currentPassword: e.target.value }
                          }))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        >
                          {showPasswords.current ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        新密码
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={settings.profile.newPassword}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            profile: { ...prev.profile, newPassword: e.target.value }
                          }))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        >
                          {showPasswords.new ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        确认新密码
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={settings.profile.confirmPassword}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            profile: { ...prev.profile, confirmPassword: e.target.value }
                          }))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => handleSave('profile')}
                    disabled={isLoading}
                    className="px-6"
                  >
                    {isLoading ? '保存中...' : '保存更改'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'site' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    网站标题
                  </label>
                  <input
                    type="text"
                    value={settings.site.title}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      site: { ...prev.site, title: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    网站描述
                  </label>
                  <textarea
                    value={settings.site.description}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      site: { ...prev.site, description: e.target.value }
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    默认可见性
                  </label>
                  <select
                    value={settings.site.defaultVisibility}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      site: { ...prev.site, defaultVisibility: e.target.value as 'PUBLIC' | 'PRIVATE' }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="PUBLIC">公开</option>
                    <option value="PRIVATE">私密</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowPublicAccess"
                    checked={settings.site.allowPublicAccess}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      site: { ...prev.site, allowPublicAccess: e.target.checked }
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="allowPublicAccess" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    允许未登录用户浏览公开内容
                  </label>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => handleSave('site')}
                    disabled={isLoading}
                    className="px-6"
                  >
                    {isLoading ? '保存中...' : '保存更改'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    最大上传文件大小 (MB)
                  </label>
                  <input
                    type="number"
                    value={settings.storage.maxUploadSize}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      storage: { ...prev.storage, maxUploadSize: parseInt(e.target.value) || 0 }
                    }))}
                    min="1"
                    max="500"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    图片压缩质量 (%)
                  </label>
                  <input
                    type="range"
                    value={settings.storage.compressionQuality}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      storage: { ...prev.storage, compressionQuality: parseInt(e.target.value) }
                    }))}
                    min="10"
                    max="100"
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>压缩率高</span>
                    <span>{settings.storage.compressionQuality}%</span>
                    <span>高质量</span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoDeleteFailed"
                    checked={settings.storage.autoDeleteFailed}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      storage: { ...prev.storage, autoDeleteFailed: e.target.checked }
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoDeleteFailed" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    自动删除上传失败的文件
                  </label>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    图片处理策略
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      生成格式
                    </label>
                    <input
                      type="text"
                      value={settings.storage.imageFormats}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        storage: { ...prev.storage, imageFormats: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="例如：webp,jpeg 或 avif,webp,jpeg"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      逗号分隔，留空表示默认 avif,webp,jpeg。更改会影响后续新处理的图片；已生成的变体不受影响。
                    </p>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      生成尺寸
                    </label>
                    <input
                      type="text"
                      value={settings.storage.imageVariantNames}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        storage: { ...prev.storage, imageVariantNames: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="例如：thumb,small,medium,large"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      逗号分隔，留空表示默认 thumb,small,medium,large。
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-4 mt-4">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      <strong>注意：</strong> 并发与上传并行度（IMG_WORKER_CONCURRENCY / UPLOAD_CONCURRENCY）需通过环境变量配置，修改后重启生效。
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => handleSave('storage')}
                    disabled={isLoading}
                    className="px-6"
                  >
                    {isLoading ? '保存中...' : '保存更改'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'runtime' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    运行时配置
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    配置存储提供商和语义搜索功能，这些设置会立即生效无需重启应用。
                  </p>
                </div>

                {/* Storage Configuration */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    存储配置
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        存储提供商
                      </label>
                      <select
                        value={settings.runtime.storage.provider}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          runtime: {
                            ...prev.runtime,
                            storage: { ...prev.runtime.storage, provider: e.target.value }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="local">本地存储</option>
                        <option value="minio">MinIO</option>
                        <option value="aws">AWS S3</option>
                      </select>
                    </div>

                    {settings.runtime.storage.provider === 'local' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          本地存储路径
                        </label>
                        <input
                          type="text"
                          value={settings.runtime.storage.local.basePath}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            runtime: {
                              ...prev.runtime,
                              storage: {
                                ...prev.runtime.storage,
                                local: { ...prev.runtime.storage.local, basePath: e.target.value }
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="./uploads"
                        />
                      </div>
                    )}

                    {settings.runtime.storage.provider === 'minio' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              MinIO 端点
                            </label>
                            <input
                              type="text"
                              value={settings.runtime.storage.minio.endpoint}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                runtime: {
                                  ...prev.runtime,
                                  storage: {
                                    ...prev.runtime.storage,
                                    minio: { ...prev.runtime.storage.minio, endpoint: e.target.value }
                                  }
                                }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="localhost:9000"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              区域
                            </label>
                            <input
                              type="text"
                              value={settings.runtime.storage.minio.region}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                runtime: {
                                  ...prev.runtime,
                                  storage: {
                                    ...prev.runtime.storage,
                                    minio: { ...prev.runtime.storage.minio, region: e.target.value }
                                  }
                                }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="us-east-1"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            存储桶名称
                          </label>
                          <input
                            type="text"
                            value={settings.runtime.storage.minio.bucket}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              runtime: {
                                ...prev.runtime,
                                storage: {
                                  ...prev.runtime.storage,
                                  minio: { ...prev.runtime.storage.minio, bucket: e.target.value }
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="photos"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              访问密钥
                            </label>
                            <input
                              type="text"
                              value={settings.runtime.storage.minio.accessKeyId}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                runtime: {
                                  ...prev.runtime,
                                  storage: {
                                    ...prev.runtime.storage,
                                    minio: { ...prev.runtime.storage.minio, accessKeyId: e.target.value }
                                  }
                                }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="minio"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              密钥
                            </label>
                            <input
                              type="password"
                              value={settings.runtime.storage.minio.secretAccessKey}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                runtime: {
                                  ...prev.runtime,
                                  storage: {
                                    ...prev.runtime.storage,
                                    minio: { ...prev.runtime.storage.minio, secretAccessKey: e.target.value }
                                  }
                                }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="密钥"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            CDN URL（可选）
                          </label>
                          <input
                            type="text"
                            value={settings.runtime.storage.minio.cdnUrl}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              runtime: {
                                ...prev.runtime,
                                storage: {
                                  ...prev.runtime.storage,
                                  minio: { ...prev.runtime.storage.minio, cdnUrl: e.target.value }
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="https://cdn.example.com"
                          />
                        </div>
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settings.runtime.storage.minio.forcePathStyle}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                runtime: {
                                  ...prev.runtime,
                                  storage: {
                                    ...prev.runtime.storage,
                                    minio: { ...prev.runtime.storage.minio, forcePathStyle: e.target.checked }
                                  }
                                }
                              }))}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              强制路径样式访问
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    {settings.runtime.storage.provider === 'aws' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              AWS 区域
                            </label>
                            <input
                              type="text"
                              value={settings.runtime.storage.aws.region}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                runtime: {
                                  ...prev.runtime,
                                  storage: {
                                    ...prev.runtime.storage,
                                    aws: { ...prev.runtime.storage.aws, region: e.target.value }
                                  }
                                }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="us-east-1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              存储桶名称
                            </label>
                            <input
                              type="text"
                              value={settings.runtime.storage.aws.bucket}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                runtime: {
                                  ...prev.runtime,
                                  storage: {
                                    ...prev.runtime.storage,
                                    aws: { ...prev.runtime.storage.aws, bucket: e.target.value }
                                  }
                                }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="my-photos"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              访问密钥 ID
                            </label>
                            <input
                              type="text"
                              value={settings.runtime.storage.aws.accessKeyId}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                runtime: {
                                  ...prev.runtime,
                                  storage: {
                                    ...prev.runtime.storage,
                                    aws: { ...prev.runtime.storage.aws, accessKeyId: e.target.value }
                                  }
                                }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="AKIA..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              秘密访问密钥
                            </label>
                            <input
                              type="password"
                              value={settings.runtime.storage.aws.secretAccessKey}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                runtime: {
                                  ...prev.runtime,
                                  storage: {
                                    ...prev.runtime.storage,
                                    aws: { ...prev.runtime.storage.aws, secretAccessKey: e.target.value }
                                  }
                                }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="秘密访问密钥"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            CloudFront URL（可选）
                          </label>
                          <input
                            type="text"
                            value={settings.runtime.storage.aws.cdnUrl}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              runtime: {
                                ...prev.runtime,
                                storage: {
                                  ...prev.runtime.storage,
                                  aws: { ...prev.runtime.storage.aws, cdnUrl: e.target.value }
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="https://d123456.cloudfront.net"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Semantic Search Configuration */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    语义搜索配置
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.runtime.semantic.enabled}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            runtime: {
                              ...prev.runtime,
                              semantic: { ...prev.runtime.semantic, enabled: e.target.checked }
                            }
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          启用语义搜索
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                        启用后会在首页显示语义搜索面板，并为新上传的图片生成向量嵌入
                      </p>
                    </div>

                    {settings.runtime.semantic.enabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            嵌入提供商
                          </label>
                          <select
                            value={settings.runtime.semantic.provider}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              runtime: {
                                ...prev.runtime,
                                semantic: { ...prev.runtime.semantic, provider: e.target.value }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="deterministic">确定性嵌入（无需API）</option>
                            <option value="openai">OpenAI</option>
                          </select>
                        </div>

                        {settings.runtime.semantic.provider === 'openai' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                OpenAI API 密钥
                              </label>
                              <input
                                type="password"
                                value={settings.runtime.semantic.openaiApiKey}
                                onChange={(e) => setSettings(prev => ({
                                  ...prev,
                                  runtime: {
                                    ...prev.runtime,
                                    semantic: { ...prev.runtime.semantic, openaiApiKey: e.target.value }
                                  }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="sk-..."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                OpenAI 基础 URL（可选）
                              </label>
                              <input
                                type="text"
                                value={settings.runtime.semantic.openaiBaseUrl}
                                onChange={(e) => setSettings(prev => ({
                                  ...prev,
                                  runtime: {
                                    ...prev.runtime,
                                    semantic: { ...prev.runtime.semantic, openaiBaseUrl: e.target.value }
                                  }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="https://api.openai.com/v1"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  请求限制（每分钟）
                                </label>
                                <input
                                  type="number"
                                  value={settings.runtime.semantic.rpmLimit}
                                  onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    runtime: {
                                      ...prev.runtime,
                                      semantic: { ...prev.runtime.semantic, rpmLimit: parseInt(e.target.value) || 60 }
                                    }
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  placeholder="60"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  最大重试次数
                                </label>
                                <input
                                  type="number"
                                  value={settings.runtime.semantic.maxRetry}
                                  onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    runtime: {
                                      ...prev.runtime,
                                      semantic: { ...prev.runtime.semantic, maxRetry: parseInt(e.target.value) || 3 }
                                    }
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  placeholder="3"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            模式
                          </label>
                          <select
                            value={settings.runtime.semantic.mode}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              runtime: {
                                ...prev.runtime,
                                semantic: { ...prev.runtime.semantic, mode: e.target.value }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="off">关闭</option>
                            <option value="shadow">影子模式（生成但不显示）</option>
                            <option value="on">完全启用</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSave('runtime')}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? '保存中...' : '保存运行时配置'}
                  </Button>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>提示：</strong> 运行时配置更改后会立即生效，无需重启应用。存储配置更改后，新上传的文件会使用新的存储提供商。语义搜索配置更改后，需要重新处理现有图片以生成嵌入向量。
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'apis' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    第三方服务配置
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    配置第三方服务的 API Key，用于导入示例图片等功能。
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pixabay API Key
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={settings.apis.pixabayApiKey}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        apis: { ...prev.apis, pixabayApiKey: e.target.value }
                      }))}
                      placeholder="输入您的 Pixabay API Key"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      用于导入 Pixabay 示例图片。您可以在 
                      <a 
                        href="https://pixabay.com/api/docs/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 underline"
                      >
                        Pixabay API 文档
                      </a> 
                      中获取免费的 API Key。
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => handleSave('apis')}
                    disabled={isLoading}
                    className="px-6"
                  >
                    {isLoading ? '保存中...' : '保存更改'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'debug' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    系统配置检查
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    查看当前系统的环境变量和配置状态，用于调试和故障排除。
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">配置信息</h4>
                    <Button
                      onClick={loadDebugConfig}
                      size="sm"
                      variant="outline"
                    >
                      刷新
                    </Button>
                  </div>

                  {debugConfig ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">运行环境:</span>
                            <span className={`text-sm font-mono px-2 py-1 rounded ${
                              debugConfig.NODE_ENV === 'production'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                              {debugConfig.NODE_ENV}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">存储方式:</span>
                            <span className="text-sm font-mono text-gray-900 dark:text-white">
                              {debugConfig.STORAGE_PROVIDER}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">SEED_TOKEN:</span>
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm font-mono px-2 py-1 rounded ${
                                debugConfig.SEED_TOKEN_SET
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                              }`}>
                                {debugConfig.SEED_TOKEN_VALUE}
                              </span>
                              {!debugConfig.SEED_TOKEN_SET && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  (管理员可直接使用)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">PIXABAY_API_KEY:</span>
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm font-mono px-2 py-1 rounded ${
                                debugConfig.PIXABAY_API_KEY_SET
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                {debugConfig.PIXABAY_API_KEY_VALUE}
                              </span>
                              {debugConfig.PIXABAY_API_KEY_SOURCE && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ({debugConfig.PIXABAY_API_KEY_SOURCE === 'database' ? '数据库' :
                                   debugConfig.PIXABAY_API_KEY_SOURCE === 'environment' ? '环境变量' : '未设置'})
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">最大导入数:</span>
                            <span className="text-sm font-mono text-gray-900 dark:text-white">
                              {debugConfig.SEED_MAX_COUNT}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">检查时间:</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(debugConfig.timestamp).toLocaleString('zh-CN')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          <strong>提示：</strong> 导入示例图片功能已优化为开箱即用。管理员用户可直接使用，只需在 API 配置中设置 PIXABAY_API_KEY 即可。
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500 dark:text-gray-400">
                        点击&quot;刷新&quot;按钮加载配置信息
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">PWA 状态</h4>
                    <Button
                      onClick={checkPwaStatus}
                      size="sm"
                      variant="outline"
                    >
                      检查
                    </Button>
                  </div>

                  {pwaStatus ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">PWA 启用:</span>
                            <span className={`text-sm font-mono px-2 py-1 rounded ${
                              pwaStatus.pwaEnabled
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {pwaStatus.pwaEnabled ? '已启用' : '已禁用'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">SW 支持:</span>
                            <span className={`text-sm font-mono px-2 py-1 rounded ${
                              pwaStatus.serviceWorkerSupported
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {pwaStatus.serviceWorkerSupported ? '支持' : '不支持'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">SW 注册:</span>
                            <span className={`text-sm font-mono px-2 py-1 rounded ${
                              pwaStatus.serviceWorkerRegistered
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {pwaStatus.serviceWorkerRegistered ? '已注册' : '未注册'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">SW 激活:</span>
                            <span className={`text-sm font-mono px-2 py-1 rounded ${
                              pwaStatus.serviceWorkerActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {pwaStatus.serviceWorkerActive ? '已激活' : '未激活'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">通知支持:</span>
                            <span className={`text-sm font-mono px-2 py-1 rounded ${
                              pwaStatus.manifestSupported
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {pwaStatus.manifestSupported ? '支持' : '不支持'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">检查时间:</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(pwaStatus.timestamp).toLocaleString('zh-CN')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                        <p className="text-sm text-green-800 dark:text-green-300">
                          <strong>说明：</strong> PWA功能让应用可以离线使用、添加到主屏幕，并提供原生应用般的体验。
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500 dark:text-gray-400">
                        点击&quot;刷新&quot;按钮加载配置信息
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

