/**
 * 文件名：announcementService.js
 * 作者：Trae AI
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：游戏公告发布系统服务层，包含公告的CRUD、发布流程、阅读记录等功能
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始版本创建
 */

const pool = require('../config/db');
const logger = require('../config/logger');

class AnnouncementService {
  /**
   * 获取公告列表
   * @param {Object} filters - 筛选条件
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Object>} 公告列表和分页信息
   */
  async getAnnouncementList(filters = {}, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (filters.title) {
      conditions.push(`a.title ILIKE $${paramIndex}`);
      params.push(`%${filters.title}%`);
      paramIndex++;
    }

    if (filters.category) {
      conditions.push(`a.category = $${paramIndex}`);
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.status) {
      conditions.push(`a.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
            SELECT COUNT(*) as total FROM announcement a ${whereClause}
        `;

    const dataQuery = `
            SELECT 
                a.*,
                su.username as creator_name,
                ac.name as category_name,
                (SELECT COUNT(*) FROM announcement_read ar WHERE ar.announcement_id = a.id) as read_count
            FROM announcement a
            LEFT JOIN sys_user su ON su.id = a.creator_id
            LEFT JOIN announcement_category ac ON ac.code = a.category
            ${whereClause}
            ORDER BY a.is_top DESC, a.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

    params.push(pageSize, offset);

    try {
      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, params.slice(0, -2)),
        pool.query(dataQuery, params),
      ]);

      return {
        data: dataResult.rows,
        total: parseInt(countResult.rows[0].total),
        page,
        pageSize,
        totalPages: Math.ceil(countResult.rows[0].total / pageSize),
      };
    } catch (error) {
      logger.error('获取公告列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取公告详情
   * @param {number} id - 公告ID
   * @returns {Promise<Object>} 公告详情
   */
  async getAnnouncementDetail(id) {
    const query = `
            SELECT 
                a.*,
                su.username as creator_name,
                ac.name as category_name
            FROM announcement a
            LEFT JOIN sys_user su ON su.id = a.creator_id
            LEFT JOIN announcement_category ac ON ac.code = a.category
            WHERE a.id = $1
        `;

    try {
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      logger.error('获取公告详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建公告
   * @param {Object} data - 公告数据
   * @param {number} creatorId - 创建人ID
   * @param {string} creatorName - 创建人名称
   * @returns {Promise<Object>} 创建的公告
   */
  async createAnnouncement(data, creatorId, creatorName) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
                INSERT INTO announcement 
                (title, content, summary, category, priority, cover_image, status, creator_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

      const result = await client.query(query, [
        data.title,
        data.content,
        data.summary,
        data.category || 'SYSTEM',
        data.priority || 'NORMAL',
        data.cover_image || null,
        data.status || 'DRAFT',
        creatorId,
      ]);

      await client.query('COMMIT');
      logger.info(`创建公告成功: ${data.title}`, {
        operatorId: creatorId,
        operatorName: creatorName,
      });
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('创建公告失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 更新公告
   * @param {number} id - 公告ID
   * @param {Object} data - 公告数据
   * @param {number} operatorId - 操作人ID
   * @returns {Promise<Object>} 更新后的公告
   */
  async updateAnnouncement(id, data, operatorId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
                UPDATE announcement 
                SET title = $1, content = $2, summary = $3, category = $4, 
                    priority = $5, cover_image = $6, updated_at = CURRENT_TIMESTAMP
                WHERE id = $7
                RETURNING *
            `;

      const result = await client.query(query, [
        data.title,
        data.content,
        data.summary,
        data.category,
        data.priority,
        data.cover_image || null,
        id,
      ]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('公告不存在');
      }

      await client.query('COMMIT');
      logger.info(`更新公告成功: ${id}`);
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('更新公告失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 删除公告
   * @param {number} id - 公告ID
   * @returns {Promise<void>}
   */
  async deleteAnnouncement(id) {
    const query = `DELETE FROM announcement WHERE id = $1`;
    try {
      await pool.query(query, [id]);
      logger.info(`删除公告成功: ${id}`);
    } catch (error) {
      logger.error('删除公告失败:', error);
      throw error;
    }
  }

  /**
   * 发布公告
   * @param {number} id - 公告ID
   * @param {number} operatorId - 操作人ID
   * @returns {Promise<Object>} 发布后的公告
   */
  async publishAnnouncement(id, operatorId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
                UPDATE announcement 
                SET status = 'PUBLISHED', publish_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `;

      const result = await client.query(query, [id]);
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('公告不存在');
      }

      await client.query('COMMIT');
      logger.info(`发布公告成功: ${id}`);
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('发布公告失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 下线公告
   * @param {number} id - 公告ID
   * @returns {Promise<Object>} 下线后的公告
   */
  async offlineAnnouncement(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
                UPDATE announcement 
                SET status = 'OFFLINE', offline_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `;

      const result = await client.query(query, [id]);
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('公告不存在');
      }

      await client.query('COMMIT');
      logger.info(`下线公告成功: ${id}`);
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('下线公告失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 定时发布公告
   * @param {number} id - 公告ID
   * @param {Date} scheduledTime - 定时时间
   * @returns {Promise<Object>} 定时设置后的公告
   */
  async scheduleAnnouncement(id, scheduledTime) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
                UPDATE announcement 
                SET status = 'PENDING', scheduled_time = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `;

      const result = await client.query(query, [scheduledTime, id]);
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('公告不存在');
      }

      await client.query('COMMIT');
      logger.info(`设置定时发布成功: ${id} at ${scheduledTime}`);
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('设置定时发布失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 设置公告置顶
   * @param {number} id - 公告ID
   * @param {boolean} isTop - 是否置顶
   * @returns {Promise<Object>} 置顶后的公告
   */
  async setAnnouncementTop(id, isTop) {
    const query = `
            UPDATE announcement 
            SET is_top = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;

    try {
      const result = await pool.query(query, [isTop, id]);
      if (result.rows.length === 0) {
        throw new Error('公告不存在');
      }
      logger.info(`设置公告置顶成功: ${id} -> ${isTop}`);
      return result.rows[0];
    } catch (error) {
      logger.error('设置公告置顶失败:', error);
      throw error;
    }
  }

  /**
   * 记录阅读公告
   * @param {number} announcementId - 公告ID
   * @param {number} userId - 用户ID
   * @returns {Promise<void>}
   */
  async recordAnnouncementRead(announcementId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        'INSERT INTO announcement_read (announcement_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [announcementId, userId]
      );

      await client.query(
        'UPDATE announcement SET view_count = view_count + 1 WHERE id = $1',
        [announcementId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('记录阅读失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取公告分类列表
   * @returns {Promise<Array>} 公告分类列表
   */
  async getAnnouncementCategories() {
    const query = `SELECT * FROM announcement_category WHERE is_active = TRUE ORDER BY sort_order`;
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('获取公告分类失败:', error);
      throw error;
    }
  }

  /**
   * 获取公告统计数据
   * @returns {Promise<Object>} 统计数据
   */
  async getAnnouncementStatistics() {
    const queries = {
      total: 'SELECT COUNT(*) as count FROM announcement',
      published:
        "SELECT COUNT(*) as count FROM announcement WHERE status = 'PUBLISHED'",
      draft:
        "SELECT COUNT(*) as count FROM announcement WHERE status = 'DRAFT'",
      totalViews: 'SELECT SUM(view_count) as sum FROM announcement',
      totalLikes: 'SELECT SUM(like_count) as sum FROM announcement',
    };

    try {
      const [
        totalResult,
        publishedResult,
        draftResult,
        totalViewsResult,
        totalLikesResult,
      ] = await Promise.all([
        pool.query(queries.total),
        pool.query(queries.published),
        pool.query(queries.draft),
        pool.query(queries.totalViews),
        pool.query(queries.totalLikes),
      ]);

      return {
        total: parseInt(totalResult.rows[0].count || 0),
        published: parseInt(publishedResult.rows[0].count || 0),
        draft: parseInt(draftResult.rows[0].count || 0),
        totalViews: parseInt(totalViewsResult.rows[0].sum || 0),
        totalLikes: parseInt(totalLikesResult.rows[0].sum || 0),
      };
    } catch (error) {
      logger.error('获取公告统计失败:', error);
      throw error;
    }
  }
}

module.exports = new AnnouncementService();
