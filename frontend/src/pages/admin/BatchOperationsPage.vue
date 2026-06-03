/** * 文件名：BatchOperationsPage.vue * 作者：Trae AI * 日期：2026-05-01 *
版本：v1.0.0 * 功能描述：批量操作功能页面 * 更新记录： * 2026-05-01 - v1.0.0 -
完整版本实现 */

<template>
  <div class="batch-operations-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">📦 批量操作</h1>
      <p class="page-description">支持批量删除、批量状态更新等操作</p>
    </div>

    <!-- 快速操作栏 -->
    <div class="quick-actions">
      <button class="btn btn-primary" @click="showCreateModal = true">
        + 创建批量操作
      </button>
      <button
        v-if="selectedItems.length > 0"
        class="btn btn-danger"
        @click="handleBatchDelete"
      >
        🗑️ 批量删除 ({{ selectedItems.length }})
      </button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <select
          v-model="filters.operation_type"
          class="filter-select"
          @change="handleFilter"
        >
          <option value="">全部操作类型</option>
          <option value="BATCH_DELETE">批量删除</option>
          <option value="BATCH_UPDATE">批量更新</option>
          <option value="BATCH_ENABLE">批量启用</option>
          <option value="BATCH_DISABLE">批量禁用</option>
        </select>
        <select
          v-model="filters.target_module"
          class="filter-select"
          @change="handleFilter"
        >
          <option value="">全部模块</option>
          <option value="PLAYER">玩家</option>
          <option value="ITEM">物品</option>
          <option value="ANNOUNCEMENT">公告</option>
          <option value="CONFIG">配置</option>
        </select>
        <select
          v-model="filters.status"
          class="filter-select"
          @change="handleFilter"
        >
          <option value="">全部状态</option>
          <option value="PENDING">待处理</option>
          <option value="PROCESSING">处理中</option>
          <option value="COMPLETED">已完成</option>
          <option value="FAILED">失败</option>
          <option value="CANCELLED">已取消</option>
        </select>
        <div class="date-filter">
          <input
            v-model="filters.start_date"
            type="date"
            class="filter-input"
            placeholder="开始日期"
            @change="handleFilter"
          />
          <span class="date-separator">至</span>
          <input
            v-model="filters.end_date"
            type="date"
            class="filter-input"
            placeholder="结束日期"
            @change="handleFilter"
          />
        </div>
      </div>
      <div class="filter-actions">
        <button class="btn btn-default" @click="handleReset">🔄 重置</button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ total }}</div>
          <div class="stat-label">总记录数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-content">
          <div class="stat-value">{{ processingCount }}</div>
          <div class="stat-label">处理中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">{{ completedCount }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">❌</div>
        <div class="stat-content">
          <div class="stat-value">{{ failedCount }}</div>
          <div class="stat-label">失败</div>
        </div>
      </div>
    </div>

    <!-- 批量操作列表 -->
    <div class="batch-list-container">
      <div v-if="batchStore.loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="batchStore.error" class="error">
        <p>❌ {{ batchStore.error }}</p>
        <button class="btn btn-primary" @click="fetchData">重试</button>
      </div>

      <div v-else-if="batchStore.batches.length === 0" class="empty">
        <p>📦 暂无批量操作记录</p>
      </div>

      <div v-else class="batch-list">
        <!-- 表头 -->
        <div class="batch-item batch-header">
          <div class="batch-cell checkbox-cell">
            <input
              type="checkbox"
              :checked="batchStore.isAllSelected"
              @change="batchStore.toggleAllSelection"
            />
          </div>
          <div class="batch-cell id-cell">ID</div>
          <div class="batch-cell type-cell">操作类型</div>
          <div class="batch-cell module-cell">目标模块</div>
          <div class="batch-cell status-cell">状态</div>
          <div class="batch-cell count-cell">数量</div>
          <div class="batch-cell progress-cell">进度</div>
          <div class="batch-cell operator-cell">操作人</div>
          <div class="batch-cell time-cell">创建时间</div>
          <div class="batch-cell actions-cell">操作</div>
        </div>

        <!-- 列表项 -->
        <div
          v-for="batch in batchStore.batches"
          :key="batch.id"
          class="batch-item"
          :class="getBatchRowClass(batch)"
        >
          <div class="batch-cell checkbox-cell">
            <input
              type="checkbox"
              :checked="batchStore.selectedItems.some((i) => i.id === batch.id)"
              @change="batchStore.toggleSelection(batch)"
            />
          </div>
          <div class="batch-cell id-cell">{{ batch.id }}</div>
          <div class="batch-cell type-cell">
            <span
              class="type-badge"
              :class="getOperationTypeClass(batch.operation_type)"
            >
              {{ getOperationTypeName(batch.operation_type) }}
            </span>
          </div>
          <div class="batch-cell module-cell">
            {{ getModuleName(batch.target_module) }}
          </div>
          <div class="batch-cell status-cell">
            <span class="status-badge" :class="getStatusClass(batch.status)">
              {{ getStatusName(batch.status) }}
            </span>
          </div>
          <div class="batch-cell count-cell">
            <span class="count-text">
              <span class="success">{{ batch.success_count }}</span>
              /
              <span class="fail">{{ batch.fail_count }}</span>
              /
              <span class="total">{{ batch.total_count }}</span>
            </span>
          </div>
          <div class="batch-cell progress-cell">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :class="getProgressClass(batch)"
                :style="{ width: batch.progress + '%' }"
              ></div>
              <span class="progress-text">{{ batch.progress }}%</span>
            </div>
          </div>
          <div class="batch-cell operator-cell">
            {{ batch.operator_name || '未知' }}
          </div>
          <div class="batch-cell time-cell">
            {{ formatTime(batch.created_at) }}
          </div>
          <div class="batch-cell actions-cell">
            <div class="action-buttons">
              <button
                v-if="batch.status === 'PENDING'"
                class="btn btn-sm btn-success"
                title="执行"
                @click="handleExecute(batch)"
              >
                ▶️ 执行
              </button>
              <button
                v-if="
                  batch.status === 'PENDING' || batch.status === 'PROCESSING'
                "
                class="btn btn-sm btn-warning"
                title="取消"
                @click="handleCancel(batch)"
              >
                ⏹️ 取消
              </button>
              <button
                v-if="batch.status === 'COMPLETED' || batch.status === 'FAILED'"
                class="btn btn-sm btn-primary"
                title="详情"
                @click="handleDetail(batch)"
              >
                📋 详情
              </button>
              <button
                v-if="batch.status === 'COMPLETED'"
                class="btn btn-sm btn-default"
                title="导出"
                @click="handleExport(batch)"
              >
                📥 导出
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination">
      <button
        :disabled="page <= 1"
        class="btn btn-default"
        @click="changePage(page - 1)"
      >
        上一页
      </button>
      <span class="page-info"
        >第 {{ page }} 页 / 共 {{ Math.ceil(total / pageSize) }} 页</span
      >
      <button
        :disabled="page >= Math.ceil(total / pageSize)"
        class="btn btn-default"
        @click="changePage(page + 1)"
      >
        下一页
      </button>
    </div>

    <!-- 创建批量操作弹窗 -->
    <div
      v-if="showCreateModal"
      class="modal-overlay"
      @click.self="closeCreateModal"
    >
      <div class="modal">
        <div class="modal-header">
          <h2>📦 创建批量操作</h2>
          <button class="close-btn" @click="closeCreateModal">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleCreateSubmit">
            <div class="form-group">
              <label>操作类型</label>
              <select
                v-model="createForm.operation_type"
                class="form-control"
                required
              >
                <option value="">请选择操作类型</option>
                <option value="BATCH_DELETE">批量删除</option>
                <option value="BATCH_UPDATE">批量更新</option>
                <option value="BATCH_ENABLE">批量启用</option>
                <option value="BATCH_DISABLE">批量禁用</option>
              </select>
            </div>
            <div class="form-group">
              <label>目标模块</label>
              <select
                v-model="createForm.target_module"
                class="form-control"
                required
              >
                <option value="">请选择目标模块</option>
                <option value="PLAYER">玩家</option>
                <option value="ITEM">物品</option>
                <option value="ANNOUNCEMENT">公告</option>
                <option value="CONFIG">配置</option>
              </select>
            </div>
            <div class="form-group">
              <label>目标ID列表（每行一个）</label>
              <textarea
                v-model="createForm.target_ids_text"
                class="form-control"
                rows="6"
                placeholder="1&#10;2&#10;3&#10;4&#10;5"
                required
              ></textarea>
              <div
                v-if="createForm.target_ids.length > 0"
                class="selected-count"
              >
                已选择 {{ createForm.target_ids.length }} 个目标
              </div>
            </div>
            <div
              v-if="createForm.operation_type === 'BATCH_UPDATE'"
              class="form-group"
            >
              <label>更新数据（JSON格式）</label>
              <textarea
                v-model="createForm.update_data_text"
                class="form-control"
                rows="4"
                placeholder='{"status": "ACTIVE"}'
              ></textarea>
            </div>
            <div class="form-group">
              <label>备注（可选）</label>
              <textarea
                v-model="createForm.remark"
                class="form-control"
                rows="3"
                placeholder="操作备注信息..."
              ></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeCreateModal">
            取消
          </button>
          <button class="btn btn-primary" @click="handleCreateSubmit">
            创建
          </button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div
      v-if="showDetailModal"
      class="modal-overlay"
      @click.self="closeDetailModal"
    >
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>📋 批量操作详情</h2>
          <button class="close-btn" @click="closeDetailModal">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="!currentDetail" class="loading">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>
          <div v-else class="detail-content">
            <div class="detail-section">
              <h3>基本信息</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">ID:</span>
                  <span class="detail-value">{{ currentDetail.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">操作类型:</span>
                  <span class="detail-value">{{
                    getOperationTypeName(currentDetail.operation_type)
                  }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">目标模块:</span>
                  <span class="detail-value">{{
                    getModuleName(currentDetail.target_module)
                  }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">状态:</span>
                  <span class="detail-value">
                    <span
                      class="status-badge"
                      :class="getStatusClass(currentDetail.status)"
                    >
                      {{ getStatusName(currentDetail.status) }}
                    </span>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">进度:</span>
                  <span class="detail-value"
                    >{{ currentDetail.progress }}%</span
                  >
                </div>
                <div class="detail-item">
                  <span class="detail-label">数量:</span>
                  <span class="detail-value">
                    成功 {{ currentDetail.success_count }} / 失败
                    {{ currentDetail.fail_count }} / 总计
                    {{ currentDetail.total_count }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">操作人:</span>
                  <span class="detail-value">{{
                    currentDetail.operator_name || '未知'
                  }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">创建时间:</span>
                  <span class="detail-value">{{
                    formatTime(currentDetail.created_at)
                  }}</span>
                </div>
              </div>
            </div>

            <div
              v-if="currentDetail.details && currentDetail.details.length > 0"
              class="detail-section"
            >
              <h3>执行详情</h3>
              <div class="details-table-container">
                <div class="details-table">
                  <div class="details-row details-header">
                    <div class="details-cell">目标ID</div>
                    <div class="details-cell">状态</div>
                    <div class="details-cell">错误信息</div>
                    <div class="details-cell">执行时间</div>
                  </div>
                  <div
                    v-for="(detail, index) in currentDetail.details.slice(
                      0,
                      50
                    )"
                    :key="index"
                    class="details-row"
                  >
                    <div class="details-cell">{{ detail.target_id }}</div>
                    <div class="details-cell">
                      <span
                        class="status-badge"
                        :class="
                          detail.status === 'SUCCESS' ? 'success' : 'fail'
                        "
                      >
                        {{ detail.status === 'SUCCESS' ? '成功' : '失败' }}
                      </span>
                    </div>
                    <div class="details-cell">
                      {{ detail.error_message || '-' }}
                    </div>
                    <div class="details-cell">
                      {{ formatTime(detail.executed_at) }}
                    </div>
                  </div>
                </div>
                <div v-if="currentDetail.details.length > 50" class="more-note">
                  显示前50条，共 {{ currentDetail.details.length }} 条
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeDetailModal">
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useBatchStore } from '../../stores/batch';
import { useToastStore } from '../../stores/toast';

const batchStore = useBatchStore();
const toastStore = useToastStore();

// 基础数据
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

// 筛选
const filters = ref({
  operation_type: '',
  target_module: '',
  status: '',
  start_date: '',
  end_date: '',
});

// 弹窗状态
const showCreateModal = ref(false);
const showDetailModal = ref(false);
const currentDetail = ref(null);

// 创建表单
const createForm = ref({
  operation_type: '',
  target_module: '',
  target_ids_text: '',
  target_ids: [],
  update_data_text: '',
  remark: '',
});

// 监听target_ids_text变化，自动解析
watch(
  () => createForm.value.target_ids_text,
  (newVal) => {
    if (newVal) {
      createForm.value.target_ids = newVal
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !isNaN(line))
        .map((line) => parseInt(line));
    } else {
      createForm.value.target_ids = [];
    }
  }
);

// 计算属性
const processingCount = computed(() => {
  return batchStore.batches.filter((b) => b.status === 'PROCESSING').length;
});

const completedCount = computed(() => {
  return batchStore.batches.filter((b) => b.status === 'COMPLETED').length;
});

const failedCount = computed(() => {
  return batchStore.batches.filter((b) => b.status === 'FAILED').length;
});

// 辅助方法
const getOperationTypeName = (type) => {
  const names = {
    BATCH_DELETE: '批量删除',
    BATCH_UPDATE: '批量更新',
    BATCH_ENABLE: '批量启用',
    BATCH_DISABLE: '批量禁用',
  };
  return names[type] || type;
};

const getOperationTypeClass = (type) => {
  const classes = {
    BATCH_DELETE: 'delete',
    BATCH_UPDATE: 'update',
    BATCH_ENABLE: 'enable',
    BATCH_DISABLE: 'disable',
  };
  return classes[type] || '';
};

const getModuleName = (module) => {
  const names = {
    PLAYER: '玩家',
    ITEM: '物品',
    ANNOUNCEMENT: '公告',
    CONFIG: '配置',
  };
  return names[module] || module;
};

const getStatusName = (status) => {
  const names = {
    PENDING: '待处理',
    PROCESSING: '处理中',
    COMPLETED: '已完成',
    FAILED: '失败',
    CANCELLED: '已取消',
  };
  return names[status] || status;
};

const getStatusClass = (status) => {
  const classes = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'success',
    FAILED: 'fail',
    CANCELLED: 'cancelled',
  };
  return classes[status] || '';
};

const getBatchRowClass = (batch) => {
  const classes = [];
  if (batch.status === 'PROCESSING') classes.push('processing-row');
  if (batch.status === 'FAILED') classes.push('failed-row');
  return classes.join(' ');
};

const getProgressClass = (batch) => {
  if (batch.status === 'COMPLETED') return 'success';
  if (batch.status === 'FAILED') return 'fail';
  if (batch.status === 'PROCESSING') return 'processing';
  return '';
};

const formatTime = (time) => {
  if (!time) return '-';
  const date = new Date(time);
  return date.toLocaleString('zh-CN');
};

// 业务方法
const fetchData = async () => {
  batchStore.page = page.value;
  batchStore.pageSize = pageSize.value;
  await batchStore.fetchBatches(filters.value);
  total.value = batchStore.total;
};

const handleFilter = () => {
  page.value = 1;
  fetchData();
};

const handleReset = () => {
  filters.value = {
    operation_type: '',
    target_module: '',
    status: '',
    start_date: '',
    end_date: '',
  };
  page.value = 1;
  fetchData();
};

const changePage = (newPage) => {
  page.value = newPage;
  fetchData();
};

const handleCreateSubmit = async () => {
  if (!createForm.value.operation_type) {
    toastStore.error('请选择操作类型');
    return;
  }
  if (!createForm.value.target_module) {
    toastStore.error('请选择目标模块');
    return;
  }
  if (createForm.value.target_ids.length === 0) {
    toastStore.error('请输入至少一个目标ID');
    return;
  }

  try {
    const data = {
      operation_type: createForm.value.operation_type,
      target_module: createForm.value.target_module,
      total_count: createForm.value.target_ids.length,
      input_data: {
        target_ids: createForm.value.target_ids,
      },
    };

    if (
      createForm.value.operation_type === 'BATCH_UPDATE' &&
      createForm.value.update_data_text
    ) {
      try {
        data.input_data.update_data = JSON.parse(
          createForm.value.update_data_text
        );
      } catch (e) {
        toastStore.error('更新数据格式错误，请输入有效的JSON');
        return;
      }
    }

    await batchStore.createBatch(data);
    toastStore.success('批量操作创建成功');
    closeCreateModal();
  } catch (error) {
    toastStore.error('创建批量操作失败: ' + (error.message || error));
  }
};

const handleExecute = async (batch) => {
  if (!confirm(`确定要执行批量操作 #${batch.id} 吗？`)) return;

  try {
    await batchStore.executeBatch(batch.id);
    toastStore.success('批量操作已开始执行');
  } catch (error) {
    toastStore.error('执行失败: ' + (error.message || error));
  }
};

const handleCancel = async (batch) => {
  if (!confirm(`确定要取消批量操作 #${batch.id} 吗？`)) return;

  try {
    await batchStore.cancelBatch(batch.id);
    toastStore.success('批量操作已取消');
  } catch (error) {
    toastStore.error('取消失败: ' + (error.message || error));
  }
};

const handleDetail = async (batch) => {
  try {
    const detail = await batchStore.fetchBatchDetail(batch.id);
    currentDetail.value = detail;
    showDetailModal.value = true;
  } catch (error) {
    toastStore.error('获取详情失败: ' + (error.message || error));
  }
};

const handleExport = async (batch) => {
  try {
    await batchStore.exportResult(batch.id);
    toastStore.success('导出成功');
  } catch (error) {
    toastStore.error('导出失败: ' + (error.message || error));
  }
};

const handleBatchDelete = async () => {
  if (batchStore.selectedItems.length === 0) {
    toastStore.warning('请先选择要删除的记录');
    return;
  }

  if (
    !confirm(
      `确定要删除选中的 ${batchStore.selectedItems.length} 条记录吗？此操作不可恢复！`
    )
  ) {
    return;
  }

  toast.warning('删除功能在实际开发中应谨慎实现');
};

const closeCreateModal = () => {
  showCreateModal.value = false;
  resetCreateForm();
};

const resetCreateForm = () => {
  createForm.value = {
    operation_type: '',
    target_module: '',
    target_ids_text: '',
    target_ids: [],
    update_data_text: '',
    remark: '',
  };
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  currentDetail.value = null;
};

// 生命周期
onMounted(() => {
  fetchData();

  // 定时刷新（每10秒）
  const interval = setInterval(() => {
    if (batchStore.batches.some((b) => b.status === 'PROCESSING')) {
      fetchData();
    }
  }, 10000);

  return () => clearInterval(interval);
});
</script>

<style scoped>
.batch-operations-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.page-description {
  color: #666;
  margin: 0;
}

.quick-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex-wrap: wrap;
  gap: 12px;
}

.filter-group {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-width: 150px;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-separator {
  color: #666;
  font-size: 14px;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  font-size: 32px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.batch-list-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.loading,
.empty,
.error {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.batch-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.batch-item {
  display: grid;
  grid-template-columns: 40px 60px 120px 100px 100px 120px 120px 100px 160px 150px;
  gap: 8px;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.batch-item:hover {
  background: #f9f9f9;
}

.batch-header {
  font-weight: 600;
  color: #333;
  background: #f5f5f5;
  border-bottom: 2px solid #ddd;
}

.processing-row {
  background: #fff7e6 !important;
}

.failed-row {
  background: #fff1f0 !important;
}

.batch-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.checkbox-cell {
  display: flex;
  justify-content: center;
}

.action-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.type-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.type-badge.delete {
  background: #fff1f0;
  color: #f5222d;
}
.type-badge.update {
  background: #e6f7ff;
  color: #1890ff;
}
.type-badge.enable {
  background: #f6ffed;
  color: #52c41a;
}
.type-badge.disable {
  background: #fff7e6;
  color: #fa8c16;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background: #f5f5f5;
  color: #666;
}
.status-badge.processing {
  background: #e6f7ff;
  color: #1890ff;
}
.status-badge.success {
  background: #f6ffed;
  color: #52c41a;
}
.status-badge.fail {
  background: #fff1f0;
  color: #f5222d;
}
.status-badge.cancelled {
  background: #fafafa;
  color: #999;
}

.count-text {
  font-family: monospace;
  font-size: 13px;
}

.count-text .success {
  color: #52c41a;
}
.count-text .fail {
  color: #f5222d;
}
.count-text .total {
  color: #666;
}

.progress-bar {
  position: relative;
  height: 24px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #1890ff;
  transition: width 0.3s;
}

.progress-fill.success {
  background: #52c41a;
}
.progress-fill.fail {
  background: #f5222d;
}
.progress-fill.processing {
  background: #fa8c16;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: 500;
  color: #333;
  text-shadow: 0 0 2px white;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.page-info {
  color: #666;
  font-size: 14px;
}

/* 弹窗样式 */
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
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.selected-count {
  margin-top: 8px;
  font-size: 13px;
  color: #1890ff;
}

/* 详情样式 */
.detail-content {
  padding: 8px 0;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h3 {
  font-size: 16px;
  color: #333;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.detail-label {
  color: #666;
  min-width: 80px;
}

.detail-value {
  color: #333;
  flex: 1;
}

.details-table-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 8px;
}

.details-table {
  width: 100%;
}

.details-row {
  display: grid;
  grid-template-columns: 80px 100px 1fr 150px;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.details-header {
  font-weight: 600;
  background: #f5f5f5;
  position: sticky;
  top: 0;
}

.details-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.more-note {
  padding: 12px;
  text-align: center;
  color: #666;
  font-size: 13px;
  background: #fafafa;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #40a9ff;
}

.btn-success {
  background: #52c41a;
  color: white;
}

.btn-success:hover {
  background: #73d13d;
}

.btn-danger {
  background: #f5222d;
  color: white;
}

.btn-danger:hover {
  background: #ff4d4f;
}

.btn-warning {
  background: #fa8c16;
  color: white;
}

.btn-warning:hover {
  background: #ffa940;
}

.btn-default {
  background: #f0f0f0;
  color: #333;
}

.btn-default:hover {
  background: #d9d9d9;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
