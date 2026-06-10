/**
 * 文件名：FarmLevelPage.vue
 * 作者：开发者
 * 日期：2026-05-23
 * 版本：v2.0.0
 * 功能描述：农场配置管理页面，提供农场等级配置查询、新增、编辑和删除功能
 * 更新记录：
 * 2026-05-23 - v1.0.0 - 初始版本创建
 * 2026-05-23 - v2.0.0 - 修复 HTML 编码问题，添加分页功能，统一样式
 */
<template>
  <div class="farm-level-page">
    <div class="page-header">
      <h2>🏡 农场配置管理</h2>
      <button class="btn btn-primary" @click="showCreateModal">
        ➕ 新增等级
      </button>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <input
          v-model="filters.search"
          type="text"
          placeholder="搜索农场等级"
          class="filter-input"
        />
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="loadFarmLevels">🔍 搜索</button>
        <button class="btn btn-default" @click="resetFilters">🔄 重置</button>
      </div>
    </div>

    <div class="farm-level-table-container">
      <table class="farm-level-table">
        <thead>
          <tr>
            <th>等级ID</th>
            <th>解锁玩家等级</th>
            <th>解锁世界等级</th>
            <th>解锁地块数</th>
            <th>奖励类型</th>
            <th>奖励道具ID</th>
            <th>奖励数量</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="level in farmLevelList" :key="level.farm_id">
            <td>{{ level.farm_id }}</td>
            <td>{{ level.unlock_player_level }}</td>
            <td>{{ level.unlock_world_level }}</td>
            <td>{{ level.land_unlock_num }}</td>
            <td>
              <span
                class="reward-type-badge"
                :class="getRewardTypeClass(level.reward_type)"
              >
                {{ getRewardTypeName(level.reward_type) }}
              </span>
            </td>
            <td>{{ level.reward_id || '-' }}</td>
            <td>{{ formatNumber(level.reward_num) }}</td>
            <td>{{ formatTime(level.updated_at) }}</td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn btn-small btn-info"
                  @click="editFarmLevel(level)"
                >
                  编辑
                </button>
                <button
                  class="btn btn-small btn-danger"
                  @click="confirmDelete(level)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="farmLevelList.length === 0">
            <td colspan="9" class="no-data">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button
        :disabled="currentPage <= 1"
        class="btn btn-default"
        @click="
          currentPage--;
          loadFarmLevels();
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
          loadFarmLevels();
        "
      >
        下一页
      </button>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑等级' : '新增等级' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>解锁玩家等级 *</label>
              <input
                v-model.number="formData.unlockPlayerLevel"
                type="number"
                class="form-input"
                min="1"
              />
            </div>
            <div class="form-group">
              <label>解锁世界等级 *</label>
              <input
                v-model.number="formData.unlockWorldLevel"
                type="number"
                class="form-input"
                min="1"
              />
            </div>
          </div>
          <div class="form-group">
            <label>解锁地块数 *</label>
            <input
              v-model.number="formData.landUnlockNum"
              type="number"
              class="form-input"
              min="0"
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>奖励类型 *</label>
              <select v-model="formData.rewardType" class="form-select">
                <option value="1">农场币</option>
                <option value="2">道具</option>
              </select>
            </div>
            <div v-if="formData.rewardType === '2'" class="form-group">
              <label>奖励道具ID</label>
              <input
                v-model.number="formData.rewardId"
                type="number"
                class="form-input"
                min="1"
              />
            </div>
          </div>
          <div class="form-group">
            <label>奖励数量 *</label>
            <input
              v-model.number="formData.rewardNum"
              type="number"
              class="form-input"
              min="0"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeModal">取消</button>
          <button
            class="btn btn-primary"
            :disabled="isSaving"
            @click="saveFarmLevel"
          >
            {{ isSaving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDeleteConfirm"
      class="modal-overlay"
      @click.self="showDeleteConfirm = false"
    >
      <div class="modal modal-small">
        <div class="modal-header">
          <h3>⚠️ 确认删除</h3>
          <button class="close-btn" @click="showDeleteConfirm = false">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <p>
            确定要删除农场等级 {{ deleteTarget?.farm_id }} 吗？此操作不可恢复。
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showDeleteConfirm = false">
            取消
          </button>
          <button
            class="btn btn-danger"
            :disabled="isDeleting"
            @click="deleteFarmLevel"
          >
            {{ isDeleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToastStore } from '../../stores/toast';
import adminService from '../../services/adminService';

const toastStore = useToastStore();

const farmLevelList = ref([]);
const showModal = ref(false);
const showDeleteConfirm = ref(false);
const isEdit = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const deleteTarget = ref(null);
const currentFarmId = ref(null);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const totalPages = ref(1);

const filters = ref({
  search: '',
});

const formData = ref({
  unlockPlayerLevel: 1,
  unlockWorldLevel: 1,
  landUnlockNum: 0,
  rewardType: '1',
  rewardId: null,
  rewardNum: 0,
});

async function loadFarmLevels() {
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...filters.value,
    };
    const response = await adminService.getFarmLevelList(params);
    if (response.success) {
      if (response.data && response.data.levels) {
        farmLevelList.value = response.data.levels;
        total.value = response.data.total || 0;
        totalPages.value = response.data.totalPages || 1;
      } else {
        farmLevelList.value = response.data || [];
        total.value = farmLevelList.value.length;
        totalPages.value = 1;
      }
    }
  } catch (error) {
    console.error('加载农场等级列表失败:', error);
    toastStore.error('加载农场等级列表失败');
  }
}

function resetFilters() {
  filters.value = {
    search: '',
  };
  currentPage.value = 1;
  loadFarmLevels();
}

function showCreateModal() {
  isEdit.value = false;
  currentFarmId.value = null;
  formData.value = {
    unlockPlayerLevel: 1,
    unlockWorldLevel: 1,
    landUnlockNum: 0,
    rewardType: '1',
    rewardId: null,
    rewardNum: 0,
  };
  showModal.value = true;
}

function editFarmLevel(level) {
  isEdit.value = true;
  currentFarmId.value = level.farm_id;
  formData.value = {
    unlockPlayerLevel: level.unlock_player_level,
    unlockWorldLevel: level.unlock_world_level,
    landUnlockNum: level.land_unlock_num,
    rewardType: String(level.reward_type),
    rewardId: level.reward_id,
    rewardNum: level.reward_num,
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  isEdit.value = false;
  currentFarmId.value = null;
}

async function saveFarmLevel() {
  if (!formData.value.unlockPlayerLevel || !formData.value.unlockWorldLevel) {
    toastStore.warning('请填写必填项');
    return;
  }

  isSaving.value = true;
  try {
    const data = {
      ...formData.value,
      rewardType: Number(formData.value.rewardType),
    };

    let response;
    if (isEdit.value) {
      response = await adminService.updateFarmLevel(currentFarmId.value, data);
    } else {
      response = await adminService.createFarmLevel(data);
    }

    if (response.success) {
      toastStore.success(isEdit.value ? '更新成功' : '创建成功');
      closeModal();
      loadFarmLevels();
    }
  } catch (error) {
    console.error('保存失败:', error);
    toastStore.error(error.response?.data?.message || '保存失败');
  } finally {
    isSaving.value = false;
  }
}

function confirmDelete(level) {
  deleteTarget.value = level;
  showDeleteConfirm.value = true;
}

async function deleteFarmLevel() {
  if (!deleteTarget.value) return;

  isDeleting.value = true;
  try {
    const response = await adminService.deleteFarmLevel(
      deleteTarget.value.farm_id
    );
    if (response.success) {
      toastStore.success('删除成功');
      showDeleteConfirm.value = false;
      deleteTarget.value = null;
      loadFarmLevels();
    }
  } catch (error) {
    console.error('删除失败:', error);
    toastStore.error('删除失败');
  } finally {
    isDeleting.value = false;
  }
}

function getRewardTypeClass(type) {
  return type === 1 ? 'coin' : 'item';
}

function getRewardTypeName(type) {
  return type === 1 ? '农场币' : '道具';
}

function formatNumber(num) {
  if (num == null) return '-';
  return Number(num).toLocaleString('zh-CN');
}

function formatTime(timeStr) {
  if (!timeStr) return '-';
  const date = new Date(timeStr);
  return date.toLocaleString('zh-CN');
}

onMounted(() => {
  loadFarmLevels();
});
</script>

<style scoped>
.farm-level-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  color: #2c3e50;
}

.filter-bar {
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
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

.filter-input {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.filter-input:focus {
  border-color: #1890ff;
}

.filter-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #40a9ff;
}

.btn-default {
  background: #fafafa;
  color: #262626;
  border: 1px solid #d9d9d9;
}

.btn-default:hover {
  background: #f5f5f5;
}

.btn-small {
  padding: 4px 12px;
  font-size: 12px;
}

.btn-info {
  background: #e6f7ff;
  color: #1890ff;
}

.btn-info:hover {
  background: #bae7ff;
}

.btn-danger {
  background: #fff1f0;
  color: #ff4d4f;
}

.btn-danger:hover {
  background: #ffa39e;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.farm-level-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.farm-level-table {
  width: 100%;
  border-collapse: collapse;
}

.farm-level-table th,
.farm-level-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.farm-level-table th {
  background: #fafafa;
  font-weight: 600;
  color: #595959;
  font-size: 14px;
}

.farm-level-table td {
  color: #262626;
  font-size: 14px;
}

.reward-type-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.reward-type-badge.coin {
  background: #f6ffed;
  color: #52c41a;
}

.reward-type-badge.item {
  background: #fff7e6;
  color: #fa8c16;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.no-data {
  text-align: center;
  color: #8c8c8c;
  padding: 60px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
}

.page-info {
  color: #595959;
  font-size: 14px;
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
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-small {
  max-width: 450px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #262626;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #8c8c8c;
  cursor: pointer;
}

.close-btn:hover {
  color: #262626;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #262626;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  outline: none;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #1890ff;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-row .form-group {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    flex-direction: column;
  }

  .filter-input {
    width: 100%;
  }
}
</style>
