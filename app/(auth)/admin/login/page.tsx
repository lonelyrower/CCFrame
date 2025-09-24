'use client'

import { useState, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Camera, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

// Force dynamic rendering to prevent prerender errors
export const dynamic = 'force-dynamic'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/admin'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        twoFactorCode: requiresTwoFactor ? twoFactorCode : undefined,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === '2FA_REQUIRED') {
          setRequiresTwoFactor(true)
          toast.error('请输入双重认证验证码')
        } else if (result.error === 'INVALID_2FA_CODE') {
          toast.error('双重认证验证码无效')
        } else {
          toast.error('用户名或密码错误')
        }
      } else {
        toast.success('登录成功')

        // Wait for session to be established
        await new Promise(resolve => setTimeout(resolve, 100))
        const session = await getSession()

        if (session) {
          router.push(callbackUrl)
          router.refresh()
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('登录失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-canvas px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-full">
              <Camera className="h-8 w-8 text-text-inverted" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-text-primary">
            管理员登录
          </h2>
          <p className="mt-2 text-sm text-text-secondary">登录后可管理你的相册</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              邮箱
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="relative block w-full px-3 py-2 border border-surface-outline/60 placeholder:text-text-muted text-text-primary rounded-md focus:outline-none focus:ring-primary focus:border-primary bg-surface-panel"
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="sr-only">
              密码
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className="relative block w-full px-3 py-2 pr-10 border border-surface-outline/60 placeholder:text-text-muted text-text-primary rounded-md focus:outline-none focus:ring-primary focus:border-primary bg-surface-panel"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-text-muted" />
              ) : (
                <Eye className="h-5 w-5 text-text-muted" />
              )}
            </button>
          </div>

          {requiresTwoFactor && (
            <div>
              <label htmlFor="twoFactorCode" className="sr-only">
                双重认证验证码
              </label>
              <input
                id="twoFactorCode"
                name="twoFactorCode"
                type="text"
                autoComplete="one-time-code"
                required={requiresTwoFactor}
                maxLength={6}
                className="relative block w-full px-3 py-2 border border-surface-outline/60 placeholder:text-text-muted text-text-primary rounded-md focus:outline-none focus:ring-primary focus:border-primary bg-surface-panel text-center tracking-widest"
                placeholder="000000"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
              />
              <p className="mt-1 text-xs text-text-muted text-center">
                请输入认证器应用中的6位验证码
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || (requiresTwoFactor && twoFactorCode.length !== 6)}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                登录中...
              </>
            ) : (
              '登录'
            )}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            ← 返回相册
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-canvas px-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-text-secondary">加载中...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
