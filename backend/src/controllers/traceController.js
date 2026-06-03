/**
 * 文件名：traceController.js
 * 作者：开发者
 * 日期：2026-05-16
 * 版本：v1.0.0
 * 功能描述：链路追踪控制器，提供链路追踪API
 * 更新记录：
 *   2026-05-16 - v1.0.0 - 初始版本，提供链路追踪API
 */

const traceService = require('../services/traceService');
const logger = require('../config/logger');

/**
 * 获取追踪详情
 */
const getTrace = async (req, res) => {
  try {
    const { traceId } = req.params;

    const trace = traceService.getTrace(traceId);

    if (!trace) {
      return res.status(404).json({
        success: false,
        message: '追踪信息不存在或已过期',
      });
    }

    res.status(200).json({
      success: true,
      data: trace,
    });
  } catch (error) {
    logger.error('获取追踪信息失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取追踪信息失败',
      error: error.message,
    });
  }
};

/**
 * 根据requestId获取追踪
 */
const getTraceByRequestId = async (req, res) => {
  try {
    const { requestId } = req.params;

    const trace = traceService.getTraceByRequestId(requestId);

    if (!trace) {
      return res.status(404).json({
        success: false,
        message: '追踪信息不存在或已过期',
      });
    }

    res.status(200).json({
      success: true,
      data: trace,
    });
  } catch (error) {
    logger.error('根据requestId获取追踪失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取追踪信息失败',
      error: error.message,
    });
  }
};

/**
 * 搜索追踪信息
 */
const searchTraces = async (req, res) => {
  try {
    const {
      operationName,
      status,
      minDuration,
      maxDuration,
      startTimeFrom,
      startTimeTo,
      limit = 100,
    } = req.query;

    const traces = traceService.searchTraces({
      operationName,
      status,
      minDuration: minDuration ? Number(minDuration) : undefined,
      maxDuration: maxDuration ? Number(maxDuration) : undefined,
      startTimeFrom,
      startTimeTo,
      limit: Number(limit),
    });

    res.status(200).json({
      success: true,
      data: traces,
      count: traces.length,
    });
  } catch (error) {
    logger.error('搜索追踪信息失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '搜索追踪信息失败',
      error: error.message,
    });
  }
};

/**
 * 获取追踪统计信息
 */
const getTraceStats = async (req, res) => {
  try {
    const stats = traceService.getTraceStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('获取追踪统计失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取追踪统计失败',
      error: error.message,
    });
  }
};

/**
 * 开始一个新的追踪（供手动调用）
 */
const startManualTrace = async (req, res) => {
  try {
    const { requestId, traceId, parentSpanId, operationName, metadata } =
      req.body;

    const traceContext = traceService.startTrace({
      requestId,
      traceId,
      parentSpanId,
      operationName: operationName || 'manual_trace',
      metadata,
    });

    res.status(201).json({
      success: true,
      data: traceContext,
      message: '追踪已开始',
    });
  } catch (error) {
    logger.error('开始手动追踪失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '开始追踪失败',
      error: error.message,
    });
  }
};

/**
 * 结束追踪（供手动调用）
 */
const endManualTrace = async (req, res) => {
  try {
    const { traceId } = req.params;
    const { status = 'success', result, error } = req.body;

    // 获取追踪上下文
    const traceContext = traceService.getTrace(traceId);
    if (!traceContext) {
      return res.status(404).json({
        success: false,
        message: '追踪信息不存在',
      });
    }

    // 结束追踪
    const completeTrace = traceService.endTrace(traceContext, {
      status,
      result,
      error: error ? new Error(error) : null,
    });

    res.status(200).json({
      success: true,
      data: completeTrace,
      message: '追踪已结束',
    });
  } catch (error) {
    logger.error('结束手动追踪失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '结束追踪失败',
      error: error.message,
    });
  }
};

/**
 * 记录追踪事件
 */
const recordTraceEvent = async (req, res) => {
  try {
    const { traceId } = req.params;
    const { eventName, eventData } = req.body;

    // 获取追踪上下文
    const traceContext = traceService.getTrace(traceId);
    if (!traceContext) {
      return res.status(404).json({
        success: false,
        message: '追踪信息不存在',
      });
    }

    // 记录事件
    traceService.recordEvent(traceContext, eventName, eventData);

    res.status(200).json({
      success: true,
      message: '事件已记录',
    });
  } catch (error) {
    logger.error('记录追踪事件失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '记录事件失败',
      error: error.message,
    });
  }
};

module.exports = {
  getTrace,
  getTraceByRequestId,
  searchTraces,
  getTraceStats,
  startManualTrace,
  endManualTrace,
  recordTraceEvent,
};
