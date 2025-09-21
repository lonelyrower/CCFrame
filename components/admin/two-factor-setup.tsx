'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, ShieldCheck, ShieldX, Copy, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

interface TwoFactorStatus {
  enabled: boolean
  message: string
}

interface TwoFactorSetup {
  qrCodeUrl: string
  manualEntryKey: string
  secret: string
}

export function TwoFactorSetup() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null)
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')
  const [showManualKey, setShowManualKey] = useState(false)
  const [isSetupMode, setIsSetupMode] = useState(false)

  // 加载2FA状态
  const loadStatus = async () => {
    try {
      const response = await fetch('/api/admin/two-factor/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to load 2FA status:', error)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  // 开始设置2FA
  const startSetup = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/two-factor/setup', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setSetup(data)
        setIsSetupMode(true)
      } else {
        const error = await response.json()
        toast.error(error.error || '设置失败')
      }
    } catch (error) {
      toast.error('网络错误')
    } finally {
      setLoading(false)
    }
  }

  // 启用2FA
  const enableTwoFactor = async () => {
    if (!setup || !token) {
      toast.error('请输入验证码')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/two-factor/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: setup.secret,
          token: token.replace(/\s/g, '') // 移除空格
        })
      })

      if (response.ok) {
        toast.success('双重认证已启用！')
        setIsSetupMode(false)
        setSetup(null)
        setToken('')
        await loadStatus()
      } else {
        const error = await response.json()
        toast.error(error.error || '启用失败')
      }
    } catch (error) {
      toast.error('网络错误')
    } finally {
      setLoading(false)
    }
  }

  // 禁用2FA
  const disableTwoFactor = async () => {
    if (!token) {
      toast.error('请输入验证码')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/two-factor/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.replace(/\s/g, '')
        })
      })

      if (response.ok) {
        toast.success('双重认证已禁用')
        setToken('')
        await loadStatus()
      } else {
        const error = await response.json()
        toast.error(error.error || '禁用失败')
      }
    } catch (error) {
      toast.error('网络错误')
    } finally {
      setLoading(false)
    }
  }

  // 复制密钥
  const copyManualKey = () => {
    if (setup) {
      navigator.clipboard.writeText(setup.manualEntryKey)
      toast.success('密钥已复制到剪贴板')
    }
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 状态显示 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            双重认证 (2FA)
          </CardTitle>
          <CardDescription>
            增强账户安全性，防止未授权访问
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status.enabled ? (
                <ShieldCheck className="h-5 w-5 text-green-600" />
              ) : (
                <ShieldX className="h-5 w-5 text-gray-400" />
              )}
              <span>{status.message}</span>
            </div>
            <Badge variant={status.enabled ? 'default' : 'secondary'}>
              {status.enabled ? '已启用' : '未启用'}
            </Badge>
          </div>

          {!status.enabled && !isSetupMode && (
            <Button onClick={startSetup} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              启用双重认证
            </Button>
          )}

          {status.enabled && (
            <div className="space-y-4 pt-4 border-t">
              <Alert>
                <AlertDescription>
                  要禁用双重认证，请输入您的认证器应用中的当前验证码。
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Input
                  placeholder="输入6位验证码"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  maxLength={6}
                  className="max-w-[200px]"
                />
                <Button
                  variant="destructive"
                  onClick={disableTwoFactor}
                  disabled={loading || token.length !== 6}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  禁用2FA
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 设置流程 */}
      {isSetupMode && setup && (
        <Card>
          <CardHeader>
            <CardTitle>设置双重认证</CardTitle>
            <CardDescription>
              扫描二维码或手动输入密钥到您的认证器应用中
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 二维码 */}
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <Image
                  src={setup.qrCodeUrl}
                  alt="2FA QR Code"
                  width={200}
                  height={200}
                  className="block"
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                使用 Google Authenticator、Authy 或其他TOTP应用扫描此二维码
              </p>
            </div>

            {/* 手动输入密钥 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">手动输入密钥：</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManualKey(!showManualKey)}
                >
                  {showManualKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {showManualKey && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <code className="flex-1 text-sm font-mono break-all">
                    {setup.manualEntryKey}
                  </code>
                  <Button variant="ghost" size="sm" onClick={copyManualKey}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* 验证码输入 */}
            <div className="space-y-4 pt-4 border-t">
              <Alert>
                <AlertDescription>
                  设置完成后，请输入认证器应用显示的6位验证码以启用双重认证。
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Input
                  placeholder="输入6位验证码"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  maxLength={6}
                  className="max-w-[200px]"
                />
                <Button
                  onClick={enableTwoFactor}
                  disabled={loading || token.length !== 6}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  启用2FA
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSetupMode(false)
                    setSetup(null)
                    setToken('')
                  }}
                >
                  取消
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}