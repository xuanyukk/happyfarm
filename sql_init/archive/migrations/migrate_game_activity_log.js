/**
 * 文件名：migrate_game_activity_log.js
 * 作者：开发者
 * 日期：2026-03-26
 * 版本：v1.0.0
 * 功能描述：执行游戏活动日志表创建的迁移脚本
 */

const fs = require("fs");
const path = require("path");
const pool = require("../../backend/src/config/db");
const logger = require("../../backend/src/config/logger");

async function migrateGameActivityLog() {
  const client = await pool.connect();
  
  try {
    logger.info("开始执行游戏活动日志表迁移...");
    
    const sqlPath = path.join(__dirname, "010_create_game_activity_log_table.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    
    for (const statement of statements) {
      try {
        await client.query(statement);
        logger.debug("执行SQL成功", { statement: statement.substring(0, 100) + "..." });
      } catch (err) {
        if (
          err.message.includes("already exists") ||
          err.message.includes("duplicate key")
        ) {
          logger.debug("对象已存在，跳过", { statement: statement.substring(0, 50) });
        } else {
          throw err;
        }
      }
    }
    
    logger.info("游戏活动日志表迁移完成！");
  } catch (error) {
    logger.error("游戏活动日志表迁移失败", { error: error.message, stack: error.stack });
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateGameActivityLog()
    .then(() => {
      logger.info("迁移脚本执行完毕");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("迁移脚本执行失败", { error: error.message });
      process.exit(1);
    });
}

module.exports = migrateGameActivityLog;
