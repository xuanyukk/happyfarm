#!/usr/bin/env node

/**
 * 文件名：setup-env.js
 * 作者：开发者
 * 日期：2026-05-14
 * 版本：v1.0.0
 * 功能描述：交互式环境配置工具，用于生成开发或 Docker 部署的环境配置文件
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

// 配置文件路径
const CONFIG = {
  LOCAL_TEMPLATE: path.join(__dirname, 'backend', '.env.example'),
  DOCKER_TEMPLATE: path.join(__dirname, '.env.docker.example'),
  LOCAL_OUTPUT: path.join(__dirname, 'backend', '.env'),
  DOCKER_OUTPUT: path.join(__dirname, '.env'),
};

// 工具函数
function generateRandomKey(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function backupFile(filePath) {
  if (fileExists(filePath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup.${timestamp}`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`✅ 已备份现有配置文件: ${backupPath}`);
    return backupPath;
  }
  return null;
}

// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// 显示标题
function showTitle() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    🎮 开心农场 环境配置工具                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('\n');
}

// 显示主菜单
async function showMainMenu() {
  console.log('请选择部署方式：\n');
  console.log('  1️⃣  本地开发部署');
  console.log('  2️⃣  Docker 容器部署');
  console.log('  3️⃣  查看当前配置');
  console.log('  4️⃣  退出\n');
  
  const choice = await question('请输入选项 (1-4): ');
  return choice.trim();
}

// 处理本地部署
async function setupLocal() {
  console.log('\n📋 本地开发部署配置\n');
  
  if (!fileExists(CONFIG.LOCAL_TEMPLATE)) {
    console.log('❌ 错误：找不到本地部署模板文件！');
    return;
  }
  
  let templateContent = fs.readFileSync(CONFIG.LOCAL_TEMPLATE, 'utf-8');
  
  // 询问是否自动生成密钥
  const autoGenerate = await question('是否自动生成安全密钥？(Y/n): ');
  
  if (autoGenerate.toLowerCase() !== 'n') {
    console.log('\n🔐 正在生成安全密钥...');
    
    const jwtSecret = generateRandomKey(64);
    const encryptionKey = generateRandomKey(32);
    
    templateContent = templateContent.replace(
      /JWT_SECRET="your_strong_jwt_secret_key_here"/,
      `JWT_SECRET="${jwtSecret}"`
    );
    templateContent = templateContent.replace(
      /ENCRYPTION_KEY="your_strong_encryption_key_here"/,
      `ENCRYPTION_KEY="${encryptionKey}"`
    );
    
    console.log('✅ JWT 密钥已生成');
    console.log('✅ 加密密钥已生成');
  }
  
  // 询问数据库密码
  const dbPassword = await question('\n请输入数据库密码 (默认: your_password_here): ');
  if (dbPassword.trim()) {
    templateContent = templateContent.replace(
      /DB_PASSWORD=your_password_here/g,
      `DB_PASSWORD=${dbPassword.trim()}`
    );
    templateContent = templateContent.replace(
      /DATABASE_URL="postgresql:\/\/用户名:密码@localhost:5432\/happy_farm"/,
      `DATABASE_URL="postgresql://postgres:${dbPassword.trim()}@localhost:5432/happy_farm"`
    );
  }
  
  // 备份现有文件
  backupFile(CONFIG.LOCAL_OUTPUT);
  
  // 写入新配置
  fs.writeFileSync(CONFIG.LOCAL_OUTPUT, templateContent, 'utf-8');
  
  console.log('\n✅ 本地开发环境配置已成功生成！');
  console.log(`📄 配置文件: ${CONFIG.LOCAL_OUTPUT}`);
  console.log('\n💡 下一步：');
  console.log('  1. 检查并修改其他配置项（如需要）');
  console.log('  2. 启动数据库服务');
  console.log('  3. 运行 sql_init/init_db.js 初始化数据库');
  console.log('  4. 在 backend 目录运行 npm start 启动服务\n');
}

// 处理 Docker 部署
async function setupDocker() {
  console.log('\n🐳 Docker 容器部署配置\n');
  
  if (!fileExists(CONFIG.DOCKER_TEMPLATE)) {
    console.log('❌ 错误：找不到 Docker 部署模板文件！');
    return;
  }
  
  let templateContent = fs.readFileSync(CONFIG.DOCKER_TEMPLATE, 'utf-8');
  
  // 询问是否自动生成密钥
  const autoGenerate = await question('是否自动生成安全密钥？(Y/n): ');
  
  if (autoGenerate.toLowerCase() !== 'n') {
    console.log('\n🔐 正在生成安全密钥...');
    
    const jwtSecret = generateRandomKey(64);
    const encryptionKey = generateRandomKey(32);
    
    templateContent = templateContent.replace(
      /JWT_SECRET=your_jwt_secret_key_here/,
      `JWT_SECRET=${jwtSecret}`
    );
    templateContent = templateContent.replace(
      /ENCRYPTION_KEY=your_strong_encryption_key_here/,
      `ENCRYPTION_KEY=${encryptionKey}`
    );
    
    console.log('✅ JWT 密钥已生成');
    console.log('✅ 加密密钥已生成');
  }
  
  // 询问数据库密码
  const dbPassword = await question('\n请输入数据库密码 (默认: happy_farm_password): ');
  if (dbPassword.trim()) {
    templateContent = templateContent.replace(
      /POSTGRES_PASSWORD=happy_farm_password/g,
      `POSTGRES_PASSWORD=${dbPassword.trim()}`
    );
    templateContent = templateContent.replace(
      /DB_PASSWORD=happy_farm_password/g,
      `DB_PASSWORD=${dbPassword.trim()}`
    );
    templateContent = templateContent.replace(
      /DATABASE_URL=postgresql:\/\/happy_farm:happy_farm_password@postgres:5432\/happy_farm/,
      `DATABASE_URL=postgresql://happy_farm:${dbPassword.trim()}@postgres:5432/happy_farm`
    );
  }
  
  // 备份现有文件
  backupFile(CONFIG.DOCKER_OUTPUT);
  
  // 写入新配置
  fs.writeFileSync(CONFIG.DOCKER_OUTPUT, templateContent, 'utf-8');
  
  console.log('\n✅ Docker 部署环境配置已成功生成！');
  console.log(`📄 配置文件: ${CONFIG.DOCKER_OUTPUT}`);
  console.log('\n💡 下一步：');
  console.log('  1. 检查并修改其他配置项（如需要）');
  console.log('  2. 运行 docker-compose up -d 启动所有服务');
  console.log('  3. 等待服务启动完成');
  console.log('  4. 访问 http://localhost:3000 验证服务\n');
}

// 查看当前配置
function showCurrentConfig() {
  console.log('\n📊 当前配置状态：\n');
  
  if (fileExists(CONFIG.LOCAL_OUTPUT)) {
    console.log('✅ 本地开发配置: 存在');
  } else {
    console.log('❌ 本地开发配置: 不存在');
  }
  
  if (fileExists(CONFIG.DOCKER_OUTPUT)) {
    console.log('✅ Docker 部署配置: 存在');
  } else {
    console.log('❌ Docker 部署配置: 不存在');
  }
  
  console.log('\n📁 配置文件位置：');
  console.log(`   本地开发: ${CONFIG.LOCAL_OUTPUT}`);
  console.log(`   Docker 部署: ${CONFIG.DOCKER_OUTPUT}`);
  console.log('\n');
}

// 显示命令行使用说明
function showHelp() {
  console.log('\n📖 使用说明：\n');
  console.log('  交互式模式:');
  console.log('    node setup-env.js\n');
  console.log('  命令行模式:');
  console.log('    node setup-env.js local     - 生成本地开发配置');
  console.log('    node setup-env.js docker    - 生成 Docker 部署配置');
  console.log('    node setup-env.js help      - 显示此帮助信息\n');
  console.log('  选项:');
  console.log('    --no-backup    - 跳过备份现有配置文件');
  console.log('    --auto-key     - 自动生成安全密钥（不询问）\n');
}

// 主函数
async function main() {
  showTitle();
  
  // 检查命令行参数
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const command = args[0].toLowerCase();
    
    if (command === 'local') {
      await setupLocal();
      rl.close();
      return;
    } else if (command === 'docker') {
      await setupDocker();
      rl.close();
      return;
    } else if (command === 'help' || command === '--help' || command === '-h') {
      showHelp();
      rl.close();
      return;
    }
  }
  
  // 交互式模式
  while (true) {
    const choice = await showMainMenu();
    
    switch (choice) {
      case '1':
        await setupLocal();
        break;
      case '2':
        await setupDocker();
        break;
      case '3':
        showCurrentConfig();
        break;
      case '4':
        console.log('\n👋 再见！\n');
        rl.close();
        return;
      default:
        console.log('\n❌ 无效选项，请重新选择！\n');
    }
    
    if (['1', '2', '3'].includes(choice)) {
      const continueChoice = await question('是否继续？(Y/n): ');
      if (continueChoice.toLowerCase() === 'n') {
        console.log('\n👋 再见！\n');
        rl.close();
        return;
      }
      console.log('\n');
    }
  }
}

// 运行主函数
main().catch((error) => {
  console.error('\n❌ 发生错误：', error);
  rl.close();
  process.exit(1);
});
