/**
 * 文件名：adminService.js
 * 作者：开发者
 * 日期：2026-03-28
 * 版本：v1.4.0
 * 功能描述：后台管理API服务，封装所有后台管理相关的API调用
 * 更新记录：
 *   2026-03-28 - v1.0.0 - 初始版本创建
 *   2026-03-28 - v1.0.1 - 修复URL参数未编码的安全问题，使用encodeURIComponent对所有URL参数值进行编码
 *   2026-03-28 - v1.1.0 - 添加URL参数名白名单验证，防止恶意参数名攻击
 *   2026-03-29 - v1.2.0 - 增强参数验证逻辑，添加类型检查和范围验证
 *   2026-03-29 - v1.3.0 - 修复整数验证漏洞，添加XSS防护和严格的日期格式验证
 *   2026-05-26 - v1.4.0 - 新增配置变更历史API(版本对比、回滚预览、回滚、统计、导出)
 */

import axios from 'axios';
import { getAccessToken } from './authService';
import { useAuthStore } from '../stores/auth';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      authStore.logout();
    }
    return Promise.reject(error);
  }
);

class AdminService {
  static allowedParams = {
    players: ['page', 'limit', 'search', 'status', 'sort', 'order'],
    logs: ['page', 'limit', 'type', 'action', 'startDate', 'endDate', 'userId'],
    alerts: ['page', 'limit', 'status', 'level', 'startDate', 'endDate'],
    approvals: ['page', 'limit', 'status', 'type', 'startDate', 'endDate'],
    statistics: ['period', 'type', 'startDate', 'endDate'],
    crops: ['worldId', 'cropType', 'search'],
    items: ['itemType', 'search'],
    roles: ['page', 'limit', 'search', 'status'],
    announcements: ['page', 'limit', 'status', 'type', 'search'],
    configs: ['page', 'limit', 'category', 'search'],
    backups: ['page', 'limit', 'type', 'dateRange'],
    gameEvents: ['page', 'limit', 'status', 'type'],
    performance: ['type', 'timeRange', 'limit'],
    batch: ['page', 'limit', 'status', 'type'],
    health: ['checkType'],
    docs: ['tableName', 'exportFormat'],
    logAnalysis: [
      'level',
      'searchTerm',
      'startDate',
      'endDate',
      'limit',
      'format',
    ],
    shop: ['goodsType', 'search', 'isOnSale'],
    achievements: ['category', 'rarity', 'search', 'isActive'],
    farmLevels: ['search'],
    mailHistory: ['page', 'limit', 'status', 'search'],
  };

  static paramRules = {
    page: { type: 'integer', min: 1, max: 1000 },
    limit: { type: 'integer', min: 1, max: 100 },
    userId: { type: 'integer', min: 1 },
    period: { enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    type: { type: 'string' },
    search: { type: 'string', maxLength: 100 },
    status: { type: 'string' },
    sort: { type: 'string' },
    order: { enum: ['asc', 'desc'] },
    level: { type: 'string' },
    action: { type: 'string' },
    startDate: { type: 'date' },
    endDate: { type: 'date' },
    category: { type: 'string' },
    dateRange: { type: 'string' },
    timeRange: { type: 'string' },
    exportFormat: { enum: ['json', 'csv', 'pdf'] },
    checkType: { enum: ['full', 'quick', 'database', 'cache'] },
  };

  validateParamValue(paramName, value) {
    const rules = AdminService.paramRules[paramName];
    if (!rules) {
      return value;
    }

    let validatedValue = value;

    if (rules.type === 'integer') {
      const strValue = String(value);
      if (!/^-?\d+$/.test(strValue)) {
        return undefined;
      }
      const num = parseInt(strValue, 10);
      if (isNaN(num)) {
        return undefined;
      }
      if (rules.min !== undefined && num < rules.min) {
        validatedValue = rules.min;
      } else if (rules.max !== undefined && num > rules.max) {
        validatedValue = rules.max;
      } else {
        validatedValue = num;
      }
    }

    if (rules.type === 'string') {
      if (typeof validatedValue !== 'string') {
        validatedValue = String(validatedValue);
      }
      if (rules.maxLength && validatedValue.length > rules.maxLength) {
        validatedValue = validatedValue.substring(0, rules.maxLength);
      }
      const dangerousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /['";]/g,
      ];
      dangerousPatterns.forEach((pattern) => {
        validatedValue = validatedValue.replace(pattern, '');
      });
    }

    if (rules.enum) {
      if (!rules.enum.includes(validatedValue)) {
        return undefined;
      }
    }

    if (rules.type === 'date') {
      const dateStr = String(validatedValue);
      const datePattern = /^\d{4}-\d{2}-\d{2}(?:\s\d{2}:\d{2}:\d{2})?$/;
      if (!datePattern.test(dateStr)) {
        return undefined;
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return undefined;
      }
    }

    return validatedValue;
  }

  validateParams(type, filters) {
    const allowed = AdminService.allowedParams[type] || [];
    const validated = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (
        allowed.includes(key) &&
        value !== undefined &&
        value !== null &&
        value !== ''
      ) {
        const validatedValue = this.validateParamValue(key, value);
        if (validatedValue !== undefined) {
          validated[key] = validatedValue;
        }
      }
    });

    return validated;
  }
  async getDashboardData() {
    const response = await api.get('/admin/dashboard');
    return response.data;
  }

  async getPlayerList(filters = {}) {
    const validatedFilters = this.validateParams('players', filters);
    const params = new URLSearchParams();
    Object.entries(validatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, encodeURIComponent(value));
      }
    });
    const response = await api.get(`/admin/players?${params.toString()}`);
    return response.data;
  }

  async getPlayerDetail(playerId) {
    const response = await api.get(`/admin/players/${playerId}`);
    return response.data;
  }

  async updatePlayerStatus(playerId, isActive, reason) {
    const response = await api.put(`/admin/players/${playerId}/status`, {
      isActive,
      reason,
    });
    return response.data;
  }

  async getOperationLogs(filters = {}) {
    const validatedFilters = this.validateParams('logs', filters);
    const params = new URLSearchParams();
    Object.entries(validatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, encodeURIComponent(value));
      }
    });
    const response = await api.get(`/admin/logs?${params.toString()}`);
    return response.data;
  }

  async getMonitoringData(type, limit = 100) {
    const response = await api.get(`/admin/monitoring/${type}`, {
      params: { limit },
    });
    return response.data;
  }

  async getAlertList(filters = {}) {
    const validatedFilters = this.validateParams('alerts', filters);
    const params = new URLSearchParams();
    Object.entries(validatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, encodeURIComponent(value));
      }
    });
    const response = await api.get(`/admin/alerts?${params.toString()}`);
    return response.data;
  }

  async handleAlert(alertId, status, note) {
    const response = await api.post(`/admin/alerts/${alertId}/handle`, {
      status,
      note,
    });
    return response.data;
  }

  async getApprovalList(filters = {}) {
    const validatedFilters = this.validateParams('approvals', filters);
    const params = new URLSearchParams();
    Object.entries(validatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, encodeURIComponent(value));
      }
    });
    const response = await api.get(`/admin/approvals?${params.toString()}`);
    return response.data;
  }

  async createApprovalRequest(data) {
    const response = await api.post('/admin/approvals', data);
    return response.data;
  }

  async approveOperation(requestId, status, note) {
    const response = await api.post(`/admin/approvals/${requestId}/approve`, {
      status,
      note,
    });
    return response.data;
  }

  async getCurrencyBalanceData(currencyType = 'coin', days = 30) {
    const response = await api.get('/admin/currency-balance', {
      params: { currencyType, days },
    });
    return response.data;
  }

  async getStatisticsData(
    period = 'daily',
    type = 'player',
    startDate,
    endDate
  ) {
    const filters = { period, type };
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    const validatedFilters = this.validateParams('statistics', filters);
    const params = new URLSearchParams();
    Object.entries(validatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, encodeURIComponent(value));
      }
    });
    const response = await api.get(`/admin/statistics?${params.toString()}`);
    return response.data;
  }

  async getCropList(filters = {}) {
    const validatedFilters = this.validateParams('crops', filters);
    const params = new URLSearchParams();
    Object.entries(validatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, encodeURIComponent(value));
      }
    });
    const response = await api.get(`/admin/crops?${params.toString()}`);
    return response.data;
  }

  async getCropDetail(cropId) {
    const response = await api.get(`/admin/crops/${cropId}`);
    return response.data;
  }

  async createCrop(data) {
    const response = await api.post('/admin/crops', data);
    return response.data;
  }

  async updateCrop(cropId, data) {
    const response = await api.put(`/admin/crops/${cropId}`, data);
    return response.data;
  }

  async deleteCrop(cropId) {
    const response = await api.delete(`/admin/crops/${cropId}`);
    return response.data;
  }

  async getItemList(filters = {}) {
    const validatedFilters = this.validateParams('items', filters);
    const params = new URLSearchParams();
    Object.entries(validatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, encodeURIComponent(value));
      }
    });
    const response = await api.get(`/admin/items?${params.toString()}`);
    return response.data;
  }

  async getItemDetail(itemId) {
    const response = await api.get(`/admin/items/${itemId}`);
    return response.data;
  }

  async createItem(data) {
    const response = await api.post('/admin/items', data);
    return response.data;
  }

  async updateItem(itemId, data) {
    const response = await api.put(`/admin/items/${itemId}`, data);
    return response.data;
  }

  async deleteItem(itemId) {
    const response = await api.delete(`/admin/items/${itemId}`);
    return response.data;
  }

  async getRoleList(params = {}) {
    const validatedParams = this.validateParams('roles', params);
    const response = await api.get('/admin/rbac/roles', {
      params: validatedParams,
    });
    return response.data;
  }

  async getRoleDetail(roleId) {
    const response = await api.get(`/admin/rbac/roles/${roleId}`);
    return response.data;
  }

  async createRole(data) {
    const response = await api.post('/admin/rbac/roles', data);
    return response.data;
  }

  async updateRole(roleId, data) {
    const response = await api.put(`/admin/rbac/roles/${roleId}`, data);
    return response.data;
  }

  async deleteRole(roleId, reason = '') {
    const response = await api.delete(`/admin/rbac/roles/${roleId}`, {
      data: { reason },
    });
    return response.data;
  }

  async assignRolePermissions(roleId, permissionIds) {
    const response = await api.post(`/admin/rbac/roles/${roleId}/permissions`, {
      permissionIds,
    });
    return response.data;
  }

  async getPermissionTree() {
    const response = await api.get('/admin/rbac/permissions');
    return response.data;
  }

  async getUserRoles(userId) {
    const response = await api.get(`/admin/rbac/users/${userId}/roles`);
    return response.data;
  }

  async assignUserRoles(userId, roleIds) {
    const response = await api.post(`/admin/rbac/users/${userId}/roles`, {
      roleIds,
    });
    return response.data;
  }

  async getAnnouncementList(params = {}) {
    const validatedParams = this.validateParams('announcements', params);
    const response = await api.get('/admin/announcements', {
      params: validatedParams,
    });
    return response.data;
  }

  async createAnnouncement(data) {
    const response = await api.post('/admin/announcements', data);
    return response.data;
  }

  async updateAnnouncement(announcementId, data) {
    const response = await api.put(
      `/admin/announcements/${announcementId}`,
      data
    );
    return response.data;
  }

  async deleteAnnouncement(announcementId) {
    const response = await api.delete(`/admin/announcements/${announcementId}`);
    return response.data;
  }

  async publishAnnouncement(announcementId) {
    const response = await api.post(
      `/admin/announcements/${announcementId}/publish`
    );
    return response.data;
  }

  async offlineAnnouncement(announcementId) {
    const response = await api.post(
      `/admin/announcements/${announcementId}/offline`
    );
    return response.data;
  }

  async setAnnouncementTop(announcementId, isTop) {
    const response = await api.post(
      `/admin/announcements/${announcementId}/top`,
      { isTop }
    );
    return response.data;
  }

  async getAnnouncementStatistics() {
    const response = await api.get('/admin/announcements/statistics');
    return response.data;
  }

  async getConfigCategories() {
    const response = await api.get('/admin/configs/categories');
    return response.data;
  }

  async getConfigList(params = {}) {
    const validatedParams = this.validateParams('configs', params);
    const response = await api.get('/admin/configs/list', {
      params: validatedParams,
    });
    return response.data;
  }

  async getConfigDetail(configKey) {
    const response = await api.get(`/admin/configs/${configKey}`);
    return response.data;
  }

  async createConfig(data) {
    const response = await api.post('/admin/configs', data);
    return response.data;
  }

  async updateConfig(configKey, data) {
    const response = await api.put(`/admin/configs/${configKey}`, data);
    return response.data;
  }

  async deleteConfig(configKey) {
    const response = await api.delete(`/admin/configs/${configKey}`);
    return response.data;
  }

  async getConfigHistory(configKey, params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const queryStr = query.toString();
    const url = queryStr
      ? `/admin/configs/${configKey}/history?${queryStr}`
      : `/admin/configs/${configKey}/history`;
    const response = await api.get(url);
    return response.data;
  }

  async restoreConfig(configKey, version, reason) {
    const response = await api.post(`/admin/configs/${configKey}/restore`, {
      version,
      reason,
    });
    return response.data;
  }

  async compareConfigVersions(configKey, v1, v2) {
    const response = await api.get(
      `/admin/configs/${configKey}/compare?v1=${v1}&v2=${v2}`
    );
    return response.data;
  }

  async getRollbackPreview(configKey, version) {
    const response = await api.get(
      `/admin/configs/${configKey}/rollback-preview?version=${version}`
    );
    return response.data;
  }

  async rollbackConfig(configKey, version, reason) {
    const response = await api.post(`/admin/configs/${configKey}/rollback`, {
      version,
      reason,
    });
    return response.data;
  }

  async getChangeStatistics(key = '') {
    const params = key ? `?key=${encodeURIComponent(key)}` : '';
    const response = await api.get(`/admin/configs/statistics${params}`);
    return response.data;
  }

  async exportChangeHistory(configKey, format = 'json') {
    const response = await api.get(
      `/admin/configs/${configKey}/history/export?format=${format}`,
      { responseType: format === 'csv' ? 'blob' : 'json' }
    );
    return response.data;
  }

  async createConfigApprovalRequest(configKey, data) {
    const response = await api.post(
      `/admin/configs/${configKey}/approve-request`,
      data
    );
    return response.data;
  }

  async approveConfigChange(approvalId, status, comment) {
    const response = await api.put(
      `/admin/configs/approve-request/${approvalId}`,
      {
        status,
        comment,
      }
    );
    return response.data;
  }

  async getConfigApprovalRequests(params = {}) {
    const response = await api.get('/admin/configs/approval-requests/list', {
      params,
    });
    return response.data;
  }

  async getCacheStatus() {
    const response = await api.get('/admin/configs/cache/status');
    return response.data;
  }

  async refreshCache(key) {
    const response = await api.post(`/admin/configs/cache/refresh/${key}`);
    return response.data;
  }

  async batchUpdateConfigs(updates) {
    const response = await api.post('/admin/configs/batch/update', { updates });
    return response.data;
  }

  async exportConfigs() {
    const response = await api.post(
      '/admin/configs/export',
      {},
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }

  async importConfigs(configs, override = false) {
    const response = await api.post('/admin/configs/import', {
      configs,
      override,
    });
    return response.data;
  }

  async getCachedConfigs() {
    const response = await api.get('/admin/cache/stats');
    return response.data;
  }

  async getCachedConfig(key) {
    const response = await api.get(`/admin/configs/cache/${key}`);
    return response.data;
  }

  async getBackupList(params = {}) {
    return this.getBackupListV2();
  }

  async getBackupListV2() {
    const response = await api.get('/admin/backup/list');
    return response.data;
  }

  async createBackup(data = {}) {
    return this.createBackupV2();
  }

  async createBackupV2() {
    const response = await api.post('/admin/backup/create');
    return response.data;
  }

  async restoreBackup(backupId) {
    const filename =
      typeof backupId === 'object' ? backupId.filename : backupId;
    return this.restoreBackupV2(filename);
  }

  async restoreBackupV2(filename) {
    const response = await api.post('/admin/backup/restore', { filename });
    return response.data;
  }

  async downloadBackup(backupId) {
    const filename =
      typeof backupId === 'object' ? backupId.filename : backupId;
    const response = await api.get(`/admin/backup/download/${filename}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async deleteBackup(backupId) {
    const filename =
      typeof backupId === 'object' ? backupId.filename : backupId;
    return this.deleteBackupV2(filename);
  }

  async deleteBackupV2(filename) {
    const response = await api.delete(`/admin/backup/delete/${filename}`);
    return response.data;
  }

  async getScheduledJobs() {
    const response = await api.get('/admin/backup/schedule/list');
    return response.data;
  }

  async startScheduledBackup(cronExpression) {
    const response = await api.post('/admin/backup/schedule/start', {
      cronExpression,
    });
    return response.data;
  }

  async stopScheduledBackup() {
    const response = await api.post('/admin/backup/schedule/stop');
    return response.data;
  }

  async getRestoreProgress() {
    const response = await api.get('/admin/backup/restore/progress');
    return response.data;
  }

  async rollbackRestore() {
    const response = await api.post('/admin/backup/restore/rollback');
    return response.data;
  }

  async clearRestoreProgress() {
    const response = await api.post('/admin/backup/restore/clear');
    return response.data;
  }

  async getGameEventList(params = {}) {
    const validatedParams = this.validateParams('gameEvents', params);
    const response = await api.get('/admin/game-events', {
      params: validatedParams,
    });
    return response.data;
  }

  async getGameEventDetail(eventId) {
    const response = await api.get(`/admin/game-events/${eventId}`);
    return response.data;
  }

  async createGameEvent(data) {
    const response = await api.post('/admin/game-events', data);
    return response.data;
  }

  async updateGameEvent(eventId, data) {
    const response = await api.put(`/admin/game-events/${eventId}`, data);
    return response.data;
  }

  async deleteGameEvent(eventId) {
    const response = await api.delete(`/admin/game-events/${eventId}`);
    return response.data;
  }

  async startGameEvent(eventId) {
    const response = await api.post(`/admin/game-events/${eventId}/start`);
    return response.data;
  }

  async pauseGameEvent(eventId) {
    const response = await api.post(`/admin/game-events/${eventId}/pause`);
    return response.data;
  }

  async endGameEvent(eventId) {
    const response = await api.post(`/admin/game-events/${eventId}/end`);
    return response.data;
  }

  async getGameEventTasks(eventId) {
    const response = await api.get(`/admin/game-events/${eventId}/tasks`);
    return response.data;
  }

  async createGameEventTask(eventId, data) {
    const response = await api.post(
      `/admin/game-events/${eventId}/tasks`,
      data
    );
    return response.data;
  }

  async getGameEventProgress(eventId, params = {}) {
    const response = await api.get(`/admin/game-events/${eventId}/progress`, {
      params,
    });
    return response.data;
  }

  async getGameEventStatistics(eventId) {
    const response = await api.get(`/admin/game-events/${eventId}/statistics`);
    return response.data;
  }

  async getPerformanceData(type, params = {}) {
    const validatedParams = this.validateParams('performance', params);
    const response = await api.get(`/admin/performance/${type}`, {
      params: validatedParams,
    });
    return response.data;
  }

  async getPerformanceStats() {
    const response = await api.get('/performance/stats');
    return response.data;
  }

  async getSlowestRoutes(limit = 10) {
    const response = await api.get('/performance/slowest', {
      params: { limit },
    });
    return response.data;
  }

  async getMostRequestedRoutes(limit = 10) {
    const response = await api.get('/performance/most-requested', {
      params: { limit },
    });
    return response.data;
  }

  async resetPerformanceStats() {
    const response = await api.post('/performance/reset');
    return response.data;
  }

  async checkHealth() {
    const response = await api.get('/admin/health-check');
    return response.data;
  }

  async getHealthCheckStatus(checkType = 'full') {
    const response = await api.get('/admin/health-check', {
      params: { checkType },
    });
    return response.data;
  }

  async getSystemState() {
    const response = await api.get('/admin/system-state');
    return response.data;
  }

  async getDatabaseInfo() {
    const response = await api.get('/admin/database/info');
    return response.data;
  }

  async getDbHealth() {
    const response = await api.get('/admin/database/info');
    return response.data;
  }

  async getDbIndexes() {
    const response = await api.get('/admin/database/indexes');
    return response.data;
  }

  async getDbUnusedIndexes() {
    const response = await api.get('/admin/database/indexes/unused');
    return response.data;
  }

  async getDbTables() {
    const response = await api.get('/admin/database/tables');
    return response.data;
  }

  async getDbCacheStats() {
    const response = await api.get('/admin/database/info');
    return response.data;
  }

  async clearDbCache() {
    const response = await api.post('/admin/database/info');
    return response.data;
  }

  async getLogAnalysis(params = {}) {
    const validatedParams = this.validateParams('logAnalysis', params);
    const response = await api.get('/admin/log-analysis', {
      params: validatedParams,
    });
    return response.data;
  }

  async getLogFiles() {
    const response = await api.get('/admin/log-analysis/files');
    return response.data;
  }

  async getLogFileContent(fileName, params = {}) {
    const response = await api.get(
      `/admin/log-analysis/files/${encodeURIComponent(fileName)}`,
      {
        params,
      }
    );
    return response.data;
  }

  async getLogFileStats(fileName) {
    const response = await api.get(
      `/admin/log-analysis/files/${encodeURIComponent(fileName)}/stats`
    );
    return response.data;
  }

  async getLogFileErrors(fileName) {
    const response = await api.get(
      `/admin/log-analysis/files/${encodeURIComponent(fileName)}/errors`
    );
    return response.data;
  }

  async getLogFilePerformance(fileName) {
    const response = await api.get(
      `/admin/log-analysis/files/${encodeURIComponent(fileName)}/performance`
    );
    return response.data;
  }

  async exportLogFile(fileName, params = {}) {
    const response = await api.get(
      `/admin/log-analysis/files/${encodeURIComponent(fileName)}/export`,
      {
        params,
        responseType: 'blob',
      }
    );
    return response.data;
  }

  async getBatchOperationList(params = {}) {
    const validatedParams = this.validateParams('batch', params);
    const response = await api.get('/admin/batch/list', {
      params: validatedParams,
    });
    return response.data;
  }

  async executeBatchOperation(operationType, data) {
    const response = await api.post('/admin/batch', { ...data, operationType });
    return response.data;
  }

  async getBatchOperationStatus(operationId) {
    const response = await api.get(`/admin/batch/${operationId}`);
    return response.data;
  }

  async cancelBatchOperation(operationId) {
    const response = await api.post(`/admin/batch/${operationId}/cancel`);
    return response.data;
  }

  async exportDatabaseDocs(format = 'json') {
    const response = await api.post(
      '/admin/docs/export',
      { format },
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }

  async getTableStructure(tableName = '') {
    const params = tableName ? { tableName } : {};
    const response = await api.get('/admin/docs/structure', { params });
    return response.data;
  }

  async getTableData(tableName, params = {}) {
    const response = await api.get('/admin/docs/data', {
      params: { tableName, ...params },
    });
    return response.data;
  }

  async getAuditLogs(params = {}) {
    const validatedParams = this.validateParams('logs', params);
    const response = await api.get('/admin/audit-logs', {
      params: validatedParams,
    });
    return response.data;
  }

  async getAlertsPush(params = {}) {
    const validatedParams = this.validateParams('alerts', params);
    const response = await api.get('/admin/alerts-push', {
      params: validatedParams,
    });
    return response.data;
  }

  async getShopGoodsList(filters = {}) {
    const validatedFilters = this.validateParams('shop', filters);
    const params = new URLSearchParams();
    Object.entries(validatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, encodeURIComponent(value));
      }
    });
    const response = await api.get(`/admin/shop?${params.toString()}`);
    return response.data;
  }

  async getShopGoodsDetail(goodsId) {
    const response = await api.get(`/admin/shop/${goodsId}`);
    return response.data;
  }

  async createShopGoods(data) {
    const response = await api.post('/admin/shop', data);
    return response.data;
  }

  async updateShopGoods(goodsId, data) {
    const response = await api.put(`/admin/shop/${goodsId}`, data);
    return response.data;
  }

  async deleteShopGoods(goodsId) {
    const response = await api.delete(`/admin/shop/${goodsId}`);
    return response.data;
  }

  async toggleShopGoodsStatus(goodsId, isOnSale) {
    const response = await api.post(`/admin/shop/${goodsId}/status`, {
      isOnSale,
    });
    return response.data;
  }

  async getAchievementList(filters = {}) {
    const validatedFilters = this.validateParams('achievements', filters);
    const params = new URLSearchParams();
    Object.entries(validatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, encodeURIComponent(value));
      }
    });
    const response = await api.get(`/admin/achievements?${params.toString()}`);
    return response.data;
  }

  async getAchievementDetail(achievementId) {
    const response = await api.get(`/admin/achievements/${achievementId}`);
    return response.data;
  }

  async createAchievement(data) {
    const response = await api.post('/admin/achievements', data);
    return response.data;
  }

  async updateAchievement(achievementId, data) {
    const response = await api.put(
      `/admin/achievements/${achievementId}`,
      data
    );
    return response.data;
  }

  async deleteAchievement(achievementId) {
    const response = await api.delete(`/admin/achievements/${achievementId}`);
    return response.data;
  }

  async getAchievementStatistics(achievementId) {
    const response = await api.get(
      `/admin/achievements/${achievementId}/statistics`
    );
    return response.data;
  }

  async getEconomyStats() {
    const response = await api.get('/admin/analytics/economy');
    return response.data;
  }

  async getTransactionList(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit);
    if (params.type) query.append('type', params.type);
    const response = await api.get(
      `/admin/analytics/transactions?${query.toString()}`
    );
    return response.data;
  }

  async getShopStats() {
    const response = await api.get('/admin/analytics/shop-stats');
    return response.data;
  }

  async getEconomyAlerts() {
    const response = await api.get('/admin/analytics/economy-alerts');
    return response.data;
  }

  async getPlayerAnalytics() {
    const response = await api.get('/admin/analytics/players');
    return response.data;
  }

  async getTopPlayers(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit);
    const response = await api.get(
      `/admin/analytics/top-players?${query.toString()}`
    );
    return response.data;
  }

  async getPlayerAlerts() {
    const response = await api.get('/admin/analytics/player-alerts');
    return response.data;
  }

  async getPlayerProfile() {
    const response = await api.get('/admin/analytics/player-profile');
    return response.data;
  }

  async getFarmLevelList(filters = {}) {
    const validatedFilters = this.validateParams('farmLevels', filters);
    const params = new URLSearchParams();
    Object.entries(validatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, encodeURIComponent(value));
      }
    });
    const response = await api.get(`/admin/farm-levels?${params.toString()}`);
    return response.data;
  }

  async getFarmLevelDetail(farmId) {
    const response = await api.get(`/admin/farm-levels/${farmId}`);
    return response.data;
  }

  async createFarmLevel(data) {
    const response = await api.post('/admin/farm-levels', data);
    return response.data;
  }

  async updateFarmLevel(farmId, data) {
    const response = await api.put(`/admin/farm-levels/${farmId}`, data);
    return response.data;
  }

  async deleteFarmLevel(farmId) {
    const response = await api.delete(`/admin/farm-levels/${farmId}`);
    return response.data;
  }

  async getBusinessMetrics() {
    const response = await api.get('/business-metrics');
    return response.data;
  }

  async getTransactionSuccessRates() {
    const response = await api.get('/business-metrics/transaction-success');
    return response.data;
  }

  async getUserActivityMetrics() {
    const response = await api.get('/business-metrics/user-activity');
    return response.data;
  }

  async getGameActivityMetrics() {
    const response = await api.get('/business-metrics/game-activity');
    return response.data;
  }

  async getPerformanceMetrics() {
    const response = await api.get('/business-metrics/performance');
    return response.data;
  }

  async getMetricsHistory(params = {}) {
    const query = new URLSearchParams();
    if (params.startTime) query.append('startTime', params.startTime);
    if (params.endTime) query.append('endTime', params.endTime);
    if (params.limit) query.append('limit', params.limit);
    const response = await api.get(
      `/business-metrics/history?${query.toString()}`
    );
    return response.data;
  }

  async checkBusinessAlerts() {
    const response = await api.get('/business-metrics/alerts/check');
    return response.data;
  }

  async getAlertThresholds() {
    const response = await api.get('/business-metrics/alerts/thresholds');
    return response.data;
  }

  async updateAlertThresholds(data) {
    const response = await api.put('/business-metrics/alerts/thresholds', data);
    return response.data;
  }

  async getCurrencyConfigList() {
    const response = await api.get('/admin/currency-config');
    return response.data;
  }

  async getCurrencyConfigDetail(configId) {
    const response = await api.get(`/admin/currency-config/${configId}`);
    return response.data;
  }

  async updateCurrencyConfig(configId, data) {
    const response = await api.put(`/admin/currency-config/${configId}`, data);
    return response.data;
  }

  async getMailTemplates() {
    const response = await api.get('/admin/mails/templates');
    return response.data;
  }

  async createMailTemplate(data) {
    const response = await api.post('/admin/mails/templates', data);
    return response.data;
  }

  async updateMailTemplate(templateId, data) {
    const response = await api.put(
      `/admin/mails/templates/${templateId}`,
      data
    );
    return response.data;
  }

  async deleteMailTemplate(templateId) {
    const response = await api.delete(`/admin/mails/templates/${templateId}`);
    return response.data;
  }

  async sendMail(data) {
    const response = await api.post('/admin/mails/send', data);
    return response.data;
  }

  async getMailHistory(params = {}) {
    const validatedFilters = this.validateParams('mailHistory', params);
    const query = new URLSearchParams();
    Object.entries(validatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, encodeURIComponent(value));
      }
    });
    const response = await api.get(`/admin/mails/history?${query.toString()}`);
    return response.data;
  }

  async getMailDetail(mailId) {
    const response = await api.get(`/admin/mails/${mailId}`);
    return response.data;
  }

  async getMonitoringMetrics() {
    const response = await api.get('/admin/monitoring/metrics');
    return response.data;
  }

  async getCpuMetrics() {
    const response = await api.get('/admin/monitoring/metrics/cpu');
    return response.data;
  }

  async getMemoryMetrics() {
    const response = await api.get('/admin/monitoring/metrics/memory');
    return response.data;
  }

  async getDiskMetrics() {
    const response = await api.get('/admin/monitoring/metrics/disk');
    return response.data;
  }

  async getNetworkMetrics() {
    const response = await api.get('/admin/monitoring/metrics/network');
    return response.data;
  }

  async checkMonitoringAlerts() {
    const response = await api.get('/admin/monitoring/alerts/check');
    return response.data;
  }

  async getMonitoringAlertHistory(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);
    const response = await api.get(
      `/admin/monitoring/alerts/history?${query.toString()}`
    );
    return response.data;
  }

  async acknowledgeMonitoringAlert(alertId) {
    const response = await api.post(
      `/admin/monitoring/alerts/${alertId}/acknowledge`
    );
    return response.data;
  }

  async getLogRetentionPolicies() {
    const response = await api.get('/admin/log-cleanup/policies');
    return response.data;
  }

  async updateLogRetentionPolicy(logType, data) {
    const response = await api.put(
      `/admin/log-cleanup/policies/${logType}`,
      data
    );
    return response.data;
  }

  async getLogDiskUsage() {
    const response = await api.get('/admin/log-cleanup/usage');
    return response.data;
  }

  async runLogCleanup() {
    const response = await api.post('/admin/log-cleanup/cleanup');
    return response.data;
  }

  async runLogCleanupByType(logType) {
    const response = await api.post(`/admin/log-cleanup/cleanup/${logType}`);
    return response.data;
  }

  async getDataWarehouseOverview() {
    const response = await api.get('/datawarehouse/overview');
    return response.data;
  }

  async getDAUStats(params = {}) {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    const response = await api.get(`/datawarehouse/dau?${query.toString()}`);
    return response.data;
  }

  async getCropStats() {
    const response = await api.get('/datawarehouse/crops');
    return response.data;
  }

  async getRevenueStats(params = {}) {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    const response = await api.get(
      `/datawarehouse/revenue?${query.toString()}`
    );
    return response.data;
  }

  async getRetentionAnalysis(params = {}) {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    const response = await api.get(
      `/datawarehouse/retention?${query.toString()}`
    );
    return response.data;
  }

  async triggerETL() {
    const response = await api.post('/datawarehouse/etl');
    return response.data;
  }

  async sendClientLog(data) {
    const response = await api.post('/client-logs', data);
    return response.data;
  }

  async sendBatchClientLogs(logs) {
    const response = await api.post('/client-logs/batch', { logs });
    return response.data;
  }

  async getTrace(traceId) {
    const response = await api.get(`/traces/${traceId}`);
    return response.data;
  }

  async getTraceByRequestId(requestId) {
    const response = await api.get(`/traces/request/${requestId}`);
    return response.data;
  }

  async searchTraces(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.service) query.append('service', params.service);
    if (params.limit) query.append('limit', params.limit);
    const response = await api.get(`/traces?${query.toString()}`);
    return response.data;
  }

  async getTraceStats() {
    const response = await api.get('/traces/stats/overview');
    return response.data;
  }

  async startTrace(data) {
    const response = await api.post('/traces/start', data);
    return response.data;
  }

  async endTrace(traceId) {
    const response = await api.post(`/traces/${traceId}/end`);
    return response.data;
  }

  async addTraceSpan(data) {
    const response = await api.post('/traces/spans', data);
    return response.data;
  }

  async getDailyTasks() {
    const response = await api.get('/daily-tasks');
    return response.data;
  }

  async claimDailyTaskReward(taskId) {
    const response = await api.post(`/daily-tasks/${taskId}/claim`);
    return response.data;
  }

  async getDailyDiscounts() {
    const response = await api.get('/daily-discounts/discounts');
    return response.data;
  }

  async refreshDailyDiscounts() {
    const response = await api.post('/daily-discounts/discounts/refresh');
    return response.data;
  }

  async getMyItemUsageLogs() {
    const response = await api.get('/item-usage-logs/mylogs');
    return response.data;
  }

  async getItemUsageStats() {
    const response = await api.get('/item-usage-logs/stats');
    return response.data;
  }

  async getItemUsageAnomalies() {
    const response = await api.get('/item-usage-logs/anomalies');
    return response.data;
  }

  async getGrafanaConfig() {
    const response = await api.get('/grafana/config');
    return response.data;
  }

  async getBatchTables() {
    const response = await api.get('/batch/tables');
    return response.data;
  }

  async previewImportData(formData) {
    const response = await api.post('/batch/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async importData(formData, onProgress) {
    const response = await api.post('/batch/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percent);
        }
      },
    });
    return response.data;
  }

  async exportData(data) {
    const response = await api.post('/batch/export', data, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getExportHistory() {
    const response = await api.get('/batch/export-history');
    return response.data;
  }

  async getImportHistory() {
    const response = await api.get('/batch/import-history');
    return response.data;
  }

  async getBatchJobStatus(jobId) {
    const response = await api.get(`/batch/jobs/${jobId}`);
    return response.data;
  }

  async getExportProgress(taskId) {
    const response = await api.get(`/batch/export/${taskId}/status`);
    return response.data;
  }

  async downloadExportFile(taskId) {
    const response = await api.get(`/batch/export/${taskId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getImportProgress(taskId) {
    const response = await api.get(`/batch/import/${taskId}/status`);
    return response.data;
  }

  async getImportErrors(taskId) {
    const response = await api.get(`/batch/import/${taskId}/errors`);
    return response.data;
  }

  async createGameEventTrigger(data) {
    const response = await api.post(
      '/admin/game-event-extensions/triggers',
      data
    );
    return response.data;
  }

  async getGameEventTriggers() {
    const response = await api.get('/admin/game-event-extensions/triggers');
    return response.data;
  }

  async getEventTriggers(eventId) {
    const response = await api.get(
      `/admin/game-event-extensions/events/${eventId}/triggers`
    );
    return response.data;
  }

  async updateGameEventTrigger(triggerId, data) {
    const response = await api.put(
      `/admin/game-event-extensions/triggers/${triggerId}`,
      data
    );
    return response.data;
  }

  async deleteGameEventTrigger(triggerId) {
    const response = await api.delete(
      `/admin/game-event-extensions/triggers/${triggerId}`
    );
    return response.data;
  }

  async computeEventStats(eventId) {
    const response = await api.post(
      `/admin/game-event-extensions/stats/events/${eventId}/compute`
    );
    return response.data;
  }

  async computeAllEventsStats() {
    const response = await api.post(
      '/admin/game-event-extensions/stats/compute-all'
    );
    return response.data;
  }

  async getEventDetailStats(eventId) {
    const response = await api.get(
      `/admin/game-event-extensions/stats/events/${eventId}`
    );
    return response.data;
  }

  async getEventFunnel(eventId) {
    const response = await api.get(
      `/admin/game-event-extensions/stats/events/${eventId}/funnel`
    );
    return response.data;
  }

  async getGameEventTemplates() {
    const response = await api.get('/admin/game-event-medium/templates');
    return response.data;
  }

  async getGameEventTemplate(id) {
    const response = await api.get(`/admin/game-event-medium/templates/${id}`);
    return response.data;
  }

  async createGameEventTemplate(data) {
    const response = await api.post('/admin/game-event-medium/templates', data);
    return response.data;
  }

  async updateGameEventTemplate(id, data) {
    const response = await api.put(
      `/admin/game-event-medium/templates/${id}`,
      data
    );
    return response.data;
  }

  async createEventFromTemplate(id) {
    const response = await api.post(
      `/admin/game-event-medium/templates/${id}/create-event`
    );
    return response.data;
  }

  async deactivateGameEventTemplate(id) {
    const response = await api.delete(
      `/admin/game-event-medium/templates/${id}`
    );
    return response.data;
  }

  async compareTemplateVersions(id) {
    const response = await api.get(
      `/admin/game-event-medium/templates/${id}/compare`
    );
    return response.data;
  }

  async getSchedulerTaskTypes() {
    const response = await api.get(
      '/admin/game-event-medium/scheduler/task-types'
    );
    return response.data;
  }

  async getSchedulerTasks() {
    const response = await api.get('/admin/game-event-medium/scheduler/tasks');
    return response.data;
  }

  async getSchedulerTask(id) {
    const response = await api.get(
      `/admin/game-event-medium/scheduler/tasks/${id}`
    );
    return response.data;
  }

  async createSchedulerTask(data) {
    const response = await api.post(
      '/admin/game-event-medium/scheduler/tasks',
      data
    );
    return response.data;
  }

  async cancelSchedulerTask(id) {
    const response = await api.delete(
      `/admin/game-event-medium/scheduler/tasks/${id}`
    );
    return response.data;
  }
}

export default new AdminService();
