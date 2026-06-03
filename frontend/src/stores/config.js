// 文件名: config.js
// 作者: Trae AI
// 日期: 2026-04-30
// 版本: v1.1.0
// 功能描述: 游戏参数配置管理Pinia状态管理(含变更历史增强)
// 更新记录:
//   2026-04-30 - v1.0.0 - 初始版本创建
//   2026-05-26 - v1.1.0 - 新增版本对比、回滚预览、变更统计状态

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import request from '../utils/request';

export const useConfigStore = defineStore('config', () => {
  // 状态
  const categories = ref([]);
  const configs = ref([]);
  const currentConfig = ref(null);
  const configHistory = ref({
    records: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const approvalRequests = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const versionDiff = ref(null);
  const rollbackPreview = ref(null);
  const changeStats = ref(null);

  // 计算属性
  const configsByCategory = computed(() => {
    const map = {};
    configs.value.forEach((config) => {
      if (!map[config.category]) {
        map[config.category] = [];
      }
      map[config.category].push(config);
    });
    return map;
  });

  // 获取分类列表
  const fetchCategories = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.get('/admin/configs/categories');
      categories.value = response.data || [];
    } catch (err) {
      error.value = err.message || '获取分类列表失败';
      console.error('获取分类列表失败:', err);
    } finally {
      loading.value = false;
    }
  };

  // 获取配置列表
  const fetchConfigs = async (filters = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);

      const response = await request.get(
        `/admin/configs/list?${params.toString()}`
      );
      configs.value = response.data || [];
    } catch (err) {
      error.value = err.message || '获取配置列表失败';
      console.error('获取配置列表失败:', err);
    } finally {
      loading.value = false;
    }
  };

  // 获取配置详情
  const fetchConfigDetail = async (key) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.get(`/admin/configs/${key}`);
      currentConfig.value = response.data;
    } catch (err) {
      error.value = err.message || '获取配置详情失败';
      console.error('获取配置详情失败:', err);
    } finally {
      loading.value = false;
    }
  };

  // 创建配置
  const createConfig = async (data) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.post('/admin/configs/', data);
      if (response.success) {
        await fetchConfigs();
      }
      return response;
    } catch (err) {
      error.value = err.message || '创建配置失败';
      console.error('创建配置失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 更新配置
  const updateConfig = async (key, data) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.put(`/admin/configs/${key}`, data);
      if (response.success) {
        await fetchConfigs();
        if (currentConfig.value?.key === key) {
          await fetchConfigDetail(key);
        }
      }
      return response;
    } catch (err) {
      error.value = err.message || '更新配置失败';
      console.error('更新配置失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 删除配置
  const deleteConfig = async (key) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.delete(`/admin/configs/${key}`);
      if (response.success) {
        await fetchConfigs();
      }
      return response;
    } catch (err) {
      error.value = err.message || '删除配置失败';
      console.error('删除配置失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 获取配置历史版本(增强版，支持分页)
  const fetchConfigHistory = async (key, page = 1, limit = 20) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.get(
        `/admin/configs/${key}/history?page=${page}&limit=${limit}`
      );
      configHistory.value = response.data || { records: [], total: 0 };
      return response.data;
    } catch (err) {
      error.value = err.message || '获取配置历史失败';
      console.error('获取配置历史失败:', err);
    } finally {
      loading.value = false;
    }
  };

  // 恢复配置到历史版本
  const restoreConfigVersion = async (key, version, reason) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.post(`/admin/configs/${key}/restore`, {
        version,
        reason,
      });
      if (response.success) {
        await fetchConfigs();
        await fetchConfigHistory(key);
        if (currentConfig.value?.key === key) {
          await fetchConfigDetail(key);
        }
      }
      return response;
    } catch (err) {
      error.value = err.message || '回滚配置失败';
      console.error('回滚配置失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 比较配置版本差异
  const compareVersions = async (key, v1, v2) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.get(
        `/admin/configs/${key}/compare?v1=${v1}&v2=${v2}`
      );
      versionDiff.value = response.data || null;
      return response.data;
    } catch (err) {
      error.value = err.message || '版本对比失败';
      console.error('版本对比失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 获取回滚预览
  const fetchRollbackPreview = async (key, version) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.get(
        `/admin/configs/${key}/rollback-preview?version=${version}`
      );
      rollbackPreview.value = response.data || null;
      return response.data;
    } catch (err) {
      error.value = err.message || '获取回滚预览失败';
      console.error('获取回滚预览失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 增强版回滚
  const rollbackConfig = async (key, version, reason) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.post(`/admin/configs/${key}/rollback`, {
        version,
        reason,
      });
      if (response.success) {
        await fetchConfigs();
        await fetchConfigHistory(key);
        if (currentConfig.value?.key === key) {
          await fetchConfigDetail(key);
        }
      }
      return response;
    } catch (err) {
      error.value = err.message || '回滚配置失败';
      console.error('回滚配置失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 获取变更统计
  const fetchChangeStats = async (key = '') => {
    loading.value = true;
    error.value = null;
    try {
      const params = key ? `?key=${key}` : '';
      const response = await request.get(`/admin/configs/statistics${params}`);
      changeStats.value = response.data || null;
      return response.data;
    } catch (err) {
      error.value = err.message || '获取变更统计失败';
      console.error('获取变更统计失败:', err);
    } finally {
      loading.value = false;
    }
  };

  // 导出配置
  const exportConfigs = async (category = null) => {
    loading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);

      const response = await request.post(
        `/admin/configs/export?${params.toString()}`
      );
      return response.data;
    } catch (err) {
      error.value = err.message || '导出配置失败';
      console.error('导出配置失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 创建审批请求
  const createApprovalRequest = async (key, requestData, reason) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.post(
        `/admin/configs/${key}/approve-request`,
        { requestData, reason }
      );
      if (response.success) {
        await fetchApprovalRequests();
      }
      return response;
    } catch (err) {
      error.value = err.message || '创建审批请求失败';
      console.error('创建审批请求失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 审批配置变更
  const approveConfigChange = async (id, status, comment) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.put(
        `/admin/configs/approve-request/${id}`,
        { status, comment }
      );
      if (response.success) {
        await fetchApprovalRequests();
        await fetchConfigs();
      }
      return response;
    } catch (err) {
      error.value = err.message || '审批配置变更失败';
      console.error('审批配置变更失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 获取审批请求列表
  const fetchApprovalRequests = async (status = null) => {
    loading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);

      const response = await request.get(
        `/admin/configs/approval-requests/list?${params.toString()}`
      );
      approvalRequests.value = response.data || [];
    } catch (err) {
      error.value = err.message || '获取审批请求列表失败';
      console.error('获取审批请求列表失败:', err);
    } finally {
      loading.value = false;
    }
  };

  // 清除当前配置
  const clearCurrentConfig = () => {
    currentConfig.value = null;
    configHistory.value = {
      records: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    };
    versionDiff.value = null;
    rollbackPreview.value = null;
    changeStats.value = null;
  };

  return {
    // 状态
    categories,
    configs,
    currentConfig,
    configHistory,
    approvalRequests,
    loading,
    error,
    versionDiff,
    rollbackPreview,
    changeStats,

    // 计算属性
    configsByCategory,

    // 方法
    fetchCategories,
    fetchConfigs,
    fetchConfigDetail,
    createConfig,
    updateConfig,
    deleteConfig,
    fetchConfigHistory,
    restoreConfigVersion,
    compareVersions,
    fetchRollbackPreview,
    rollbackConfig,
    fetchChangeStats,
    exportConfigs,
    createApprovalRequest,
    approveConfigChange,
    fetchApprovalRequests,
    clearCurrentConfig,
  };
});
