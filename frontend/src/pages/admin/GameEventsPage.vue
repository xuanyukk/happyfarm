/**
 * 文件名：GameEventsPage.vue
 * 作者：开发者
 * 日期：2026-05-06
 * 版本：v1.0.0
 * 功能描述：游戏活动管理页面，提供活动创建、编辑、任务管理、进度监控等功能
 * 更新记录：
 * 2026-05-06 - v1.0.0 - 初始版本创建
 */

<template>
  <div class="game-events-page">
    <div class="filter-bar">
      <div class="filter-group">
        <input
          v-model="filters.name"
          type="text"
          placeholder="搜索活动名称"
          class="filter-input"
        />
        <select v-model="filters.type" class="filter-select">
          <option value="">全部类型</option>
          <option value="DAILY">日常活动</option>
          <option value="WEEKLY">周常活动</option>
          <option value="MONTHLY">月常活动</option>
          <option value="SPECIAL">特殊活动</option>
          <option value="HOLIDAY">节日活动</option>
        </select>
        <select v-model="filters.status" class="filter-select">
          <option value="">全部状态</option>
          <option value="DRAFT">草稿</option>
          <option value="PENDING">待开始</option>
          <option value="ACTIVE">进行中</option>
          <option value="PAUSED">已暂停</option>
          <option value="ENDED">已结束</option>
          <option value="CANCELLED">已取消</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="loadEvents">🔍 搜索</button>
        <button class="btn btn-default" @click="resetFilters">🔄 重置</button>
        <button class="btn btn-success" @click="openCreateModal">
          ➕ 创建活动
        </button>
      </div>
    </div>

    <div class="statistics-bar">
      <div class="stat-item">
        <span class="stat-label">总活动</span>
        <span class="stat-value">{{ statistics.total || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">进行中</span>
        <span class="stat-value active">{{ statistics.active || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">待开始</span>
        <span class="stat-value">{{ statistics.pending || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">参与人次</span>
        <span class="stat-value">{{ statistics.totalParticipants || 0 }}</span>
      </div>
    </div>

    <div class="events-table-container">
      <table class="events-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>活动名称</th>
            <th>类型</th>
            <th>状态</th>
            <th>开始时间</th>
            <th>结束时间</th>
            <th>参与人数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="event in events" :key="event.id">
            <td>{{ event.id }}</td>
            <td class="name-cell">{{ event.name }}</td>
            <td>
              <span class="type-badge">{{ getTypeLabel(event.type) }}</span>
            </td>
            <td>
              <span class="status-badge" :class="getStatusClass(event.status)">
                {{ getStatusLabel(event.status) }}
              </span>
            </td>
            <td>{{ formatTime(event.start_time) }}</td>
            <td>{{ formatTime(event.end_time) }}</td>
            <td>{{ event.participant_count || 0 }}</td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn btn-small btn-info"
                  @click="viewDetail(event)"
                >
                  查看
                </button>
                <button
                  class="btn btn-small btn-warning"
                  @click="editEvent(event)"
                >
                  编辑
                </button>
                <template v-if="event.status === 'DRAFT'">
                  <button
                    class="btn btn-small btn-success"
                    @click="startEvent(event)"
                  >
                    启动
                  </button>
                </template>
                <template v-if="event.status === 'PENDING'">
                  <button
                    class="btn btn-small btn-success"
                    @click="startEvent(event)"
                  >
                    开始
                  </button>
                </template>
                <template v-if="event.status === 'ACTIVE'">
                  <button
                    class="btn btn-small btn-warning"
                    @click="pauseEvent(event)"
                  >
                    暂停
                  </button>
                  <button
                    class="btn btn-small btn-danger"
                    @click="endEvent(event)"
                  >
                    结束
                  </button>
                </template>
                <template v-if="event.status === 'PAUSED'">
                  <button
                    class="btn btn-small btn-success"
                    @click="resumeEvent(event)"
                  >
                    恢复
                  </button>
                </template>
                <template
                  v-if="event.status === 'DRAFT' || event.status === 'PENDING'"
                >
                  <button
                    class="btn btn-small btn-danger"
                    @click="deleteConfirm(event)"
                  >
                    删除
                  </button>
                </template>
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
          <h3>{{ isEditMode ? '编辑活动' : '创建活动' }}</h3>
          <button class="btn btn-small" @click="closeEditModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>活动名称 <span class="required">*</span></label>
            <input v-model="formData.name" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>活动类型</label>
            <select v-model="formData.type" class="form-select">
              <option value="DAILY">日常活动</option>
              <option value="WEEKLY">周常活动</option>
              <option value="MONTHLY">月常活动</option>
              <option value="SPECIAL">特殊活动</option>
              <option value="HOLIDAY">节日活动</option>
            </select>
          </div>
          <div class="form-group">
            <label>活动描述</label>
            <textarea
              v-model="formData.description"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>开始时间 <span class="required">*</span></label>
              <input
                v-model="formData.start_time"
                type="datetime-local"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>结束时间 <span class="required">*</span></label>
              <input
                v-model="formData.end_time"
                type="datetime-local"
                class="form-input"
              />
            </div>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="formData.status" class="form-select">
              <option value="DRAFT">草稿</option>
              <option value="PENDING">待开始</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>优先级</label>
              <input
                v-model.number="formData.priority"
                type="number"
                class="form-input"
                min="0"
              />
            </div>
            <div class="form-group">
              <label>最大参与人数</label>
              <input
                v-model.number="formData.max_participants"
                type="number"
                class="form-input"
                min="0"
              />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeEditModal">取消</button>
          <button
            class="btn btn-primary"
            :disabled="loading"
            @click="saveEvent"
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
      <div class="modal detail-modal large">
        <div class="modal-header">
          <h3>活动详情</h3>
          <button class="btn btn-small" @click="closeDetailModal">
            &times;
          </button>
        </div>
        <div v-if="currentEvent" class="modal-body">
          <div class="detail-tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="tab-button"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
          <div class="tab-content">
            <div v-if="activeTab === 'info'" class="info-section">
              <div class="detail-row">
                <span class="detail-label">活动名称</span>
                <span class="detail-value">{{ currentEvent.name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">活动类型</span>
                <span class="detail-value">{{
                  getTypeLabel(currentEvent.type)
                }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">状态</span>
                <span class="detail-value">
                  <span
                    class="status-badge"
                    :class="getStatusClass(currentEvent.status)"
                  >
                    {{ getStatusLabel(currentEvent.status) }}
                  </span>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">开始时间</span>
                <span class="detail-value">{{
                  formatTime(currentEvent.start_time)
                }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">结束时间</span>
                <span class="detail-value">{{
                  formatTime(currentEvent.end_time)
                }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">优先级</span>
                <span class="detail-value">{{ currentEvent.priority }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">参与人数</span>
                <span class="detail-value"
                  >{{ currentEvent.participant_count || 0 }} /
                  {{ currentEvent.max_participants || '无限制' }}</span
                >
              </div>
              <div class="detail-row">
                <span class="detail-label">描述</span>
                <span class="detail-value">{{
                  currentEvent.description || '无'
                }}</span>
              </div>
            </div>
            <div v-if="activeTab === 'tasks'" class="tasks-section">
              <div class="tasks-header">
                <h4>任务列表</h4>
                <button
                  class="btn btn-small btn-success"
                  @click="openTaskModal"
                >
                  ➕ 添加任务
                </button>
              </div>
              <div class="tasks-list">
                <div v-for="task in tasks" :key="task.id" class="task-item">
                  <div class="task-info">
                    <span class="task-name">{{ task.name }}</span>
                    <span class="task-type">{{
                      getTaskTypeLabel(task.type)
                    }}</span>
                  </div>
                  <div class="task-actions">
                    <button
                      class="btn btn-small btn-warning"
                      @click="editTask(task)"
                    >
                      编辑
                    </button>
                    <button
                      class="btn btn-small btn-danger"
                      @click="deleteTask(task)"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="activeTab === 'progress'" class="progress-section">
              <div class="progress-header">
                <h4>玩家进度</h4>
                <div class="progress-stats">
                  <span>完成: {{ progressStats.completed || 0 }}</span>
                  <span>进行中: {{ progressStats.inProgress || 0 }}</span>
                </div>
              </div>
              <div class="progress-list">
                <div
                  v-for="p in playerProgress"
                  :key="p.player_id"
                  class="progress-item"
                >
                  <span class="player-name">{{ p.player_name }}</span>
                  <span class="progress-percent"
                    >{{
                      Math.round((p.completed_tasks / p.total_tasks) * 100)
                    }}%</span
                  >
                </div>
              </div>
            </div>
            <div v-if="activeTab === 'statistics'" class="statistics-section">
              <div class="stat-cards">
                <div class="stat-card">
                  <span class="stat-card-label">参与人数</span>
                  <span class="stat-card-value">{{
                    eventStatistics.participants || 0
                  }}</span>
                </div>
                <div class="stat-card">
                  <span class="stat-card-label">任务完成数</span>
                  <span class="stat-card-value">{{
                    eventStatistics.completed_tasks || 0
                  }}</span>
                </div>
                <div class="stat-card">
                  <span class="stat-card-label">奖励发放</span>
                  <span class="stat-card-value">{{
                    eventStatistics.rewards_given || 0
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="closeDetailModal">
            关闭
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showTaskModal"
      class="modal-overlay"
      @click.self="closeTaskModal"
    >
      <div class="modal task-modal">
        <div class="modal-header">
          <h3>{{ isEditTask ? '编辑任务' : '添加任务' }}</h3>
          <button class="btn btn-small" @click="closeTaskModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>任务名称 <span class="required">*</span></label>
            <input v-model="taskForm.name" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>任务类型</label>
            <select v-model="taskForm.type" class="form-select">
              <option value="HARVEST">收获任务</option>
              <option value="PLANT">种植任务</option>
              <option value="COLLECT">收集任务</option>
              <option value="TRADE">交易任务</option>
              <option value="SOCIAL">社交任务</option>
              <option value="CUSTOM">自定义任务</option>
            </select>
          </div>
          <div class="form-group">
            <label>任务描述</label>
            <textarea
              v-model="taskForm.description"
              class="form-textarea"
              rows="2"
            ></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>目标数量</label>
              <input
                v-model.number="taskForm.target_value"
                type="number"
                class="form-input"
                min="1"
              />
            </div>
            <div class="form-group">
              <label>排序</label>
              <input
                v-model.number="taskForm.sort_order"
                type="number"
                class="form-input"
                min="0"
              />
            </div>
          </div>
          <div class="form-group">
            <label>奖励配置 (JSON)</label>
            <textarea
              v-model="taskForm.rewards"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeTaskModal">取消</button>
          <button class="btn btn-primary" @click="saveTask">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useGameEventStore } from '../../stores/gameEvent';

const gameEventStore = useGameEventStore();

const events = ref([]);
const currentEvent = ref(null);
const tasks = ref([]);
const playerProgress = ref([]);
const statistics = ref({});
const eventStatistics = ref({});
const progressStats = ref({});
const loading = ref(false);
const showEditModal = ref(false);
const showDetailModal = ref(false);
const showTaskModal = ref(false);
const isEditMode = ref(false);
const isEditTask = ref(false);
const activeTab = ref('info');

const tabs = [
  { key: 'info', label: '基本信息' },
  { key: 'tasks', label: '任务管理' },
  { key: 'progress', label: '玩家进度' },
  { key: 'statistics', label: '统计数据' },
];

const formData = ref({
  name: '',
  description: '',
  type: 'SPECIAL',
  status: 'DRAFT',
  start_time: '',
  end_time: '',
  priority: 0,
  max_participants: null,
});

const taskForm = ref({
  name: '',
  type: 'CUSTOM',
  description: '',
  target_value: 1,
  sort_order: 0,
  rewards: '{}',
});

const filters = ref({
  name: '',
  type: '',
  status: '',
});

const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
});

const TYPE_LABELS = {
  DAILY: '日常活动',
  WEEKLY: '周常活动',
  MONTHLY: '月常活动',
  SPECIAL: '特殊活动',
  HOLIDAY: '节日活动',
};

const STATUS_LABELS = {
  DRAFT: '草稿',
  PENDING: '待开始',
  ACTIVE: '进行中',
  PAUSED: '已暂停',
  ENDED: '已结束',
  CANCELLED: '已取消',
};

const TASK_TYPE_LABELS = {
  HARVEST: '收获任务',
  PLANT: '种植任务',
  COLLECT: '收集任务',
  TRADE: '交易任务',
  SOCIAL: '社交任务',
  CUSTOM: '自定义任务',
};

onMounted(() => {
  loadEvents();
  calculateStatistics();
});

async function loadEvents() {
  try {
    await gameEventStore.fetchEvents({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      name: filters.value.name || undefined,
      type: filters.value.type || undefined,
      status: filters.value.status || undefined,
    });
    events.value = gameEventStore.events;
    pagination.value = gameEventStore.pagination;
  } catch (error) {
    alert(
      '加载活动列表失败: ' + (error.response?.data?.message || error.message)
    );
  }
}

function calculateStatistics() {
  const allEvents = events.value;
  statistics.value = {
    total: allEvents.length,
    active: allEvents.filter((e) => e.status === 'ACTIVE').length,
    pending: allEvents.filter((e) => e.status === 'PENDING').length,
    totalParticipants: allEvents.reduce(
      (sum, e) => sum + (e.participant_count || 0),
      0
    ),
  };
}

function resetFilters() {
  filters.value = {
    name: '',
    type: '',
    status: '',
  };
  pagination.value.page = 1;
  loadEvents();
}

function changePage(page) {
  pagination.value.page = page;
  loadEvents();
}

function viewDetail(event) {
  currentEvent.value = event;
  activeTab.value = 'info';
  showDetailModal.value = true;
  loadEventDetail(event.id);
}

async function loadEventDetail(eventId) {
  try {
    await gameEventStore.fetchEvent(eventId);
    currentEvent.value = gameEventStore.currentEvent;
    await loadEventTasks(eventId);
    await loadEventStatistics(eventId);
    await loadPlayerProgress(eventId);
  } catch (error) {
    console.error('加载活动详情失败', error);
  }
}

async function loadEventTasks(eventId) {
  try {
    const response = await gameEventStore.fetchEventTasks(eventId);
    if (response.data.success) {
      tasks.value = response.data.data || [];
    }
  } catch (error) {
    console.error('加载任务失败', error);
  }
}

async function loadEventStatistics(eventId) {
  try {
    const response = await gameEventStore.fetchEventStatistics(eventId);
    if (response.data.success) {
      eventStatistics.value = response.data.data || {};
    }
  } catch (error) {
    console.error('加载统计失败', error);
  }
}

async function loadPlayerProgress(eventId) {
  try {
    const response = await gameEventStore.fetchPlayerProgress(eventId);
    if (response.data.success) {
      playerProgress.value = response.data.data.progress || [];
      progressStats.value = response.data.data.stats || {};
    }
  } catch (error) {
    console.error('加载进度失败', error);
  }
}

function openCreateModal() {
  isEditMode.value = false;
  formData.value = {
    name: '',
    description: '',
    type: 'SPECIAL',
    status: 'DRAFT',
    start_time: '',
    end_time: '',
    priority: 0,
    max_participants: null,
  };
  showEditModal.value = true;
}

function editEvent(event) {
  isEditMode.value = true;
  formData.value = {
    id: event.id,
    name: event.name,
    description: event.description,
    type: event.type,
    status: event.status,
    start_time: formatDateTimeLocal(event.start_time),
    end_time: formatDateTimeLocal(event.end_time),
    priority: event.priority,
    max_participants: event.max_participants,
  };
  showEditModal.value = true;
}

async function saveEvent() {
  if (
    !formData.value.name ||
    !formData.value.start_time ||
    !formData.value.end_time
  ) {
    alert('请填写必填项');
    return;
  }

  try {
    loading.value = true;
    if (isEditMode.value) {
      await gameEventStore.updateEvent(formData.value.id, formData.value);
    } else {
      await gameEventStore.createEvent(formData.value);
    }
    showEditModal.value = false;
    loadEvents();
    calculateStatistics();
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
  currentEvent.value = null;
}

async function startEvent(event) {
  if (!confirm(`确定要启动活动 "${event.name}" 吗?`)) {
    return;
  }

  try {
    await gameEventStore.startEvent(event.id);
    loadEvents();
    calculateStatistics();
  } catch (error) {
    alert('启动失败: ' + (error.response?.data?.message || error.message));
  }
}

async function endEvent(event) {
  if (!confirm(`确定要结束活动 "${event.name}" 吗?`)) {
    return;
  }

  try {
    await gameEventStore.endEvent(event.id);
    loadEvents();
    calculateStatistics();
  } catch (error) {
    alert('结束失败: ' + (error.response?.data?.message || error.message));
  }
}

async function pauseEvent(event) {
  if (!confirm(`确定要暂停活动 "${event.name}" 吗?`)) {
    return;
  }

  try {
    await gameEventStore.pauseEvent(event.id);
    loadEvents();
    calculateStatistics();
  } catch (error) {
    alert('暂停失败: ' + (error.response?.data?.message || error.message));
  }
}

async function resumeEvent(event) {
  if (!confirm(`确定要恢复活动 "${event.name}" 吗?`)) {
    return;
  }

  try {
    await gameEventStore.resumeEvent(event.id);
    loadEvents();
    calculateStatistics();
  } catch (error) {
    alert('恢复失败: ' + (error.response?.data?.message || error.message));
  }
}

async function deleteConfirm(event) {
  if (!confirm(`确定要删除活动 "${event.name}" 吗?此操作不可恢复!`)) {
    return;
  }

  try {
    await gameEventStore.deleteEvent(event.id);
    loadEvents();
    calculateStatistics();
  } catch (error) {
    alert('删除失败: ' + (error.response?.data?.message || error.message));
  }
}

function openTaskModal() {
  isEditTask.value = false;
  taskForm.value = {
    name: '',
    type: 'CUSTOM',
    description: '',
    target_value: 1,
    sort_order: 0,
    rewards: '{}',
  };
  showTaskModal.value = true;
}

function editTask(task) {
  isEditTask.value = true;
  taskForm.value = {
    id: task.id,
    name: task.name,
    type: task.type,
    description: task.description,
    target_value: task.target_value,
    sort_order: task.sort_order,
    rewards: JSON.stringify(task.rewards || {}, null, 2),
  };
  showTaskModal.value = true;
}

async function saveTask() {
  if (!taskForm.value.name) {
    alert('请填写任务名称');
    return;
  }

  try {
    const data = {
      ...taskForm.value,
      rewards: JSON.parse(taskForm.value.rewards),
    };

    if (isEditTask.value) {
      await gameEventStore.updateEventTask(
        currentEvent.value.id,
        taskForm.value.id,
        data
      );
    } else {
      await gameEventStore.createEventTask(currentEvent.value.id, data);
    }
    showTaskModal.value = false;
    loadEventTasks(currentEvent.value.id);
  } catch (error) {
    alert('保存任务失败: ' + (error.response?.data?.message || error.message));
  }
}

async function deleteTask(task) {
  if (!confirm(`确定要删除任务 "${task.name}" 吗?`)) {
    return;
  }

  try {
    await gameEventStore.deleteEventTask(currentEvent.value.id, task.id);
    loadEventTasks(currentEvent.value.id);
  } catch (error) {
    alert('删除任务失败: ' + (error.response?.data?.message || error.message));
  }
}

function closeTaskModal() {
  showTaskModal.value = false;
}

function getTypeLabel(type) {
  return TYPE_LABELS[type] || type;
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

function getTaskTypeLabel(type) {
  return TASK_TYPE_LABELS[type] || type;
}

function getStatusClass(status) {
  const classes = {
    DRAFT: 'draft',
    PENDING: 'pending',
    ACTIVE: 'active',
    PAUSED: 'paused',
    ENDED: 'ended',
    CANCELLED: 'cancelled',
  };
  return classes[status] || '';
}

function formatTime(timeStr) {
  if (!timeStr) return '-';
  const date = new Date(timeStr);
  return date.toLocaleString('zh-CN');
}

function formatDateTimeLocal(timeStr) {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
</script>

<style scoped>
.game-events-page {
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
  gap: 30px;
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

.stat-value.active {
  color: #67c23a;
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

.events-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.events-table {
  width: 100%;
  border-collapse: collapse;
}

.events-table th,
.events-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.events-table th {
  background: #f5f7fa;
  font-weight: 600;
}

.name-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-badge {
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
  background: #fdf6ec;
  color: #e6a23c;
}

.status-badge.active {
  background: #e1f3d8;
  color: #67c23a;
}

.status-badge.paused {
  background: #fef0f0;
  color: #f56c6c;
}

.status-badge.ended,
.status-badge.cancelled {
  background: #f5f7fa;
  color: #c0c4cc;
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

.detail-modal.large {
  max-width: 900px;
}

.task-modal {
  max-width: 500px;
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

.form-row {
  display: flex;
  gap: 20px;
}

.form-row .form-group {
  flex: 1;
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

.required {
  color: #f56c6c;
}

.detail-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.tab-button {
  padding: 8px 16px;
  border: none;
  background: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  background: #e5e7eb;
}

.tab-button.active {
  background: #409eff;
  color: white;
}

.detail-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f5f7fa;
}

.detail-label {
  width: 120px;
  color: #666;
  font-weight: 500;
}

.detail-value {
  flex: 1;
}

.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.tasks-header h4 {
  margin: 0;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.task-info {
  display: flex;
  gap: 15px;
  align-items: center;
}

.task-name {
  font-weight: 500;
}

.task-type {
  font-size: 12px;
  color: #666;
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 4px;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.progress-header h4 {
  margin: 0;
}

.progress-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #666;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.progress-percent {
  font-weight: bold;
  color: #409eff;
}

.stat-cards {
  display: flex;
  gap: 20px;
}

.stat-card {
  flex: 1;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;
}

.stat-card-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-card-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}
</style>
