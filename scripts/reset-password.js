#!/usr/bin/env node
/**
 * 密码重置脚本
 * 
 * 使用方法:
 *   node scripts/reset-password.js <email> <new-password>
 *   
 * 示例:
 *   node scripts/reset-password.js admin@example.com newpassword123
 *   
 * 或者通过环境变量:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=newpassword123 node scripts/reset-password.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // 支持命令行参数或环境变量
  const email = process.argv[2] || process.env.ADMIN_EMAIL;
  const newPassword = process.argv[3] || process.env.ADMIN_PASSWORD;

  if (!email || !newPassword) {
    console.error('');
    console.error('❌ 错误: 缺少必要参数');
    console.error('');
    console.error('使用方法:');
    console.error('  node scripts/reset-password.js <email> <new-password>');
    console.error('');
    console.error('示例:');
    console.error('  node scripts/reset-password.js admin@example.com myNewPassword123');
    console.error('');
    console.error('或者通过环境变量:');
    console.error('  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=newpassword123 node scripts/reset-password.js');
    console.error('');
    process.exit(1);
  }

  // 密码强度检查
  if (newPassword.length < 8) {
    console.error('❌ 错误: 密码至少需要8个字符');
    process.exit(1);
  }

  try {
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ 错误: 用户 "${email}" 不存在`);
      console.error('');
      
      // 列出所有用户
      const users = await prisma.user.findMany({
        select: { email: true, createdAt: true },
      });
      
      if (users.length > 0) {
        console.log('现有用户:');
        users.forEach((u) => {
          console.log(`  - ${u.email} (创建于 ${u.createdAt.toLocaleDateString()})`);
        });
      } else {
        console.log('系统中没有任何用户，请先运行 seed-admin.js 创建管理员');
      }
      
      process.exit(1);
    }

    // 生成新密码哈希
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // 更新密码
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    console.log('');
    console.log('✅ 密码重置成功！');
    console.log('');
    console.log(`   用户: ${email}`);
    console.log(`   新密码: ${'*'.repeat(newPassword.length)}`);
    console.log('');
    console.log('请使用新密码登录管理后台。');
    console.log('');

  } catch (error) {
    console.error('❌ 密码重置失败:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
