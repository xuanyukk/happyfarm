/** * 文件名：ApprovalsPage.vue * 作者：开发者 * 日期：2025-01-01 * 版本：v2.0.0
* 功能描述：审批流程管理页面，提供多状态视图、审批操作、意见填写及进度跟踪功能 *
更新记录： * 2025-01-01 - v1.1.0 - 初始版本创建（占位实现） * 2026-03-28 -
v2.0.0 - 【阶段四完成】审批流程页面完整实现，接入adminService */
<template>
  <div class="approvals-page">
    <div class="tabs-bar">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-item', { active: currentTab === tab.key }]"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
        <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <input
          v-model="filters.keyword"
          type="text"
          placeholder="搜索审批标题"
          class="filter-input"
        />
      </div>
      <div class="filter-group">
        <select v-model="filters.type" class="filter-select">
          <option value="">全部类型</option>
          <option value="currency">货币调控</option>
          <option value="player">玩家管理</option>
          <option value="system">系统配置</option>
          <option value="other">其他</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="loadApprovals">🔍 搜索</button>
        <button class="btn btn-default" @click="resetFilters">🔄 重置</button>
      </div>
    </div>

    <div class="approvals-table-container">
      <table class="approvals-table">
        <thead>
          <tr>
            <th>审批ID</th>
            <th>审批标题</th>
            <th>审批类型</th>
            <th>发起人</th>
            <th>当前审批人</th>
            <th>提交时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="approval in approvals" :key="approval.id">
            <td>{{ approval.id }}</td>
            <td>{{ approval.approval_title }}</td>
            <td>{{ getTypeText(approval.approval_type) }}</td>
            <td>{{ approval.creator_username || '-' }}</td>
            <td>{{ approval.current_approver_username || '-' }}</td>
            <td>{{ formatTime(approval.created_at) }}</td>
            <td>
              <span class="status-badge" :class="approval.status">
                {{ getStatusText(approval.status) }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn btn-small btn-info"
                  @click="viewDetail(approval)"
                >
                  详情
                </button>
                <button
                  v-if="
                    currentTab === 'pending' && approval.status === 'pending'
                  "
                  class="btn btn-small btn-success"
                  @click="openApproveModal(approval)"
                >
                  审批
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!approvals.length" class="empty-state">暂无审批数据</div>
    </div>

    <div class="pagination">
      <button
        :disabled="currentPage <= 1"
        class="btn btn-default"
        @click="
          currentPage--;
          loadApprovals();
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
          loadApprovals();
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
      <div class="modal large-modal">
        <div class="modal-header">
          <h3>审批详情</h3>
          <button class="close-btn" @click="showDetailModal = false">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div v-if="selectedApproval" class="approval-detail">
            <div class="detail-section">
              <h4>基本信息</h4>
              <div class="detail-row">
                <span class="label">审批ID:</span>
                <span class="value">{{ selectedApproval.id }}</span>
              </div>
              <div class="detail-row">
                <span class="label">审批标题:</span>
                <span class="value">{{ selectedApproval.approval_title }}</span>
              </div>
              <div class="detail-row">
                <span class="label">审批类型:</span>
                <span class="value">{{
                  getTypeText(selectedApproval.approval_type)
                }}</span>
              </div>
              <div class="detail-row">
                <span class="label">状态:</span>
                <span class="value">
                  <span class="status-badge" :class="selectedApproval.status">
                    {{ getStatusText(selectedApproval.status) }}
                  </span>
                </span>
              </div>
            </div>

            <div class="detail-section">
              <h4>审批内容</h4>
              <div class="detail-row">
                <span class="label">申请内容:</span>
                <span class="value">{{
                  selectedApproval.approval_content || '-'
                }}</span>
              </div>
              <div class="detail-row">
                <span class="label">发起人:</span>
                <span class="value">{{
                  selectedApproval.creator_username || '-'
                }}</span>
              </div>
              <div class="detail-row">
                <span class="label">当前审批人:</span>
                <span class="value">{{
                  selectedApproval.current_approver_username || '-'
                }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h4>审批历史</h4>
              <div
                v-if="selectedApproval.approval_history?.length"
                class="history-list"
              >
                <div
                  v-for="(item, index) in selectedApproval.approval_history"
                  :key="index"
                  class="history-item"
                >
                  <div class="history-header">
                    <span class="history-user">{{
                      item.approver_username || '-'
                    }}</span>
                    <span class="history-time">{{
                      formatTime(item.approved_at)
                    }}</span>
                    <span class="history-result" :class="item.approval_result">
                      {{
                        item.approval_result === 'approved' ? '同意' : '拒绝'
                      }}
                    </span>
                  </div>
                  <div v-if="item.approval_comment" class="history-comment">
                    {{ item.approval_comment }}
                  </div>
                </div>
              </div>
              <div v-else class="empty-history">暂无审批历史</div>
            </div>

            <div class="detail-section">
              <h4>时间信息</h4>
              <div class="detail-row">
                <span class="label">提交时间:</span>
                <span class="value">{{
                  formatTime(selectedApproval.created_at)
                }}</span>
              </div>
              <div class="detail-row">
                <span class="label">更新时间:</span>
                <span class="value">{{
                  formatTime(selectedApproval.updated_at)
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

    <div
      v-if="showApproveModal"
      class="modal-overlay"
      @click.self="showApproveModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>审批操作</h3>
          <button class="close-btn" @click="showApproveModal = false">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div class="approve-form">
            <div class="approve-info">
              <div class="approve-title">
                {{ selectedApprovalForAction?.approval_title }}
              </div>
              <div class="approve-desc">
                {{ selectedApprovalForAction?.approval_content || '' }}
              </div>
            </div>
            <div class="form-group">
              <label>审批意见（可选）：</label>
              <textarea
                v-model="approvalComment"
                placeholder="请输入审批意见"
                class="form-textarea"
              ></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-success" @click="submitApprove('approved')">
            同意
          </button>
          <button class="btn btn-danger" @click="submitApprove('rejected')">
            拒绝
          </button>
          <button class="btn btn-default" @click="showApproveModal = false">
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import adminService from '../../services/adminService';

const tabs = ref([
  { key: 'pending', label: '待我审批', count: 0 },
  { key: 'approved', label: '我已审批', count: 0 },
  { key: 'my', label: '我发起的', count: 0 },
  { key: 'all', label: '全部审批', count: 0 },
]);

const currentTab = ref('pending');
const filters = ref({
  keyword: '',
  type: '',
});

const approvals = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const totalPages = ref(1);
const showDetailModal = ref(false);
const selectedApproval = ref(null);
const showApproveModal = ref(false);
const selectedApprovalForAction = ref(null);
const approvalComment = ref('');

/**
 * 切换标签页
 * @param {string} tabKey - 标签页key
 * @returns {void} 无返回值
 */
function switchTab(tabKey) {
  currentTab.value = tabKey;
  currentPage.value = 1;
  loadApprovals();
}

/**
 * 加载审批列表数据
 * @returns {Promise<void>} 无返回值
 */
async function loadApprovals() {
  try {
    let status = '';
    if (currentTab.value === 'pending') status = 'pending';
    else if (currentTab.value === 'approved') status = 'approved,rejected';

    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      status: status,
      ...filters.value,
    };

    const result = await adminService.getApprovalList(params);
    if (result.success) {
      approvals.value = result.data.approvals || [];
      total.value = result.data.total || 0;
      totalPages.value = result.data.totalPages || 1;

      if (currentTab.value === 'pending') {
        tabs.value[0].count = result.data.total || 0;
      }
    }
  } catch (error) {
    console.error('加载审批列表失败', error);
  }
}

/**
 * 重置筛选条件
 * @returns {void} 无返回值
 */
function resetFilters() {
  filters.value = {
    keyword: '',
    type: '',
  };
  currentPage.value = 1;
  loadApprovals();
}

/**
 * 查看审批详情
 * @param {Object} approval - 审批对象
 * @returns {void} 无返回值
 */
function viewDetail(approval) {
  selectedApproval.value = approval;
  showDetailModal.value = true;
}

/**
 * 显示审批弹窗
 * @param {Object} approval - 审批对象
 * @returns {void} 无返回值
 */
function openApproveModal(approval) {
  selectedApprovalForAction.value = approval;
  approvalComment.value = '';
  showApproveModal.value = true;
}

/**
 * 提交审批
 * @param {string} result - 审批结果
 * @returns {Promise<void>} 无返回值
 */
async function submitApprove(result) {
  if (!selectedApprovalForAction.value) return;

  try {
    const res = await adminService.approveOperation(
      selectedApprovalForAction.value.id,
      result,
      approvalComment.value
    );
    if (res.success) {
      showApproveModal.value = false;
      loadApprovals();
    }
  } catch (error) {
    console.error('提交审批失败', error);
    alert('操作失败');
  }
}

/**
 * 获取审批类型文本
 * @param {string} type - 类型
 * @returns {string} 类型中文文本
 */
function getTypeText(type) {
  const typeMap = {
    currency: '货币调控',
    player: '玩家管理',
    system: '系统配置',
    other: '其他',
  };
  return typeMap[type] || type;
}

/**
 * 获取状态文本
 * @param {string} status - 状态
 * @returns {string} 状态中文文本
 */
function getStatusText(status) {
  const statusMap = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
    processing: '处理中',
  };
  return statusMap[status] || status;
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
  loadApprovals();
});
</script>

<style scoped>
.approvals-page {
  padding: 0;
}

.tabs-bar {
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
  display: flex;
  gap: 24px;
}

.tab-item {
  padding: 8px 0;
  font-size: 15px;
  color: #595959;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.3s;
}

.tab-item:hover {
  color: #1890ff;
}

.tab-item.active {
  color: #1890ff;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -16px;
  left: 0;
  right: 0;
  height: 2px;
  background: #1890ff;
}

.tab-count {
  background: #ff4d4f;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
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

.btn-success {
  background: #52c41a;
  color: white;
}

.btn-success:hover {
  background: #73d13d;
}

.btn-danger {
  background: #ff4d4f;
  color: white;
}

.btn-danger:hover {
  background: #ff7875;
}

.approvals-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.approvals-table {
  width: 100%;
  border-collapse: collapse;
}

.approvals-table th,
.approvals-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.approvals-table th {
  background: #fafafa;
  font-weight: 600;
  color: #595959;
  font-size: 14px;
}

.approvals-table td {
  color: #262626;
  font-size: 14px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge.pending {
  background: #fff7e6;
  color: #fa8c16;
}

.status-badge.approved {
  background: #f6ffed;
  color: #52c41a;
}

.status-badge.rejected {
  background: #fff1f0;
  color: #ff4d4f;
}

.status-badge.processing {
  background: #e6f7ff;
  color: #1890ff;
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
  background: white;
  border-radius: 8px;
}

.page-info {
  color: #595959;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  color: #8c8c8c;
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
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal.large-modal {
  max-width: 800px;
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

.approval-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #262626;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-row {
  display: flex;
  padding: 8px 0;
}

.detail-row .label {
  width: 120px;
  color: #8c8c8c;
  flex-shrink: 0;
}

.detail-row .value {
  color: #262626;
  flex: 1;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  background: #fafafa;
  padding: 12px 16px;
  border-radius: 6px;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.history-user {
  font-weight: 500;
  color: #262626;
}

.history-time {
  font-size: 12px;
  color: #8c8c8c;
}

.history-result {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.history-result.approved {
  background: #f6ffed;
  color: #52c41a;
}

.history-result.rejected {
  background: #fff1f0;
  color: #ff4d4f;
}

.history-comment {
  color: #595959;
  font-size: 14px;
}

.empty-history {
  color: #8c8c8c;
  text-align: center;
  padding: 20px;
}

.approve-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.approve-info {
  background: #fafafa;
  padding: 16px;
  border-radius: 6px;
}

.approve-title {
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
}

.approve-desc {
  color: #595959;
  font-size: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  color: #262626;
}

.form-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  outline: none;
}

.form-textarea:focus {
  border-color: #1890ff;
}
</style>
