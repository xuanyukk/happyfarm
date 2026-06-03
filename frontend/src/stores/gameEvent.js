/**
 * 文件名：gameEvent.js
 * 作者：开发者
 * 日期：2026-05-06
 * 版本：v1.0.0
 * 功能描述：游戏活动管理的Pinia状态管理
 * 更新记录：
 *   2026-05-06 - v1.0.0 - 初始版本创建
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import request from '../utils/request';

export const useGameEventStore = defineStore('gameEvent', () => {
  const events = ref([]);
  const currentEvent = ref(null);
  const statistics = ref({});
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const loading = ref(false);

  async function fetchEvents(params = {}) {
    loading.value = true;
    try {
      const response = await request.get('/admin/game-events', { params });
      if (response.data.success) {
        events.value = response.data.data.events || [];
        pagination.value = response.data.data.pagination || pagination.value;
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchEvent(id) {
    loading.value = true;
    try {
      const response = await request.get(`/admin/game-events/${id}`);
      if (response.data.success) {
        currentEvent.value = response.data.data;
      }
    } finally {
      loading.value = false;
    }
  }

  async function createEvent(data) {
    const response = await request.post('/admin/game-events', data);
    if (response.data.success) {
      await fetchEvents();
    }
    return response;
  }

  async function updateEvent(id, data) {
    const response = await request.put(`/admin/game-events/${id}`, data);
    if (response.data.success) {
      await fetchEvents();
    }
    return response;
  }

  async function deleteEvent(id) {
    const response = await request.delete(`/admin/game-events/${id}`);
    if (response.data.success) {
      await fetchEvents();
    }
    return response;
  }

  async function startEvent(id) {
    const response = await request.post(`/admin/game-events/${id}/start`);
    if (response.data.success) {
      await fetchEvents();
    }
    return response;
  }

  async function endEvent(id) {
    const response = await request.post(`/admin/game-events/${id}/end`);
    if (response.data.success) {
      await fetchEvents();
    }
    return response;
  }

  async function pauseEvent(id) {
    const response = await request.post(`/admin/game-events/${id}/pause`);
    if (response.data.success) {
      await fetchEvents();
    }
    return response;
  }

  async function resumeEvent(id) {
    const response = await request.post(`/admin/game-events/${id}/resume`);
    if (response.data.success) {
      await fetchEvents();
    }
    return response;
  }

  async function fetchEventStatistics(id) {
    const response = await request.get(`/admin/game-events/${id}/statistics`);
    if (response.data.success) {
      statistics.value = response.data.data;
    }
    return response;
  }

  async function fetchEventTasks(eventId) {
    const response = await request.get(`/admin/game-events/${eventId}/tasks`);
    return response;
  }

  async function createEventTask(eventId, data) {
    const response = await request.post(
      `/admin/game-events/${eventId}/tasks`,
      data
    );
    return response;
  }

  async function updateEventTask(eventId, taskId, data) {
    const response = await request.put(
      `/admin/game-events/${eventId}/tasks/${taskId}`,
      data
    );
    return response;
  }

  async function deleteEventTask(eventId, taskId) {
    const response = await request.delete(
      `/admin/game-events/${eventId}/tasks/${taskId}`
    );
    return response;
  }

  async function fetchPlayerProgress(eventId, params = {}) {
    const response = await request.get(
      `/admin/game-events/${eventId}/progress`,
      { params }
    );
    return response;
  }

  return {
    events,
    currentEvent,
    statistics,
    pagination,
    loading,
    fetchEvents,
    fetchEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    startEvent,
    endEvent,
    pauseEvent,
    resumeEvent,
    fetchEventStatistics,
    fetchEventTasks,
    createEventTask,
    updateEventTask,
    deleteEventTask,
    fetchPlayerProgress,
  };
});
