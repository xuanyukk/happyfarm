/**
 * 文件名：grafanaController.js
 * 作者：开发者
 * 日期：2026-05-26
 * 版本：v1.0.0
 * 功能描述：Grafana 监控仪表板代理控制器，提供 Grafana 配置信息
 * 更新记录：
 *   2026-05-26 - v1.0.0 - 初始版本创建
 */

const logger = require('../config/logger');
const { successResponse, errorResponse } = require('../utils/response');

/** 预定义仪表板列表 */
const DEFAULT_DASHBOARDS = [
  {
    id: 1,
    uid: 'happy-farm-business-metrics',
    title: '业务指标监控面板',
    description: '展示核心业务指标，包括用户活跃度、交易成功率、趋势预测等',
  },
  {
    id: 2,
    uid: 'happy-farm-system-resources',
    title: '系统资源监控面板',
    description: '展示服务器CPU、内存、磁盘、网络等系统资源使用情况',
  },
  {
    id: 3,
    uid: 'happy-farm-database-performance',
    title: '数据库性能监控面板',
    description: '展示数据库连接数、查询性能、慢查询、表大小等数据库指标',
  },
  {
    id: 4,
    uid: 'happy-farm-redis-monitoring',
    title: 'Redis监控面板',
    description: '展示Redis内存使用、命中率、连接数、键数量等缓存指标',
  },
  {
    id: 5,
    uid: 'happy-farm-trace-dashboard',
    title: '链路追踪面板',
    description: '展示请求链路追踪信息、服务调用拓扑、响应时间分布等',
  },
];

/**
 * 获取 Grafana 配置信息
 * GET /api/grafana/config
 *
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @returns {Object} 包含 grafanaUrl 和 dashboards 数组的配置对象
 */
exports.getGrafanaConfig = (req, res) => {
  try {
    const grafanaUrl = process.env.GRAFANA_URL || 'http://localhost:3001';

    logger.info('获取Grafana配置', {
      grafanaUrl,
      dashboardsCount: DEFAULT_DASHBOARDS.length,
    });

    successResponse(
      res,
      {
        grafanaUrl,
        dashboards: DEFAULT_DASHBOARDS,
      },
      '获取Grafana配置成功'
    );
  } catch (error) {
    logger.error('获取Grafana配置失败', { error: error.message });
    errorResponse(res, '获取Grafana配置失败', 500);
  }
};
