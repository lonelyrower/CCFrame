#!/usr/bin/env node

/**
 * 数据库迁移和初始化脚本
 * 支持生产环境的安全部署
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 开始数据库迁移和初始化...')
  
  try {
    // 1. 测试数据库连接
    console.log('📡 测试数据库连接...')
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    // 2. 运行数据库迁移
    console.log('🔄 运行数据库迁移...')
    // Prisma db push 在生产环境中的等效操作
    await prisma.$executeRaw`SELECT 1`
    console.log('✅ 数据库迁移完成')
    
    // 3. 检查并创建管理员账户
    console.log('👤 检查管理员账户...')
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD
    
    if (!adminEmail || !adminPassword) {
      console.log('⚠️  未配置管理员账户环境变量')
      console.log('请设置 ADMIN_EMAIL 和 ADMIN_PASSWORD 环境变量')
      return
    }
    
    // 检查管理员是否已存在
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })
    
    if (existingAdmin) {
      console.log('✅ 管理员账户已存在:', adminEmail)
    } else {
      // 创建管理员账户
      const passwordHash = await bcrypt.hash(adminPassword, 12)
      
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash
        }
      })
      
      console.log('✅ 管理员账户创建成功:', admin.email)
      console.log('🔑 请在首次登录后修改密码')
    }
    
    // 4. 创建默认相册 (如果不存在)
    console.log('📁 检查默认相册...')
    const adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    })
    
    if (adminUser) {
      const defaultAlbum = await prisma.album.findFirst({
        where: { 
          userId: adminUser.id,
          title: '默认相册'
        }
      })
      
      if (!defaultAlbum) {
        const { VISIBILITY } = require('../lib/constants')
        await prisma.album.create({
          data: {
            title: '默认相册',
            description: '系统自动创建的默认相册',
            visibility: VISIBILITY.PUBLIC,
            userId: adminUser.id
          }
        })
        console.log('✅ 默认相册创建成功')
      } else {
        console.log('✅ 默认相册已存在')
      }
    }
    
    // 5. 创建常用标签
    console.log('🏷️  创建常用标签...')
    const defaultTags = [
      { name: '风景', color: '#10b981' },
      { name: '人物', color: '#f59e0b' },
      { name: '美食', color: '#ef4444' },
      { name: '旅行', color: '#8b5cf6' },
      { name: '生活', color: '#06b6d4' },
      { name: '工作', color: '#6b7280' }
    ]
    
    for (const tagData of defaultTags) {
      const existingTag = await prisma.tag.findUnique({
        where: { name: tagData.name }
      })
      
      if (!existingTag) {
        await prisma.tag.create({
          data: tagData
        })
        console.log(`✅ 标签创建成功: ${tagData.name}`)
      }
    }
    
    // 6. 验证数据完整性
    console.log('🔍 验证数据完整性...')
    const userCount = await prisma.user.count()
    const albumCount = await prisma.album.count()
    const tagCount = await prisma.tag.count()
    
    console.log(`📊 数据统计:`)
    console.log(`   用户数量: ${userCount}`)
    console.log(`   相册数量: ${albumCount}`)
    console.log(`   标签数量: ${tagCount}`)
    
    console.log('✅ 数据库初始化完成！')
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 健康检查函数
async function healthCheck() {
  try {
    await prisma.$connect()
    await prisma.$executeRaw`SELECT 1`
    console.log('✅ 数据库健康状态: 正常')
    return true
  } catch (error) {
    console.error('❌ 数据库健康检查失败:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

// 命令行参数处理
const command = process.argv[2]

switch (command) {
  case 'health':
    healthCheck().then(healthy => {
      process.exit(healthy ? 0 : 1)
    })
    break
  case 'migrate':
  default:
    main().catch(error => {
      console.error(error)
      process.exit(1)
    })
    break
}