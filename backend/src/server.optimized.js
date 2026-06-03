/**
 * 文件名：server.optimized.js
 * 作者：AI助手
 * 日期：2026-04-26
 * 版本：v2.0.0
 * 功能描述：优化后的后端服务器入口文件
 * 更新记录：
 *   2026-04-26 - v2.0.0 - 整合统一错误处理、配置管理，保持功能完全兼容
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const { Server } = require('socket.io');

const { config, validateConfig } = require('./config/index');
const { errorHandler, asyncHandler } = require('./utils/errors');
const { successResponse } = require('./utils/response');
const swaggerSpec = require('./config/swagger');

const authRoutes = require('./routes/authRoutes');
const playerRoutes = require('./routes/playerRoutes');
const farmRoutes = require('./routes/farmRoutes');
const cropRoutes = require('./routes/cropRoutes');
const shopRoutes = require('./routes/shopRoutes');
const itemRoutes = require('./routes/itemRoutes');
const economyRoutes = require('./routes/economyRoutes');
const gameActivityRoutes = require('./routes/gameActivityRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const adminRoutes = require('./routes/adminRoutes');

const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');
const authMiddleware = require('./middleware/authMiddleware');
const schedulerService = require('./services/schedulerService');
const backupService = require('./services/backupService');
const monitoringService = require('./services/monitoringService');
const cropMonitorService = require('./services/cropMonitorService');

const connectedUsers = new Map();
let io = null;

validateConfig();

const app = express();
const PORT = config.port;

app.use(compression());
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json());
app.use(requestLogger);

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, message: '请求过于频繁，请稍后再试' },
});
app.use('/api/auth/login', (req, res, next) => {
  limiter(req, res, (err) => {
    if (err) logger.warn('速率限制触发', { ip: req.ip, url: req.originalUrl });
    next();
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/farm', farmRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/economy', economyRoutes);
app.use('/api/game-activity', gameActivityRoutes);
app.use('/api', achievementRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  successResponse(res, { status: 'ok' }, '服务运行正常');
});

app.get('/api/time', (req, res) => {
  const serverTime = Date.now();
  successResponse(res, {
    serverTime,
    serverTimeISO: new Date(serverTime).toISOString(),
  });
});

app.use((req, res) => {
  logger.warn('404接口不存在', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.post(
  '/api/admin/backup',
  authMiddleware,
  asyncHandler(async (req, res) => {
    if (!req.user.is_admin) {
      logger.warn('非管理员尝试访问备份API', {
        userId: req.user.id,
        username: req.user.username,
        ip: req.ip,
      });
      return res.status(403).json({ success: false, message: '无管理员权限' });
    }
    const result = await backupService.createBackup();
    logger.info('管理员创建备份', {
      userId: req.user.id,
      username: req.user.username,
    });
    successResponse(res, result, '备份创建成功');
  })
);

app.get(
  '/api/admin/backups',
  authMiddleware,
  asyncHandler(async (req, res) => {
    if (!req.user.is_admin) {
      logger.warn('非管理员尝试访问备份列表API', {
        userId: req.user.id,
        username: req.user.username,
        ip: req.ip,
      });
      return res.status(403).json({ success: false, message: '无管理员权限' });
    }
    const backups = backupService.listBackups();
    successResponse(res, backups);
  })
);

app.use(errorHandler);

let server;
if (config.env !== 'test') {
  server = app.listen(PORT, () => {
    logger.info(`后端服务运行在: http://localhost:${PORT}`);

    try {
      logger.info('定时备份任务已暂时禁用，避免Windows兼容性问题');
    } catch (error) {
      logger.error('初始化定时备份任务失败', { error: error.message });
    }

    if (config.monitoring.enabled) {
      try {
        monitoringService.startMonitoring(config.monitoring.interval);
        logger.info('系统监控服务已启动');
      } catch (error) {
        logger.error('启动系统监控服务失败', { error: error.message });
      }
    }

    try {
      cropMonitorService.start();
      logger.info('作物成熟监测服务已启动');
    } catch (error) {
      logger.error('启动作物成熟监测服务失败', { error: error.message });
    }
  });

  const allowedOrigins = config.cors.origin.filter(
    (origin) => origin.startsWith('http://') || origin.startsWith('https://')
  );

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  module.exports.io = io;
  module.exports.connectedUsers = connectedUsers;

  io.on('connection', (socket) => {
    logger.info('新的WebSocket连接', { socketId: socket.id });
    socket.on('authenticate', (token) => {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, config.jwt.secret);
        const userId = decoded.userId.toString();
        connectedUsers.set(userId, socket.id);
        socket.userId = userId;
        logger.info('用户认证成功', { userId, socketId: socket.id });
        socket.emit('authenticated', { success: true, userId });
      } catch (error) {
        logger.warn('WebSocket认证失败', { error: error.message });
        socket.emit('authentication_error', { message: '认证失败' });
        socket.disconnect();
      }
    });
    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        logger.info('用户断开连接', {
          userId: socket.userId,
          socketId: socket.id,
        });
      } else {
        logger.info('未认证用户断开连接', { socketId: socket.id });
      }
    });
    socket.on('ping', () => socket.emit('pong'));
  });
}

process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，正在关闭服务器');
  schedulerService.stopAllJobs();
  server &&
    server.close(() => {
      logger.info('服务器已关闭');
      process.exit(0);
    });
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，正在关闭服务器');
  schedulerService.stopAllJobs();
  server &&
    server.close(() => {
      logger.info('服务器已关闭');
      process.exit(0);
    });
});

process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝', {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });
});

module.exports = app;
module.exports.io = io;
module.exports.connectedUsers = connectedUsers;
