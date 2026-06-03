/**
 * 文件名：ecosystem.config.js
 * 作者：DevOps团队
 * 日期：2026-05-20
 * 版本：v1.0.0
 * 功能描述：PM2进程管理配置文件
 */

module.exports = {
  apps: [
    {
      name: 'happy-farm-backend',
      script: './src/server.js',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '60s',
      max_restarts: 10,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:happy-farm/repo.git',
      path: '/var/www/production',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
