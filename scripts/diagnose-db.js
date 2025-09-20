const { PrismaClient } = require('@prisma/client')

async function diagnoseDatabase() {
  console.log('🔍 诊断数据库连接问题...\n')

  // 检查环境变量
  console.log('1. 检查环境变量:')
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✓ 已配置' : '✗ 未配置'}`)

  if (!process.env.DATABASE_URL) {
    console.log('\n❌ DATABASE_URL 未配置')
    console.log('请设置 DATABASE_URL 环境变量')
    return
  }

  console.log(`   连接字符串: ${process.env.DATABASE_URL}\n`)

  // 尝试连接数据库
  console.log('2. 尝试连接数据库:')
  const prisma = new PrismaClient()

  try {
    await prisma.$connect()
    console.log('   ✓ 数据库连接成功')

    // 检查表是否存在
    console.log('\n3. 检查数据库表:')
    try {
      const userCount = await prisma.user.count()
      console.log(`   ✓ users 表存在，记录数: ${userCount}`)

      const photoCount = await prisma.photo.count()
      console.log(`   ✓ photos 表存在，记录数: ${photoCount}`)

      const albumCount = await prisma.album.count()
      console.log(`   ✓ albums 表存在，记录数: ${albumCount}`)

      const tagCount = await prisma.tag.count()
      console.log(`   ✓ tags 表存在，记录数: ${tagCount}`)

      console.log('\n✅ 数据库配置正常!')

    } catch (tableError) {
      console.log('   ✗ 数据库表不存在或有问题')
      console.log('   错误:', tableError.message)
      console.log('\n💡 建议运行数据库迁移:')
      console.log('   npx prisma migrate deploy')
      console.log('   或 npx prisma db push')
    }

  } catch (connectionError) {
    console.log('   ✗ 数据库连接失败')
    console.log('   错误:', connectionError.message)

    if (connectionError.message.includes('database') && connectionError.message.includes('does not exist')) {
      console.log('\n💡 数据库不存在，需要创建:')
      console.log('   1. 连接到 PostgreSQL: psql -h localhost -U postgres')
      console.log('   2. 创建数据库: CREATE DATABASE ccframe_db;')
      console.log('   3. 创建用户: CREATE USER ccframe_user WITH PASSWORD \'ccframe_password\';')
      console.log('   4. 授权: GRANT ALL PRIVILEGES ON DATABASE ccframe_db TO ccframe_user;')
    }

    if (connectionError.message.includes('authentication failed')) {
      console.log('\n💡 认证失败，检查用户名/密码')
    }

    if (connectionError.message.includes('connection refused')) {
      console.log('\n💡 连接被拒绝，检查:')
      console.log('   1. PostgreSQL 服务是否运行')
      console.log('   2. 端口 5432 是否正确')
      console.log('   3. 主机地址是否正确')
    }
  } finally {
    await prisma.$disconnect()
  }
}

diagnoseDatabase().catch(console.error)