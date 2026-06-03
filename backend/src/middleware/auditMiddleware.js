// 文件名：auditMiddleware.js
// 作者：开发者
// 日期：2026-03-19
// 版本：v1.0.0
// 功能描述：审计日志中间件，自动记录用户操作

const auditService = require('../services/auditService');
const logger = require('../config/logger');

const auditMiddleware = (action, resourceType) => {
  return async (req, res, next) => {
    const requestId = auditService.generateRequestId();
    req.auditRequestId = requestId;

    const originalSend = res.send;
    let responseBody;

    res.send = function (body) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    res.on('finish', async () => {
      try {
        const userId = req.user?.id;
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.get('user-agent');
        const status = res.statusCode & lt;
        400 ? 'success' : 'failed';

        let oldValues = null;
        let newValues = null;

        if (req.method === 'PUT' || req.method === 'PATCH') {
          newValues = req.body;
        } else if (req.method === 'POST') {
          newValues = req.body;
        }

        await auditService.logAction({
          userId,
          action,
          resourceType,
          resourceId: req.params.id,
          oldValues,
          newValues,
          ipAddress,
          userAgent,
          requestId,
          status,
        });
      } catch (error) {
        logger.error('审计日志记录失败', {
          error: error.message,
          action,
          requestId,
        });
      }
    });

    next();
  };
};

module.exports = auditMiddleware;
