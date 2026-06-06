/**
 * 文件名：server.js
 * 作者：开发者
 * 日期：2026-05-22
 * 版本：v3.11.0
 * 功能描述：后端服务器入口文件
 * 更新记录：
 *   2026-03-19 - v1.0.0 - 初始版本创建
 *   2026-03-21 - v1.1.0 - 添加playerRoutes和itemRoutes路由挂载
 *   2026-03-22 - v1.1.1 - 添加economyRoutes路由挂载
 *   2026-03-26 - v1.2.0 - 添加gameActivityRoutes游戏活动日志路由挂载
 *   2026-03-27 - v1.3.0 - 集成WebSocket实时通信功能
 *   2026-03-29 - v1.4.0 - 添加服务器时间同步接口
 *   2026-03-29 - v1.5.0 - 添加作物成熟监测服务
 *   2026-04-30 - v1.6.0 - 添加RBAC角色权限管理路由
 *   2026-04-30 - v1.7.0 - 添加游戏公告发布系统路由
 *   2026-04-30 - v1.8.0 - 添加游戏参数配置管理路由
 *   2026-05-01 - v1.9.0 - 添加批量操作功能路由
 *   2026-05-01 - v2.0.0 - 添加实时预警推送系统
 *   2026-05-04 - v2.1.0 - 添加Windows终端中文编码支持
 *   2026-05-06 - v2.2.0 - 添加系统健康检查路由
 *   2026-05-06 - v2.3.0 - 添加完整的备份与恢复系统路由
 *   2026-05-06 - v2.4.0 - 添加完整的日志分析与可视化系统路由
 *   2026-05-06 - v2.5.0 - 添加完整的游戏活动管理系统路由
 *   2026-05-09 - v2.6.0 - 添加完整的数据仓库与BI分析系统路由
 *   2026-05-12 - v2.7.0 - 添加缓存预热和缓存统计功能
 *   2026-05-12 - v2.8.0 - 添加数据库性能管理API（索引、缓存、健康检查）
 *   2026-05-12 - v2.9.0 - 统一使用响应工具，确保API输出格式一致
 *   2026-05-12 - v3.0.0 - 集成错误分类系统，提供更精确的错误信息
 *   2026-05-13 - v3.1.0 - 添加高级日志功能：链路追踪、脱敏、异步写入、告警管理
 *   2026-05-15 - v3.2.0 - 添加客户端日志上报功能，支持单条和批量上报
 *   2026-05-16 - v3.3.0 - 完善链路追踪系统，添加完整的链路追踪API
 *   2026-05-16 - v3.4.0 - 添加日志清理服务，支持不同类型日志的差异化保留策略
 *   2026-05-18 - v3.5.0 - 添加系统监控告警服务（服务器资源、应用性能）
 *   2026-05-18 - v3.6.0 - 添加业务指标监控系统（交易成功率、用户活跃度、趋势预测）
 *   2026-05-22 - v3.7.0 - 添加游戏活动系统扩展功能路由（触发器、统计）
 *   2026-05-22 - v3.8.0 - 添加游戏活动中期规划路由（模板系统、定时任务）
 *   2026-05-26 - v3.9.0 - 添加Grafana监控嵌入功能和批量数据导入/导出路由
 *   2026-05-26 - v3.10.0 - 优化全局异常处理（优雅关闭），为管理后台路由集成express-validator请求验证
 *   2026-06-05 - v3.11.0 - 拆分行内管理员路由到adminManagementRoutes.js，精简server.js至约800行
 */

// 修复Windows终端中文乱码问题
if (process.platform === 'win32') {
  try {
    const { execSync } = require('child_process');
    // 设置控制台为UTF-8编码
    execSync('chcp 65001 > nul', { stdio: 'ignore' });
    // 设置标准输出和错误输出的编码为UTF-8
    process.stdout.setEncoding('utf8');
    process.stderr.setEncoding('utf8');
  } catch (e) {
    // 忽略错误，不影响程序运行
  }
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { Server } = require('socket.io');
const { responseTimeMiddleware } = require('./middleware/responseTime');
const logger = require('./config/logger');

let client;
let collectDefaultMetrics;
let httpRequestDurationMicroseconds;
let httpRequestsTotal;
try {
  client = require('prom-client');
  collectDefaultMetrics = client.collectDefaultMetrics;
  httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  });
  httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'code'],
  });
} catch (e) {
  logger.warn('prom-client 模块未安装，指标功能将不可用');
}
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
const rbacRoutes = require('./routes/rbacRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const configRoutes = require('./routes/configRoutes');
const batchRoutes = require('./routes/batchRoutes');
const alertRoutes = require('./routes/alertRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const healthRoutes = require('./routes/healthRoutes');
const backupRoutes = require('./routes/backupRoutes');
const logAnalysisRoutes = require('./routes/logAnalysisRoutes');
const gameEventRoutes = require('./routes/gameEventRoutes');
const dataWarehouseRoutes = require('./routes/dataWarehouseRoutes');
const clientLogRoutes = require('./routes/clientLogRoutes');
const traceRoutes = require('./routes/traceRoutes');
const logCleanupRoutes = require('./routes/logCleanupRoutes');
const monitoringRoutes = require('./routes/monitoringRoutes');
const businessMetricsRoutes = require('./routes/businessMetricsRoutes');
const userGameEventRoutes = require('./routes/userGameEventRoutes');
const gameEventExtensionRoutes = require('./routes/gameEventExtensionRoutes');
const gameEventMediumRoutes = require('./routes/gameEventMediumRoutes');
const adminCropRoutes = require('./routes/adminCropRoutes');
const adminItemRoutes = require('./routes/adminItemRoutes');
const adminGameConfigRoutes = require('./routes/adminGameConfigRoutes');
const dailyTaskRoutes = require('./routes/dailyTaskRoutes');
const dailyDiscountRoutes = require('./routes/dailyDiscountRoutes');
const itemUsageLogRoutes = require('./routes/itemUsageLogRoutes');
const currencyConfigRoutes = require('./routes/currencyConfigRoutes');
const grafanaRoutes = require('./routes/grafanaRoutes');
const batchImportExportRoutes = require('./routes/batchImportExportRoutes');
const adminShopRoutes = require('./routes/adminShopRoutes');
const adminAchievementRoutes = require('./routes/adminAchievementRoutes');
const adminFarmLevelRoutes = require('./routes/adminFarmLevelRoutes');
const adminDatabaseRoutes = require('./routes/adminDatabaseRoutes');
const adminMailRoutes = require('./routes/adminMailRoutes');
const adminManagementRoutes = require('./routes/adminManagementRoutes');
const queueRoutes = require('./routes/queueRoutes');
const docsAuthRoutes = require('./routes/docsAuthRoutes');
const requestLogger = require('./middleware/requestLogger');
const { authMiddleware } = require('./middleware/authMiddleware');
const schedulerService = require('./services/schedulerService');
const { queueService } = require('./services/queueService');
const gameEventSchedulerService = require('./services/gameEventSchedulerService');
const {
  successResponse,
  errorResponse,
  notFoundResponse,
} = require('./utils/response');
const { errorHandler, ErrorCodes } = require('./utils/errors');
const monitoringService = require('./services/monitoringService');
const cropMonitorService = require('./services/cropMonitorService');
const cacheService = require('./services/cacheService');
const pool = require('./config/db');
const serviceProvider = require('./config/serviceProvider');

// 高级日志功能模块
const {
  logMetrics,
  asyncWriter,
  alertManager,
  requestTracer,
  SensitiveDataMasker,
} = require('./utils/logger-advanced');

// WebSocket连接管理
const connectedUsers = new Map();
let io = null;

// 加载环境变量
dotenv.config({
  debug: process.env.NODE_ENV === 'development',
});

const app = express();
const PORT = process.env.PORT || 3001;

// 初始化Prometheus指标（仅在prom-client可用时）
if (collectDefaultMetrics) {
  collectDefaultMetrics({ prefix: 'happy_farm_' });
}

// HTTP请求统计中间件（仅在指标可用时）
if (httpRequestDurationMicroseconds && httpRequestsTotal) {
  app.use((req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
      end({ method: req.method, route: req.path, code: res.statusCode });
      httpRequestsTotal.inc({
        method: req.method,
        route: req.path,
        code: res.statusCode,
      });
    });
    next();
  });
}

// ==========================================
// DI容器初始化（向后兼容，可选使用）
// ==========================================
// 仅在非测试环境下初始化完整服务
if (process.env.NODE_ENV !== 'test') {
  serviceProvider.registerAll();
  logger.info('DI容器初始化完成');
}
// ==========================================

// Gzip压缩中间件（应放在最前面）
app.use(compression());

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
})); // 增加安全性

// 跨域中间件
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Trace-Id',
    ],
    credentials: true,
    maxAge: 86400, // 预检请求缓存 24 小时
  })
);

// 解析JSON请求体
app.use(express.json());

// 请求日志中间件
app.use(requestLogger);

// API响应时间监控
app.use(responseTimeMiddleware);

// 请求链路追踪中间件
app.use((req, res, next) => {
  // 开始链路追踪
  const trace = requestTracer.startTrace(req);
  req.traceId = trace.traceId;
  res.setHeader('X-Trace-ID', trace.traceId);

  // 包装响应结束链路追踪
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    requestTracer.endTrace(trace.traceId, res.statusCode);
    originalEnd.call(this, chunk, encoding);
  };

  next();
});

// 速率限制（防止暴力破解）
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX), // 从环境变量获取限制次数
  message: { message: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});
// 将限流器应用到所有认证路由，防止暴力破解和枚举攻击
app.use('/api/auth', (req, res, next) => {
  limiter(req, res, (err) => {
    if (err) {
      logger.warn('速率限制触发', {
        ip: req.ip,
        url: req.originalUrl,
      });
    }
    next();
  });
});

// Prometheus指标端点（仅在prom-client可用时）
app.get('/api/metrics', async (req, res) => {
  if (!client) {
    return res.status(501).json({ error: 'prom-client 模块未安装' });
  }
  res.set('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

// 路由挂载
app.use('/api/auth', authRoutes);
app.use('/api/docs/auth', docsAuthRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/farm', farmRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/economy', economyRoutes);
app.use('/api/game-activity', gameActivityRoutes);
app.use('/api', achievementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/rbac', rbacRoutes);
app.use('/api/admin/announcements', announcementRoutes);
app.use('/api/admin/configs', configRoutes);
app.use('/api/admin/batch', batchRoutes);
app.use('/api/admin/alerts', alertRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/', healthRoutes);
app.use('/api/admin/backup', backupRoutes);
app.use('/api/admin/log-analysis', logAnalysisRoutes);
app.use('/api/admin/game-events', gameEventRoutes);
app.use('/api/datawarehouse', dataWarehouseRoutes);
app.use('/api/client-logs', clientLogRoutes);
app.use('/api/traces', traceRoutes);
app.use('/api/admin/log-cleanup', logCleanupRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/business-metrics', businessMetricsRoutes);
app.use('/api/game-events', userGameEventRoutes);
app.use('/api/daily-tasks', dailyTaskRoutes);
app.use('/api/daily-discounts', dailyDiscountRoutes);
app.use('/api/item-usage-logs', itemUsageLogRoutes);
app.use('/api/admin/game-event-extensions', gameEventExtensionRoutes);
app.use('/api/admin/game-event-medium', gameEventMediumRoutes);
app.use('/api/admin/crops', adminCropRoutes);
app.use('/api/admin/items', adminItemRoutes);
app.use('/api/admin/game-config', adminGameConfigRoutes);
app.use('/api/currency-config', currencyConfigRoutes);
app.use('/api/grafana', grafanaRoutes);
app.use('/api/batch', batchImportExportRoutes);
app.use('/api/admin/shop', adminShopRoutes);
app.use('/api/admin/achievements', adminAchievementRoutes);
app.use('/api/admin/farm-levels', adminFarmLevelRoutes);
app.use('/api/admin/database', adminDatabaseRoutes);
app.use('/api/admin/mails', adminMailRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api', adminManagementRoutes);

// Swagger API文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: 健康检查接口
 *     description: 检查后端服务是否正常运行
 *     tags: [健康检查]
 *     responses:
 *       200:
 *         description: 服务正常运行
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * @swagger
 * /api/time:
 *   get:
 *     summary: 获取服务器时间
 *     description: 返回服务器当前时间戳，用于前端时间同步
 *     tags: [系统服务]
 *     responses:
 *       200:
 *         description: 成功返回服务器时间
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 serverTime:
 *                   type: number
 *                   description: 服务器时间戳（毫秒）
 *                 serverTimeISO:
 *                   type: string
 *                   description: 服务器时间ISO格式字符串
 */
app.get('/api/time', (req, res) => {
  const serverTime = Date.now();
  res.status(200).json({
    serverTime: serverTime,
    serverTimeISO: new Date(serverTime).toISOString(),
  });
});

// 404处理
app.use((req, res) => {
  logger.warn('404接口不存在', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });
  notFoundResponse(res, '接口不存在', ErrorCodes.NOT_FOUND);
});

// 错误处理中间件
app.use(errorHandler);

// ================================
// 服务器启动
// ================================

// 仅在非测试环境下启动服务器
let server;
if (process.env.NODE_ENV !== 'test') {
  // 启动异步日志写入器
  asyncWriter.start();
  logger.info('异步日志写入器已启动');

  server = app.listen(PORT, () => {
    logger.info(`后端服务运行在: http://localhost:${PORT}`);

    try {
      logger.info('定时备份任务已暂时禁用，避免Windows兼容性问题');
      try {
        schedulerService.startDailyResetJob();
        logger.info('商店每日限购重置任务已启动');
      } catch (error) {
        logger.error('启动商店每日重置任务失败', { error: error.message });
      }
    } catch (error) {
      logger.error('初始化定时备份任务失败', { error: error.message });
    }

    try {
      monitoringService.startMonitoring(60000);
      logger.info('系统监控服务已启动');
    } catch (error) {
      logger.error('启动系统监控服务失败', { error: error.message });
    }

    try {
      cropMonitorService.start();
      logger.info('作物成熟监测服务已启动');
    } catch (error) {
      logger.error('启动作物成熟监测服务失败', { error: error.message });
    }

    // 初始化队列服务（创建Worker，开始消费队列任务）
    try {
      queueService
        .init()
        .then(() => {
          logger.info('队列服务初始化完成');
        })
        .catch((err) => {
          logger.error('队列服务初始化失败', { error: err.message });
        });
    } catch (error) {
      logger.error('队列服务初始化失败', { error: error.message });
    }

    // 初始化游戏活动定时任务调度器
    try {
      gameEventSchedulerService
        .init()
        .then(() => {
          logger.info('游戏活动调度器初始化完成');
        })
        .catch((err) => {
          logger.error('游戏活动调度器初始化失败', { error: err.message });
        });
    } catch (error) {
      logger.error('游戏活动调度器初始化失败', { error: error.message });
    }

    // 启动缓存预热（异步执行，不阻塞服务器启动
    if (typeof cacheService.prewarm === 'function') {
      cacheService.prewarm().catch((err) => {
        logger.error('启动缓存预热失败', { error: err.message });
      });
    } else {
      logger.info('缓存预热功能暂不可用，跳过');
    }
  });

  // 初始化WebSocket服务器
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .filter(
      (origin) => origin.startsWith('http://') || origin.startsWith('https://')
    );

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // 导出WebSocket实例供其他模块使用
  module.exports.io = io;
  module.exports.connectedUsers = connectedUsers;

  // WebSocket连接处理
  io.on('connection', (socket) => {
    logger.info('新的WebSocket连接', { socketId: socket.id });

    // 处理用户认证
    socket.on('authenticate', (token) => {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId.toString();

        // 存储用户连接
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

    // 处理断开连接
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

    // 处理心跳
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });
}

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，正在关闭服务器');
  schedulerService.stopAllJobs();
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，正在关闭服务器');
  schedulerService.stopAllJobs();
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

// ================================
// 全局兜底异常处理
// ================================

// 用于防止重复处理
let isShuttingDown = false;

/**
 * 统一处理未捕获的异常
 * 执行优雅关闭流程：停止定时任务 → 关闭HTTP服务器 → 退出进程
 */
process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常 - 进程即将退出', {
    error: err.message,
    stack: err.stack,
    name: err.name,
  });

  if (isShuttingDown) {
    process.exit(1);
  }
  isShuttingDown = true;

  try {
    // 停止所有定时任务
    schedulerService.stopAllJobs();
    // 停止监控服务
    if (monitoringService && monitoringService.stopMonitoring) {
      monitoringService.stopMonitoring();
    }
  } catch (cleanupErr) {
    logger.error('清理资源时发生错误', { error: cleanupErr.message });
  }

  // 给异步清理操作一点时间，然后退出
  setTimeout(() => {
    process.exit(1);
  }, 3000);
});

/**
 * 统一处理未处理的Promise拒绝
 * 记录详细错误信息但不退出进程，允许服务继续运行
 */
process.on('unhandledRejection', (reason, promise) => {
  const errorMsg = reason instanceof Error ? reason.message : String(reason);
  const errorStack = reason instanceof Error ? reason.stack : undefined;

  logger.error('未处理的Promise拒绝', {
    reason: errorMsg,
    stack: errorStack,
    type: reason?.constructor?.name || typeof reason,
    timestamp: new Date().toISOString(),
  });

  // 对于严重错误（如数据库连接失败），触发优雅关闭
  if (
    errorMsg.includes('Connection terminated') ||
    errorMsg.includes('Connection refused') ||
    errorMsg.includes('EADDRINUSE')
  ) {
    logger.error('检测到严重错误，触发优雅关闭');
    if (!isShuttingDown) {
      isShuttingDown = true;
      schedulerService.stopAllJobs();
      setTimeout(() => {
        process.exit(1);
      }, 3000);
    }
  }
});

// 导出app和WebSocket实例
module.exports = app;
module.exports.io = io;
module.exports.connectedUsers = connectedUsers;
