/**
 * 文件名：AchievementPage.vue
 * 作者：开发者
 * 日期：2026-05-23
 * 版本：v2.0.0
 * 功能描述：成就管理页面，提供成就列表查询、新增、编辑和删除功能
 * 更新记录：
 * 2026-05-23 - v1.0.0 - 初始版本创建
 * 2026-05-23 - v2.0.0 - 修复 HTML 编码问题，添加分页功能，统一样式
 */
<template>
  <div class="achievement-page">
    <div class="page-header">
      <h2>🏆 成就管理</h2>
      <button class="btn btn-primary" @click="showCreateModal">
        ➕ 新增成就
      </button>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <input
          v-model="filters.search"
          type="text"
          placeholder="搜索成就名称"
          class="filter-input"
        />
      </div>
      <div class="filter-group">
        <select v-model="filters.category" class="filter-select">
          <option value="">全部分类</option>
          <option value="plant">种植类</option>
          <option value="harvest">收获类</option>
          <option value="level">等级类</option>
          <option value="collection">收集类</option>
        </select>
        <select v-model="filters.rarity" class="filter-select">
          <option value="">全部稀有度</option>
          <option value="common">普通</option>
          <option value="rare">稀有</option>
          <option value="epic">史诗</option>
          <option value="legendary">传说</option>
        </select>
        <select v-model="filters.isActive" class="filter-select">
          <option value="">全部状态</option>
          <option value="true">启用</option>
          <option value="false">禁用</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="loadAchievements">
          🔍 搜索
        </button>
        <button class="btn btn-default" @click="resetFilters">🔄 重置</button>
      </div>
    </div>

    <div class="achievement-table-container">
      <table class="achievement-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>图标</th>
            <th>成就名称</th>
            <th>分类</th>
            <th>稀有度</th>
            <th>目标数量</th>
            <th>奖励类型</th>
            <th>状态</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="achievement in achievementList"
            :key="achievement.achievement_id"
          >
            <td>{{ achievement.achievement_id }}</td>
            <td>
              <span class="achievement-icon">{{ achievement.icon }}</span>
            </td>
            <td>{{ achievement.achievement_name }}</td>
            <td>
              <span
                class="category-badge"
                :class="getCategoryClass(achievement.category)"
              >
                {{ getCategoryName(achievement.category) }}
              </span>
            </td>
            <td>
              <span
                class="rarity-badge"
                :class="getRarityClass(achievement.rarity)"
              >
                {{ getRarityName(achievement.rarity) }}
              </span>
            </td>
            <td>{{ achievement.required_count }}</td>
            <td>{{ getRewardName(achievement.reward_type) }}</td>
            <td>
              <span
                class="status-badge"
                :class="achievement.is_active ? 'active' : 'inactive'"
              >
                {{ achievement.is_active ? '启用' : '禁用' }}
              </span>
            </td>
            <td>{{ formatTime(achievement.updated_at) }}</td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn btn-small btn-info"
                  @click="viewStatistics(achievement)"
                >
                  统计
                </button>
                <button
                  class="btn btn-small btn-info"
                  @click="editAchievement(achievement)"
                >
                  编辑
                </button>
                <button
                  class="btn btn-small btn-danger"
                  @click="confirmDelete(achievement)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="achievementList.length === 0">
            <td colspan="10" class="no-data">暂无数据</td>
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
          loadAchievements();
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
          loadAchievements();
        "
      >
        下一页
      </button>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑成就' : '新增成就' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>成就名称 *</label>
              <input
                v-model="formData.achievementName"
                type="text"
                class="form-input"
                placeholder="请输入成就名称"
              />
            </div>
            <div class="form-group">
              <label>图标</label>
              <input
                v-model="formData.icon"
                type="text"
                class="form-input"
                placeholder="请输入emoji图标"
              />
            </div>
          </div>
          <div class="form-group">
            <label>描述 *</label>
            <textarea
              v-model="formData.description"
              class="form-textarea"
              rows="3"
              placeholder="请输入成就描述"
            ></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>分类 *</label>
              <select v-model="formData.category" class="form-select">
                <option value="plant">种植类</option>
                <option value="harvest">收获类</option>
                <option value="level">等级类</option>
                <option value="collection">收集类</option>
              </select>
            </div>
            <div class="form-group">
              <label>稀有度 *</label>
              <select v-model="formData.rarity" class="form-select">
                <option value="common">普通</option>
                <option value="rare">稀有</option>
                <option value="epic">史诗</option>
                <option value="legendary">传说</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>目标数量 *</label>
            <input
              v-model.number="formData.requiredCount"
              type="number"
              class="form-input"
              min="1"
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>奖励类型 *</label>
              <select v-model="formData.rewardType" class="form-select">
                <option value="none">无奖励</option>
                <option value="coin">农场币</option>
                <option value="item">道具</option>
                <option value="title">称号</option>
              </select>
            </div>
            <div class="form-group">
              <label>奖励数量</label>
              <input
                v-model.number="formData.rewardAmount"
                type="number"
                class="form-input"
                min="0"
              />
            </div>
          </div>
          <div v-if="formData.rewardType === 'item'" class="form-group">
            <label>奖励道具ID</label>
            <input
              v-model.number="formData.rewardItemId"
              type="number"
              class="form-input"
              min="1"
            />
          </div>
          <div v-if="formData.rewardType === 'title'" class="form-group">
            <label>奖励称号</label>
            <input
              v-model="formData.rewardTitle"
              type="text"
              class="form-input"
              placeholder="请输入称号名称"
            />
          </div>
          <div class="form-group">
            <label>是否启用 *</label>
            <select v-model="formData.isActive" class="form-select">
              <option :value="true">是</option>
              <option :value="false">否</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeModal">取消</button>
          <button
            class="btn btn-primary"
            :disabled="isSaving"
            @click="saveAchievement"
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
            确定要删除成就"{{
              deleteTarget?.achievement_name
            }}"吗？此操作不可恢复。
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showDeleteConfirm = false">
            取消
          </button>
          <button
            class="btn btn-danger"
            :disabled="isDeleting"
            @click="deleteAchievement"
          >
            {{ isDeleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showStatisticsModal"
      class="modal-overlay"
      @click.self="showStatisticsModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>📊 成就统计</h3>
          <button class="close-btn" @click="showStatisticsModal = false">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div class="statistics-info">
            <div class="stat-item">
              <span class="stat-label">成就名称：</span>
              <span class="stat-value">{{
                statisticsTarget?.achievement_name
              }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">已完成人数：</span>
              <span class="stat-value">{{
                statisticsData?.completedCount || 0
              }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">进行中人数：</span>
              <span class="stat-value">{{
                statisticsData?.inProgressCount || 0
              }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">完成率：</span>
              <span class="stat-value">{{
                statisticsData?.completionRate || '0%'
              }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showStatisticsModal = false">
            关闭
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

const achievementList = ref([]);
const showModal = ref(false);
const showDeleteConfirm = ref(false);
const showStatisticsModal = ref(false);
const isEdit = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const deleteTarget = ref(null);
const statisticsTarget = ref(null);
const statisticsData = ref(null);
const currentAchievementId = ref(null);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const totalPages = ref(1);

const filters = ref({
  search: '',
  category: '',
  rarity: '',
  isActive: '',
});

const formData = ref({
  achievementName: '',
  icon: '🏆',
  description: '',
  category: 'plant',
  rarity: 'common',
  requiredCount: 1,
  rewardType: 'none',
  rewardAmount: 0,
  rewardItemId: null,
  rewardTitle: '',
  isActive: true,
});

async function loadAchievements() {
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...filters.value,
    };
    const response = await adminService.getAchievementList(params);
    if (response.success) {
      if (response.data && response.data.achievements) {
        achievementList.value = response.data.achievements;
        total.value = response.data.total || 0;
        totalPages.value = response.data.totalPages || 1;
      } else {
        achievementList.value = response.data || [];
        total.value = achievementList.value.length;
        totalPages.value = 1;
      }
    }
  } catch (error) {
    console.error('加载成就列表失败:', error);
    toastStore.error('加载成就列表失败');
  }
}

function resetFilters() {
  filters.value = {
    search: '',
    category: '',
    rarity: '',
    isActive: '',
  };
  currentPage.value = 1;
  loadAchievements();
}

function showCreateModal() {
  isEdit.value = false;
  currentAchievementId.value = null;
  formData.value = {
    achievementName: '',
    icon: '🏆',
    description: '',
    category: 'plant',
    rarity: 'common',
    requiredCount: 1,
    rewardType: 'none',
    rewardAmount: 0,
    rewardItemId: null,
    rewardTitle: '',
    isActive: true,
  };
  showModal.value = true;
}

function editAchievement(achievement) {
  isEdit.value = true;
  currentAchievementId.value = achievement.achievement_id;
  formData.value = {
    achievementName: achievement.achievement_name,
    icon: achievement.icon,
    description: achievement.description,
    category: achievement.category,
    rarity: achievement.rarity,
    requiredCount: achievement.required_count,
    rewardType: achievement.reward_type,
    rewardAmount: achievement.reward_amount,
    rewardItemId: achievement.reward_item_id,
    rewardTitle: achievement.reward_title,
    isActive: achievement.is_active,
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  isEdit.value = false;
  currentAchievementId.value = null;
}

async function saveAchievement() {
  if (!formData.value.achievementName || !formData.value.description) {
    toastStore.warning('请填写必填项');
    return;
  }

  isSaving.value = true;
  try {
    const data = {
      ...formData.value,
    };

    let response;
    if (isEdit.value) {
      response = await adminService.updateAchievement(
        currentAchievementId.value,
        data
      );
    } else {
      response = await adminService.createAchievement(data);
    }

    if (response.success) {
      toastStore.success(isEdit.value ? '更新成功' : '创建成功');
      closeModal();
      loadAchievements();
    }
  } catch (error) {
    console.error('保存失败:', error);
    toastStore.error(error.response?.data?.message || '保存失败');
  } finally {
    isSaving.value = false;
  }
}

function confirmDelete(achievement) {
  deleteTarget.value = achievement;
  showDeleteConfirm.value = true;
}

async function deleteAchievement() {
  if (!deleteTarget.value) return;

  isDeleting.value = true;
  try {
    const response = await adminService.deleteAchievement(
      deleteTarget.value.achievement_id
    );
    if (response.success) {
      toastStore.success('删除成功');
      showDeleteConfirm.value = false;
      deleteTarget.value = null;
      loadAchievements();
    }
  } catch (error) {
    console.error('删除失败:', error);
    toastStore.error('删除失败');
  } finally {
    isDeleting.value = false;
  }
}

async function viewStatistics(achievement) {
  statisticsTarget.value = achievement;
  try {
    const response = await adminService.getAchievementStatistics(
      achievement.achievement_id
    );
    if (response.success) {
      statisticsData.value = response.data;
    }
    showStatisticsModal.value = true;
  } catch (error) {
    console.error('获取统计数据失败:', error);
    toastStore.error('获取统计数据失败');
  }
}

function getCategoryClass(category) {
  const classes = {
    plant: 'plant',
    harvest: 'harvest',
    level: 'level',
    collection: 'collection',
  };
  return classes[category] || 'default';
}

function getCategoryName(category) {
  const names = {
    plant: '种植类',
    harvest: '收获类',
    level: '等级类',
    collection: '收集类',
  };
  return names[category] || category;
}

function getRarityClass(rarity) {
  const classes = {
    common: 'common',
    rare: 'rare',
    epic: 'epic',
    legendary: 'legendary',
  };
  return classes[rarity] || 'common';
}

function getRarityName(rarity) {
  const names = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
  };
  return names[rarity] || rarity;
}

function getRewardName(rewardType) {
  const names = {
    none: '无奖励',
    coin: '农场币',
    item: '道具',
    title: '称号',
  };
  return names[rewardType] || rewardType;
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
  loadAchievements();
});
</script>

<style scoped>
.achievement-page {
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

.filter-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.filter-input:focus,
.filter-select:focus {
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

.achievement-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.achievement-table {
  width: 100%;
  border-collapse: collapse;
}

.achievement-table th,
.achievement-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.achievement-table th {
  background: #fafafa;
  font-weight: 600;
  color: #595959;
  font-size: 14px;
}

.achievement-table td {
  color: #262626;
  font-size: 14px;
}

.achievement-icon {
  font-size: 24px;
}

.category-badge,
.rarity-badge,
.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.category-badge.plant {
  background: #e6f7ff;
  color: #1890ff;
}

.category-badge.harvest {
  background: #fff7e6;
  color: #fa8c16;
}

.category-badge.level {
  background: #e8f7ff;
  color: #0050b3;
}

.category-badge.collection {
  background: #f9f0ff;
  color: #722ed1;
}

.rarity-badge.common {
  background: #f5f5f5;
  color: #595959;
}

.rarity-badge.rare {
  background: #e6f7ff;
  color: #1890ff;
}

.rarity-badge.epic {
  background: #f9f0ff;
  color: #722ed1;
}

.rarity-badge.legendary {
  background: #fff7e6;
  color: #fa8c16;
}

.status-badge.active {
  background: #f6ffed;
  color: #52c41a;
}

.status-badge.inactive {
  background: #fff1f0;
  color: #ff4d4f;
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

.statistics-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 4px;
}

.stat-label {
  font-weight: 500;
  color: #595959;
}

.stat-value {
  font-weight: 600;
  color: #1890ff;
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

  .filter-input,
  .filter-select {
    width: 100%;
  }
}
</style>
