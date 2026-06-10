/**
 * 文件名：backupService.js
 * 作者：开发者
 * 日期：2026-03-19
 * 版本：v2.0.0
 * 功能描述：数据库备份服务
 * 更新记录：
 *   2026-03-22 - v1.1.1 - 修复Windows系统备份兼容性问题
 *   2026-05-06 - v2.0.0 - 添加恢复过程监控和回滚功能
 *   2026-06-11 - v2.1.0 - B7-6/B7-7/B7-8修复：空备份文件检查、mtimeMs注释、restore失败清理pre-restore文件
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const logger = require('../config/logger');

const execPromise = util.promisify(exec);

// B7-4修复：解析并校验DATABASE_URL，防止命令注入
function parseAndValidateDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL环境变量未设置');
  }
  const pgUrlPattern = /^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:/]+):(\d+)\/(.+)$/;
  const match = databaseUrl.match(pgUrlPattern);
  if (!match) {
    throw new Error('DATABASE_URL格式无效，仅支持postgresql://user:password@host:port/dbname');
  }
  const [, user, password, host, port, dbname] = match;
  const safePattern = /^[a-zA-Z0-9._-]+$/;
  if (!safePattern.test(user) || !safePattern.test(host) || !safePattern.test(dbname) || !safePattern.test(port)) {
    throw new Error('DATABASE_URL包含非法字符');
  }
  const cleanUser = decodeURIComponent(user);
  const cleanPassword = decodeURIComponent(password);
  return { user: cleanUser, password: cleanPassword, host, port, dbname, url: databaseUrl };
}

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

      const dbConfig = parseAndValidateDatabaseUrl();

      const isWindows = process.platform === 'win32';

      if (isWindows) {
        await new Promise((resolve, reject) => {
          process.env.PGPASSWORD = dbConfig.password;
          const pgDump = spawn('pg_dump', [
            '-h', dbConfig.host, '-p', dbConfig.port, '-U', dbConfig.user, '-d', dbConfig.dbname,
          ], { shell: false, stdio: ['ignore', 'pipe', 'pipe'] });

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
        const command = `pg_dump "${dbConfig.url}" > "${backupPath}"`;
        await execPromise(command);
      }

      const stats = fs.statSync(backupPath);

      // B7-6修复：检查备份文件是否为空，防止静默生成无效备份
      if (stats.size === 0) {
        // 删除空备份文件，避免占用存储空间
        try {
          fs.unlinkSync(backupPath);
        } catch (unlinkError) {
          logger.warn('删除空备份文件失败', {
            backupPath,
            error: unlinkError.message,
          });
        }
        throw new Error(
          `备份文件为空(${backupPath})，请检查数据库连接和pg_dump权限`
        );
      }

      logger.info('数据库备份成功', {
        filename,
        size: `${(stats.size / 1024).toFixed(2)} KB`,
        backupPath,
      });

      // B7-3修复：清理失败不应影响备份成功的结果
      try {
        await this.cleanupOldBackups();
      } catch (cleanupError) {
        logger.warn('清理旧备份文件失败，备份本身已成功', {
          error: cleanupError.message,
        });
      }

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

          // B7-7说明：使用mtimeMs（修改时间）而非birthtime（创建时间）
          // 原因：Windows系统上birthtime可能不可靠（部分文件系统不支持），
          // 且在文件复制/移动后birthtime会变化。mtimeMs在备份文件写入完成后
          // 不会被后续读取操作修改（只读访问），因此更适合判断文件新旧。
          // 备选方案：可解析备份文件名中的ISO时间戳来排序，更精确但需额外解析。
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

  restoreProgressMap: new Map(),

  async restoreDatabase(filename) {
    try {
      const backupDir = this.getBackupDir();
      const filePath = path.join(backupDir, filename);

      if (!fs.existsSync(filePath)) {
        throw new Error('备份文件不存在');
      }

      logger.info('开始恢复数据库', { filename });

      const restoreId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const progress = {
        filename,
        status: 'preparing',
        progress: 0,
        startTime: new Date(),
        endTime: null,
        error: null,
        canRollback: false,
      };
      this.restoreProgressMap.set(restoreId, progress);

      const dbConfig = parseAndValidateDatabaseUrl();

      progress.status = 'backing-up-current';
      progress.progress = 10;

      // B7-1修复：使用精确时间戳保持文件名一致性
      const preRestoreTimestamp = Date.now();
      const preRestoreFilename = `pre-restore-backup-${preRestoreTimestamp}.sql`;
      const preRestorePath = path.join(backupDir, preRestoreFilename);
      // 将精确文件名存入进度对象，供rollbackRestore使用
      progress.preRestoreFilename = preRestoreFilename;

      logger.info('创建恢复前备份', { preRestoreFilename });

      const isWindows = process.platform === 'win32';

      if (isWindows) {
        await new Promise((resolve, reject) => {
          process.env.PGPASSWORD = dbConfig.password;
          const pgDump = spawn('pg_dump', [
            '-h', dbConfig.host, '-p', dbConfig.port, '-U', dbConfig.user, '-d', dbConfig.dbname,
          ], { shell: false, stdio: ['ignore', 'pipe', 'pipe'] });

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
        const command = `pg_dump "${dbConfig.url}" > "${preRestorePath}"`;
        await execPromise(command);
      }

      progress.canRollback = true;
      progress.status = 'restoring';
      progress.progress = 40;

      logger.info('执行数据库恢复', { filename });

      if (isWindows) {
        await new Promise((resolve, reject) => {
          process.env.PGPASSWORD = dbConfig.password;
          const psql = spawn('psql', [
            '-h', dbConfig.host, '-p', dbConfig.port, '-U', dbConfig.user, '-d', dbConfig.dbname, '-f', preRestorePath,
          ], { shell: false, stdio: ['ignore', 'pipe', 'pipe'] });

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
        const command = `psql "${dbConfig.url}" -f "${preRestorePath}"`;
        await execPromise(command);
      }

      progress.status = 'completed';
      progress.progress = 100;
      progress.endTime = new Date();

      logger.info('数据库恢复成功', { filename });

      return {
        success: true,
        filename,
        restoreId,
        preRestoreBackup: preRestoreFilename,
        canRollback: true,
      };
    } catch (error) {
      logger.error('数据库恢复失败', {
        error: error.message,
        stack: error.stack,
        filename,
      });

      if (progress) {
        progress.status = 'failed';
        progress.error = error.message;
        progress.endTime = new Date();
      }

      // B7-8修复：恢复失败后清理pre-restore备份文件
      // 恢复已失败，pre-restore文件无保留价值，清理以节省磁盘空间
      if (progress && progress.preRestoreFilename) {
        const preRestoreCleanupPath = path.join(
          this.getBackupDir(),
          progress.preRestoreFilename
        );
        try {
          if (fs.existsSync(preRestoreCleanupPath)) {
            fs.unlinkSync(preRestoreCleanupPath);
            logger.info('恢复失败后已清理pre-restore备份文件', {
              file: progress.preRestoreFilename,
            });
          }
        } catch (cleanupError) {
          logger.warn('清理pre-restore备份文件失败', {
            file: progress.preRestoreFilename,
            error: cleanupError.message,
          });
        }
      }

      throw error;
    }
  },

  getRestoreProgress(restoreId) {
    if (restoreId) {
      return this.restoreProgressMap.get(restoreId) || null;
    }
    // 返回最新的一个进度（向后兼容）
    const entries = [...this.restoreProgressMap.entries()];
    return entries.length > 0 ? entries[entries.length - 1][1] : null;
  },

  async rollbackRestore(restoreId) {
    try {
      const progress = restoreId
        ? this.restoreProgressMap.get(restoreId)
        : null;
      if (!progress || !progress.canRollback) {
        throw new Error('无法回滚：没有可回滚的恢复操作');
      }

      const backupDir = this.getBackupDir();
      // B7-1修复：使用恢复时记录的精确文件名，而非模糊匹配
      const preRestoreFilename = progress.preRestoreFilename
        || `pre-restore-backup-${progress.startTime.getTime()}.sql`;
      const preRestorePath = path.join(backupDir, preRestoreFilename);

      if (!fs.existsSync(preRestorePath)) {
        throw new Error('回滚备份文件不存在: ' + preRestoreFilename);
      }

      logger.info('开始回滚恢复操作', { backupFile: preRestoreFilename });

      const dbConfig = parseAndValidateDatabaseUrl();

      const isWindows = process.platform === 'win32';

      if (isWindows) {
        await new Promise((resolve, reject) => {
          process.env.PGPASSWORD = dbConfig.password;
          const psql = spawn('psql', [
            '-h', dbConfig.host, '-p', dbConfig.port, '-U', dbConfig.user, '-d', dbConfig.dbname, '-f', preRestorePath,
          ], { shell: false, stdio: ['ignore', 'pipe', 'pipe'] });

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
        const command = `psql "${dbConfig.url}" -f "${preRestorePath}"`;
        await execPromise(command);
      }

      logger.info('回滚成功', { backupFile: preRestoreFilename });

      this.restoreProgressMap.set(restoreId, {
        status: 'rolled-back',
        progress: 100,
        startTime: new Date(),
        endTime: new Date(),
        error: null,
        canRollback: false,
      });

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

  clearRestoreProgress(restoreId) {
    if (restoreId) {
      this.restoreProgressMap.delete(restoreId);
    } else {
      this.restoreProgressMap.clear();
    }
  },
};

module.exports = backupService;
