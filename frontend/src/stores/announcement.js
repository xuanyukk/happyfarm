/**
 * 文件名：announcement.js
 * 作者：Trae AI
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：游戏公告发布系统状态管理（Pinia Store）
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始版本创建
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api';

export const useAnnouncementStore = defineStore('announcement', () => {
  const announcements = ref([]);
  const categories = ref([]);
  const statistics = ref({});
  const currentAnnouncement = ref(null);
  const loading = ref(false);
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  const hasAnnouncements = computed(() => announcements.value.length > 0);

  async function fetchAnnouncements(params = {}) {
    try {
      loading.value = true;
      const response = await api.get('/admin/announcements', { params });
      if (response.data.success) {
        announcements.value = response.data.data.data;
        pagination.value = {
          page: response.data.data.page,
          pageSize: response.data.data.pageSize,
          total: response.data.data.total,
          totalPages: response.data.data.totalPages,
        };
      }
    } catch (error) {
      console.error('获取公告列表失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchAnnouncementDetail(id) {
    try {
      loading.value = true;
      const response = await api.get(`/admin/announcements/${id}`);
      if (response.data.success) {
        currentAnnouncement.value = response.data.data;
        return response.data.data;
      }
    } catch (error) {
      console.error('获取公告详情失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCategories() {
    try {
      const response = await api.get('/admin/announcements/categories');
      if (response.data.success) {
        categories.value = response.data.data;
      }
    } catch (error) {
      console.error('获取公告分类失败:', error);
      throw error;
    }
  }

  async function fetchStatistics() {
    try {
      const response = await api.get('/admin/announcements/statistics');
      if (response.data.success) {
        statistics.value = response.data.data;
      }
    } catch (error) {
      console.error('获取公告统计失败:', error);
      throw error;
    }
  }

  async function createAnnouncement(data) {
    try {
      loading.value = true;
      const response = await api.post('/admin/announcements', data);
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('创建公告失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function updateAnnouncement(id, data) {
    try {
      loading.value = true;
      const response = await api.put(`/admin/announcements/${id}`, data);
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('更新公告失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function deleteAnnouncement(id) {
    try {
      await api.delete(`/admin/announcements/${id}`);
    } catch (error) {
      console.error('删除公告失败:', error);
      throw error;
    }
  }

  async function publishAnnouncement(id) {
    try {
      const response = await api.post(`/admin/announcements/${id}/publish`);
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('发布公告失败:', error);
      throw error;
    }
  }

  async function offlineAnnouncement(id) {
    try {
      const response = await api.post(`/admin/announcements/${id}/offline`);
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('下线公告失败:', error);
      throw error;
    }
  }

  async function scheduleAnnouncement(id, scheduledTime) {
    try {
      const response = await api.post(`/admin/announcements/${id}/schedule`, {
        scheduled_time: scheduledTime,
      });
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('设置定时发布失败:', error);
      throw error;
    }
  }

  async function setAnnouncementTop(id, isTop) {
    try {
      const response = await api.post(`/admin/announcements/${id}/top`, {
        is_top: isTop,
      });
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('设置置顶失败:', error);
      throw error;
    }
  }

  function resetCurrentAnnouncement() {
    currentAnnouncement.value = null;
  }

  return {
    announcements,
    categories,
    statistics,
    currentAnnouncement,
    loading,
    pagination,
    hasAnnouncements,
    fetchAnnouncements,
    fetchAnnouncementDetail,
    fetchCategories,
    fetchStatistics,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    publishAnnouncement,
    offlineAnnouncement,
    scheduleAnnouncement,
    setAnnouncementTop,
    resetCurrentAnnouncement,
  };
});
