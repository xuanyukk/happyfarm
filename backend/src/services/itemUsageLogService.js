/**
 * 文件名：itemUsageLogService.js
 * 作者：SOLO
 * 日期：2026-05-31
 * 版本：v1.0.0
 * 功能描述：道具使用日志服务 - 记录和管理道具使用日志
 * 更新记录：
 *   2026-05-31 - v1.0.0 - 初始创建
 */

const pool = require('../config/db');
const logger = require('../config/logger');

const itemUsageLogService = {
  /**
   * 记录道具使用日志
   * @param {Object} params - 日志参数
   * @param {string} params.playerId - 玩家ID
   * @param {number} params.itemId - 道具ID
   * @param {string} params.itemName - 道具名称
   * @param {number} params.quantity - 使用数量
   * @param {string} params.usageScene - 使用场景
   * @param {number|null} params.landNum - 目标地块编号
   * @param {string} params.result - 使用结果
   * @param {Object|null} params.effectDetail - 效果详情
   * @param {number|null} params.inventoryBefore - 使用前数量
   * @param {number|null} params.inventoryAfter - 使用后数量
   * @param {string|null} params.ipAddress - 客户端IP
   * @param {string|null} params.userAgent - 客户端UA
   * @returns {Promise<Object>} 插入的日志记录
   */
  async logUsage({
    playerId,
    itemId,
    itemName,
    quantity = 1,
    usageScene = 'inventory',
    landNum = null,
    result = 'success',
    effectDetail = null,
    inventoryBefore = null,
    inventoryAfter = null,
    ipAddress = null,
    userAgent = null,
  }) {
    try {
      const query = `
        INSERT INTO player_item_usage_log (
          player_id, item_id, item_name, quantity,
          usage_scene, land_num, result, effect_detail,
          inventory_before, inventory_after,
          ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, create_time
      `;

      const values = [
        playerId,
        itemId,
        itemName,
        quantity,
        usageScene,
        landNum,
        result,
        effectDetail ? JSON.stringify(effectDetail) : null,
        inventoryBefore,
        inventoryAfter,
        ipAddress,
        userAgent,
      ];

      const dbResult = await pool.query(query, values);
      const logId = dbResult.rows[0].id;
      const createTime = dbResult.rows[0].create_time;

      logger.info('道具使用日志记录成功', {
        logId,
        playerId,
        itemId,
        itemName,
        usageScene,
        result,
      });

      return { id: logId, create_time: createTime };
    } catch (err) {
      logger.error('道具使用日志记录失败', {
        playerId,
        itemId,
        itemName,
        error: err.message,
      });
      throw err;
    }
  },

  /**
   * 查询玩家道具使用日志（分页）
   * @param {string} playerId - 玩家ID
   * @param {Object} filters - 筛选条件
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} 日志列表和分页信息
   */
  async queryLogs(playerId, filters = {}, page = 1, limit = 20) {
    try {
      const conditions = ['player_id = $1'];
      const values = [playerId];
      let paramIndex = 2;

      if (filters.itemId) {
        conditions.push(`item_id = $${paramIndex++}`);
        values.push(filters.itemId);
      }
      if (filters.usageScene) {
        conditions.push(`usage_scene = $${paramIndex++}`);
        values.push(filters.usageScene);
      }
      if (filters.result) {
        conditions.push(`result = $${paramIndex++}`);
        values.push(filters.result);
      }
      if (filters.startTime) {
        conditions.push(`create_time >= $${paramIndex++}`);
        values.push(filters.startTime);
      }
      if (filters.endTime) {
        conditions.push(`create_time <= $${paramIndex++}`);
        values.push(filters.endTime);
      }

      const whereClause = conditions.join(' AND ');
      const offset = (page - 1) * limit;

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM player_item_usage_log WHERE ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count, 10);

      const dataResult = await pool.query(
        `SELECT * FROM player_item_usage_log
         WHERE ${whereClause}
         ORDER BY create_time DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...values, limit, offset]
      );

      return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        logs: dataResult.rows,
      };
    } catch (err) {
      logger.error('查询道具使用日志失败', {
        playerId,
        filters,
        error: err.message,
      });
      throw err;
    }
  },

  /**
   * 统计分析：按道具使用频率排行
   * @param {string} startTime - 开始时间
   * @param {string} endTime - 结束时间
   * @param {number} limit - 返回数量
   * @returns {Promise<Array>} 统计结果
   */
  async getItemUsageStats(startTime, endTime, limit = 20) {
    try {
      const query = `
        SELECT
          item_id, item_name, usage_scene,
          COUNT(*) AS use_count,
          SUM(quantity) AS total_quantity,
          COUNT(DISTINCT player_id) AS unique_players,
          COUNT(CASE WHEN result = 'success' THEN 1 END) AS success_count,
          COUNT(CASE WHEN result = 'failed' THEN 1 END) AS failed_count
        FROM player_item_usage_log
        WHERE create_time >= $1 AND create_time <= $2
        GROUP BY item_id, item_name, usage_scene
        ORDER BY use_count DESC
        LIMIT $3
      `;

      const result = await pool.query(query, [startTime, endTime, limit]);
      return result.rows;
    } catch (err) {
      logger.error('查询道具使用统计失败', {
        startTime,
        endTime,
        error: err.message,
      });
      throw err;
    }
  },

  /**
   * 防作弊分析：检测异常使用频率
   * @param {number} thresholdMinutes - 时间窗口（分钟）
   * @param {number} maxUsage - 最大使用次数阈值
   * @returns {Promise<Array>} 异常记录列表
   */
  async detectAnomalies(thresholdMinutes = 10, maxUsage = 100) {
    try {
      const query = `
        SELECT
          player_id, item_id, item_name,
          COUNT(*) AS usage_count,
          MIN(create_time) AS first_use,
          MAX(create_time) AS last_use
        FROM player_item_usage_log
        WHERE create_time >= NOW() - INTERVAL '${thresholdMinutes} minutes'
        GROUP BY player_id, item_id, item_name
        HAVING COUNT(*) > $1
        ORDER BY usage_count DESC
      `;

      const result = await pool.query(query, [maxUsage]);
      return result.rows;
    } catch (err) {
      logger.error('道具使用异常检测失败', {
        thresholdMinutes,
        maxUsage,
        error: err.message,
      });
      throw err;
    }
  },
};

module.exports = itemUsageLogService;
