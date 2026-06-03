/**
 * 文件名：announcementController.js
 * 作者：Trae AI
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：游戏公告发布系统控制器，处理公告相关的API请求
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始版本创建
 */

const { body, validationResult, query } = require('express-validator');
const announcementService = require('../services/announcementService');
const logger = require('../config/logger');

/**
 * 获取公告列表
 */
exports.getAnnouncementList = async function (req, res) {
  try {
    const { page = 1, pageSize = 20, title, category, status } = req.query;

    const result = await announcementService.getAnnouncementList(
      { title, category, status },
      parseInt(page),
      parseInt(pageSize)
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('获取公告列表失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取公告详情
 */
exports.getAnnouncementDetail = async function (req, res) {
  try {
    const { id } = req.params;
    const announcement = await announcementService.getAnnouncementDetail(
      parseInt(id)
    );

    if (!announcement) {
      return res.status(404).json({ success: false, message: '公告不存在' });
    }

    res.status(200).json({ success: true, data: announcement });
  } catch (error) {
    logger.error('获取公告详情失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 创建公告
 */
exports.createAnnouncement = [
  body('title').notEmpty().withMessage('公告标题不能为空'),
  body('content').notEmpty().withMessage('公告内容不能为空'),
  async function (req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const announcement = await announcementService.createAnnouncement(
        req.body,
        req.user.id,
        req.user.username
      );

      res
        .status(201)
        .json({ success: true, data: announcement, message: '公告创建成功' });
    } catch (error) {
      logger.error('创建公告失败', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  },
];

/**
 * 更新公告
 */
exports.updateAnnouncement = [
  body('title').notEmpty().withMessage('公告标题不能为空'),
  body('content').notEmpty().withMessage('公告内容不能为空'),
  async function (req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const announcement = await announcementService.updateAnnouncement(
        parseInt(id),
        req.body,
        req.user.id
      );

      res
        .status(200)
        .json({ success: true, data: announcement, message: '公告更新成功' });
    } catch (error) {
      logger.error('更新公告失败', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  },
];

/**
 * 删除公告
 */
exports.deleteAnnouncement = async function (req, res) {
  try {
    const { id } = req.params;
    await announcementService.deleteAnnouncement(parseInt(id));

    res.status(200).json({ success: true, message: '公告删除成功' });
  } catch (error) {
    logger.error('删除公告失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 发布公告
 */
exports.publishAnnouncement = async function (req, res) {
  try {
    const { id } = req.params;
    const announcement = await announcementService.publishAnnouncement(
      parseInt(id),
      req.user.id
    );

    res
      .status(200)
      .json({ success: true, data: announcement, message: '公告发布成功' });
  } catch (error) {
    logger.error('发布公告失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 下线公告
 */
exports.offlineAnnouncement = async function (req, res) {
  try {
    const { id } = req.params;
    const announcement = await announcementService.offlineAnnouncement(
      parseInt(id)
    );

    res
      .status(200)
      .json({ success: true, data: announcement, message: '公告下线成功' });
  } catch (error) {
    logger.error('下线公告失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 定时发布公告
 */
exports.scheduleAnnouncement = [
  body('scheduled_time').notEmpty().withMessage('定时时间不能为空'),
  async function (req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const announcement = await announcementService.scheduleAnnouncement(
        parseInt(id),
        new Date(req.body.scheduled_time)
      );

      res.status(200).json({
        success: true,
        data: announcement,
        message: '定时发布设置成功',
      });
    } catch (error) {
      logger.error('设置定时发布失败', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  },
];

/**
 * 设置公告置顶
 */
exports.setAnnouncementTop = async function (req, res) {
  try {
    const { id } = req.params;
    const { is_top } = req.body;
    const announcement = await announcementService.setAnnouncementTop(
      parseInt(id),
      is_top !== undefined ? is_top : true
    );

    res
      .status(200)
      .json({ success: true, data: announcement, message: '置顶设置成功' });
  } catch (error) {
    logger.error('设置置顶失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取公告分类列表
 */
exports.getAnnouncementCategories = async function (req, res) {
  try {
    const categories = await announcementService.getAnnouncementCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    logger.error('获取公告分类失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取公告统计数据
 */
exports.getAnnouncementStatistics = async function (req, res) {
  try {
    const statistics = await announcementService.getAnnouncementStatistics();
    res.status(200).json({ success: true, data: statistics });
  } catch (error) {
    logger.error('获取公告统计失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};
