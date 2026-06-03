
/**
 * 文件名：gameEventTriggerService.js
 * 作者：Trae AI
 * 日期：2026-05-22
 * 版本：v1.0.0
 * 功能描述：游戏活动触发器服务
 * 更新记录：
 *   2026-05-22 - v1.0.0 - 初始创建
 */

const db = require('../config/db');
const logger = require('../config/logger');

const MAX_RETRY_COUNT = 3;

/**
 * 创建触发器
 * @param {Object} triggerData - 触发器数据
 * @returns {Promise&lt;Object>} 创建的触发器
 */
const createTrigger = async (triggerData) => {
  const { event_id, trigger_type, trigger_condition, trigger_action, trigger_params } = triggerData;
  
  const result = await db.query(
    `INSERT INTO game_event_triggers 
     (event_id, trigger_type, trigger_condition, trigger_action, trigger_params) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING *`,
    [event_id, trigger_type, trigger_condition, trigger_action, trigger_params]
  );
  
  logger.info('创建触发器成功', { triggerId: result.rows[0].id });
  return result.rows[0];
};

/**
 * 获取活动的所有触发器
 * @param {number} eventId - 活动ID
 * @returns {Promise&lt;Array>} 触发器列表
 */
const getEventTriggers = async (eventId) => {
  const result = await db.query(
    'SELECT * FROM game_event_triggers WHERE event_id = $1 AND is_active = true',
    [eventId]
  );
  return result.rows;
};

/**
 * 获取所有活动的触发器
 * @returns {Promise&lt;Array>} 触发器列表
 */
const getAllTriggers = async () => {
  const result = await db.query('SELECT * FROM game_event_triggers WHERE is_active = true');
  return result.rows;
};

/**
 * 根据行为类型获取匹配的触发器
 * @param {string} actionType - 行为类型
 * @returns {Promise&lt;Array>} 触发器列表
 */
const getMatchingBehaviorTriggers = async (actionType) => {
  const result = await db.query(
    `SELECT * FROM game_event_triggers 
     WHERE trigger_type = 'behavior_based' 
     AND is_active = true`
  );
  
  // 过滤出匹配的触发器
  return result.rows.filter(trigger => {
    const condition = trigger.trigger_condition;
    return condition.action === actionType;
  });
};

/**
 * 处理行为触发器
 * @param {string} playerId - 玩家ID
 * @param {string} actionType - 行为类型
 * @param {Object} actionData - 行为数据
 */
const handleBehaviorTrigger = async (playerId, actionType, actionData) => {
  const triggers = await getMatchingBehaviorTriggers(actionType);
  
  for (const trigger of triggers) {
    await executeTrigger(trigger, playerId, actionData);
  }
};

/**
 * 执行触发器
 * @param {Object} trigger - 触发器
 * @param {string} playerId - 玩家ID
 * @param {Object} contextData - 上下文数据
 */
const executeTrigger = async (trigger, playerId, contextData) => {
  try {
    // 检查触发条件
    const conditionMet = await checkCondition(trigger, contextData);
    
    if (conditionMet) {
      // 执行触发动作
      const executionResult = await executeAction(trigger, playerId, contextData);
      
      // 记录成功
      await logTriggerExecution(trigger.id, trigger.event_id, playerId, 'success', executionResult);
      
      logger.info('触发器执行成功', {
        triggerId: trigger.id,
        playerId,
        eventId: trigger.event_id
      });
    }
  } catch (error) {
    logger.error('触发器执行失败', {
      triggerId: trigger.id,
      playerId,
      error: error.message
    });
    
    // 记录失败
    await logTriggerExecution(trigger.id, trigger.event_id, playerId, 'failed', null, error.message);
    
    // 检查是否需要重试
    await handleRetry(trigger, playerId, contextData);
  }
};

/**
 * 检查触发条件
 * @param {Object} trigger - 触发器
 * @param {Object} contextData - 上下文数据
 * @returns {Promise&lt;boolean>} 是否满足条件
 */
const checkCondition = async (trigger, contextData) => {
  const condition = trigger.trigger_condition;
  
  switch (trigger.trigger_type) {
    case 'threshold_based':
      return checkThresholdCondition(condition, contextData);
    case 'behavior_based':
      return checkBehaviorCondition(condition, contextData);
    case 'time_based':
      return checkTimeCondition(condition);
    default:
      return false;
  }
};

/**
 * 检查阈值条件
 * @param {Object} condition - 条件
 * @param {Object} contextData - 上下文数据
 * @returns {boolean} 是否满足条件
 */
const checkThresholdCondition = (condition, contextData) => {
  const { metric, operator, value } = condition;
  const actualValue = contextData[metric];
  
  if (actualValue === undefined) return false;
  
  switch (operator) {
    case '>=':
      return actualValue >= value;
    case '<=':
      return actualValue <= value;
    case '>':
      return actualValue > value;
    case '<':
      return actualValue < value;
    case '==':
      return actualValue == value;
    case '===':
      return actualValue === value;
    default:
      return false;
  }
};

/**
 * 检查行为条件
 * @param {Object} condition - 条件
 * @param {Object} contextData - 上下文数据
 * @returns {boolean} 是否满足条件
 */
const checkBehaviorCondition = (condition, contextData) => {
  // 简单实现，实际可以根据需求扩展
  return condition.action === contextData.actionType;
};

/**
 * 检查时间条件
 * @param {Object} condition - 条件
 * @returns {boolean} 是否满足条件
 */
const checkTimeCondition = (condition) => {
  const now = new Date();
  
  // 这里可以根据cron表达式或其他时间条件进行判断
  // 简单实现：检查当前时间是否在指定范围内
  if (condition.startTime && condition.endTime) {
    const startTime = new Date(condition.startTime);
    const endTime = new Date(condition.endTime);
    return now >= startTime && now <= endTime;
  }
  
  return false;
};

/**
 * 执行触发动作
 * @param {Object} trigger - 触发器
 * @param {string} playerId - 玩家ID
 * @param {Object} contextData - 上下文数据
 * @returns {Promise&lt;Object>} 执行结果
 */
const executeAction = async (trigger, playerId, contextData) => {
  // 这里根据trigger_action执行相应的动作
  // 实际项目中需要根据业务需求实现
  const params = trigger.trigger_params || {};
  
  return {
    action: trigger.trigger_action,
    params,
    playerId,
    timestamp: new Date().toISOString()
  };
};

/**
 * 记录触发器执行日志
 * @param {number} triggerId - 触发器ID
 * @param {number} eventId - 活动ID
 * @param {string} playerId - 玩家ID
 * @param {string} status - 状态
 * @param {Object} result - 执行结果
 * @param {string} errorMessage - 错误信息
 */
const logTriggerExecution = async (triggerId, eventId, playerId, status, result = null, errorMessage = null) => {
  await db.query(
    `INSERT INTO game_event_trigger_logs 
     (trigger_id, event_id, player_id, execution_status, execution_result, error_message) 
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [triggerId, eventId, playerId, status, result, errorMessage]
  );
};

/**
 * 处理重试
 * @param {Object} trigger - 触发器
 * @param {string} playerId - 玩家ID
 * @param {Object} contextData - 上下文数据
 */
const handleRetry = async (trigger, playerId, contextData) => {
  // 获取最近的失败记录
  const logResult = await db.query(
    `SELECT retry_count FROM game_event_trigger_logs 
     WHERE trigger_id = $1 AND player_id = $2 
     ORDER BY created_at DESC LIMIT 1`,
    [trigger.id, playerId]
  );
  
  const retryCount = logResult.rows[0]?.retry_count || 0;
  
  if (retryCount < MAX_RETRY_COUNT) {
    // 更新重试次数
    await db.query(
      `INSERT INTO game_event_trigger_logs 
       (trigger_id, event_id, player_id, execution_status, retry_count) 
       VALUES ($1, $2, $3, 'retrying', $4)`,
      [trigger.id, trigger.event_id, playerId, retryCount + 1]
    );
    
    // 这里可以加入重试队列，由定时任务处理
    logger.info('触发器重试', {
      triggerId: trigger.id,
      playerId,
      retryCount: retryCount + 1
    });
  }
};

/**
 * 更新触发器
 * @param {number} triggerId - 触发器ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise&lt;Object>} 更新后的触发器
 */
const updateTrigger = async (triggerId, updateData) => {
  const fields = [];
  const values = [];
  let index = 1;
  
  Object.entries(updateData).forEach(([key, value]) => {
    fields.push(`${key} = $${index}`);
    values.push(value);
    index++;
  });
  
  values.push(triggerId);
  
  const result = await db.query(
    `UPDATE game_event_triggers 
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${index} 
     RETURNING *`,
    values
  );
  
  logger.info('更新触发器成功', { triggerId });
  return result.rows[0];
};

/**
 * 删除触发器
 * @param {number} triggerId - 触发器ID
 */
const deleteTrigger = async (triggerId) => {
  await db.query('DELETE FROM game_event_triggers WHERE id = $1', [triggerId]);
  logger.info('删除触发器成功', { triggerId });
};

module.exports = {
  createTrigger,
  getEventTriggers,
  getAllTriggers,
  handleBehaviorTrigger,
  executeTrigger,
  updateTrigger,
  deleteTrigger
};

