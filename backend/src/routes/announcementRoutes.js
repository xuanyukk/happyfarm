/**
 * 文件名：announcementRoutes.js
 * 作者：Trae AI
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：游戏公告发布系统路由配置
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始版本创建
 */

const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authMiddleware } = require('../middleware/authMiddleware');

const {
  getAnnouncementList,
  getAnnouncementDetail,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
  offlineAnnouncement,
  scheduleAnnouncement,
  setAnnouncementTop,
  getAnnouncementCategories,
  getAnnouncementStatistics,
} = announcementController;

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Announcement
 *   description: 游戏公告管理接口
 */

/**
 * @swagger
 * /admin/announcements:
 *   get:
 *     summary: 获取公告列表
 *     tags: [Announcement]
 *     parameters:
 *       - in: query
 *         name: page
 *         description: 页码
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         description: 每页数量
 *         schema:
 *           type: integer
 *       - in: query
 *         name: title
 *         description: 标题搜索
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         description: 分类筛选
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         description: 状态筛选
 *         schema:
 *           type: string
 */
router.get('/', getAnnouncementList);

/**
 * @swagger
 * /admin/announcements/categories:
 *   get:
 *     summary: 获取公告分类列表
 *     tags: [Announcement]
 */
router.get('/categories', getAnnouncementCategories);

/**
 * @swagger
 * /admin/announcements/statistics:
 *   get:
 *     summary: 获取公告统计数据
 *     tags: [Announcement]
 */
router.get('/statistics', getAnnouncementStatistics);

/**
 * @swagger
 * /admin/announcements/{id}:
 *   get:
 *     summary: 获取公告详情
 *     tags: [Announcement]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 公告ID
 *         schema:
 *           type: integer
 */
router.get('/:id', getAnnouncementDetail);

/**
 * @swagger
 * /admin/announcements:
 *   post:
 *     summary: 创建公告
 *     tags: [Announcement]
 */
router.post('/', createAnnouncement);

/**
 * @swagger
 * /admin/announcements/{id}:
 *   put:
 *     summary: 更新公告
 *     tags: [Announcement]
 */
router.put('/:id', updateAnnouncement);

/**
 * @swagger
 * /admin/announcements/{id}:
 *   delete:
 *     summary: 删除公告
 *     tags: [Announcement]
 */
router.delete('/:id', deleteAnnouncement);

/**
 * @swagger
 * /admin/announcements/{id}/publish:
 *   post:
 *     summary: 发布公告
 *     tags: [Announcement]
 */
router.post('/:id/publish', publishAnnouncement);

/**
 * @swagger
 * /admin/announcements/{id}/offline:
 *   post:
 *     summary: 下线公告
 *     tags: [Announcement]
 */
router.post('/:id/offline', offlineAnnouncement);

/**
 * @swagger
 * /admin/announcements/{id}/schedule:
 *   post:
 *     summary: 定时发布公告
 *     tags: [Announcement]
 */
router.post('/:id/schedule', scheduleAnnouncement);

/**
 * @swagger
 * /admin/announcements/{id}/top:
 *   post:
 *     summary: 设置公告置顶
 *     tags: [Announcement]
 */
router.post('/:id/top', setAnnouncementTop);

module.exports = router;
