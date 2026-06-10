/**
 * 文件名: alert.js
 * 作者: Trae AI
 * 日期: 2026-05-01
 * 版本: v1.0.0
 * 功能描述: 预警推送系统状态管理
 */
import { defineStore } from 'pinia';
import request from '../utils/request';

export const useAlertStore = defineStore('alert', {
  state: () => ({
    rules: [],
    records: [],
    currentRecord: null,
    stats: null,
    loading: false,
    error: null,
    total: 0,
    page: 1,
    pageSize: 20,
    websocketConnected: false,
    websocket: null,
  }),

  actions: {
    async fetchRules() {
      this.loading = true;
      try {
        const response = await request.get('/admin/alerts/rules');
        if (response.success) {
          this.rules = response.data;
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async createRule(data) {
      try {
        const response = await request.post('/admin/alerts/rules', data);
        if (response.success) {
          await this.fetchRules();
        }
        return response;
      } catch (err) {
        console.error('创建预警规则失败', err);
        throw err;
      }
    },

    async updateRule(id, data) {
      try {
        const response = await request.put(`/admin/alerts/rules/${id}`, data);
        if (response.success) {
          await this.fetchRules();
        }
        return response;
      } catch (err) {
        console.error('更新预警规则失败', err);
        throw err;
      }
    },

    async deleteRule(id) {
      try {
        const response = await request.delete(`/admin/alerts/rules/${id}`);
        if (response.success) {
          await this.fetchRules();
        }
        return response;
      } catch (err) {
        console.error('删除预警规则失败', err);
        throw err;
      }
    },

    async fetchRecords(filters = {}) {
      this.loading = true;
      try {
        const params = new URLSearchParams();
        params.append('page', this.page);
        params.append('pageSize', this.pageSize);
        Object.keys(filters).forEach((key) => {
          if (filters[key]) params.append(key, filters[key]);
        });

        const response = await request.get(`/admin/alerts/records?${params}`);
        if (response.success) {
          this.records = response.list;
          this.total = response.total;
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchRecordDetail(id) {
      this.loading = true;
      try {
        const response = await request.get(`/admin/alerts/records/${id}`);
        if (response.success) {
          this.currentRecord = response.data;
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async markAsRead(id) {
      try {
        const response = await request.put(`/admin/alerts/records/${id}/read`);
        if (response.success) {
          await this.fetchRecords();
          await this.fetchStats();
        }
        return response;
      } catch (err) {
        console.error('标记已读失败', err);
        throw err;
      }
    },

    async resolveRecord(id, note) {
      try {
        const response = await request.put(
          `/admin/alerts/records/${id}/resolve`,
          { note }
        );
        if (response.success) {
          await this.fetchRecords();
          await this.fetchStats();
        }
        return response;
      } catch (err) {
        console.error('解决预警记录失败', err);
        throw err;
      }
    },

    async ignoreRecord(id) {
      try {
        const response = await request.put(`/admin/alerts/records/${id}/ignore`);
        if (response.success) {
          await this.fetchRecords();
          await this.fetchStats();
        }
        return response;
      } catch (err) {
        console.error('忽略预警记录失败', err);
        throw err;
      }
    },

    async triggerDemo() {
      try {
        const response = await request.post('/admin/alerts/trigger');
        if (response.success) {
          await this.fetchRecords();
          await this.fetchStats();
        }
        return response;
      } catch (err) {
        console.error('触发演示预警失败', err);
        throw err;
      }
    },

    async fetchStats() {
      try {
        const response = await request.get('/admin/alerts/stats/overview');
        if (response.success) {
          this.stats = response.data;
        }
      } catch (err) {
        console.error('获取统计失败', err);
      }
    },

    initWebSocket() {
      if (typeof window === 'undefined') return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        this.websocketConnected = true;
        console.log('WebSocket预警推送已连接');
      };

      this.websocket.onclose = () => {
        this.websocketConnected = false;
        console.log('WebSocket已断开，3秒后重连...');
        setTimeout(() => this.initWebSocket(), 3000);
      };

      this.websocket.onerror = (err) => {
        console.error('WebSocket错误', err);
      };

      this.websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'alert') {
          console.log('收到新预警', data);
          this.fetchRecords();
          this.fetchStats();
        }
      };
    },

    clearCurrentRecord() {
      this.currentRecord = null;
    },
  },
});
