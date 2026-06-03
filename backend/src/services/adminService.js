/**
 * 文件名：adminService.js
 * 作者：开发者
 * 日期：2026-03-28
 * 版本：v1.0.0
 * 功能描述：后台管理服务层，包含玩家管理、系统监控、货币调控等功能
 * 更新记录：
 *   2026-03-28 - v1.0.0 - 初始版本创建
 */

const pool = require('../config/db');
const logger = require('../config/logger');
const crypto = require('crypto');

/**
 * 管理员服务类
 */
class AdminService {
  /**
   * 获取玩家列表（支持筛选和分页）
   * @param {Object} filters - 筛选条件
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Object>} 玩家列表和分页信息
   */
  async getPlayerList(filters = {}, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (filters.username) {
      conditions.push(`su.username ILIKE $${paramIndex}`);
      params.push(`%${filters.username}%`);
      paramIndex++;
    }

    if (filters.playerId) {
      conditions.push(`pb.player_id = $${paramIndex}`);
      params.push(filters.playerId);
      paramIndex++;
    }

    if (filters.minLevel !== undefined) {
      conditions.push(`pb.player_level >= $${paramIndex}`);
      params.push(parseInt(filters.minLevel));
      paramIndex++;
    }

    if (filters.maxLevel !== undefined) {
      conditions.push(`pb.player_level <= $${paramIndex}`);
      params.push(parseInt(filters.maxLevel));
      paramIndex++;
    }

    if (filters.status !== undefined) {
      conditions.push(`su.is_active = $${paramIndex}`);
      params.push(filters.status === 'active');
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM player_base pb
      LEFT JOIN sys_user su ON pb.player_id = su.id::VARCHAR
      ${whereClause}
    `;

    const dataQuery = `
      SELECT 
        pb.player_id,
        su.username,
        su.email,
        pb.player_level,
        pb.farm_level,
        pb.world_level,
        pb.total_earn,
        pb.total_spend,
        su.is_active,
        su.last_login_at,
        pb.create_time,
        pb.update_time
      FROM player_base pb
      LEFT JOIN sys_user su ON pb.player_id = su.id::VARCHAR
      ${whereClause}
      ORDER BY pb.create_time DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pageSize, offset);

    try {
      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, params.slice(0, -2)),
        pool.query(dataQuery, params),
      ]);

      return {
        players: dataResult.rows,
        total: parseInt(countResult.rows[0].total),
        page,
        pageSize,
        totalPages: Math.ceil(countResult.rows[0].total / pageSize),
      };
    } catch (error) {
      logger.error('获取玩家列表失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取玩家详情
   * @param {string} playerId - 玩家ID
   * @returns {Promise<Object>} 玩家详情
   */
  async getPlayerDetail(playerId) {
    try {
      const query = `
        SELECT 
          pb.*,
          su.username,
          su.email,
          su.phone,
          su.is_active,
          su.is_admin,
          su.last_login_at,
          su.created_at as account_created_at
        FROM player_base pb
        LEFT JOIN sys_user su ON pb.player_id = su.id::VARCHAR
        WHERE pb.player_id = $1
      `;

      const result = await pool.query(query, [playerId]);
      if (result.rows.length === 0) {
        throw new Error('玩家不存在');
      }

      const player = result.rows[0];

      const currencyQuery = `
        SELECT * FROM player_currency WHERE player_id = $1
      `;
      const currencyResult = await pool.query(currencyQuery, [playerId]);

      const inventoryQuery = `
        SELECT 
          pi.*,
          ic.item_name,
          ic.item_type
        FROM player_inventory pi
        LEFT JOIN item_config ic ON pi.item_id = ic.item_id
        WHERE pi.player_id = $1
        ORDER BY pi.update_time DESC
      `;
      const inventoryResult = await pool.query(inventoryQuery, [playerId]);

      return {
        ...player,
        currency: currencyResult.rows,
        inventory: inventoryResult.rows,
      };
    } catch (error) {
      logger.error('获取玩家详情失败', { error: error.message, playerId });
      throw error;
    }
  }

  /**
   * 更新玩家账户状态
   * @param {string} playerId - 玩家ID
   * @param {boolean} isActive - 是否激活
   * @param {string} adminId - 管理员ID
   * @param {string} adminUsername - 管理员用户名
   * @param {string} reason - 原因
   * @returns {Promise<Object>} 操作结果
   */
  async updatePlayerStatus(playerId, isActive, adminId, adminUsername, reason) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updateQuery = `
        UPDATE sys_user 
        SET is_active = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2::INTEGER
        RETURNING *
      `;
      const result = await client.query(updateQuery, [isActive, playerId]);

      if (result.rows.length === 0) {
        throw new Error('玩家不存在');
      }

      await this.logAdminOperation(
        client,
        adminId,
        adminUsername,
        'update_status',
        'player',
        isActive ? '解冻玩家账户' : '冻结玩家账户',
        { playerId, reason },
        'success'
      );

      await client.query('COMMIT');
      return { success: true, player: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('更新玩家状态失败', { error: error.message, playerId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 创建操作审批请求
   * @param {Object} requestData - 请求数据
   * @param {number} requesterId - 申请人ID
   * @param {string} requesterUsername - 申请人用户名
   * @returns {Promise<Object>} 审批请求
   */
  async createApprovalRequest(requestData, requesterId, requesterUsername) {
    const requestId = crypto.randomBytes(32).toString('hex');

    try {
      const query = `
        INSERT INTO operation_approval (
          request_id, requester_id, requester_username,
          operation_type, operation_module, operation_desc,
          target_player_id, target_data, approval_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
        RETURNING *
      `;

      const result = await pool.query(query, [
        requestId,
        requesterId,
        requesterUsername,
        requestData.operationType,
        requestData.operationModule,
        requestData.operationDesc,
        requestData.targetPlayerId,
        JSON.stringify(requestData.targetData),
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('创建审批请求失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 审批操作请求
   * @param {string} requestId - 请求ID
   * @param {string} status - 审批状态
   * @param {string} note - 审批备注
   * @param {number} approverId - 审批人ID
   * @param {string} approverUsername - 审批人用户名
   * @returns {Promise<Object>} 审批结果
   */
  async approveOperation(
    requestId,
    status,
    note,
    approverId,
    approverUsername
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const getQuery =
        'SELECT * FROM operation_approval WHERE request_id = $1 FOR UPDATE';
      const getResult = await client.query(getQuery, [requestId]);

      if (getResult.rows.length === 0) {
        throw new Error('审批请求不存在');
      }

      const approval = getResult.rows[0];
      if (approval.approval_status !== 'pending') {
        throw new Error('审批请求已处理');
      }

      const updateQuery = `
        UPDATE operation_approval
        SET approval_status = $1, approver_id = $2, approver_username = $3,
            approval_note = $4, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE request_id = $5
        RETURNING *
      `;

      const result = await client.query(updateQuery, [
        status,
        approverId,
        approverUsername,
        note,
        requestId,
      ]);

      if (status === 'approved') {
        await this.executeApprovedOperation(client, approval);
      }

      await this.logAdminOperation(
        client,
        approverId,
        approverUsername,
        'approval',
        'admin',
        status === 'approved' ? '审批通过' : '审批拒绝',
        { requestId, note },
        'success'
      );

      await client.query('COMMIT');
      return { success: true, approval: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('审批操作失败', { error: error.message, requestId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 执行已批准的操作
   * @param {Object} client - 数据库连接
   * @param {Object} approval - 审批数据
   */
  async executeApprovedOperation(client, approval) {
    const targetData = approval.target_data;

    switch (approval.operation_type) {
      case 'adjust_currency':
        await this.adjustPlayerCurrency(
          client,
          approval.target_player_id,
          targetData.currencyType,
          targetData.amount,
          approval.requester_id,
          approval.requester_username,
          targetData.reason,
          approval.id
        );
        break;

      case 'modify_player_data':
        await this.modifyPlayerData(
          client,
          approval.target_player_id,
          targetData,
          approval.requester_id,
          approval.requester_username
        );
        break;
    }

    await client.query(
      'UPDATE operation_approval SET approval_status = $1, executed_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['executed', approval.id]
    );
  }

  /**
   * 调整玩家货币
   * @param {Object} client - 数据库连接
   * @param {string} playerId - 玩家ID
   * @param {string} currencyType - 货币类型
   * @param {number} amount - 金额
   * @param {number} adminId - 管理员ID
   * @param {string} adminUsername - 管理员用户名
   * @param {string} reason - 原因
   * @param {number} approvalId - 审批ID
   */
  async adjustPlayerCurrency(
    client,
    playerId,
    currencyType,
    amount,
    adminId,
    adminUsername,
    reason,
    approvalId
  ) {
    const getQuery = `SELECT * FROM player_currency WHERE player_id = $1 FOR UPDATE`;
    const getResult = await client.query(getQuery, [playerId]);

    if (getResult.rows.length === 0) {
      throw new Error('玩家货币数据不存在');
    }

    const currency = getResult.rows[0];
    const currencyField = `${currencyType}_balance`;
    const beforeBalance = currency[currencyField];
    const afterBalance = beforeBalance + amount;

    const updateQuery = `
      UPDATE player_currency
      SET ${currencyField} = $1, update_time = CURRENT_TIMESTAMP
      WHERE player_id = $2
    `;
    await client.query(updateQuery, [afterBalance, playerId]);

    const logQuery = `
      INSERT INTO currency_control_log (
        admin_id, admin_username, control_type, currency_type,
        amount, target_player_id, reason, approval_id, before_balance, after_balance
      ) VALUES ($1, $2, 'adjust', $3, $4, $5, $6, $7, $8, $9)
    `;
    await client.query(logQuery, [
      adminId,
      adminUsername,
      currencyType,
      amount,
      playerId,
      reason,
      approvalId,
      beforeBalance,
      afterBalance,
    ]);
  }

  /**
   * 修改玩家数据
   * @param {Object} client - 数据库连接
   * @param {string} playerId - 玩家ID
   * @param {Object} data - 要修改的数据
   * @param {number} adminId - 管理员ID
   * @param {string} adminUsername - 管理员用户名
   */
  async modifyPlayerData(client, playerId, data, adminId, adminUsername) {
    const updates = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(data)) {
      updates.push(`${key} = $${index}`);
      values.push(value);
      index++;
    }

    values.push(playerId);
    const updateQuery = `
      UPDATE player_base
      SET ${updates.join(', ')}, update_time = CURRENT_TIMESTAMP
      WHERE player_id = $${index}
    `;
    await client.query(updateQuery, values);
  }

  /**
   * 记录管理员操作日志
   * @param {Object} client - 数据库连接
   * @param {number} adminId - 管理员ID
   * @param {string} adminUsername - 管理员用户名
   * @param {string} operationType - 操作类型
   * @param {string} operationModule - 操作模块
   * @param {string} operationDesc - 操作描述
   * @param {Object} requestParams - 请求参数
   * @param {string} status - 状态
   */
  async logAdminOperation(
    client,
    adminId,
    adminUsername,
    operationType,
    operationModule,
    operationDesc,
    requestParams,
    status
  ) {
    const query = `
      INSERT INTO admin_operation_log (
        admin_id, admin_username, operation_type, operation_module,
        operation_desc, request_params, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    await client.query(query, [
      adminId,
      adminUsername,
      operationType,
      operationModule,
      operationDesc,
      JSON.stringify(requestParams),
      status,
    ]);
  }

  /**
   * 获取操作日志列表
   * @param {Object} filters - 筛选条件
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Object>} 日志列表
   */
  async getOperationLogs(filters = {}, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (filters.adminId) {
      conditions.push(`admin_id = $${paramIndex}`);
      params.push(parseInt(filters.adminId));
      paramIndex++;
    }

    if (filters.operationType) {
      conditions.push(`operation_type = $${paramIndex}`);
      params.push(filters.operationType);
      paramIndex++;
    }

    if (filters.module) {
      conditions.push(`operation_module = $${paramIndex}`);
      params.push(filters.module);
      paramIndex++;
    }

    if (filters.status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM admin_operation_log ${whereClause}`;
    const dataQuery = `
      SELECT * FROM admin_operation_log
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pageSize, offset);

    try {
      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, params.slice(0, -2)),
        pool.query(dataQuery, params),
      ]);

      return {
        logs: dataResult.rows,
        total: parseInt(countResult.rows[0].total),
        page,
        pageSize,
        totalPages: Math.ceil(countResult.rows[0].total / pageSize),
      };
    } catch (error) {
      logger.error('获取操作日志失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取系统监控数据
   * @param {string} type - 监控类型
   * @param {number} limit - 数据条数
   * @returns {Promise<Array>} 监控数据
   */
  async getMonitoringData(type, limit = 100) {
    try {
      const query = `
        SELECT * FROM system_monitoring
        WHERE monitor_type = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;
      const result = await pool.query(query, [type, limit]);
      return result.rows.reverse();
    } catch (error) {
      logger.error('获取监控数据失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 记录系统监控数据
   * @param {string} type - 监控类型
   * @param {string} key - 监控键
   * @param {number} value - 监控值
   * @param {string} unit - 单位
   * @param {Object} data - 扩展数据
   */
  async recordMonitoringData(type, key, value, unit = '', data = {}) {
    try {
      const query = `
        INSERT INTO system_monitoring (monitor_type, monitor_key, monitor_value, monitor_unit, monitor_data)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await pool.query(query, [type, key, value, unit, JSON.stringify(data)]);
    } catch (error) {
      logger.error('记录监控数据失败', { error: error.message });
    }
  }

  /**
   * 获取预警列表
   * @param {Object} filters - 筛选条件
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Object>} 预警列表
   */
  async getAlertList(filters = {}, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.level) {
      conditions.push(`alert_level = $${paramIndex}`);
      params.push(filters.level);
      paramIndex++;
    }

    if (filters.type) {
      conditions.push(`alert_type = $${paramIndex}`);
      params.push(filters.type);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM alert_record ${whereClause}`;
    const dataQuery = `
      SELECT * FROM alert_record
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pageSize, offset);

    try {
      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, params.slice(0, -2)),
        pool.query(dataQuery, params),
      ]);

      return {
        alerts: dataResult.rows,
        total: parseInt(countResult.rows[0].total),
        page,
        pageSize,
        totalPages: Math.ceil(countResult.rows[0].total / pageSize),
      };
    } catch (error) {
      logger.error('获取预警列表失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 处理预警
   * @param {number} alertId - 预警ID
   * @param {string} status - 处理状态
   * @param {string} note - 处理备注
   * @param {number} handlerId - 处理人ID
   */
  async handleAlert(alertId, status, note, handlerId) {
    try {
      const query = `
        UPDATE alert_record
        SET status = $1, handled_by = $2, handled_at = CURRENT_TIMESTAMP, handle_note = $3
        WHERE id = $4
        RETURNING *
      `;
      const result = await pool.query(query, [
        status,
        handlerId,
        note,
        alertId,
      ]);
      if (result.rows.length === 0) {
        throw new Error('预警记录不存在');
      }
      return result.rows[0];
    } catch (error) {
      logger.error('处理预警失败', { error: error.message, alertId });
      throw error;
    }
  }

  /**
   * 获取货币平衡监测数据
   * @param {string} currencyType - 货币类型
   * @param {number} days - 天数
   * @returns {Promise<Array>} 监测数据
   */
  async getCurrencyBalanceData(currencyType = 'coin', days = 30) {
    try {
      const query = `
        SELECT * FROM currency_balance_monitor
        WHERE currency_type = $1
        AND monitor_date >= CURRENT_DATE - $2 * INTERVAL '1 day'
        ORDER BY monitor_date ASC
      `;
      const result = await pool.query(query, [currencyType, days]);
      return result.rows;
    } catch (error) {
      logger.error('获取货币平衡数据失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取统计数据
   * @param {string} period - 统计周期
   * @param {string} type - 统计类型
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Array>} 统计数据
   */
  async getStatisticsData(
    period = 'daily',
    type = 'player',
    startDate,
    endDate
  ) {
    try {
      let query = `
        SELECT * FROM data_statistics
        WHERE stat_period = $1 AND stat_type = $2
      `;
      const params = [period, type];

      if (startDate) {
        query += ` AND stat_date >= $3`;
        params.push(startDate);
      }

      if (endDate) {
        const paramIndex = params.length + 1;
        query += ` AND stat_date <= $${paramIndex}`;
        params.push(endDate);
      }

      query += ` ORDER BY stat_date ASC`;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('获取统计数据失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取审批请求列表
   * @param {Object} filters - 筛选条件
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Object>} 审批列表
   */
  async getApprovalList(filters = {}, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      conditions.push(`approval_status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.requesterId) {
      conditions.push(`requester_id = $${paramIndex}`);
      params.push(parseInt(filters.requesterId));
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM operation_approval ${whereClause}`;
    const dataQuery = `
      SELECT * FROM operation_approval
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pageSize, offset);

    try {
      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, params.slice(0, -2)),
        pool.query(dataQuery, params),
      ]);

      return {
        approvals: dataResult.rows,
        total: parseInt(countResult.rows[0].total),
        page,
        pageSize,
        totalPages: Math.ceil(countResult.rows[0].total / pageSize),
      };
    } catch (error) {
      logger.error('获取审批列表失败', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AdminService();
