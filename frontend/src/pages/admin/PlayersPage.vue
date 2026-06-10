/**
 * 文件名：PlayersPage.vue
 * 作者：开发者
 * 日期：2025-01-01
 * 版本：v2.1.0
 * 功能描述：玩家数据管理页面，提供玩家列表查询、筛选、详情查看和状态管理功能
 * 更新记录：
 * 2025-01-01 - v1.1.0 - 初始版本创建
 * 2026-03-28 - v2.0.0 - 【阶段四完成】接入adminService，玩家管理功能完整实现
 * 2026-06-10 - v2.1.0 - 美化：玻璃拟态容器/表格/模态框、CSS变量替代硬编码色、
 *             表格行hover效果、统一农场主题色系
 */
<template>
  <div class="players-page">
    <div class="filter-bar">
      <div class="filter-group">
        <input
          v-model="filters.username"
          type="text"
          placeholder="搜索用户名"
          class="filter-input"
        />
        <input
          v-model="filters.playerId"
          type="text"
          placeholder="玩家ID"
          class="filter-input"
        />
      </div>
      <div class="filter-group">
        <select v-model="filters.status" class="filter-select">
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="inactive">冻结</option>
        </select>
        <input
          v-model.number="filters.minLevel"
          type="number"
          placeholder="最低等级"
          class="filter-input"
          style="width: 100px"
        />
        <input
          v-model.number="filters.maxLevel"
          type="number"
          placeholder="最高等级"
          class="filter-input"
          style="width: 100px"
        />
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="loadPlayers">🔍 搜索</button>
        <button class="btn btn-default" @click="resetFilters">🔄 重置</button>
      </div>
    </div>

    <div class="players-table-container">
      <table class="players-table">
        <thead>
          <tr>
            <th>玩家ID</th>
            <th>用户名</th>
            <th>玩家等级</th>
            <th>农场等级</th>
            <th>世界等级</th>
            <th>累计获得</th>
            <th>累计消耗</th>
            <th>状态</th>
            <th>最后登录</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="player in players" :key="player.player_id">
            <td>{{ player.player_id }}</td>
            <td>{{ player.username || '-' }}</td>
            <td>Lv.{{ player.player_level }}</td>
            <td>Lv.{{ player.farm_level }}</td>
            <td>Lv.{{ player.world_level }}</td>
            <td>{{ formatNumber(player.total_earn) }}</td>
            <td>{{ formatNumber(player.total_spend) }}</td>
            <td>
              <span
                class="status-badge"
                :class="player.is_active ? 'active' : 'inactive'"
              >
                {{ player.is_active ? '正常' : '冻结' }}
              </span>
            </td>
            <td>{{ formatTime(player.last_login_at) }}</td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn btn-small btn-info"
                  @click="viewDetail(player)"
                >
                  详情
                </button>
                <button
                  v-if="player.is_active"
                  class="btn btn-small btn-danger"
                  @click="toggleStatus(player, false)"
                >
                  冻结
                </button>
                <button
                  v-else
                  class="btn btn-small btn-success"
                  @click="toggleStatus(player, true)"
                >
                  解冻
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!players.length" class="empty-state">暂无玩家数据</div>
    </div>

    <div class="pagination">
      <button
        :disabled="currentPage <= 1"
        class="btn btn-default"
        @click="
          currentPage--;
          loadPlayers();
        "
      >
        上一页
      </button>
      <span class="page-info">
        第 {{ currentPage }} / {{ totalPages }} 页，共 {{ total }} 条
      </span>
      <button
        :disabled="currentPage >= totalPages"
        class="btn btn-default"
        @click="
          currentPage++;
          loadPlayers();
        "
      >
        下一页
      </button>
    </div>

    <div
      v-if="showDetailModal"
      class="modal-overlay"
      @click.self="showDetailModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>玩家详情</h3>
          <button class="close-btn" @click="showDetailModal = false">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div v-if="selectedPlayer" class="player-detail">
            <div class="detail-section">
              <h4>基本信息</h4>
              <div class="detail-row">
                <span class="label">玩家ID:</span>
                <span class="value">{{ selectedPlayer.player_id }}</span>
              </div>
              <div class="detail-row">
                <span class="label">用户名:</span>
                <span class="value">{{ selectedPlayer.username || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">邮箱:</span>
                <span class="value">{{ selectedPlayer.email || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">状态:</span>
                <span class="value">
                  <span
                    class="status-badge"
                    :class="selectedPlayer.is_active ? 'active' : 'inactive'"
                  >
                    {{ selectedPlayer.is_active ? '正常' : '冻结' }}
                  </span>
                </span>
              </div>
            </div>

            <div class="detail-section">
              <h4>等级信息</h4>
              <div class="detail-row">
                <span class="label">玩家等级:</span>
                <span class="value">Lv.{{ selectedPlayer.player_level }}</span>
              </div>
              <div class="detail-row">
                <span class="label">农场等级:</span>
                <span class="value">Lv.{{ selectedPlayer.farm_level }}</span>
              </div>
              <div class="detail-row">
                <span class="label">世界等级:</span>
                <span class="value">Lv.{{ selectedPlayer.world_level }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h4>货币信息</h4>
              <div class="detail-row">
                <span class="label">农场币:</span>
                <span class="value">{{
                  formatNumber(selectedPlayer.currency?.coin_balance)
                }}</span>
              </div>
              <div class="detail-row">
                <span class="label">宝石:</span>
                <span class="value">{{
                  formatNumber(selectedPlayer.currency?.gem_balance)
                }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h4>时间信息</h4>
              <div class="detail-row">
                <span class="label">注册时间:</span>
                <span class="value">{{
                  formatTime(selectedPlayer.created_at)
                }}</span>
              </div>
              <div class="detail-row">
                <span class="label">最后登录:</span>
                <span class="value">{{
                  formatTime(selectedPlayer.last_login_at)
                }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showDetailModal = false">
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import adminService from '../../services/adminService';

const filters = ref({
  username: '',
  playerId: '',
  status: '',
  minLevel: null,
  maxLevel: null,
});

const players = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const totalPages = ref(1);
const showDetailModal = ref(false);
const selectedPlayer = ref(null);

/**
 * 加载玩家列表数据
 * @returns {Promise<void>} 无返回值
 */
async function loadPlayers() {
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...filters.value,
    };

    const result = await adminService.getPlayerList(params);
    if (result.success) {
      players.value = result.data.players;
      total.value = result.data.total;
      totalPages.value = result.data.totalPages;
    }
  } catch (error) {
    console.error('加载玩家列表失败', error);
  }
}

/**
 * 重置筛选条件
 * @returns {void} 无返回值
 */
function resetFilters() {
  filters.value = {
    username: '',
    playerId: '',
    status: '',
    minLevel: null,
    maxLevel: null,
  };
  currentPage.value = 1;
  loadPlayers();
}

/**
 * 查看玩家详情
 * @param {Object} player - 玩家对象
 * @returns {void} 无返回值
 */
function viewDetail(player) {
  selectedPlayer.value = player;
  showDetailModal.value = true;
  loadPlayerDetail(player.player_id);
}

/**
 * 加载玩家详情数据
 * @param {number} playerId - 玩家ID
 * @returns {Promise<void>} 无返回值
 */
async function loadPlayerDetail(playerId) {
  try {
    const result = await adminService.getPlayerDetail(playerId);
    if (result.success) {
      selectedPlayer.value = result.data;
    }
  } catch (error) {
    console.error('加载玩家详情失败', error);
  }
}

/**
 * 切换玩家状态（冻结/解冻）
 * @param {Object} player - 玩家对象
 * @param {boolean} isActive - 是否激活
 * @returns {Promise<void>} 无返回值
 */
async function toggleStatus(player, isActive) {
  if (!confirm(`确定要${isActive ? '解冻' : '冻结'}该玩家吗？`)) {
    return;
  }

  try {
    const result = await adminService.updatePlayerStatus(
      player.player_id,
      isActive,
      isActive ? '管理员解冻' : '管理员冻结'
    );

    if (result.success) {
      loadPlayers();
    }
  } catch (error) {
    console.error('更新玩家状态失败', error);
    alert('操作失败');
  }
}

/**
 * 格式化数字显示（千分位）
 * @param {number} num - 数字
 * @returns {string} 格式化后的字符串
 */
function formatNumber(num) {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('zh-CN');
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

onMounted(() => {
  loadPlayers();
});
</script>

<style scoped>
.players-page {
  padding: 0;
}

.filter-bar {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  padding: 16px 20px;
  border-radius: var(--radius-xl);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 14px;
  outline: none;
  background: rgba(255,252,245,.6);
  color: var(--text-primary);
  transition: border-color 0.3s;
}

.filter-input:focus,
.filter-select:focus {
  border-color: var(--primary-500);
}

.filter-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: var(--primary-500);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-400);
}

.btn-default {
  background: rgba(139,105,20,.06);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-default:hover {
  background: rgba(139,105,20,.14);
}

.btn-small {
  padding: 4px 12px;
  font-size: 12px;
}

.btn-info {
  background: var(--primary-100);
  color: var(--primary-700);
}

.btn-info:hover {
  background: var(--primary-200);
}

.btn-success {
  background: rgba(74,124,89,.12);
  color: var(--primary-600);
}

.btn-success:hover {
  background: rgba(74,124,89,.22);
}

.btn-danger {
  background: rgba(220,38,38,.1);
  color: var(--error-600);
}

.btn-danger:hover {
  background: rgba(220,38,38,.2);
}

.players-table-container {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.players-table {
  width: 100%;
  border-collapse: collapse;
}

.players-table th,
.players-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.players-table th {
  background: rgba(139,105,20,.06);
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.players-table td {
  color: var(--text-primary);
  font-size: 14px;
}

.players-table tbody tr:hover {
  background: rgba(255,252,245,.18);
}

.status-badge {
  padding: 4px 12px;
  border-radius: var(--radius-md);
  font-size: 12px;
}

.status-badge.active {
  background: rgba(74,124,89,.12);
  color: var(--primary-600);
}

.status-badge.inactive {
  background: rgba(220,38,38,.1);
  color: var(--error-600);
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  padding: 16px;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
}

.page-info {
  color: var(--text-secondary);
  font-size: 14px;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 60px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  border: 1px solid var(--glass-border);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
}

.close-btn:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}

.player-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--text-primary);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.detail-row {
  display: flex;
  padding: 8px 0;
}

.detail-row .label {
  width: 120px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.detail-row .value {
  color: var(--text-primary);
  flex: 1;
}
</style>
