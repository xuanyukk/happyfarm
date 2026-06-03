/**
 * 文件名：migrate-exp-fields.js
 * 作者：开发者
 * 日期：2026-03-24
 * 版本：v1.0.0
 * 功能描述：执行数据库迁移，添加农场经验和世界经验字段
 */

const pool = require('../../backend/src/config/db');
const logger = require('../../backend/src/config/logger');

async function migrateExpFields() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    logger.info('开始执行数据库迁移：添加农场经验和世界经验字段');

    // 检查字段是否存在
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'player_base' 
        AND column_name IN ('farm_exp', 'world_exp')
    `);

    const existingColumns = checkResult.rows.map(row => row.column_name);
    logger.info('当前已存在的字段:', existingColumns);

    // 添加农场经验字段（如果不存在）
    if (!existingColumns.includes('farm_exp')) {
      await client.query(`
        ALTER TABLE player_base ADD COLUMN farm_exp BIGINT DEFAULT 0
      `);
      await client.query(`
        COMMENT ON COLUMN player_base.farm_exp IS '农场经验值'
      `);
      logger.info('成功添加 farm_exp 字段');
    } else {
      logger.info('farm_exp 字段已存在，跳过添加');
    }

    // 添加世界经验字段（如果不存在）
    if (!existingColumns.includes('world_exp')) {
      await client.query(`
        ALTER TABLE player_base ADD COLUMN world_exp BIGINT DEFAULT 0
      `);
      await client.query(`
        COMMENT ON COLUMN player_base.world_exp IS '世界经验值'
      `);
      logger.info('成功添加 world_exp 字段');
    } else {
      logger.info('world_exp 字段已存在，跳过添加');
    }

    // 确保现有玩家的经验值不为 NULL
    await client.query(`
      UPDATE player_base SET farm_exp = 0 WHERE farm_exp IS NULL
    `);
    await client.query(`
      UPDATE player_base SET world_exp = 0 WHERE world_exp IS NULL
    `);

    await client.query('COMMIT');
    logger.info('数据库迁移成功完成！');

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('数据库迁移失败', { error: error.message, stack: error.stack });
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

migrateExpFields()
  .then(() => {
    logger.info('迁移脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('迁移脚本执行失败', { error: error.message });
    process.exit(1);
  });
