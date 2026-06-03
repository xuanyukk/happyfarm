/**
 * 文件名：dataWarehouseService.js
 * 作者：Trae AI
 * 日期：2026-05-09
 * 版本：v1.0.0
 * 功能描述：数据仓库服务 - 提供数据分析和BI报表功能
 * 更新记录：
 *   2026-05-09 - v1.0.0 - 初始版本创建
 */

const db = require('../config/db');
const logger = require('../config/logger');

class DataWarehouseService {
  constructor() {
    this.ETLIntervalId = null;
  }

  /**
   * 启动ETL数据抽取进程
   * @param {number} intervalMs - 抽取间隔（毫秒），默认每天凌晨2点
   */
  startETLProcess(intervalMs = 24 * 60 * 60 * 1000) {
    if (this.ETLIntervalId) {
      logger.warn('ETL进程已经在运行中');
      return;
    }

    logger.info('启动数据仓库ETL进程', { interval: `${intervalMs}ms` });

    this.runDailyETL();
    this.ETLIntervalId = setInterval(() => {
      this.runDailyETL();
    }, intervalMs);
  }

  /**
   * 停止ETL数据抽取进程
   */
  stopETLProcess() {
    if (this.ETLIntervalId) {
      clearInterval(this.ETLIntervalId);
      this.ETLIntervalId = null;
      logger.info('停止数据仓库ETL进程');
    }
  }

  /**
   * 运行每日ETL任务
   */
  async runDailyETL() {
    try {
      logger.info('开始执行每日ETL任务');

      await Promise.all([
        this.refreshPlayerDimension(),
        this.refreshCropDimension(),
        this.loadDailyActivePlayers(),
        this.loadDailyTransactions(),
        this.loadCropPlantingData(),
        this.loadDailyRevenueData(),
      ]);

      logger.info('每日ETL任务执行完成');
    } catch (error) {
      logger.error('执行每日ETL任务失败', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * 刷新玩家维度数据
   */
  async refreshPlayerDimension() {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      await client.query(`
        INSERT INTO dim_player (
          player_id, username, registration_date, player_level, 
          farm_level, is_vip, vip_level, last_login_date, create_time, update_time
        )
        SELECT 
          p.player_id,
          p.username,
          p.created_at::DATE AS registration_date,
          p.world_level AS player_level,
          p.farm_level,
          FALSE AS is_vip,
          0 AS vip_level,
          p.last_login::DATE AS last_login_date,
          CURRENT_TIMESTAMP AS create_time,
          CURRENT_TIMESTAMP AS update_time
        FROM player_base p
        ON CONFLICT (player_id) DO UPDATE SET
          username = EXCLUDED.username,
          player_level = EXCLUDED.player_level,
          farm_level = EXCLUDED.farm_level,
          last_login_date = EXCLUDED.last_login_date,
          update_time = CURRENT_TIMESTAMP
      `);

      await client.query('COMMIT');
      logger.info('玩家维度数据刷新完成');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('刷新玩家维度数据失败', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 刷新作物维度数据
   */
  async refreshCropDimension() {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      await client.query(`
        INSERT INTO dim_crop (
          crop_id, crop_name, crop_type, crop_rarity, 
          base_growth_time, base_yield, base_sell_price, 
          unlock_level, is_seasonal, season, create_time
        )
        SELECT 
          c.crop_id,
          c.crop_name,
          c.crop_type,
          c.quality AS crop_rarity,
          c.growth_time AS base_growth_time,
          c.yield_min AS base_yield,
          c.sell_price AS base_sell_price,
          c.unlock_level,
          FALSE AS is_seasonal,
          NULL AS season,
          CURRENT_TIMESTAMP AS create_time
        FROM crop c
        ON CONFLICT (crop_id) DO UPDATE SET
          crop_name = EXCLUDED.crop_name,
          base_growth_time = EXCLUDED.base_growth_time,
          base_yield = EXCLUDED.base_yield,
          base_sell_price = EXCLUDED.base_sell_price
      `);

      await client.query('COMMIT');
      logger.info('作物维度数据刷新完成');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('刷新作物维度数据失败', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 加载日活跃玩家数据
   */
  async loadDailyActivePlayers() {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      await client.query(`
        INSERT INTO fact_daily_active_players (
          date_id, player_id, login_count, plant_count, harvest_count, 
          sell_count, total_revenue, total_expense, is_new_player, create_time
        )
        SELECT 
          d.date_id,
          p.player_id,
          1 AS login_count,
          COUNT(CASE WHEN gal.activity_type = 'plant' THEN 1 END) AS plant_count,
          COUNT(CASE WHEN gal.activity_type = 'harvest' THEN 1 END) AS harvest_count,
          COUNT(CASE WHEN gal.activity_type = 'buy' OR gal.activity_type = 'sell' THEN 1 END) AS sell_count,
          0 AS total_revenue,
          0 AS total_expense,
          CASE WHEN p.created_at::DATE = '${yesterdayStr}' THEN TRUE ELSE FALSE END AS is_new_player,
          CURRENT_TIMESTAMP AS create_time
        FROM game_activity_log gal
        JOIN player_base p ON gal.player_id = p.player_id
        JOIN dim_date d ON gal.create_time::DATE = d.full_date
        WHERE gal.create_time::DATE = '${yesterdayStr}'
        GROUP BY d.date_id, p.player_id, p.created_at::DATE
        ON CONFLICT (date_id, player_id) DO UPDATE SET
          login_count = EXCLUDED.login_count,
          plant_count = EXCLUDED.plant_count,
          harvest_count = EXCLUDED.harvest_count,
          sell_count = EXCLUDED.sell_count
      `);

      await client.query('COMMIT');
      logger.info('日活跃玩家数据加载完成', { date: yesterdayStr });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('加载日活跃玩家数据失败', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 加载每日交易数据
   */
  async loadDailyTransactions() {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      await client.query(`
        INSERT INTO fact_daily_transactions (
          date_id, player_id, transaction_type, transaction_count, 
          total_quantity, total_amount, avg_price, create_time
        )
        SELECT 
          d.date_id,
          p.player_id,
          CASE WHEN gal.activity_type = 'buy' THEN 'buy' ELSE 'sell' END AS transaction_type,
          COUNT(*) AS transaction_count,
          0 AS total_quantity,
          0 AS total_amount,
          0 AS avg_price,
          CURRENT_TIMESTAMP AS create_time
        FROM game_activity_log gal
        JOIN player_base p ON gal.player_id = p.player_id
        JOIN dim_date d ON gal.create_time::DATE = d.full_date
        WHERE gal.create_time::DATE = '${yesterdayStr}'
          AND gal.activity_type IN ('buy', 'sell')
        GROUP BY d.date_id, p.player_id, 
          CASE WHEN gal.activity_type = 'buy' THEN 'buy' ELSE 'sell' END
        ON CONFLICT DO NOTHING
      `);

      await client.query('COMMIT');
      logger.info('每日交易数据加载完成', { date: yesterdayStr });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('加载每日交易数据失败', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 加载作物种植数据
   */
  async loadCropPlantingData() {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      await client.query(`
        INSERT INTO fact_crop_planting (
          date_id, player_id, crop_id, plant_count, 
          harvest_count, total_yield, success_rate, avg_growth_time, create_time
        )
        SELECT 
          d.date_id,
          p.player_id,
          'unknown' AS crop_id,
          COUNT(CASE WHEN gal.activity_type = 'plant' THEN 1 END) AS plant_count,
          COUNT(CASE WHEN gal.activity_type = 'harvest' THEN 1 END) AS harvest_count,
          0 AS total_yield,
          100.0 AS success_rate,
          0 AS avg_growth_time,
          CURRENT_TIMESTAMP AS create_time
        FROM game_activity_log gal
        JOIN player_base p ON gal.player_id = p.player_id
        JOIN dim_date d ON gal.create_time::DATE = d.full_date
        WHERE gal.create_time::DATE = '${yesterdayStr}'
          AND gal.activity_type IN ('plant', 'harvest')
        GROUP BY d.date_id, p.player_id
        ON CONFLICT DO NOTHING
      `);

      await client.query('COMMIT');
      logger.info('作物种植数据加载完成', { date: yesterdayStr });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('加载作物种植数据失败', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 加载每日收入数据
   */
  async loadDailyRevenueData() {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      await client.query(`
        INSERT INTO fact_daily_revenue (
          date_id, player_id, revenue_source, revenue_amount, revenue_count, create_time
        )
        SELECT 
          d.date_id,
          p.player_id,
          'crop_sell' AS revenue_source,
          0 AS revenue_amount,
          COUNT(CASE WHEN gal.activity_type = 'sell' THEN 1 END) AS revenue_count,
          CURRENT_TIMESTAMP AS create_time
        FROM game_activity_log gal
        JOIN player_base p ON gal.player_id = p.player_id
        JOIN dim_date d ON gal.create_time::DATE = d.full_date
        WHERE gal.create_time::DATE = '${yesterdayStr}'
          AND gal.activity_type = 'sell'
        GROUP BY d.date_id, p.player_id
        ON CONFLICT DO NOTHING
      `);

      await client.query('COMMIT');
      logger.info('每日收入数据加载完成', { date: yesterdayStr });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('加载每日收入数据失败', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取DAU统计数据
   * @param {string} startDate - 开始日期（YYYY-MM-DD）
   * @param {string} endDate - 结束日期（YYYY-MM-DD）
   */
  async getDAUStats(startDate, endDate) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        `
        SELECT * FROM v_dau_stats 
        WHERE full_date BETWEEN $1 AND $2
        ORDER BY full_date DESC
      `,
        [startDate, endDate]
      );
      return result.rows;
    } catch (error) {
      logger.error('获取DAU统计数据失败', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取作物统计数据
   * @param {string} startDate - 开始日期（YYYY-MM-DD）
   * @param {string} endDate - 结束日期（YYYY-MM-DD）
   */
  async getCropStats(startDate, endDate) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        `
        SELECT * FROM v_crop_stats 
        WHERE full_date BETWEEN $1 AND $2
        ORDER BY full_date DESC, total_plant_count DESC
      `,
        [startDate, endDate]
      );
      return result.rows;
    } catch (error) {
      logger.error('获取作物统计数据失败', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取收入统计数据
   * @param {string} startDate - 开始日期（YYYY-MM-DD）
   * @param {string} endDate - 结束日期（YYYY-MM-DD）
   */
  async getRevenueStats(startDate, endDate) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        `
        SELECT * FROM v_revenue_stats 
        WHERE full_date BETWEEN $1 AND $2
        ORDER BY full_date DESC, total_revenue DESC
      `,
        [startDate, endDate]
      );
      return result.rows;
    } catch (error) {
      logger.error('获取收入统计数据失败', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取留存分析数据
   * @param {string} startDate - 开始日期（YYYY-MM-DD）
   * @param {string} endDate - 结束日期（YYYY-MM-DD）
   */
  async getRetentionAnalysis(startDate, endDate) {
    const client = await db.getClient();
    try {
      const result = await client.query(
        `
        SELECT * FROM v_retention_analysis 
        WHERE full_date BETWEEN $1 AND $2
        ORDER BY full_date DESC, retention_day
      `,
        [startDate, endDate]
      );
      return result.rows;
    } catch (error) {
      logger.error('获取留存分析数据失败', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取数据仓库概览
   */
  async getWarehouseOverview() {
    const client = await db.getClient();
    try {
      const [playerCount, cropCount, dauToday, totalRevenue] =
        await Promise.all([
          client.query('SELECT COUNT(*) AS count FROM dim_player'),
          client.query('SELECT COUNT(*) AS count FROM dim_crop'),
          client.query(`
          SELECT dau FROM v_dau_stats 
          WHERE full_date = CURRENT_DATE
        `),
          client.query(`
          SELECT SUM(total_revenue) AS total 
          FROM v_revenue_stats 
          WHERE full_date >= CURRENT_DATE - INTERVAL '30 days'
        `),
        ]);

      return {
        playerCount: playerCount.rows[0].count,
        cropCount: cropCount.rows[0].count,
        dauToday: dauToday.rows[0]?.dau || 0,
        totalRevenueLast30Days: totalRevenue.rows[0]?.total || 0,
      };
    } catch (error) {
      logger.error('获取数据仓库概览失败', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 手动触发ETL任务
   */
  async triggerETL() {
    logger.info('手动触发ETL任务');
    await this.runDailyETL();
    return { success: true, message: 'ETL任务执行完成' };
  }
}

module.exports = new DataWarehouseService();
