/**
 * 文件名：backupService.js
 * 作者：开发者
 * 日期：2026-03-19
 * 版本：v2.0.0
 * 功能描述：数据库备份服务
 * 更新记录：
 *   2026-03-22 - v1.1.1 - 修复Windows系统备份兼容性问题
 *   2026-05-06 - v2.0.0 - 添加恢复过程监控和回滚功能
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const logger = require('../config/logger');

const execPromise = util.promisify(exec);

const backupService = {
  getBackupDir() {
    const backupDir = path.join(__dirname, '../../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    return backupDir;
  },

  generateBackupFilename() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    return `happy_farm_backup_${timestamp}.sql`;
  },

  async createBackup() {
    try {
      const backupDir = this.getBackupDir();
      const filename = this.generateBackupFilename();
      const backupPath = path.join(backupDir, filename);

      logger.info('开始数据库备份', { backupPath });

      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL环境变量未设置');
      }

      const isWindows = process.platform === 'win32';

      if (isWindows) {
        await new Promise((resolve, reject) => {
          const pgDump = spawn('pg_dump', [databaseUrl], {
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe'],
          });

          const writeStream = fs.createWriteStream(backupPath);
          pgDump.stdout.pipe(writeStream);

          let stderr = '';
          pgDump.stderr.on('data', (data) => {
            stderr += data.toString();
          });

          pgDump.on('close', (code) => {
            writeStream.end();
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`pg_dump failed with code ${code}: ${stderr}`));
            }
          });

          pgDump.on('error', (err) => {
            writeStream.end();
            reject(err);
          });
        });
      } else {
        const command = `pg_dump "${databaseUrl}" > "${backupPath}"`;
        await execPromise(command);
      }

      const stats = fs.statSync(backupPath);
      logger.info('数据库备份成功', {
        filename,
        size: `${(stats.size / 1024).toFixed(2)} KB`,
        backupPath,
      });

      await this.cleanupOldBackups();

      return {
        success: true,
        filename,
        backupPath,
        size: stats.size,
      };
    } catch (error) {
      logger.error('数据库备份失败', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  async cleanupOldBackups(daysToKeep = 7) {
    try {
      const backupDir = this.getBackupDir();
      const files = fs.readdirSync(backupDir);
      const now = Date.now();
      const cutoff = now - daysToKeep * 24 * 60 * 60 * 1000;

      let deletedCount = 0;

      for (const file of files) {
        if (file.startsWith('happy_farm_backup_') && file.endsWith('.sql')) {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);

          if (stats.mtimeMs < cutoff) {
            fs.unlinkSync(filePath);
            deletedCount++;
            logger.info('删除旧备份文件', { file });
          }
        }
      }

      if (deletedCount > 0) {
        logger.info('旧备份清理完成', { deletedCount });
      }

      return deletedCount;
    } catch (error) {
      logger.error('清理旧备份失败', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  listBackups() {
    try {
      const backupDir = this.getBackupDir();
      const files = fs.readdirSync(backupDir);

      const backups = files
        .filter(
          (file) =>
            file.startsWith('happy_farm_backup_') && file.endsWith('.sql')
        )
        .map((file) => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            path: filePath,
            size: stats.size,
            sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`,
            createdAt: stats.mtime,
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);

      return backups;
    } catch (error) {
      logger.error('列出备份文件失败', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  restoreProgress: null,

  async restoreDatabase(filename) {
    try {
      const backupDir = this.getBackupDir();
      const filePath = path.join(backupDir, filename);

      if (!fs.existsSync(filePath)) {
        throw new Error('备份文件不存在');
      }

      logger.info('开始恢复数据库', { filename });

      this.restoreProgress = {
        filename,
        status: 'preparing',
        progress: 0,
        startTime: new Date(),
        endTime: null,
        error: null,
        canRollback: false,
      };

      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL环境变量未设置');
      }

      this.restoreProgress.status = 'backing-up-current';
      this.restoreProgress.progress = 10;

      const preRestoreFilename = `pre-restore-backup-${Date.now()}.sql`;
      const preRestorePath = path.join(backupDir, preRestoreFilename);

      logger.info('创建恢复前备份', { preRestoreFilename });

      const isWindows = process.platform === 'win32';

      if (isWindows) {
        await new Promise((resolve, reject) => {
          const pgDump = spawn('pg_dump', [databaseUrl], {
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe'],
          });

          const writeStream = fs.createWriteStream(preRestorePath);
          pgDump.stdout.pipe(writeStream);

          let stderr = '';
          pgDump.stderr.on('data', (data) => {
            stderr += data.toString();
          });

          pgDump.on('close', (code) => {
            writeStream.end();
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`pg_dump failed with code ${code}: ${stderr}`));
            }
          });

          pgDump.on('error', (err) => {
            writeStream.end();
            reject(err);
          });
        });
      } else {
        const command = `pg_dump "${databaseUrl}" > "${preRestorePath}"`;
        await execPromise(command);
      }

      this.restoreProgress.canRollback = true;
      this.restoreProgress.status = 'restoring';
      this.restoreProgress.progress = 40;

      logger.info('执行数据库恢复', { filename });

      if (isWindows) {
        await new Promise((resolve, reject) => {
          const psql = spawn('psql', [databaseUrl, '-f', filePath], {
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe'],
          });

          let stderr = '';
          psql.stderr.on('data', (data) => {
            stderr += data.toString();
          });

          psql.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`psql failed with code ${code}: ${stderr}`));
            }
          });

          psql.on('error', (err) => {
            reject(err);
          });
        });
      } else {
        const command = `psql "${databaseUrl}" -f "${filePath}"`;
        await execPromise(command);
      }

      this.restoreProgress.status = 'completed';
      this.restoreProgress.progress = 100;
      this.restoreProgress.endTime = new Date();

      logger.info('数据库恢复成功', { filename });

      return {
        success: true,
        filename,
        preRestoreBackup: preRestoreFilename,
        canRollback: true,
      };
    } catch (error) {
      logger.error('数据库恢复失败', {
        error: error.message,
        stack: error.stack,
        filename,
      });

      if (this.restoreProgress) {
        this.restoreProgress.status = 'failed';
        this.restoreProgress.error = error.message;
        this.restoreProgress.endTime = new Date();
      }

      throw error;
    }
  },

  getRestoreProgress() {
    return this.restoreProgress;
  },

  async rollbackRestore() {
    try {
      if (!this.restoreProgress || !this.restoreProgress.canRollback) {
        throw new Error('无法回滚：没有可回滚的恢复操作');
      }

      const backupDir = this.getBackupDir();
      const preRestoreFilename = `pre-restore-backup-${this.restoreProgress.startTime.getTime()}.sql`;
      const preRestorePath = path.join(backupDir, preRestoreFilename);

      const files = fs.readdirSync(backupDir);
      const actualFile = files.find((f) => f.startsWith('pre-restore-backup-'));

      if (!actualFile || !fs.existsSync(path.join(backupDir, actualFile))) {
        throw new Error('回滚备份文件不存在');
      }

      const filePath = path.join(backupDir, actualFile);

      logger.info('开始回滚恢复操作', { backupFile: actualFile });

      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL环境变量未设置');
      }

      const isWindows = process.platform === 'win32';

      if (isWindows) {
        await new Promise((resolve, reject) => {
          const psql = spawn('psql', [databaseUrl, '-f', filePath], {
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe'],
          });

          let stderr = '';
          psql.stderr.on('data', (data) => {
            stderr += data.toString();
          });

          psql.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`psql failed with code ${code}: ${stderr}`));
            }
          });

          psql.on('error', (err) => {
            reject(err);
          });
        });
      } else {
        const command = `psql "${databaseUrl}" -f "${filePath}"`;
        await execPromise(command);
      }

      logger.info('回滚成功', { backupFile: actualFile });

      this.restoreProgress = {
        status: 'rolled-back',
        progress: 100,
        startTime: new Date(),
        endTime: new Date(),
        error: null,
        canRollback: false,
      };

      return {
        success: true,
        message: '回滚成功',
      };
    } catch (error) {
      logger.error('回滚失败', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  clearRestoreProgress() {
    this.restoreProgress = null;
  },
};

module.exports = backupService;
