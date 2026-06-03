/** * 文件名：ShopPage.vue * 作者：开发者 * 日期：2026-05-23 * 版本：v2.0.0 *
功能描述：商店商品管理页面，提供商品列表查询、新增、编辑和删除功能 * 更新记录：
* 2026-05-23 - v1.0.0 - 初始版本创建 * 2026-05-23 - v2.0.0 - 修复 HTML
编码问题，添加分页功能，统一样式 */
<template>
  <div class="shop-page">
    <div class="page-header">
      <h2>🏪 商店商品管理</h2>
      <button class="btn btn-primary" @click="showCreateModal">
        ➕ 新增商品
      </button>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <input
          v-model="filters.search"
          type="text"
          placeholder="搜索商品名称"
          class="filter-input"
        />
      </div>
      <div class="filter-group">
        <select v-model="filters.goodsType" class="filter-select">
          <option value="">全部类型</option>
          <option value="1">种子</option>
          <option value="2">道具</option>
        </select>
        <select v-model="filters.isOnSale" class="filter-select">
          <option value="">全部状态</option>
          <option value="true">上架中</option>
          <option value="false">已下架</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="loadGoods">🔍 搜索</button>
        <button class="btn btn-default" @click="resetFilters">🔄 重置</button>
      </div>
    </div>

    <div class="goods-table-container">
      <table class="goods-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>商品名称</th>
            <th>类型</th>
            <th>价格</th>
            <th>解锁等级</th>
            <th>库存</th>
            <th>销量</th>
            <th>状态</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="goods in goodsList" :key="goods.goods_id">
            <td>{{ goods.goods_id }}</td>
            <td>{{ goods.goods_name }}</td>
            <td>
              <span class="type-badge" :class="getTypeClass(goods.goods_type)">
                {{ getTypeName(goods.goods_type) }}
              </span>
            </td>
            <td>{{ formatNumber(goods.price_num) }}</td>
            <td>
              世界{{ goods.unlock_world_level }}/玩家{{
                goods.unlock_player_level
              }}
            </td>
            <td>{{ goods.stock_limit }}</td>
            <td>{{ goods.sales_volume }}</td>
            <td>
              <span
                class="status-badge"
                :class="goods.is_on_sale ? 'active' : 'inactive'"
              >
                {{ goods.is_on_sale ? '上架中' : '已下架' }}
              </span>
            </td>
            <td>{{ formatTime(goods.updated_at) }}</td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn btn-small btn-info"
                  @click="editGoods(goods)"
                >
                  编辑
                </button>
                <button
                  class="btn btn-small btn-warning"
                  @click="toggleStatus(goods)"
                >
                  {{ goods.is_on_sale ? '下架' : '上架' }}
                </button>
                <button
                  class="btn btn-small btn-danger"
                  @click="confirmDelete(goods)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="goodsList.length === 0">
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
          loadGoods();
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
          loadGoods();
        "
      >
        下一页
      </button>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑商品' : '新增商品' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>商品名称 *</label>
            <input
              v-model="formData.goodsName"
              type="text"
              class="form-input"
              placeholder="请输入商品名称"
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>商品类型 *</label>
              <select v-model="formData.goodsType" class="form-select">
                <option value="1">种子</option>
                <option value="2">道具</option>
              </select>
            </div>
            <div class="form-group">
              <label>关联对象ID *</label>
              <input
                v-model.number="formData.goodsObjId"
                type="number"
                class="form-input"
                min="1"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>价格类型 *</label>
              <select v-model="formData.priceType" class="form-select">
                <option value="1">农场币</option>
              </select>
            </div>
            <div class="form-group">
              <label>价格数量 *</label>
              <input
                v-model.number="formData.priceNum"
                type="number"
                class="form-input"
                min="0"
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
          <div class="form-row">
            <div class="form-group">
              <label>库存限制 *</label>
              <input
                v-model.number="formData.stockLimit"
                type="number"
                class="form-input"
                min="1"
              />
            </div>
            <div class="form-group">
              <label>是否上架 *</label>
              <select v-model="formData.isOnSale" class="form-select">
                <option :value="true">是</option>
                <option :value="false">否</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>商品描述 *</label>
            <textarea
              v-model="formData.description"
              class="form-textarea"
              rows="3"
              placeholder="请输入商品描述"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeModal">取消</button>
          <button
            class="btn btn-primary"
            :disabled="isSaving"
            @click="saveGoods"
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
            确定要删除商品"{{ deleteTarget?.goods_name }}"吗？此操作不可恢复。
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showDeleteConfirm = false">
            取消
          </button>
          <button
            class="btn btn-danger"
            :disabled="isDeleting"
            @click="deleteGoods"
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

const goodsList = ref([]);
const showModal = ref(false);
const showDeleteConfirm = ref(false);
const isEdit = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const deleteTarget = ref(null);
const currentGoodsId = ref(null);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const totalPages = ref(1);

const filters = ref({
  search: '',
  goodsType: '',
  isOnSale: '',
});

const formData = ref({
  goodsName: '',
  goodsType: 1,
  goodsObjId: 1,
  priceType: 1,
  priceNum: 0,
  unlockWorldLevel: 1,
  unlockPlayerLevel: 1,
  stockLimit: 9999,
  isOnSale: true,
  description: '',
});

async function loadGoods() {
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...filters.value,
    };
    const response = await adminService.getShopGoodsList(params);
    if (response.success) {
      if (response.data && response.data.goods) {
        goodsList.value = response.data.goods;
        total.value = response.data.total || 0;
        totalPages.value = response.data.totalPages || 1;
      } else {
        goodsList.value = response.data || [];
        total.value = goodsList.value.length;
        totalPages.value = 1;
      }
    }
  } catch (error) {
    console.error('加载商品列表失败:', error);
    toastStore.error('加载商品列表失败');
  }
}

function resetFilters() {
  filters.value = {
    search: '',
    goodsType: '',
    isOnSale: '',
  };
  currentPage.value = 1;
  loadGoods();
}

function showCreateModal() {
  isEdit.value = false;
  currentGoodsId.value = null;
  formData.value = {
    goodsName: '',
    goodsType: 1,
    goodsObjId: 1,
    priceType: 1,
    priceNum: 0,
    unlockWorldLevel: 1,
    unlockPlayerLevel: 1,
    stockLimit: 9999,
    isOnSale: true,
    description: '',
  };
  showModal.value = true;
}

function editGoods(goods) {
  isEdit.value = true;
  currentGoodsId.value = goods.goods_id;
  formData.value = {
    goodsName: goods.goods_name,
    goodsType: goods.goods_type,
    goodsObjId: goods.goods_obj_id,
    priceType: goods.price_type,
    priceNum: goods.price_num,
    unlockWorldLevel: goods.unlock_world_level,
    unlockPlayerLevel: goods.unlock_player_level,
    stockLimit: goods.stock_limit,
    isOnSale: goods.is_on_sale,
    description: goods.description,
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  isEdit.value = false;
  currentGoodsId.value = null;
}

async function saveGoods() {
  if (!formData.value.goodsName || !formData.value.description) {
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
      response = await adminService.updateShopGoods(currentGoodsId.value, data);
    } else {
      response = await adminService.createShopGoods(data);
    }

    if (response.success) {
      toastStore.success(isEdit.value ? '更新成功' : '创建成功');
      closeModal();
      loadGoods();
    }
  } catch (error) {
    console.error('保存失败:', error);
    toastStore.error(error.response?.data?.message || '保存失败');
  } finally {
    isSaving.value = false;
  }
}

async function toggleStatus(goods) {
  try {
    const response = await adminService.toggleShopGoodsStatus(
      goods.goods_id,
      !goods.is_on_sale
    );
    if (response.success) {
      toastStore.success(goods.is_on_sale ? '已下架' : '已上架');
      loadGoods();
    }
  } catch (error) {
    console.error('状态切换失败:', error);
    toastStore.error('状态切换失败');
  }
}

function confirmDelete(goods) {
  deleteTarget.value = goods;
  showDeleteConfirm.value = true;
}

async function deleteGoods() {
  if (!deleteTarget.value) return;

  isDeleting.value = true;
  try {
    const response = await adminService.deleteShopGoods(
      deleteTarget.value.goods_id
    );
    if (response.success) {
      toastStore.success('删除成功');
      showDeleteConfirm.value = false;
      deleteTarget.value = null;
      loadGoods();
    }
  } catch (error) {
    console.error('删除失败:', error);
    toastStore.error('删除失败');
  } finally {
    isDeleting.value = false;
  }
}

function getTypeClass(type) {
  return type === 1 ? 'seed' : 'item';
}

function getTypeName(type) {
  return type === 1 ? '种子' : '道具';
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
  loadGoods();
});
</script>

<style scoped>
.shop-page {
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

.btn-warning {
  background: #fffbe6;
  color: #faad14;
}

.btn-warning:hover {
  background: #ffe58f;
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

.goods-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.goods-table {
  width: 100%;
  border-collapse: collapse;
}

.goods-table th,
.goods-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.goods-table th {
  background: #fafafa;
  font-weight: 600;
  color: #595959;
  font-size: 14px;
}

.goods-table td {
  color: #262626;
  font-size: 14px;
}

.type-badge,
.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.type-badge.seed {
  background: #e6f7ff;
  color: #1890ff;
}

.type-badge.item {
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
