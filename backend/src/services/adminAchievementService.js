/**
 * 文件名: adminAchievementService.js
 * 作者: Trae AI
 * 日期: 2026-05-31
 * 版本: v1.0.0
 * 功能描述: 管理后台成就管理服务，提供成就定义的CRUD操作和统计查询
 * 更新记录:
 *   2026-05-31 - v1.0.0 - 初始版本创建
 */

const pool = require('../config/db');
const logger = require('../config/logger');

/**
 * 获取成就列表
 * @param {Object} params - 查询参数 { category, rarity, search, isActive }
 * @returns {Array} 成就列表
 */
async function getAchievementList(params = {}) {
  try {
    let query = 'SELECT * FROM achievement_definition WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (params.category) {
      query += ` AND category = $${paramIndex++}`;
      queryParams.push(params.category);
    }

    if (params.rarity) {
      query += ` AND rarity = $${paramIndex++}`;
      queryParams.push(params.rarity);
    }

    if (params.search) {
      query += ` AND achievement_name ILIKE $${paramIndex++}`;
      queryParams.push(`%${params.search}%`);
    }

    if (params.isActive !== undefined && params.isActive !== null && params.isActive !== '') {
      query += ` AND is_active = $${paramIndex++}`;
      queryParams.push(params.isActive === 'true' || params.isActive === true);
    }

    query += ' ORDER BY category, achievement_id';

    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    logger.error('获取成就列表失败', { error: error.message });
    throw error;
  }
}

/**
 * 获取成就详情
 * @param {number} achievementId - 成就ID
 * @returns {Object} 成就详情
 */
async function getAchievementDetail(achievementId) {
  try {
    const query = 'SELECT * FROM achievement_definition WHERE achievement_id = $1';
    const result = await pool.query(query, [achievementId]);
    if (result.rows.length === 0) {
      throw new Error('成就不存在');
    }
    return result.rows[0];
  } catch (error) {
    logger.error('获取成就详情失败', { achievementId, error: error.message });
    throw error;
  }
}

/**
 * 创建成就
 * @param {Object} data - 成就数据
 * @returns {Object} 创建的成就
 */
async function createAchievement(data) {
  try {
    const query = `
      INSERT INTO achievement_definition (
        achievement_name, description, icon, category, rarity,
        required_count, reward_type, reward_amount, reward_item_id,
        reward_title, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      data.achievementName || data.achievement_name,
      data.description || '',
      data.icon || '🏆',
      data.category || 'general',
      data.rarity || 'common',
      data.requiredCount || data.required_count || 1,
      data.rewardType || data.reward_type || 'none',
      data.rewardAmount || data.reward_amount || 0,
      data.rewardItemId || data.reward_item_id || null,
      data.rewardTitle || data.reward_title || null,
      data.isActive !== undefined ? data.isActive : true
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error('创建成就失败', { error: error.message });
    throw error;
  }
}

/**
 * 更新成就
 * @param {number} achievementId - 成就ID
 * @param {Object} data - 更新数据
 * @returns {Object} 更新后的成就
 */
async function updateAchievement(achievementId, data) {
  try {
    const checkQuery = 'SELECT * FROM achievement_definition WHERE achievement_id = $1';
    const checkResult = await pool.query(checkQuery, [achievementId]);
    if (checkResult.rows.length === 0) {
      throw new Error('成就不存在');
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    const fieldMap = {
      achievementName: 'achievement_name',
      description: 'description',
      icon: 'icon',
      category: 'category',
      rarity: 'rarity',
      requiredCount: 'required_count',
      rewardType: 'reward_type',
      rewardAmount: 'reward_amount',
      rewardItemId: 'reward_item_id',
      rewardTitle: 'reward_title',
      isActive: 'is_active'
    };

    Object.entries(fieldMap).forEach(([key, column]) => {
      if (data[key] !== undefined) {
        fields.push(`${column} = $${paramIndex++}`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('没有需要更新的字段');
    }

    values.push(achievementId);
    const query = `
      UPDATE achievement_definition SET ${fields.join(', ')}
      WHERE achievement_id = $${paramIndex}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error('更新成就失败', { achievementId, error: error.message });
    throw error;
  }
}

/**
 * 删除成就
 * @param {number} achievementId - 成就ID
 * @returns {Object} 删除结果
 */
async function deleteAchievement(achievementId) {
  try {
    const checkQuery = 'SELECT * FROM achievement_definition WHERE achievement_id = $1';
    const checkResult = await pool.query(checkQuery, [achievementId]);
    if (checkResult.rows.length === 0) {
      throw new Error('成就不存在');
    }

    const query = 'DELETE FROM achievement_definition WHERE achievement_id = $1';
    await pool.query(query, [achievementId]);
    return { message: '成就已删除' };
  } catch (error) {
    logger.error('删除成就失败', { achievementId, error: error.message });
    throw error;
  }
}

/**
 * 获取成就统计
 * @param {number} achievementId - 成就ID
 * @returns {Object} 统计信息
 */
async function getAchievementStatistics(achievementId) {
  try {
    const checkQuery = 'SELECT * FROM achievement_definition WHERE achievement_id = $1';
    const checkResult = await pool.query(checkQuery, [achievementId]);
    if (checkResult.rows.length === 0) {
      throw new Error('成就不存在');
    }

    const statsQuery = `
      SELECT
        COUNT(*) AS total_players,
        COUNT(CASE WHEN is_completed = true THEN 1 END) AS completed_count,
        COUNT(CASE WHEN is_completed = false THEN 1 END) AS in_progress_count
      FROM player_achievement
      WHERE achievement_id = $1
    `;
    const statsResult = await pool.query(statsQuery, [achievementId]);
    return {
      achievement: checkResult.rows[0],
      statistics: statsResult.rows[0]
    };
  } catch (error) {
    logger.error('获取成就统计失败', { achievementId, error: error.message });
    throw error;
  }
}

module.exports = {
  getAchievementList,
  getAchievementDetail,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  getAchievementStatistics
};