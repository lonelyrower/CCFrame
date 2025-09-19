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
  }
  apis: {
    pixabayApiKey: string
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
      compressionQuality: 85
    },
    apis: {
      pixabayApiKey: ''
    }
  })

  const [isLoading, setIsLoading] = useState(false)

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
          toast.error('�������ʼ�')
          setIsLoading(false)
          return
        }

        if (settings.profile.newPassword && settings.profile.newPassword !== settings.profile.confirmPassword) {
          toast.error('�������������������')
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
          throw new Error(error.error || '��������ʧ��')
        }

        toast.success('����������ɹ�')
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
          throw new Error(error.error || '��վ�������ʧ��')
        }

        toast.success('��վ�����ѱ���')
        return
      }

      if (section === 'storage') {
        const response = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: 'storage',
            autoDeleteFailed: settings.storage.autoDeleteFailed,
            maxUploadSize: settings.storage.maxUploadSize,
            compressionQuality: settings.storage.compressionQuality,
          })
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(error.error || '�洢�������ʧ��')
        }

        toast.success('�洢�����ѱ���')
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
          throw new Error(error.error || 'API���ñ���ʧ��')
        }

        toast.success('API�����ѱ���')
        return
      }

      throw new Error('�޷������ô���')
    } catch (error) {
      console.error('��������ʧ��:', error)
      toast.error(error instanceof Error ? error.message : '����ʧ��')
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

  // Load settings on component mount
  useEffect(() => {
    loadApiSettings()
  }, [])

  const tabs = [
    { id: 'profile', name: '个人资料', icon: User },
    { id: 'security', name: '安全设置', icon: Shield },
    { id: 'site', name: '网站设置', icon: Globe },
    { id: 'storage', name: '存储设置', icon: Database },
    { id: 'apis', name: 'API 配置', icon: Key },
    { id: 'storage-strategy', name: '存储策略', icon: Database, href: '/admin/storage-settings' }
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
                if (tab.href) {
                  return (
                    <Link
                      key={tab.id}
                      href={tab.href}
                      className="py-4 px-2 border-b-2 border-transparent font-medium text-sm transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-4 h-4" />
                        <span>{tab.name}</span>
                      </div>
                    </Link>
                  )
                }
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
          </div>
        </div>
      </div>
    </div>
  )
}

