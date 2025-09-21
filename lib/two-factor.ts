import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import { db } from './db'

export interface TwoFactorSetup {
  secret: string
  qrCodeUrl: string
  manualEntryKey: string
}

export class TwoFactorAuth {
  /**
   * 生成2FA设置所需的密钥和二维码
   */
  static async generateSetup(userEmail: string, appName: string = 'CCFrame'): Promise<TwoFactorSetup> {
    const secret = authenticator.generateSecret()
    const keyUri = authenticator.keyuri(userEmail, appName, secret)
    const qrCodeUrl = await QRCode.toDataURL(keyUri)

    return {
      secret,
      qrCodeUrl,
      manualEntryKey: secret
    }
  }

  /**
   * 验证用户输入的2FA码
   */
  static verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret })
    } catch (error) {
      console.error('2FA verification error:', error)
      return false
    }
  }

  /**
   * 为用户启用2FA
   */
  static async enableTwoFactor(userId: string, secret: string): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: { twoFASecret: secret }
    })
  }

  /**
   * 为用户禁用2FA
   */
  static async disableTwoFactor(userId: string): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: { twoFASecret: null }
    })
  }

  /**
   * 检查用户是否启用了2FA
   */
  static async isEnabled(userId: string): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { twoFASecret: true }
    })
    return !!user?.twoFASecret
  }

  /**
   * 获取用户的2FA密钥
   */
  static async getUserSecret(userId: string): Promise<string | null> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { twoFASecret: true }
    })
    return user?.twoFASecret || null
  }
}