/**
 * 文件名：batchImportExportRoutes.js
 * 作者：开发者
 * 日期：2026-05-26
 * 版本：v1.1.0
 * 功能描述：批量数据导入/导出路由配置
 * 更新记录：
 *   2026-05-26 - v1.0.0 - 初始版本创建
 *   2026-05-26 - v1.1.0 - 集成 express-validator 请求验证
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const controller = require('../controllers/batchImportExportController');
const validate = require('../middleware/validate');

/** 确保上传目录存在 */
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/** multer 配置 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `import_${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB 限制
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.csv', '.json', '.xlsx', '.xls'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 CSV、JSON、Excel 文件格式'));
    }
  },
});

/** 导出相关路由 */
// POST /api/batch/export - 发起导出任务（需要请求体验证）
router.post('/export', validate.exportData, controller.exportData);

// GET /api/batch/export/:taskId/status - 查询导出进度
router.get('/export/:taskId/status', controller.getExportProgress);

// GET /api/batch/export/:taskId/download - 下载导出文件
router.get('/export/:taskId/download', controller.downloadExportFile);

/** 导入相关路由 */
// POST /api/batch/import - 发起导入任务（multipart文件上传 + 请求体验证）
router.post('/import', upload.single('file'), validate.importData, controller.importData);

// GET /api/batch/import/:taskId/status - 查询导入进度
router.get('/import/:taskId/status', controller.getImportProgress);

// GET /api/batch/import/:taskId/errors - 获取导入错误详情
router.get('/import/:taskId/errors', controller.getImportErrors);

/** 通用路由 */
// GET /api/batch/tables - 获取可导入/导出的表列表
router.get('/tables', controller.getTables);

module.exports = router;
