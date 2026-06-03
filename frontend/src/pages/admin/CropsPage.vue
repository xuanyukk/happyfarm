/** * 文件名：CropsPage.vue * 作者：开发者 * 日期：2026-05-23 * 版本：v1.0.0 *
功能描述：作物配置管理页面，提供作物列表查询、新增、编辑和删除功能 * 更新记录：
* 2026-05-23 - v1.0.0 - 初始版本创建 */
<template>
  <div class="crops-page">
    <div class="page-header">
      <h2>🌱 作物配置管理</h2>
      <button class="btn btn-primary" @click="showCreateModal">
        ➕ 新增作物
      </button>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <input
          v-model="filters.search"
          type="text"
          placeholder="搜索作物名称"
          class="filter-input"
        />
      </div>
      <div class="filter-group">
        <select v-model="filters.worldId" class="filter-select">
          <option value="">全部世界等级</option>
          <option v-for="i in 10" :key="i" :value="i">Lv.{{ i }}</option>
        </select>
        <select v-model="filters.cropType" class="filter-select">
          <option value="">全部类型</option>
          <option value="basic">基础作物</option>
          <option value="economic">经济作物</option>
          <option value="rare">珍稀作物</option>
          <option value="top">顶级作物</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="loadCrops">🔍 搜索</button>
        <button class="btn btn-default" @click="resetFilters">🔄 重置</button>
      </div>
    </div>

    <div class="crops-table-container">
      <table class="crops-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>作物名称</th>
            <th>世界等级</th>
            <th>类型</th>
            <th>生长周期</th>
            <th>基础产量</th>
            <th>出售价格</th>
            <th>种子成本</th>
            <th>GP/min</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="crop in crops" :key="crop.crop_id">
            <td>{{ crop.crop_id }}</td>
            <td>{{ crop.crop_name }}</td>
            <td>Lv.{{ crop.world_id }}</td>
            <td>
              <span
                class="crop-type-badge"
                :class="getCropTypeClass(crop.crop_type)"
              >
                {{ getCropTypeName(crop.crop_type) }}
              </span>
            </td>
            <td>{{ crop.growth_cycle }}分钟</td>
            <td>{{ crop.base_yield }}</td>
            <td>{{ formatNumber(crop.sell_price) }}</td>
            <td>{{ formatNumber(crop.seed_cost) }}</td>
            <td>{{ crop.gp_per_min }}</td>
            <td>{{ formatTime(crop.updated_at) }}</td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-small btn-info" @click="editCrop(crop)">
                  编辑
                </button>
                <button
                  class="btn btn-small btn-danger"
                  @click="confirmDelete(crop)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="crops.length === 0">
            <td colspan="11" class="no-data">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑作物' : '新增作物' }}</h3>
          <button class="btn-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>作物名称 *</label>
            <input
              v-model="formData.cropName"
              type="text"
              class="form-input"
              placeholder="请输入作物名称"
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>世界等级 *</label>
              <input
                v-model.number="formData.worldId"
                type="number"
                class="form-input"
                min="1"
              />
            </div>
            <div class="form-group">
              <label>类型 *</label>
              <select v-model="formData.cropType" class="form-select">
                <option value="basic">基础作物</option>
                <option value="economic">经济作物</option>
                <option value="rare">珍稀作物</option>
                <option value="top">顶级作物</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>生长周期(分钟) *</label>
              <input
                v-model.number="formData.growthCycle"
                type="number"
                class="form-input"
                min="3"
              />
            </div>
            <div class="form-group">
              <label>基础产量 *</label>
              <input
                v-model.number="formData.baseYield"
                type="number"
                class="form-input"
                min="1"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>最小产量</label>
              <input
                v-model.number="formData.minYield"
                type="number"
                class="form-input"
                min="1"
              />
            </div>
            <div class="form-group">
              <label>最大产量</label>
              <input
                v-model.number="formData.maxYield"
                type="number"
                class="form-input"
                min="1"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>出售价格 *</label>
              <input
                v-model.number="formData.sellPrice"
                type="number"
                class="form-input"
                min="0"
              />
            </div>
            <div class="form-group">
              <label>种子成本 *</label>
              <input
                v-model.number="formData.seedCost"
                type="number"
                class="form-input"
                min="0"
              />
            </div>
          </div>
          <div class="form-group">
            <label>GP/min *</label>
            <input
              v-model.number="formData.gpPerMin"
              type="number"
              class="form-input"
              step="0.01"
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>解锁玩家等级</label>
              <input
                v-model.number="formData.unlockPlayerLevel"
                type="number"
                class="form-input"
                min="1"
              />
            </div>
            <div class="form-group">
              <label>解锁农场等级</label>
              <input
                v-model.number="formData.unlockFarmLevel"
                type="number"
                class="form-input"
                min="1"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>玩家经验基数</label>
              <input
                v-model.number="formData.playerExpBase"
                type="number"
                class="form-input"
                min="0"
              />
            </div>
            <div class="form-group">
              <label>农场经验基数</label>
              <input
                v-model.number="formData.farmExpBase"
                type="number"
                class="form-input"
                min="0"
              />
            </div>
            <div class="form-group">
              <label>世界经验基数</label>
              <input
                v-model.number="formData.worldExpBase"
                type="number"
                class="form-input"
                min="0"
              />
            </div>
          </div>
          <div class="form-group">
            <label>解锁说明</label>
            <textarea
              v-model="formData.unlockDesc"
              class="form-textarea"
              rows="2"
              placeholder="请输入解锁说明"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeModal">取消</button>
          <button
            class="btn btn-primary"
            :disabled="isSaving"
            @click="saveCrop"
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
            确定要删除作物"{{ deleteTarget?.crop_name }}"吗？此操作不可恢复。
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showDeleteConfirm = false">
            取消
          </button>
          <button
            class="btn btn-danger"
            :disabled="isDeleting"
            @click="deleteCrop"
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

const crops = ref([]);
const showModal = ref(false);
const showDeleteConfirm = ref(false);
const isEdit = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const deleteTarget = ref(null);
const currentCropId = ref(null);

const filters = ref({
  search: '',
  worldId: '',
  cropType: '',
});

const formData = ref({
  cropName: '',
  worldId: 1,
  unlockPlayerLevel: 1,
  unlockFarmLevel: 1,
  growthCycle: 3,
  baseYield: 1,
  minYield: 1,
  maxYield: 1,
  sellPrice: 0,
  seedCost: 0,
  gpPerMin: 0,
  cropType: 'basic',
  unlockDesc: '',
  playerExpBase: 1,
  farmExpBase: 1,
  worldExpBase: 1,
});

async function loadCrops() {
  try {
    const response = await adminService.getCropList({
      search: filters.value.search,
      worldId: filters.value.worldId,
      cropType: filters.value.cropType,
    });
    if (response.success) {
      crops.value = response.data || [];
    }
  } catch (error) {
    console.error('加载作物列表失败:', error);
    toastStore.error('加载作物列表失败');
  }
}

function resetFilters() {
  filters.value = {
    search: '',
    worldId: '',
    cropType: '',
  };
  loadCrops();
}

function showCreateModal() {
  isEdit.value = false;
  currentCropId.value = null;
  formData.value = {
    cropName: '',
    worldId: 1,
    unlockPlayerLevel: 1,
    unlockFarmLevel: 1,
    growthCycle: 3,
    baseYield: 1,
    minYield: 1,
    maxYield: 1,
    sellPrice: 0,
    seedCost: 0,
    gpPerMin: 0,
    cropType: 'basic',
    unlockDesc: '',
    playerExpBase: 1,
    farmExpBase: 1,
    worldExpBase: 1,
  };
  showModal.value = true;
}

function editCrop(crop) {
  isEdit.value = true;
  currentCropId.value = crop.crop_id;
  formData.value = {
    cropName: crop.crop_name,
    worldId: crop.world_id,
    unlockPlayerLevel: crop.unlock_player_level,
    unlockFarmLevel: crop.unlock_farm_level,
    growthCycle: crop.growth_cycle,
    baseYield: crop.base_yield,
    minYield: crop.min_yield,
    maxYield: crop.max_yield,
    sellPrice: crop.sell_price,
    seedCost: crop.seed_cost,
    gpPerMin: crop.gp_per_min,
    cropType: crop.crop_type,
    unlockDesc: crop.unlock_desc,
    playerExpBase: crop.player_exp_base,
    farmExpBase: crop.farm_exp_base,
    worldExpBase: crop.world_exp_base,
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  isEdit.value = false;
  currentCropId.value = null;
}

async function saveCrop() {
  if (!formData.value.cropName || formData.value.growthCycle < 3) {
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
      response = await adminService.updateCrop(currentCropId.value, data);
    } else {
      response = await adminService.createCrop(data);
    }

    if (response.success) {
      toastStore.success(isEdit.value ? '更新成功' : '创建成功');
      closeModal();
      loadCrops();
    }
  } catch (error) {
    console.error('保存失败:', error);
    toastStore.error(error.response?.data?.message || '保存失败');
  } finally {
    isSaving.value = false;
  }
}

function confirmDelete(crop) {
  deleteTarget.value = crop;
  showDeleteConfirm.value = true;
}

async function deleteCrop() {
  if (!deleteTarget.value) return;

  isDeleting.value = true;
  try {
    const response = await adminService.deleteCrop(deleteTarget.value.crop_id);
    if (response.success) {
      toastStore.success('删除成功');
      showDeleteConfirm.value = false;
      deleteTarget.value = null;
      loadCrops();
    }
  } catch (error) {
    console.error('删除失败:', error);
    toastStore.error('删除失败');
  } finally {
    isDeleting.value = false;
  }
}

function getCropTypeClass(type) {
  const classes = {
    basic: 'basic',
    economic: 'economic',
    rare: 'rare',
    top: 'top',
  };
  return classes[type] || 'basic';
}

function getCropTypeName(type) {
  const names = {
    basic: '基础作物',
    economic: '经济作物',
    rare: '珍稀作物',
    top: '顶级作物',
  };
  return names[type] || type;
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
  loadCrops();
});
</script>

<style scoped>
.crops-page {
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
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-group {
  display: flex;
  gap: 12px;
}

.filter-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
  width: 200px;
}

.filter-input:focus {
  border-color: #3498db;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
  min-width: 150px;
}

.filter-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.crops-table-container {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.crops-table {
  width: 100%;
  border-collapse: collapse;
}

.crops-table th,
.crops-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.crops-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

.crops-table tbody tr:hover {
  background: #f8f9fa;
}

.crop-type-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.crop-type-badge.basic {
  background: #e3f2fd;
  color: #1976d2;
}

.crop-type-badge.economic {
  background: #fff3e0;
  color: #f57c00;
}

.crop-type-badge.rare {
  background: #f3e5f5;
  color: #7b1fa2;
}

.crop-type-badge.top {
  background: #ffebee;
  color: #d32f2f;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #3498db;
  color: #fff;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-default {
  background: #e0e0e0;
  color: #333;
}

.btn-default:hover {
  background: #bdbdbd;
}

.btn-info {
  background: #17a2b8;
  color: #fff;
}

.btn-info:hover {
  background: #138496;
}

.btn-danger {
  background: #e74c3c;
  color: #fff;
}

.btn-danger:hover {
  background: #c0392b;
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
  color: #999;
  padding: 0 8px;
}

.btn-close:hover {
  color: #333;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.no-data {
  text-align: center;
  color: #999;
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
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-small {
  max-width: 450px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #eee;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #2c3e50;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #3498db;
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
