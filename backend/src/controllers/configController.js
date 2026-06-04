// 文件名: configController.js
// 作者: Trae AI
// 日期: 2026-04-30
// 版本: v1.1.0
// 功能描述: 游戏参数配置管理控制器(含变更历史与回滚增强)
// 更新记录:
//   2026-04-30 - v1.0.0 - 初始版本创建
//   2026-05-26 - v1.1.0 - 增强：版本对比、回滚预览、变更统计、历史导出

const configService = require('../services/configService');
const configHistoryService = require('../services/configHistoryService');
const logger = require('../config/logger');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * 获取配置分类列表
 */
exports.getConfigCategories = async (req, res) => {
  try {
    const categories = await configService.getConfigCategories();
    res.json(successResponse(categories));
  } catch (error) {
    logger.error('获取配置分类列表失败:', error);
    res.status(500).json(errorResponse('获取配置分类列表失败', error.message));
  }
};

/**
 * 获取配置列表
 */
exports.getConfigList = async (req, res) => {
  try {
    const { category, search } = req.query;
    const configs = await configService.getConfigList({ category, search });
    res.json(successResponse(configs));
  } catch (error) {
    logger.error('获取配置列表失败:', error);
    res.status(500).json(errorResponse('获取配置列表失败', error.message));
  }
};

/**
 * 获取配置详情
 */
exports.getConfigDetail = async (req, res) => {
  try {
    const { key } = req.params;
    const config = await configService.getConfigDetail(key);

    if (!config) {
      return res.status(404).json(errorResponse('配置不存在'));
    }

    res.json(successResponse(config));
  } catch (error) {
    logger.error('获取配置详情失败:', error);
    res.status(500).json(errorResponse('获取配置详情失败', error.message));
  }
};

/**
 * 创建配置
 */
exports.createConfig = async (req, res) => {
  try {
    const data = req.body;
    const operatorId = req.user?.id;
    const ipAddress = req.ip;

    const config = await configService.createConfig(
      data,
      operatorId,
      ipAddress
    );
    res.status(201).json(successResponse(config, '配置创建成功'));
  } catch (error) {
    logger.error('创建配置失败:', error);
    if (error.message === '配置键已存在') {
      res.status(400).json(errorResponse('配置键已存在'));
    } else {
      res.status(500).json(errorResponse('创建配置失败', error.message));
    }
  }
};

/**
 * 更新配置
 */
exports.updateConfig = async (req, res) => {
  try {
    const { key } = req.params;
    const data = req.body;
    const operatorId = req.user?.id;
    const ipAddress = req.ip;

    const config = await configService.updateConfig(
      key,
      data,
      operatorId,
      ipAddress
    );
    res.json(successResponse(config, '配置更新成功'));
  } catch (error) {
    logger.error('更新配置失败:', error);
    if (error.message === '配置不存在') {
      res.status(404).json(errorResponse('配置不存在'));
    } else if (error.message === '该配置为只读，无法修改') {
      res.status(403).json(errorResponse('该配置为只读，无法修改'));
    } else {
      res.status(500).json(errorResponse('更新配置失败', error.message));
    }
  }
};

/**
 * 删除配置
 */
exports.deleteConfig = async (req, res) => {
  try {
    const { key } = req.params;
    const operatorId = req.user?.id;
    const ipAddress = req.ip;

    const result = await configService.deleteConfig(key, operatorId, ipAddress);
    res.json(successResponse(result, '配置删除成功'));
  } catch (error) {
    logger.error('删除配置失败:', error);
    if (error.message === '配置不存在') {
      res.status(404).json(errorResponse('配置不存在'));
    } else {
      res.status(500).json(errorResponse('删除配置失败', error.message));
    }
  }
};

/**
 * 获取配置历史版本(增强版，支持分页)
 */
exports.getConfigHistory = async (req, res) => {
  try {
    const { key } = req.params;
    const { page, limit } = req.query;

    // 先检查配置是否存在
    const config = await configService.getConfigDetail(key);
    if (!config) {
      return res.status(404).json(errorResponse('配置不存在'));
    }

    const history = await configHistoryService.getHistory(key, { page, limit });
    res.json(successResponse(history));
  } catch (error) {
    logger.error('获取配置历史失败:', error);
    res.status(500).json(errorResponse('获取配置历史失败', error.message));
  }
};

/**
 * 恢复配置到历史版本(增强版，支持reason和详细日志)
 */
exports.restoreConfigVersion = async (req, res) => {
  try {
    const { key } = req.params;
    const { version, reason } = req.body;
    const operatorId = req.user?.id;
    const operatorName = req.user?.username || '';
    const ipAddress = req.ip;

    if (!version) {
      return res.status(400).json(errorResponse('请指定目标版本号'));
    }

    // 如果reason没有传，也尝试用旧接口兼容
    const rollbackReason = reason || `恢复到版本 ${version}`;

    const result = await configHistoryService.rollbackToVersion(
      key,
      version,
      operatorId,
      operatorName,
      ipAddress,
      rollbackReason
    );

    // 同步更新原有configService的缓存
    await configService.refreshConfigCache(key);

    res.json(successResponse(result, '配置回滚成功'));
  } catch (error) {
    logger.error('回滚配置失败:', error);
    if (error.message.includes('不存在')) {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(500).json(errorResponse('回滚配置失败', error.message));
    }
  }
};

/**
 * 导出配置
 */
exports.exportConfigs = async (req, res) => {
  try {
    const { category, format = 'json' } = req.query;
    const configs = await configService.exportConfigs(category);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=game_configs.json'
      );
      res.json(successResponse(configs));
    } else {
      res.json(successResponse(configs));
    }
  } catch (error) {
    logger.error('导出配置失败:', error);
    res.status(500).json(errorResponse('导出配置失败', error.message));
  }
};

/**
 * 创建审批请求
 */
exports.createApprovalRequest = async (req, res) => {
  try {
    const { key } = req.params;
    const { requestData, reason } = req.body;
    const operatorId = req.user?.id;

    const approval = await configService.createApprovalRequest(
      key,
      requestData,
      operatorId,
      reason
    );
    res.status(201).json(successResponse(approval, '审批请求创建成功'));
  } catch (error) {
    logger.error('创建审批请求失败:', error);
    if (error.message === '配置不存在') {
      res.status(404).json(errorResponse('配置不存在'));
    } else {
      res.status(500).json(errorResponse('创建审批请求失败', error.message));
    }
  }
};

/**
 * 审批配置变更
 */
exports.approveConfigChange = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    const approverId = req.user?.id;

    const approval = await configService.approveConfigChange(
      id,
      status,
      approverId,
      comment
    );
    res.json(successResponse(approval, '审批完成'));
  } catch (error) {
    logger.error('审批配置变更失败:', error);
    if (error.message === '审批请求不存在') {
      res.status(404).json(errorResponse('审批请求不存在'));
    } else {
      res.status(500).json(errorResponse('审批配置变更失败', error.message));
    }
  }
};

/**
 * 获取审批请求列表
 */
exports.getApprovalRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const requests = await configService.getApprovalRequests(status);
    res.json(successResponse(requests));
  } catch (error) {
    logger.error('获取审批请求列表失败:', error);
    res.status(500).json(errorResponse('获取审批请求列表失败', error.message));
  }
};

// ==================== 配置热更新相关接口 ====================

/**
 * 获取配置缓存状态
 */
exports.getCacheStatus = async (req, res) => {
  try {
    const status = configService.getCacheStatus();
    res.json(successResponse(status));
  } catch (error) {
    logger.error('获取配置缓存状态失败:', error);
    res.status(500).json(errorResponse('获取配置缓存状态失败', error.message));
  }
};

/**
 * 刷新配置缓存
 */
exports.refreshCache = async (req, res) => {
  try {
    const { key } = req.params;

    if (key === 'all') {
      const result = await configService.refreshAllConfigCache();
      res.json(
        successResponse({ refreshed: true, type: 'all' }, '全部配置缓存已刷新')
      );
    } else {
      const result = await configService.refreshConfigCache(key);
      res.json(
        successResponse(
          { refreshed: result, key },
          result ? '配置缓存已刷新' : '配置不存在'
        )
      );
    }
  } catch (error) {
    logger.error('刷新配置缓存失败:', error);
    res.status(500).json(errorResponse('刷新配置缓存失败', error.message));
  }
};

/**
 * 批量更新配置
 */
exports.batchUpdateConfigs = async (req, res) => {
  try {
    const { updates } = req.body;
    const operatorId = req.user?.id;
    const ipAddress = req.ip;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json(errorResponse('更新数据格式错误'));
    }

    const results = await configService.batchUpdateConfigs(
      updates,
      operatorId,
      ipAddress
    );
    res.json(successResponse(results, '批量更新完成'));
  } catch (error) {
    logger.error('批量更新配置失败:', error);
    res.status(500).json(errorResponse('批量更新配置失败', error.message));
  }
};

/**
 * 导入配置
 */
exports.importConfigs = async (req, res) => {
  try {
    const { configs, override = false } = req.body;
    const operatorId = req.user?.id;
    const ipAddress = req.ip;

    if (!configs || !Array.isArray(configs)) {
      return res.status(400).json(errorResponse('导入数据格式错误'));
    }

    const results = await configService.importConfigs(
      configs,
      operatorId,
      ipAddress,
      override
    );
    res.json(successResponse(results, '配置导入完成'));
  } catch (error) {
    logger.error('导入配置失败:', error);
    res.status(500).json(errorResponse('导入配置失败', error.message));
  }
};

/**
 * 获取缓存中的配置
 */
exports.getCachedConfig = async (req, res) => {
  try {
    const { key } = req.params;

    if (key === 'all') {
      const configs = configService.getAllCachedConfigs();
      res.json(
        successResponse({ configs, version: configService.getCacheVersion() })
      );
    } else {
      const config = configService.getCachedConfig(key);
      if (!config) {
        return res.status(404).json(errorResponse('配置不在缓存中'));
      }
      res.json(
        successResponse({ config, version: configService.getCacheVersion() })
      );
    }
  } catch (error) {
    logger.error('获取缓存配置失败:', error);
    res.status(500).json(errorResponse('获取缓存配置失败', error.message));
  }
};

// ==================== 变更历史与回滚增强接口 ====================

/**
 * 比较配置版本差异
 * GET /api/admin/config/:key/compare?v1=1&v2=3
 */
exports.compareConfigVersions = async (req, res) => {
  try {
    const { key } = req.params;
    const { v1, v2 } = req.query;

    if (!v1 || !v2) {
      return res.status(400).json(errorResponse('请指定两个版本号(v1, v2)'));
    }

    const version1 = parseInt(v1);
    const version2 = parseInt(v2);

    if (isNaN(version1) || isNaN(version2)) {
      return res.status(400).json(errorResponse('版本号必须为整数'));
    }

    const diff = await configHistoryService.compareVersions(
      key,
      version1,
      version2
    );
    res.json(successResponse(diff));
  } catch (error) {
    logger.error('比较配置版本失败:', error);
    if (error.message.includes('不存在')) {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(500).json(errorResponse('比较配置版本失败', error.message));
    }
  }
};

/**
 * 回滚预览
 * GET /api/admin/config/:key/rollback-preview?version=2
 */
exports.getRollbackPreview = async (req, res) => {
  try {
    const { key } = req.params;
    const { version } = req.query;

    if (!version) {
      return res.status(400).json(errorResponse('请指定目标版本号'));
    }

    const targetVersion = parseInt(version);
    if (isNaN(targetVersion)) {
      return res.status(400).json(errorResponse('版本号必须为整数'));
    }

    const preview = await configHistoryService.getRollbackInfo(
      key,
      targetVersion
    );
    res.json(successResponse(preview));
  } catch (error) {
    logger.error('获取回滚预览失败:', error);
    if (error.message.includes('不存在')) {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(500).json(errorResponse('获取回滚预览失败', error.message));
    }
  }
};

/**
 * 增强版回滚配置
 * POST /api/admin/config/:key/rollback
 * body: { version, reason }
 */
exports.rollbackConfig = async (req, res) => {
  try {
    const { key } = req.params;
    const { version, reason } = req.body;
    const operatorId = req.user?.id;
    const operatorName = req.user?.username || '';
    const ipAddress = req.ip;

    if (!version) {
      return res.status(400).json(errorResponse('请指定目标版本号'));
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json(errorResponse('请填写回滚原因'));
    }

    const result = await configHistoryService.rollbackToVersion(
      key,
      version,
      operatorId,
      operatorName,
      ipAddress,
      reason
    );

    // 同步更新缓存
    await configService.refreshConfigCache(key);

    res.json(successResponse(result, '配置回滚成功'));
  } catch (error) {
    logger.error('回滚配置失败:', error);
    if (error.message.includes('不存在')) {
      res.status(404).json(errorResponse(error.message));
    } else {
      res.status(500).json(errorResponse('回滚配置失败', error.message));
    }
  }
};

/**
 * 获取配置变更统计
 * GET /api/admin/config/statistics?key=xxx(可选)
 */
exports.getChangeStatistics = async (req, res) => {
  try {
    const { key } = req.query;
    const stats = await configHistoryService.getChangeStats(key || null);
    res.json(successResponse(stats));
  } catch (error) {
    logger.error('获取变更统计失败:', error);
    res.status(500).json(errorResponse('获取变更统计失败', error.message));
  }
};

/**
 * 导出变更历史
 * GET /api/admin/config/:key/history/export?format=csv|json
 */
exports.exportChangeHistory = async (req, res) => {
  try {
    const { key } = req.params;
    const { format = 'json' } = req.query;

    // 获取全部历史记录(不分页)
    const history = await configHistoryService.getHistory(key, {
      page: 1,
      limit: 10000,
    });

    const records = history.records;

    if (format === 'csv') {
      // 生成CSV
      const csvHeaders = [
        'ID',
        '配置键',
        '变更类型',
        '变更字段',
        '操作人',
        'IP地址',
        '变更原因',
        '版本',
        '创建时间',
      ];
      const csvRows = records.map((r) => [
        r.id,
        r.config_key,
        r.change_type,
        (r.changed_fields || []).join(';'),
        r.operator_name || '',
        r.ip_address || '',
        r.change_reason || '',
        r.version,
        r.created_at,
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map((row) =>
          row
            .map((cell) => '"' + String(cell || '').replace(/"/g, '""') + '"')
            .join(',')
        )
        .join('\r\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=config_history_${key}_${new Date()
          .toISOString()
          .slice(0, 10)}.csv`
      );
      res.send('\uFEFF' + csvContent);
    } else {
      // JSON格式
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=config_history_${key}_${new Date()
          .toISOString()
          .slice(0, 10)}.json`
      );
      res.json(successResponse({ key, records, exportTime: new Date() }));
    }
  } catch (error) {
    logger.error('导出变更历史失败:', error);
    res.status(500).json(errorResponse('导出变更历史失败', error.message));
  }
};
