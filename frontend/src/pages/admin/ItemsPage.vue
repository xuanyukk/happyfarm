/**
 * 文件名：ItemsPage.vue
 * 作者：开发者
 * 日期：2026-05-23
 * 版本：v1.1.0
 * 功能描述：道具配置管理页面，提供道具列表查询、新增、编辑和删除功能
 * 更新记录：
 * 2026-05-23 - v1.0.0 - 初始版本创建
 * 2026-06-10 - v1.1.0 - 美化：玻璃拟态容器/表格/模态框、CSS变量替代硬编码色、
 *             表格行hover效果、统一农场主题色系
 */
<template>
  <div class="items-page">
    <div class="page-header">
      <h2>🎁 道具配置管理</h2>
      <button class="btn btn-primary" @click="showCreateModal">
        ➕ 新增道具
      </button>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <input
          v-model="filters.search"
          type="text"
          placeholder="搜索道具名称"
          class="filter-input"
        />
      </div>
      <div class="filter-group">
        <select v-model="filters.itemType" class="filter-select">
          <option value="">全部类型</option>
          <option v-for="(name, id) in itemTypeMap" :key="id" :value="id">
            {{ name }}
          </option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="loadItems">🔍 搜索</button>
        <button class="btn btn-default" @click="resetFilters">🔄 重置</button>
      </div>
    </div>

    <div class="items-table-container">
      <table class="items-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>道具名称</th>
            <th>类型</th>
            <th>效果值</th>
            <th>持续时间</th>
            <th>解锁等级</th>
            <th>堆叠上限</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.item_id">
            <td>{{ item.item_id }}</td>
            <td>{{ item.item_name }}</td>
            <td>
              <span
                class="item-type-badge"
                :class="getItemTypeClass(item.item_type)"
              >
                {{ getItemTypeName(item.item_type) }}
              </span>
            </td>
            <td>{{ item.effect_value }}</td>
            <td>
              {{ item.effect_duration ? item.effect_duration + '分钟' : '-' }}
            </td>
            <td>
              W{{ item.unlock_world_level }} / Lv{{ item.unlock_player_level }}
            </td>
            <td>{{ item.max_stack }}</td>
            <td>{{ formatTime(item.updated_at) }}</td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-small btn-info" @click="editItem(item)">
                  编辑
                </button>
                <button
                  class="btn btn-small btn-danger"
                  @click="confirmDelete(item)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="9" class="no-data">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑道具' : '新增道具' }}</h3>
          <button class="btn-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>道具名称 *</label>
            <input
              v-model="formData.itemName"
              type="text"
              class="form-input"
              placeholder="请输入道具名称"
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>道具类型 *</label>
              <select v-model="formData.itemType" class="form-select">
                <option v-for="(name, id) in itemTypeMap" :key="id" :value="id">
                  {{ name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>效果值 *</label>
              <input
                v-model.number="formData.effectValue"
                type="number"
                class="form-input"
                step="0.01"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>持续时间(分钟)</label>
              <input
                v-model.number="formData.effectDuration"
                type="number"
                class="form-input"
                min="0"
                placeholder="非持续时间道具留空"
              />
            </div>
            <div class="form-group">
              <label>最大堆叠 *</label>
              <input
                v-model.number="formData.maxStack"
                type="number"
                class="form-input"
                min="1"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>解锁世界等级 *</label>
              <input
                v-model.number="formData.unlockWorldLevel"
                type="number"
                class="form-input"
                min="1"
              />
            </div>
            <div class="form-group">
              <label>解锁玩家等级 *</label>
              <input
                v-model.number="formData.unlockPlayerLevel"
                type="number"
                class="form-input"
                min="1"
              />
            </div>
          </div>
          <div class="form-group">
            <label>道具描述 *</label>
            <textarea
              v-model="formData.itemDesc"
              class="form-textarea"
              rows="3"
              placeholder="请输入道具描述"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeModal">取消</button>
          <button
            class="btn btn-primary"
            :disabled="isSaving"
            @click="saveItem"
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
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>⚠️ 确认删除</h3>
          <button class="btn-close" @click="showDeleteConfirm = false">
            ×
          </button>
        </div>
        <div class="modal-body">
          <p>
            确定要删除道具"{{ deleteTarget?.item_name }}"吗？此操作不可恢复。
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showDeleteConfirm = false">
            取消
          </button>
          <button
            class="btn btn-danger"
            :disabled="isDeleting"
            @click="deleteItem"
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

const items = ref([]);
const showModal = ref(false);
const showDeleteConfirm = ref(false);
const isEdit = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const deleteTarget = ref(null);
const currentItemId = ref(null);

const filters = ref({
  search: '',
  itemType: '',
});

const formData = ref({
  itemType: 1,
  itemName: '',
  itemDesc: '',
  effectValue: 0,
  effectDuration: null,
  unlockWorldLevel: 1,
  unlockPlayerLevel: 1,
  maxStack: 9999,
});

const itemTypeMap = {
  1: '初级增产剂',
  2: '中级增产剂',
  3: '高级增产剂',
  4: '初级加速剂',
  5: '中级加速剂',
  6: '高级加速剂',
  7: '超级增产剂',
  8: '超级加速剂',
  9: '幸运种子',
  10: '时光沙漏',
  11: '丰收之神',
  12: '土地祝福',
  13: '经验药水',
  14: '金币袋',
  15: '神秘宝箱',
  16: '农场手册',
  17: '世界之书',
  18: '体力药水',
  19: '高级体力药水',
  20: '超级体力药水',
};

async function loadItems() {
  try {
    const response = await adminService.getItemList({
      search: filters.value.search,
      itemType: filters.value.itemType,
    });
    if (response.success) {
      items.value = response.data || [];
    }
  } catch (error) {
    console.error('加载道具列表失败:', error);
    toastStore.error('加载道具列表失败');
  }
}

function resetFilters() {
  filters.value = {
    search: '',
    itemType: '',
  };
  loadItems();
}

function showCreateModal() {
  isEdit.value = false;
  currentItemId.value = null;
  formData.value = {
    itemType: 1,
    itemName: '',
    itemDesc: '',
    effectValue: 0,
    effectDuration: null,
    unlockWorldLevel: 1,
    unlockPlayerLevel: 1,
    maxStack: 9999,
  };
  showModal.value = true;
}

function editItem(item) {
  isEdit.value = true;
  currentItemId.value = item.item_id;
  formData.value = {
    itemType: item.item_type,
    itemName: item.item_name,
    itemDesc: item.item_desc,
    effectValue: item.effect_value,
    effectDuration: item.effect_duration,
    unlockWorldLevel: item.unlock_world_level,
    unlockPlayerLevel: item.unlock_player_level,
    maxStack: item.max_stack,
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  isEdit.value = false;
  currentItemId.value = null;
}

async function saveItem() {
  if (!formData.value.itemName || !formData.value.itemDesc) {
    toastStore.warning('请填写必填项');
    return;
  }

  isSaving.value = true;
  try {
    const data = {
      ...formData.value,
      effectDuration: formData.value.effectDuration || null,
    };

    let response;
    if (isEdit.value) {
      response = await adminService.updateItem(currentItemId.value, data);
    } else {
      response = await adminService.createItem(data);
    }

    if (response.success) {
      toastStore.success(isEdit.value ? '更新成功' : '创建成功');
      closeModal();
      loadItems();
    }
  } catch (error) {
    console.error('保存失败:', error);
    toastStore.error(error.response?.data?.message || '保存失败');
  } finally {
    isSaving.value = false;
  }
}

function confirmDelete(item) {
  deleteTarget.value = item;
  showDeleteConfirm.value = true;
}

async function deleteItem() {
  if (!deleteTarget.value) return;

  isDeleting.value = true;
  try {
    const response = await adminService.deleteItem(deleteTarget.value.item_id);
    if (response.success) {
      toastStore.success('删除成功');
      showDeleteConfirm.value = false;
      deleteTarget.value = null;
      loadItems();
    }
  } catch (error) {
    console.error('删除失败:', error);
    toastStore.error('删除失败');
  } finally {
    isDeleting.value = false;
  }
}

function getItemTypeClass(type) {
  const typeNum = Number(type);
  if (typeNum >= 1 && typeNum <= 3) return 'boost';
  if (typeNum >= 4 && typeNum <= 6) return 'speed';
  if (typeNum === 7 || typeNum === 8) return 'super';
  if (typeNum >= 9 && typeNum <= 12) return 'special';
  if (typeNum === 13) return 'exp';
  if (typeNum === 14) return 'gold';
  if (typeNum === 15) return 'chest';
  if (typeNum === 16 || typeNum === 17) return 'book';
  if (typeNum >= 18 && typeNum <= 20) return 'energy';
  return 'default';
}

function getItemTypeName(type) {
  return itemTypeMap[type] || type;
}

function formatTime(timeStr) {
  if (!timeStr) return '-';
  const date = new Date(timeStr);
  return date.toLocaleString('zh-CN');
}

onMounted(() => {
  loadItems();
});
</script>

<style scoped>
.items-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  color: var(--text-primary);
}

.filter-bar {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  padding: 16px;
  border-radius: var(--radius-xl);
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 12px;
}

.filter-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  outline: none;
  width: 200px;
  background: rgba(255,252,245,.6);
  color: var(--text-primary);
}

.filter-input:focus {
  border-color: var(--primary-500);
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  outline: none;
  min-width: 150px;
  background: rgba(255,252,245,.6);
  color: var(--text-primary);
}

.filter-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.items-table-container {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.items-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.items-table th {
  background: rgba(139,105,20,.06);
  font-weight: 600;
  color: var(--text-primary);
}

.items-table tbody tr:hover {
  background: rgba(255,252,245,.18);
}

.item-type-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.item-type-badge.boost {
  background: var(--primary-100);
  color: var(--primary-700);
}

.item-type-badge.speed {
  background: rgba(74,124,89,.12);
  color: var(--primary-600);
}

.item-type-badge.super {
  background: rgba(245,158,11,.15);
  color: #b45309;
}

.item-type-badge.special {
  background: rgba(147,51,234,.12);
  color: #7b1fa2;
}

.item-type-badge.exp {
  background: rgba(220,38,38,.1);
  color: var(--error-600);
}

.item-type-badge.gold {
  background: rgba(212,160,23,.15);
  color: var(--gold-700);
}

.item-type-badge.chest {
  background: rgba(220,38,38,.08);
  color: #c2185b;
}

.item-type-badge.book {
  background: rgba(14,165,233,.12);
  color: #0369a1;
}

.item-type-badge.energy {
  background: rgba(74,124,89,.1);
  color: var(--primary-700);
}

.item-type-badge.default {
  background: rgba(139,105,20,.08);
  color: var(--text-secondary);
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
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

.btn-info {
  background: var(--primary-100);
  color: var(--primary-700);
}

.btn-info:hover {
  background: var(--primary-200);
}

.btn-danger {
  background: rgba(220,38,38,.1);
  color: var(--error-600);
}

.btn-danger:hover {
  background: rgba(220,38,38,.2);
  color: white;
}

.btn-small {
  padding: 4px 12px;
  font-size: 13px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0 8px;
}

.btn-close:hover {
  color: var(--text-primary);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.no-data {
  text-align: center;
  color: var(--text-secondary);
  padding: 48px !important;
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

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  border: 1px solid var(--glass-border);
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
}

.modal-small {
  max-width: 450px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  outline: none;
  font-size: 14px;
  box-sizing: border-box;
  background: rgba(255,252,245,.6);
  color: var(--text-primary);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: var(--primary-500);
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
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

  .filter-input,
  .filter-select {
    width: 100%;
  }
}
</style>
