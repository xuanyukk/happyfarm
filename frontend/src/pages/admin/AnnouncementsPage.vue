/** * 文件名：AnnouncementsPage.vue * 作者：Trae AI * 日期：2026-04-30 *
版本：v1.0.0 * 功能描述：游戏公告管理页面，提供公告列表、创建、编辑、发布等功能
* 更新记录： * 2026-04-30 - v1.0.0 - 初始版本创建 */

<template>
  <div class="announcements-page">
    <div class="filter-bar">
      <div class="filter-group">
        <input
          v-model="filters.title"
          type="text"
          placeholder="搜索公告标题"
          class="filter-input"
        />
        <select v-model="filters.category" class="filter-select">
          <option value="">全部分类</option>
          <option v-for="cat in categories" :key="cat.code" :value="cat.code">
            {{ cat.icon }} {{ cat.name }}
          </option>
        </select>
        <select v-model="filters.status" class="filter-select">
          <option value="">全部状态</option>
          <option value="DRAFT">草稿</option>
          <option value="PENDING">待发布</option>
          <option value="PUBLISHED">已发布</option>
          <option value="OFFLINE">已下线</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="loadAnnouncements">
          🔍 搜索
        </button>
        <button class="btn btn-default" @click="resetFilters">🔄 重置</button>
        <button class="btn btn-success" @click="openCreateModal">
          ➕ 创建公告
        </button>
      </div>
    </div>

    <div class="statistics-bar">
      <div class="stat-item">
        <span class="stat-label">总公告</span>
        <span class="stat-value">{{ statistics.total || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">已发布</span>
        <span class="stat-value">{{ statistics.published || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">草稿</span>
        <span class="stat-value">{{ statistics.draft || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">总阅读</span>
        <span class="stat-value">{{ statistics.totalViews || 0 }}</span>
      </div>
    </div>

    <div class="announcements-table-container">
      <table class="announcements-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>标题</th>
            <th>分类</th>
            <th>优先级</th>
            <th>状态</th>
            <th>置顶</th>
            <th>阅读数</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="announcement in announcements" :key="announcement.id">
            <td>{{ announcement.id }}</td>
            <td class="title-cell">{{ announcement.title }}</td>
            <td>
              <span class="category-badge">{{
                getCategoryLabel(announcement.category)
              }}</span>
            </td>
            <td>
              <span
                class="priority-badge"
                :class="getPriorityClass(announcement.priority)"
              >
                {{ getPriorityLabel(announcement.priority) }}
              </span>
            </td>
            <td>
              <span
                class="status-badge"
                :class="getStatusClass(announcement.status)"
              >
                {{ getStatusLabel(announcement.status) }}
              </span>
            </td>
            <td>
              <span v-if="announcement.is_top" class="top-badge">✅ 置顶</span>
              <span v-else>—</span>
            </td>
            <td>{{ announcement.view_count || 0 }}</td>
            <td>{{ formatTime(announcement.created_at) }}</td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn btn-small btn-info"
                  @click="viewDetail(announcement)"
                >
                  查看
                </button>
                <button
                  class="btn btn-small btn-warning"
                  @click="editAnnouncement(announcement)"
                >
                  编辑
                </button>
                <template
                  v-if="
                    announcement.status === 'DRAFT' ||
                    announcement.status === 'PENDING'
                  "
                >
                  <button
                    class="btn btn-small btn-success"
                    @click="publish(announcement)"
                  >
                    发布
                  </button>
                </template>
                <template v-if="announcement.status === 'PUBLISHED'">
                  <button
                    class="btn btn-small btn-primary"
                    @click="setTop(announcement)"
                  >
                    {{ announcement.is_top ? '取消置顶' : '置顶' }}
                  </button>
                  <button
                    class="btn btn-small btn-default"
                    @click="offline(announcement)"
                  >
                    下线
                  </button>
                </template>
                <button
                  class="btn btn-small btn-danger"
                  @click="deleteConfirm(announcement)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button
        :disabled="pagination.page <= 1"
        class="btn btn-small"
        @click="changePage(pagination.page - 1)"
      >
        上一页
      </button>
      <span
        >第 {{ pagination.page }} / {{ pagination.totalPages }} 页，共
        {{ pagination.total }} 条</span
      >
      <button
        :disabled="pagination.page >= pagination.totalPages"
        class="btn btn-small"
        @click="changePage(pagination.page + 1)"
      >
        下一页
      </button>
    </div>

    <div
      v-if="showEditModal"
      class="modal-overlay"
      @click.self="closeEditModal"
    >
      <div class="modal edit-modal">
        <div class="modal-header">
          <h3>{{ isEditMode ? '编辑公告' : '创建公告' }}</h3>
          <button class="btn btn-small" @click="closeEditModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>公告标题 <span class="required">*</span></label>
            <input v-model="formData.title" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>分类</label>
            <select v-model="formData.category" class="form-select">
              <option
                v-for="cat in categories"
                :key="cat.code"
                :value="cat.code"
              >
                {{ cat.icon }} {{ cat.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>优先级</label>
            <select v-model="formData.priority" class="form-select">
              <option value="LOW">低</option>
              <option value="NORMAL">普通</option>
              <option value="HIGH">高</option>
              <option value="URGENT">紧急</option>
            </select>
          </div>
          <div class="form-group">
            <label>摘要</label>
            <textarea
              v-model="formData.summary"
              class="form-textarea"
              rows="2"
            ></textarea>
          </div>
          <div class="form-group">
            <label>公告内容 <span class="required">*</span></label>
            <textarea
              v-model="formData.content"
              class="form-textarea content-area"
              rows="8"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeEditModal">取消</button>
          <button
            class="btn btn-primary"
            :disabled="loading"
            @click="saveAnnouncement"
          >
            {{ loading ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDetailModal"
      class="modal-overlay"
      @click.self="closeDetailModal"
    >
      <div class="modal detail-modal">
        <div class="modal-header">
          <h3>公告详情</h3>
          <button class="btn btn-small" @click="closeDetailModal">
            &times;
          </button>
        </div>
        <div v-if="currentAnnouncement" class="modal-body">
          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">标题</span>
              <span class="detail-value">{{ currentAnnouncement.title }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">分类</span>
              <span class="detail-value">{{
                getCategoryLabel(currentAnnouncement.category)
              }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">优先级</span>
              <span class="detail-value">{{
                getPriorityLabel(currentAnnouncement.priority)
              }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">状态</span>
              <span class="detail-value">{{
                getStatusLabel(currentAnnouncement.status)
              }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">阅读数</span>
              <span class="detail-value">{{
                currentAnnouncement.view_count || 0
              }}</span>
            </div>
            <div v-if="currentAnnouncement.publish_time" class="detail-row">
              <span class="detail-label">发布时间</span>
              <span class="detail-value">{{
                formatTime(currentAnnouncement.publish_time)
              }}</span>
            </div>
          </div>
          <div class="detail-section">
            <span class="detail-label">内容</span>
            <div
              class="content-preview"
              v-html="currentAnnouncement.content"
            ></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="closeDetailModal">
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAnnouncementStore } from '../../stores/announcement';

const announcementStore = useAnnouncementStore();

const announcements = ref([]);
const categories = ref([]);
const statistics = ref({});
const currentAnnouncement = ref(null);
const loading = ref(false);
const showEditModal = ref(false);
const showDetailModal = ref(false);
const isEditMode = ref(false);
const formData = ref({
  title: '',
  content: '',
  summary: '',
  category: 'SYSTEM',
  priority: 'NORMAL',
  status: 'DRAFT',
});
const filters = ref({
  title: '',
  category: '',
  status: '',
});
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
});

const CATEGORY_LABELS = {
  SYSTEM: '系统公告',
  ACTIVITY: '活动公告',
  MAINTENANCE: '维护公告',
  UPDATE: '更新公告',
  COMPENSATION: '补偿公告',
};

const STATUS_LABELS = {
  DRAFT: '草稿',
  PENDING: '待发布',
  PUBLISHED: '已发布',
  OFFLINE: '已下线',
};

const PRIORITY_LABELS = {
  LOW: '低',
  NORMAL: '普通',
  HIGH: '高',
  URGENT: '紧急',
};

onMounted(() => {
  loadAnnouncements();
  loadCategories();
  loadStatistics();
});

async function loadAnnouncements() {
  try {
    await announcementStore.fetchAnnouncements({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      title: filters.value.title || undefined,
      category: filters.value.category || undefined,
      status: filters.value.status || undefined,
    });
    announcements.value = announcementStore.announcements;
    pagination.value = announcementStore.pagination;
  } catch (error) {
    alert(
      '加载公告列表失败: ' + (error.response?.data?.message || error.message)
    );
  }
}

async function loadCategories() {
  try {
    await announcementStore.fetchCategories();
    categories.value = announcementStore.categories;
  } catch (error) {
    console.error('加载分类失败', error);
  }
}

async function loadStatistics() {
  try {
    await announcementStore.fetchStatistics();
    statistics.value = announcementStore.statistics;
  } catch (error) {
    console.error('加载统计失败', error);
  }
}

function resetFilters() {
  filters.value = {
    title: '',
    category: '',
    status: '',
  };
  pagination.value.page = 1;
  loadAnnouncements();
}

function changePage(page) {
  pagination.value.page = page;
  loadAnnouncements();
}

function viewDetail(announcement) {
  currentAnnouncement.value = announcement;
  showDetailModal.value = true;
}

function openCreateModal() {
  isEditMode.value = false;
  formData.value = {
    title: '',
    content: '',
    summary: '',
    category: 'SYSTEM',
    priority: 'NORMAL',
    status: 'DRAFT',
  };
  showEditModal.value = true;
}

function editAnnouncement(announcement) {
  isEditMode.value = true;
  formData.value = {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    summary: announcement.summary,
    category: announcement.category,
    priority: announcement.priority,
    status: announcement.status,
  };
  showEditModal.value = true;
}

async function saveAnnouncement() {
  if (!formData.value.title || !formData.value.content) {
    alert('请填写标题和内容');
    return;
  }

  try {
    loading.value = true;
    if (isEditMode.value) {
      await announcementStore.updateAnnouncement(
        formData.value.id,
        formData.value
      );
    } else {
      await announcementStore.createAnnouncement(formData.value);
    }
    showEditModal.value = false;
    loadAnnouncements();
    loadStatistics();
  } catch (error) {
    alert('保存失败: ' + (error.response?.data?.message || error.message));
  } finally {
    loading.value = false;
  }
}

function closeEditModal() {
  showEditModal.value = false;
}

function closeDetailModal() {
  showDetailModal.value = false;
  currentAnnouncement.value = null;
}

async function publish(announcement) {
  if (!confirm(`确定要发布公告 "${announcement.title}" 吗?`)) {
    return;
  }

  try {
    await announcementStore.publishAnnouncement(announcement.id);
    loadAnnouncements();
    loadStatistics();
  } catch (error) {
    alert('发布失败: ' + (error.response?.data?.message || error.message));
  }
}

async function offline(announcement) {
  if (!confirm(`确定要下线公告 "${announcement.title}" 吗?`)) {
    return;
  }

  try {
    await announcementStore.offlineAnnouncement(announcement.id);
    loadAnnouncements();
    loadStatistics();
  } catch (error) {
    alert('下线失败: ' + (error.response?.data?.message || error.message));
  }
}

async function setTop(announcement) {
  const newTop = !announcement.is_top;
  try {
    await announcementStore.setAnnouncementTop(announcement.id, newTop);
    loadAnnouncements();
  } catch (error) {
    alert('设置置顶失败: ' + (error.response?.data?.message || error.message));
  }
}

async function deleteConfirm(announcement) {
  if (!confirm(`确定要删除公告 "${announcement.title}" 吗?此操作不可恢复!`)) {
    return;
  }

  try {
    await announcementStore.deleteAnnouncement(announcement.id);
    loadAnnouncements();
    loadStatistics();
  } catch (error) {
    alert('删除失败: ' + (error.response?.data?.message || error.message));
  }
}

function getCategoryLabel(code) {
  return CATEGORY_LABELS[code] || code;
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

function getPriorityLabel(priority) {
  return PRIORITY_LABELS[priority] || priority;
}

function getStatusClass(status) {
  const classes = {
    DRAFT: 'draft',
    PENDING: 'pending',
    PUBLISHED: 'published',
    OFFLINE: 'offline',
  };
  return classes[status] || '';
}

function getPriorityClass(priority) {
  const classes = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent',
  };
  return classes[priority] || '';
}

function formatTime(timeStr) {
  if (!timeStr) return '-';
  const date = new Date(timeStr);
  return date.toLocaleString('zh-CN');
}
</script>

<style scoped>
.announcements-page {
  padding: 20px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filter-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}

.filter-actions {
  display: flex;
  gap: 10px;
}

.statistics-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #409eff;
  color: white;
}

.btn-primary:hover {
  background: #66b1ff;
}

.btn-success {
  background: #67c23a;
  color: white;
}

.btn-success:hover {
  background: #85ce61;
}

.btn-warning {
  background: #e6a23c;
  color: white;
}

.btn-warning:hover {
  background: #ebb563;
}

.btn-danger {
  background: #f56c6c;
  color: white;
}

.btn-danger:hover {
  background: #f78989;
}

.btn-info {
  background: #409eff;
  color: white;
}

.btn-default {
  background: #909399;
  color: white;
}

.btn-default:hover {
  background: #a6a9ad;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.announcements-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.announcements-table {
  width: 100%;
  border-collapse: collapse;
}

.announcements-table th,
.announcements-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.announcements-table th {
  background: #f5f7fa;
  font-weight: 600;
}

.title-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-badge {
  padding: 4px 8px;
  border-radius: 4px;
  background: #ecf5ff;
  color: #409eff;
  font-size: 12px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge.draft {
  background: #f4f4f5;
  color: #909399;
}

.status-badge.pending {
  background: #fef0f0;
  color: #f56c6c;
}

.status-badge.published {
  background: #e1f3d8;
  color: #67c23a;
}

.status-badge.offline {
  background: #f5f7fa;
  color: #c0c4cc;
}

.priority-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.priority-badge.low {
  background: #f4f4f5;
  color: #909399;
}

.priority-badge.normal {
  background: #ecf5ff;
  color: #409eff;
}

.priority-badge.high {
  background: #fdf6ec;
  color: #e6a23c;
}

.priority-badge.urgent {
  background: #fef0f0;
  color: #f56c6c;
}

.top-badge {
  color: #e6a23c;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  padding: 20px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
}

.edit-modal {
  max-width: 600px;
}

.detail-modal {
  max-width: 650px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-textarea.content-area {
  min-height: 200px;
  font-family: inherit;
}

.required {
  color: #f56c6c;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f5f7fa;
}

.detail-label {
  width: 100px;
  color: #666;
  font-weight: 500;
}

.detail-value {
  flex: 1;
}

.content-preview {
  margin-top: 10px;
  padding: 15px;
  background: #f9fafc;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.content-preview h1 {
  font-size: 24px;
  margin-bottom: 16px;
}

.content-preview h2 {
  font-size: 20px;
  margin: 12px 0;
}

.content-preview p {
  margin: 8px 0;
  line-height: 1.6;
}

.content-preview ul,
.content-preview ol {
  margin: 8px 0;
  padding-left: 20px;
}

.content-preview li {
  margin: 4px 0;
}
</style>
