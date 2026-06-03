/**
 * 文件名：gameEventController.js
 * 作者：开发者
 * 日期：2026-05-12
 * 版本：v2.0.0
 * 功能描述：游戏活动管理控制器
 * 更新记录：
 *   2026-05-06 - v1.0.0 - 初始版本创建
 *   2026-05-12 - v1.1.0 - 统一使用响应工具，确保API输出格式一致
 *   2026-05-12 - v2.0.0 - 集成错误分类系统，提供更精确的错误信息
 */

const gameEventService = require('../services/gameEventService');
const logger = require('../config/logger');
const {
  successResponse,
  createdResponse,
  notFoundResponse,
  badRequestResponse,
  conflictResponse,
} = require('../utils/response');
const {
  EventNotFoundError,
  EventTaskNotFoundError,
  EventTaskNotCompletedError,
  EventRewardAlreadyClaimedError,
  EventProgressNotFoundError,
  asyncHandler,
} = require('../utils/errors');

// ==================== 活动管理 ====================

exports.getAllEvents = asyncHandler(async (req, res) => {
  const includeInactive = req.query.include_inactive === 'true';
  const events = await gameEventService.getAllEvents(includeInactive);
  successResponse(res, events, '获取活动列表成功');
});

exports.getActiveEvents = asyncHandler(async (req, res) => {
  const events = await gameEventService.getActiveEvents();
  successResponse(res, events, '获取活动成功');
});

exports.getEventById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await gameEventService.getEventById(id);

  if (!event) {
    throw new EventNotFoundError();
  }

  successResponse(res, event, '获取活动成功');
});

exports.createEvent = asyncHandler(async (req, res) => {
  const adminId = req.user?.id || 1;
  const event = await gameEventService.createEvent(req.body, adminId);
  createdResponse(res, event, '活动创建成功');
});

exports.updateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const event = await gameEventService.updateEvent(id, req.body);
    successResponse(res, event, '活动更新成功');
  } catch (error) {
    if (error.message === '活动不存在') {
      throw new EventNotFoundError();
    }
    throw error;
  }
});

exports.deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await gameEventService.deleteEvent(id);
  successResponse(res, null, '活动删除成功');
});

// ==================== 任务管理 ====================

exports.getEventTasks = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const tasks = await gameEventService.getEventTasks(eventId);
  successResponse(res, tasks, '获取活动任务成功');
});

exports.addTask = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const task = await gameEventService.addTask(eventId, req.body);
  createdResponse(res, task, '任务添加成功');
});

exports.updateTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  try {
    const task = await gameEventService.updateTask(taskId, req.body);
    successResponse(res, task, '任务更新成功');
  } catch (error) {
    if (error.message === '任务不存在') {
      throw new EventTaskNotFoundError();
    }
    throw error;
  }
});

exports.deleteTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  await gameEventService.deleteTask(taskId);
  successResponse(res, null, '任务删除成功');
});

// ==================== 玩家进度 ====================

exports.getPlayerEventProgress = asyncHandler(async (req, res) => {
  const { playerId, eventId } = req.params;
  const progress = await gameEventService.getPlayerEventProgress(
    playerId,
    eventId
  );
  successResponse(res, progress, '获取玩家活动进度成功');
});

exports.claimTaskReward = asyncHandler(async (req, res) => {
  const { playerId, eventId, taskId } = req.params;
  try {
    const result = await gameEventService.claimTaskReward(
      playerId,
      eventId,
      taskId
    );
    successResponse(res, result, '奖励领取成功');
  } catch (error) {
    if (error.message === '进度记录不存在') {
      throw new EventProgressNotFoundError();
    } else if (error.message === '任务尚未完成') {
      throw new EventTaskNotCompletedError();
    } else if (error.message === '奖励已领取') {
      throw new EventRewardAlreadyClaimedError();
    }
    throw error;
  }
});

// ==================== 统计 ====================

exports.getEventStats = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const stats = await gameEventService.getEventStats(eventId);
  successResponse(res, stats, '获取活动统计成功');
});

exports.getPlayerEventStats = asyncHandler(async (req, res) => {
  const { playerId } = req.params;
  const stats = await gameEventService.getPlayerEventStats(playerId);
  successResponse(res, stats, '获取玩家活动统计成功');
});

exports.startEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await gameEventService.startEvent(id);
  if (!event) throw new EventNotFoundError();
  successResponse(res, event, '活动已启动');
});

exports.pauseEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await gameEventService.pauseEvent(id);
  if (!event) throw new EventNotFoundError();
  successResponse(res, event, '活动已暂停');
});

exports.endEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await gameEventService.endEvent(id);
  if (!event) throw new EventNotFoundError();
  successResponse(res, event, '活动已结束');
});

exports.resumeEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await gameEventService.resumeEvent(id);
  if (!event) throw new EventNotFoundError();
  successResponse(res, event, '活动已恢复');
});

/**
 * 获取管理后台活动进度概览
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @returns {Object} 活动进度聚合数据
 */
exports.getAdminEventProgress = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const progress = await gameEventService.getAdminEventProgress(eventId);
  successResponse(res, progress, '获取活动进度成功');
});
