/**
 * 文件名：batch.js
 * 作者：开发者
 * 日期：2026-05-01
 * 版本：v1.0.0
 * 功能描述：批量操作功能状态管理
 * 更新记录：
 *   2026-05-01 - v1.0.0 - 初始版本创建
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import request from '../utils/request';

export const useBatchStore = defineStore('batch', () => {
  // 状态
  const batches = ref([]);
  const currentBatch = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const total = ref(0);
  const page = ref(1);
  const pageSize = ref(20);
  const selectedItems = ref([]);

  // 计算属性
  const isAllSelected = computed(() => {
    if (batches.value.length === 0) return false;
    return selectedItems.value.length === batches.value.length;
  });

  // 获取批量操作列表
  const fetchBatches = async (filters = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams();
      params.append('page', page.value);
      params.append('pageSize', pageSize.value);

      if (filters.operation_type) {
        params.append('operation_type', filters.operation_type);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.target_module) {
        params.append('target_module', filters.target_module);
      }
      if (filters.start_date) {
        params.append('start_date', filters.start_date);
      }
      if (filters.end_date) {
        params.append('end_date', filters.end_date);
      }

      const response = await request.get(
        `/admin/batch/list?${params.toString()}`
      );
      if (response.success) {
        batches.value = response.data;
        total.value = response.total;
      }
    } catch (err) {
      error.value = err.message || '获取批量操作列表失败';
      console.error('获取批量操作列表失败:', err);
    } finally {
      loading.value = false;
    }
  };

  // 获取批量操作详情
  const fetchBatchDetail = async (id) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.get(`/admin/batch/${id}`);
      if (response.success) {
        currentBatch.value = response.data;
      }
      return response.data;
    } catch (err) {
      error.value = err.message || '获取批量操作详情失败';
      console.error('获取批量操作详情失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 创建批量操作
  const createBatch = async (data) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.post('/admin/batch/', data);
      if (response.success) {
        await fetchBatches();
      }
      return response;
    } catch (err) {
      error.value = err.message || '创建批量操作失败';
      console.error('创建批量操作失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 执行批量操作
  const executeBatch = async (id) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.post(`/admin/batch/${id}/execute`);
      if (response.success) {
        await fetchBatches();
      }
      return response;
    } catch (err) {
      error.value = err.message || '执行批量操作失败';
      console.error('执行批量操作失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 取消批量操作
  const cancelBatch = async (id) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.post(`/admin/batch/${id}/cancel`);
      if (response.success) {
        await fetchBatches();
      }
      return response;
    } catch (err) {
      error.value = err.message || '取消批量操作失败';
      console.error('取消批量操作失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 导出结果
  const exportResult = async (id, format = 'json') => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.get(
        `/admin/batch/${id}/export?format=${format}`
      );
      return response.data;
    } catch (err) {
      error.value = err.message || '导出结果失败';
      console.error('导出结果失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 批量更新状态
  const batchStatusUpdate = async (data) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.post('/admin/batch/status-update', data);
      if (response.success) {
        await fetchBatches();
      }
      return response;
    } catch (err) {
      error.value = err.message || '批量更新状态失败';
      console.error('批量更新状态失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 批量删除
  const batchDelete = async (data) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request.post('/admin/batch/delete', data);
      if (response.success) {
        await fetchBatches();
      }
      return response;
    } catch (err) {
      error.value = err.message || '批量删除失败';
      console.error('批量删除失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 切换选中
  const toggleSelection = (item) => {
    const index = selectedItems.value.findIndex((i) => i.id === item.id);
    if (index > -1) {
      selectedItems.value.splice(index, 1);
    } else {
      selectedItems.value.push(item);
    }
  };

  // 全选/取消全选
  const toggleAllSelection = () => {
    if (isAllSelected.value) {
      selectedItems.value = [];
    } else {
      selectedItems.value = [...batches.value];
    }
  };

  // 清空选中
  const clearSelection = () => {
    selectedItems.value = [];
  };

  // 重置状态
  const resetState = () => {
    batches.value = [];
    currentBatch.value = null;
    loading.value = false;
    error.value = null;
    selectedItems.value = [];
  };

  return {
    // 状态
    batches,
    currentBatch,
    loading,
    error,
    total,
    page,
    pageSize,
    selectedItems,

    // 计算属性
    isAllSelected,

    // 方法
    fetchBatches,
    fetchBatchDetail,
    createBatch,
    executeBatch,
    cancelBatch,
    exportResult,
    batchStatusUpdate,
    batchDelete,
    toggleSelection,
    toggleAllSelection,
    clearSelection,
    resetState,
  };
});
