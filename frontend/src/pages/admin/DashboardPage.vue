/** * 文件名：DashboardPage.vue * 作者：开发者 * 日期：2025-01-01 * 版本：v2.0.0
* 功能描述：后台管理系统仪表板页面，展示核心统计数据和最近活动 * 更新记录： *
2025-01-01 - v1.1.0 - 初始版本创建 * 2026-03-28 - v2.0.0 -
【阶段四完成】接入adminService，仪表板功能完整实现 */
<template>
  <div class="dashboard-page">
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: #e6f7ff; color: #1890ff">
          👥
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ dashboardData.totalPlayers || 0 }}</div>
          <div class="stat-label">总玩家数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fff7e6; color: #fa8c16">
          ⚠️
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ dashboardData.pendingAlerts?.length || 0 }}
          </div>
          <div class="stat-label">待处理预警</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #f6ffed; color: #52c41a">
          ✅
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ pendingApprovals }}</div>
          <div class="stat-label">待审批请求</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fff1f0; color: #ff4d4f">
          📝
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ dashboardData.recentLogs?.length || 0 }}
          </div>
          <div class="stat-label">今日操作</div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-panel">
        <div class="panel-header">
          <h3>📋 最近玩家</h3>
        </div>
        <div class="panel-content">
          <div v-if="dashboardData.recentPlayers?.length" class="player-list">
            <div
              v-for="player in dashboardData.recentPlayers"
              :key="player.player_id"
              class="player-item"
            >
              <div class="player-info">
                <span class="player-name">{{ player.username || '未知' }}</span>
                <span class="player-level">Lv.{{ player.player_level }}</span>
              </div>
              <span
                class="player-status"
                :class="player.is_active ? 'active' : 'inactive'"
              >
                {{ player.is_active ? '正常' : '冻结' }}
              </span>
            </div>
          </div>
          <div v-else class="empty-state">暂无数据</div>
        </div>
      </div>

      <div class="dashboard-panel">
        <div class="panel-header">
          <h3>⚠️ 待处理预警</h3>
        </div>
        <div class="panel-content">
          <div v-if="dashboardData.pendingAlerts?.length" class="alert-list">
            <div
              v-for="alert in dashboardData.pendingAlerts"
              :key="alert.id"
              class="alert-item"
              :class="alert.alert_level"
            >
              <div class="alert-info">
                <span class="alert-title">{{ alert.alert_name }}</span>
                <span class="alert-time">{{
                  formatTime(alert.created_at)
                }}</span>
              </div>
              <span class="alert-level-badge" :class="alert.alert_level">
                {{ getLevelText(alert.alert_level) }}
              </span>
            </div>
          </div>
          <div v-else class="empty-state">暂无待处理预警</div>
        </div>
      </div>
    </div>

    <div class="dashboard-panel full-width">
      <div class="panel-header">
        <h3>📝 最近操作日志</h3>
      </div>
      <div class="panel-content">
        <table v-if="dashboardData.recentLogs?.length" class="log-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>管理员</th>
              <th>模块</th>
              <th>操作</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in dashboardData.recentLogs" :key="log.id">
              <td>{{ formatTime(log.created_at) }}</td>
              <td>{{ log.admin_username || '-' }}</td>
              <td>{{ log.operation_module }}</td>
              <td>{{ log.operation_desc }}</td>
              <td>
                <span class="status-badge" :class="log.status">
                  {{ log.status === 'success' ? '成功' : '失败' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">暂无操作日志</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import adminService from '../../services/adminService';

const dashboardData = ref({});
const pendingApprovals = ref(0);
const loading = ref(true);

/**
 * 加载仪表板数据
 * @returns {Promise<void>} 无返回值
 */
async function loadDashboardData() {
  try {
    loading.value = true;
    const result = await adminService.getDashboardData();
    if (result.success) {
      dashboardData.value = result.data;
    }
  } catch (error) {
    console.error('加载仪表板数据失败', error);
  } finally {
    loading.value = false;
  }
}

/**
 * 加载待审批请求数量
 * @returns {Promise<void>} 无返回值
 */
async function loadPendingApprovals() {
  try {
    const result = await adminService.getApprovalList({
      status: 'pending',
      pageSize: 1,
    });
    if (result.success) {
      pendingApprovals.value = result.data.total;
    }
  } catch (error) {
    console.error('加载待审批数据失败', error);
  }
}

/**
 * 格式化时间显示
 * @param {string|Date} time - 时间值
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(time) {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

/**
 * 获取预警级别文本
 * @param {string} level - 预警级别
 * @returns {string} 预警级别中文文本
 */
function getLevelText(level) {
  const levelMap = {
    info: '信息',
    warning: '警告',
    error: '错误',
    critical: '严重',
  };
  return levelMap[level] || level;
}

onMounted(() => {
  loadDashboardData();
  loadPendingApprovals();
});
</script>

<style scoped>
.dashboard-page {
  padding: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.dashboard-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.dashboard-panel.full-width {
  grid-column: 1 / -1;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.panel-content {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.player-list,
.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.player-item,
.alert-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 6px;
}

.player-info,
.alert-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.player-name {
  font-weight: 500;
  color: #262626;
}

.player-level {
  font-size: 12px;
  color: #8c8c8c;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
}

.player-status {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 4px;
}

.player-status.active {
  background: #f6ffed;
  color: #52c41a;
}

.player-status.inactive {
  background: #fff1f0;
  color: #ff4d4f;
}

.alert-item.warning {
  border-left: 3px solid #faad14;
}

.alert-item.error {
  border-left: 3px solid #ff4d4f;
}

.alert-item.critical {
  border-left: 3px solid #cf1322;
}

.alert-title {
  font-weight: 500;
  color: #262626;
}

.alert-time {
  font-size: 12px;
  color: #8c8c8c;
}

.alert-level-badge {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 4px;
}

.alert-level-badge.info {
  background: #e6f7ff;
  color: #1890ff;
}

.alert-level-badge.warning {
  background: #fffbe6;
  color: #faad14;
}

.alert-level-badge.error {
  background: #fff2f0;
  color: #ff4d4f;
}

.alert-level-badge.critical {
  background: #fff1f0;
  color: #cf1322;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
}

.log-table th,
.log-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.log-table th {
  background: #fafafa;
  font-weight: 600;
  color: #595959;
  font-size: 14px;
}

.log-table td {
  color: #262626;
  font-size: 14px;
}

.status-badge {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 4px;
}

.status-badge.success {
  background: #f6ffed;
  color: #52c41a;
}

.status-badge.failed {
  background: #fff1f0;
  color: #ff4d4f;
}

.empty-state {
  text-align: center;
  color: #8c8c8c;
  padding: 40px;
}
</style>
