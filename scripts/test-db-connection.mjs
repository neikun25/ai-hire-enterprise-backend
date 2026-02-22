#!/usr/bin/env node

/**
 * Open Action - 数据库连接测试脚本
 * 
 * 用途: 测试本地MySQL数据库连接是否正常
 * 使用方法: node scripts/test-db-connection.mjs
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '..', '.env') });

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testConnection() {
  let connection;
  
  try {
    log('\n🔍 开始测试数据库连接...', 'cyan');
    log('━'.repeat(50), 'cyan');
    
    // 检查环境变量
    if (!process.env.DATABASE_URL) {
      log('❌ 错误: DATABASE_URL 环境变量未设置', 'red');
      log('请在 .env 文件中配置 DATABASE_URL', 'yellow');
      process.exit(1);
    }
    
    // 显示连接信息（隐藏密码）
    const maskedUrl = process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@');
    log(`📡 连接字符串: ${maskedUrl}`, 'blue');
    
    // 解析DATABASE_URL
    const url = new URL(process.env.DATABASE_URL);
    const config = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
    };
    
    log(`\n🔌 正在连接到 ${config.host}:${config.port}...`, 'blue');
    
    // 创建连接
    connection = await mysql.createConnection(config);
    
    log('✅ 数据库连接成功！', 'green');
    
    // 测试1: 查询MySQL版本
    log('\n📊 测试1: 查询MySQL版本', 'cyan');
    const [versionRows] = await connection.execute('SELECT VERSION() as version');
    log(`   MySQL版本: ${versionRows[0].version}`, 'green');
    
    // 测试2: 查询数据库名称
    log('\n📊 测试2: 查询当前数据库', 'cyan');
    const [dbRows] = await connection.execute('SELECT DATABASE() as db');
    log(`   当前数据库: ${dbRows[0].db}`, 'green');
    
    // 测试3: 查询表列表
    log('\n📊 测试3: 查询数据库表', 'cyan');
    const [tables] = await connection.execute('SHOW TABLES');
    log(`   表数量: ${tables.length}`, 'green');
    
    if (tables.length > 0) {
      log('   表列表:', 'blue');
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        log(`     ${index + 1}. ${tableName}`, 'blue');
      });
    } else {
      log('   ⚠️  警告: 数据库中没有表，请运行数据库迁移', 'yellow');
      log('   运行命令: pnpm drizzle-kit push', 'yellow');
    }
    
    // 测试4: 查询各表记录数
    if (tables.length > 0) {
      log('\n📊 测试4: 查询各表记录数', 'cyan');
      
      const tableNames = ['users', 'enterprises', 'individuals', 'tasks', 'orders', 'reviews', 'transactions'];
      
      for (const tableName of tableNames) {
        try {
          const [countRows] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
          const count = countRows[0].count;
          log(`   ${tableName}: ${count} 条记录`, count > 0 ? 'green' : 'yellow');
        } catch (error) {
          log(`   ${tableName}: 表不存在`, 'yellow');
        }
      }
    }
    
    // 测试5: 测试写入权限
    log('\n📊 测试5: 测试写入权限', 'cyan');
    try {
      await connection.execute('CREATE TABLE IF NOT EXISTS _test_table (id INT)');
      await connection.execute('DROP TABLE _test_table');
      log('   ✅ 写入权限正常', 'green');
    } catch (error) {
      log('   ❌ 写入权限测试失败', 'red');
      log(`   错误: ${error.message}`, 'red');
    }
    
    // 测试6: 测试字符集
    log('\n📊 测试6: 测试字符集配置', 'cyan');
    const [charsetRows] = await connection.execute(
      "SHOW VARIABLES LIKE 'character_set_database'"
    );
    const charset = charsetRows[0]?.Value || 'unknown';
    log(`   数据库字符集: ${charset}`, charset === 'utf8mb4' ? 'green' : 'yellow');
    
    if (charset !== 'utf8mb4') {
      log('   ⚠️  建议使用 utf8mb4 字符集以支持emoji', 'yellow');
    }
    
    // 总结
    log('\n' + '━'.repeat(50), 'cyan');
    log('✅ 所有测试通过！数据库连接正常', 'green');
    log('━'.repeat(50), 'cyan');
    
    // 提示下一步
    if (tables.length === 0) {
      log('\n💡 下一步操作:', 'cyan');
      log('   1. 运行数据库迁移: pnpm drizzle-kit push', 'blue');
      log('   2. 导入测试数据: mysql -u用户名 -p数据库名 < scripts/seed-data.sql', 'blue');
      log('   3. 启动开发服务器: pnpm dev', 'blue');
    } else {
      log('\n💡 数据库已准备就绪，可以启动开发服务器:', 'cyan');
      log('   pnpm dev', 'blue');
    }
    
    log('');
    
  } catch (error) {
    log('\n❌ 数据库连接失败', 'red');
    log('━'.repeat(50), 'red');
    log(`错误类型: ${error.code || 'UNKNOWN'}`, 'red');
    log(`错误信息: ${error.message}`, 'red');
    
    // 提供解决建议
    log('\n💡 可能的解决方案:', 'yellow');
    
    if (error.code === 'ECONNREFUSED') {
      log('   1. 检查MySQL服务是否启动', 'yellow');
      log('      macOS: brew services start mysql', 'yellow');
      log('      Linux: sudo systemctl start mysql', 'yellow');
      log('      Windows: net start MySQL', 'yellow');
      log('   2. 检查端口是否正确（默认3306）', 'yellow');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      log('   1. 检查用户名和密码是否正确', 'yellow');
      log('   2. 检查用户是否有权限访问数据库', 'yellow');
      log('   3. 尝试重新创建用户并授权', 'yellow');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      log('   1. 检查数据库是否存在', 'yellow');
      log('   2. 创建数据库: CREATE DATABASE open_action;', 'yellow');
    } else {
      log('   1. 检查 .env 文件中的 DATABASE_URL 是否正确', 'yellow');
      log('   2. 确认MySQL服务正常运行', 'yellow');
      log('   3. 查看完整的错误堆栈信息', 'yellow');
    }
    
    log('\n📖 详细配置指南: 查看 MYSQL_LOCAL_SETUP_GUIDE.md', 'cyan');
    log('');
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行测试
testConnection();
