/**
 * 文件名：gameEventExtensionController.js
 * 作者：Trae AI
 * 日期：2026-05-22
 * 版本：v1.0.0
 * 功能描述：游戏活动扩展功能控制器（触发器、统计）
 * 更新记录：
 *   2026-05-22 - v1.0.0 - 初始版本
 */

const gameEventTriggerService = require('../services/gameEventTriggerService');
const gameEventStatsService = require('../services/gameEventStatsService');
const gameEventWebSocketService = require('../services/gameEventWebSocketService');
const logger = require('../config/logger');
const { successResponse, createdResponse } = require('../utils/response');
const { asyncHandler } = require('../utils/errors');

// ==================== 触发器管理 ====================

exports.createTrigger = asyncHandler(async (req, res) => {
  const trigger = await gameEventTriggerService.createTrigger(req.body);
  createdResponse(res, trigger, '触发器创建成功');
});

exports.getEventTriggers = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const triggers = await gameEventTriggerService.getEventTriggers(eventId);
  successResponse(res, triggers, '获取活动触发器成功');
});

exports.getAllTriggers = asyncHandler(async (req, res) => {
  const triggers = await gameEventTriggerService.getAllTriggers();
  successResponse(res, triggers, '获取所有触发器成功');
});

exports.updateTrigger = asyncHandler(async (req, res) => {
  const { triggerId } = req.params;
  const trigger = await gameEventTriggerService.updateTrigger(
    triggerId,
    req.body
  );
  successResponse(res, trigger, '触发器更新成功');
});

exports.deleteTrigger = asyncHandler(async (req, res) => {
  const { triggerId } = req.params;
  await gameEventTriggerService.deleteTrigger(triggerId);
  successResponse(res, null, '触发器删除成功');
});

// ==================== 统计管理 ====================

exports.computeEventStats = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { date } = req.query;
  const stats = await gameEventStatsService.computeEventStats(eventId, date);
  successResponse(res, stats, '计算活动统计成功');
});

exports.getEventStats = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { start_date, end_date } = req.query;
  const stats = await gameEventStatsService.getEventStats(
    eventId,
    start_date,
    end_date
  );
  successResponse(res, stats, '获取活动统计成功');
});

exports.getEventFunnel = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { date } = req.query;
  const funnel = await gameEventStatsService.getEventFunnel(eventId, date);
  successResponse(res, funnel, '获取活动漏斗成功');
});

exports.computeAllEventsStats = asyncHandler(async (req, res) => {
  const { date } = req.query;
  await gameEventStatsService.computeAllEventsStats(date);
  successResponse(res, null, '批量计算活动统计成功');
});

// ==================== WebSocket 管理 ====================

exports.getWebSocketQueueStats = asyncHandler(async (req, res) => {
  const stats = gameEventWebSocketService.getQueueStats();
  successResponse(res, stats, '获取WebSocket队列统计成功');
});
