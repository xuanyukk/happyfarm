//
// 文件名: batchService.js
// 作者: Trae AI
// 日期: 2026-05-01
// 版本: v1.0.0
// 功能描述: 批量操作功能业务服务层
// 更新记录:
//   2026-05-01 - v1.0.0 - 初始版本创建
//

const pool = require('../config/db');
const logger = require('../config/logger');

class BatchService {
  /**
   * 获取批量操作列表
   */
  async getBatchList(filters = {}, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    let query = `
      SELECT b.*, a.username as operator_name 
      FROM batch_operation b 
      LEFT JOIN admins a ON b.operator_id = a.id 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (filters.operation_type) {
      query += ` AND b.operation_type = $${paramIndex++}`;
      params.push(filters.operation_type);
    }

    if (filters.status) {
      query += ` AND b.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.target_module) {
      query += ` AND b.target_module = $${paramIndex++}`;
      params.push(filters.target_module);
    }

    if (filters.start_date) {
      query += ` AND b.created_at >= $${paramIndex++}`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ` AND b.created_at <= $${paramIndex++}`;
      params.push(filters.end_date + ' 23:59:59');
    }

    query += ` ORDER BY b.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(pageSize, offset);

    const result = await pool.query(query, params);

    // 获取总数
    let countQuery = `SELECT COUNT(*) as total FROM batch_operation b WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;

    if (filters.operation_type) {
      countQuery += ` AND b.operation_type = $${countParamIndex++}`;
      countParams.push(filters.operation_type);
    }

    if (filters.status) {
      countQuery += ` AND b.status = $${countParamIndex++}`;
      countParams.push(filters.status);
    }

    if (filters.target_module) {
      countQuery += ` AND b.target_module = $${countParamIndex++}`;
      countParams.push(filters.target_module);
    }

    if (filters.start_date) {
      countQuery += ` AND b.created_at >= $${countParamIndex++}`;
      countParams.push(filters.start_date);
    }

    if (filters.end_date) {
      countQuery += ` AND b.created_at <= $${countParamIndex++}`;
      countParams.push(filters.end_date + ' 23:59:59');
    }

    const countResult = await pool.query(countQuery, countParams);

    return {
      list: result.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      pageSize,
    };
  }

  /**
   * 获取批量操作详情
   */
  async getBatchDetail(id) {
    const result = await pool.query(
      `SELECT b.*, a.username as operator_name 
       FROM batch_operation b 
       LEFT JOIN admins a ON b.operator_id = a.id 
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const batch = result.rows[0];

    // 获取操作详情
    const detailResult = await pool.query(
      `SELECT * FROM batch_operation_detail WHERE batch_id = $1 ORDER BY id`,
      [id]
    );
    batch.details = detailResult.rows;

    // 获取文件信息
    const fileResult = await pool.query(
      `SELECT * FROM batch_file WHERE batch_id = $1`,
      [id]
    );
    batch.files = fileResult.rows;

    return batch;
  }

  /**
   * 创建批量操作
   */
  async createBatch(data, operatorId, ipAddress) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 创建批量操作记录
      const result = await client.query(
        `INSERT INTO batch_operation 
         (operation_type, target_module, operator_id, total_count, input_data, status, created_at) 
         VALUES ($1, $2, $3, $4, $5, 'PENDING', CURRENT_TIMESTAMP) 
         RETURNING *`,
        [
          data.operation_type,
          data.target_module,
          operatorId,
          data.total_count || 0,
          data.input_data ? JSON.stringify(data.input_data) : null,
        ]
      );

      const batch = result.rows[0];

      // 如果有文件，保存文件信息
      if (data.files && data.files.length > 0) {
        for (const file of data.files) {
          await client.query(
            `INSERT INTO batch_file 
             (batch_id, file_name, file_path, file_type, file_size, uploader_id, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
            [
              batch.id,
              file.file_name,
              file.file_path,
              file.file_type,
              file.file_size,
              operatorId,
            ]
          );
        }
      }

      await client.query('COMMIT');

      logger.info(
        `Batch operation created: ${batch.id} - ${batch.operation_type}`
      );
      return batch;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create batch operation:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 执行批量操作
   */
  async executeBatch(batchId, operatorId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 更新状态为处理中
      await client.query(
        `UPDATE batch_operation 
         SET status = 'PROCESSING', started_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [batchId]
      );

      await client.query('COMMIT');

      // 异步执行批量操作（这里简化处理，实际项目中应使用队列或worker）
      this.processBatch(batchId, operatorId).catch((error) => {
        logger.error(`Failed to process batch ${batchId}:`, error);
      });

      return { message: 'Batch operation started', batchId };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to start batch operation:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 处理批量操作（异步）
   */
  async processBatch(batchId, operatorId) {
    const client = await pool.connect();
    try {
      logger.info(`Processing batch operation: ${batchId}`);

      // 获取批量操作信息
      const batchResult = await client.query(
        'SELECT * FROM batch_operation WHERE id = $1',
        [batchId]
      );

      if (batchResult.rows.length === 0) {
        throw new Error('Batch operation not found');
      }

      const batch = batchResult.rows[0];
      const inputData = batch.input_data || {};
      const targetIds = inputData.target_ids || [];
      const totalCount = targetIds.length;

      if (totalCount === 0) {
        await client.query(
          `UPDATE batch_operation 
           SET status = 'COMPLETED', 
               success_count = 0, 
               fail_count = 0, 
               progress = 100, 
               completed_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [batchId]
        );
        return;
      }

      // 执行操作
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < targetIds.length; i++) {
        const targetId = targetIds[i];

        try {
          // 根据操作类型执行相应操作
          let result = await this.executeOperation(
            batch.operation_type,
            batch.target_module,
            targetId,
            inputData
          );

          // 记录成功结果
          await client.query(
            `INSERT INTO batch_operation_detail 
             (batch_id, target_id, target_data, status, executed_at) 
             VALUES ($1, $2, $3, 'SUCCESS', CURRENT_TIMESTAMP)`,
            [batchId, targetId, result ? JSON.stringify(result) : null]
          );

          successCount++;
        } catch (error) {
          // 记录失败结果
          await client.query(
            `INSERT INTO batch_operation_detail 
             (batch_id, target_id, status, error_message, executed_at) 
             VALUES ($1, $2, 'FAIL', $3, CURRENT_TIMESTAMP)`,
            [batchId, targetId, error.message]
          );

          failCount++;
        }

        // 更新进度
        const progress = Math.round(((i + 1) / totalCount) * 100);
        await client.query(
          `UPDATE batch_operation 
           SET success_count = $1, 
               fail_count = $2, 
               progress = $3 
           WHERE id = $4`,
          [successCount, failCount, progress, batchId]
        );

        // 简单的延迟模拟
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // 操作完成
      await client.query(
        `UPDATE batch_operation 
         SET status = 'COMPLETED', 
             completed_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [batchId]
      );

      logger.info(
        `Batch operation ${batchId} completed: ${successCount} success, ${failCount} fail`
      );
    } catch (error) {
      logger.error(`Failed to process batch ${batchId}:`, error);

      // 更新状态为失败
      await client.query(
        `UPDATE batch_operation 
         SET status = 'FAILED', 
             error_log = $1 
         WHERE id = $2`,
        [error.message, batchId]
      );
    } finally {
      client.release();
    }
  }

  /**
   * 执行具体操作
   */
  async executeOperation(operationType, targetModule, targetId, inputData) {
    // 这里根据操作类型和模块执行相应的数据库操作
    // 实际项目中应该根据具体需求实现
    switch (operationType) {
      case 'BATCH_DELETE':
        return this.executeDelete(targetModule, targetId, inputData);
      case 'BATCH_UPDATE':
        return this.executeUpdate(targetModule, targetId, inputData);
      case 'BATCH_ENABLE':
        return this.executeEnable(targetModule, targetId);
      case 'BATCH_DISABLE':
        return this.executeDisable(targetModule, targetId);
      default:
        return { message: 'Operation executed', targetId };
    }
  }

  async executeDelete(targetModule, targetId, inputData) {
    // 模拟删除操作
    return { action: 'delete', targetModule, targetId };
  }

  async executeUpdate(targetModule, targetId, inputData) {
    // 模拟更新操作
    return {
      action: 'update',
      targetModule,
      targetId,
      data: inputData.update_data,
    };
  }

  async executeEnable(targetModule, targetId) {
    // 模拟启用操作
    return { action: 'enable', targetModule, targetId };
  }

  async executeDisable(targetModule, targetId) {
    // 模拟禁用操作
    return { action: 'disable', targetModule, targetId };
  }

  /**
   * 取消批量操作
   */
  async cancelBatch(batchId, operatorId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE batch_operation 
         SET status = 'CANCELLED', 
             completed_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND status IN ('PENDING', 'PROCESSING') 
         RETURNING *`,
        [batchId]
      );

      if (result.rows.length === 0) {
        throw new Error('Batch operation not found or cannot be cancelled');
      }

      await client.query('COMMIT');

      logger.info(`Batch operation cancelled: ${batchId}`);
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to cancel batch operation:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 导出结果
   */
  async exportResult(batchId) {
    const result = await pool.query(
      `SELECT * FROM batch_operation_detail WHERE batch_id = $1 ORDER BY id`,
      [batchId]
    );

    return result.rows;
  }

  /**
   * 批量更新状态
   */
  async batchStatusUpdate(
    targetModule,
    targetIds,
    newStatus,
    operatorId,
    ipAddress
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 创建批量操作记录
      const createResult = await client.query(
        `INSERT INTO batch_operation 
         (operation_type, target_module, operator_id, total_count, input_data, status, created_at) 
         VALUES ($1, $2, $3, $4, $5, 'PENDING', CURRENT_TIMESTAMP) 
         RETURNING *`,
        [
          'BATCH_UPDATE',
          targetModule,
          operatorId,
          targetIds.length,
          JSON.stringify({ target_ids: targetIds, new_status: newStatus }),
        ]
      );

      const batch = createResult.rows[0];

      await client.query('COMMIT');

      // 异步执行
      this.processBatch(batch.id, operatorId).catch((error) => {
        logger.error(`Failed to process batch ${batch.id}:`, error);
      });

      return batch;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create batch status update:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 批量删除
   */
  async batchDelete(targetModule, targetIds, operatorId, ipAddress) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 创建批量操作记录
      const createResult = await client.query(
        `INSERT INTO batch_operation 
         (operation_type, target_module, operator_id, total_count, input_data, status, created_at) 
         VALUES ($1, $2, $3, $4, $5, 'PENDING', CURRENT_TIMESTAMP) 
         RETURNING *`,
        [
          'BATCH_DELETE',
          targetModule,
          operatorId,
          targetIds.length,
          JSON.stringify({ target_ids: targetIds }),
        ]
      );

      const batch = createResult.rows[0];

      await client.query('COMMIT');

      // 异步执行
      this.processBatch(batch.id, operatorId).catch((error) => {
        logger.error(`Failed to process batch ${batch.id}:`, error);
      });

      return batch;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create batch delete:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new BatchService();
