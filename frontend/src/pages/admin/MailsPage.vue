/**
 * 文件名：MailsPage.vue
 * 作者：开发者
 * 日期：2026-05-24
 * 版本：v2.0.0
 * 功能描述：邮件管理页面，提供邮件发送、模板管理、发送记录等功能
 * 更新记录：
 * 2026-05-24 - v1.0.0 - 初始版本创建
 * 2026-05-24 - v2.0.0 - 修复 HTML 编码问题，统一样式风格
 */
<template>
  <div class="mails-page">
    <div class="mails-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-item', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.name }}
      </div>
    </div>

    <div v-if="activeTab === 'compose'" class="compose-section">
      <div class="compose-card">
        <div class="card-header">
          <h3>✉️ 发送邮件</h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label>收件人</label>
            <select v-model="mailForm.recipientType" class="form-select">
              <option value="all">所有用户</option>
              <option value="online">在线用户</option>
              <option value="level">指定等级用户</option>
              <option value="custom">自定义用户</option>
            </select>
          </div>

          <div v-if="mailForm.recipientType === 'level'" class="form-group">
            <label>等级范围</label>
            <div class="level-range">
              <input
                v-model="mailForm.minLevel"
                type="number"
                class="form-input"
                placeholder="最低等级"
              />
              <span>-</span>
              <input
                v-model="mailForm.maxLevel"
                type="number"
                class="form-input"
                placeholder="最高等级"
              />
            </div>
          </div>

          <div v-if="mailForm.recipientType === 'custom'" class="form-group">
            <label>用户ID列表(逗号分隔)</label>
            <textarea
              v-model="mailForm.userIds"
              class="form-textarea"
              placeholder="请输入用户ID"
            ></textarea>
          </div>

          <div class="form-group">
            <label>邮件标题</label>
            <input
              v-model="mailForm.title"
              type="text"
              class="form-input"
              placeholder="请输入邮件标题"
            />
          </div>

          <div class="form-group">
            <label>邮件内容</label>
            <textarea
              v-model="mailForm.content"
              class="form-textarea large"
              placeholder="请输入邮件内容"
            ></textarea>
          </div>

          <div class="form-group">
            <label>附件奖励(可选)</label>
            <div class="attachments">
              <div class="attachment-item">
                <span class="attachment-icon">💰</span>
                <input
                  v-model="mailForm.attachments.gold"
                  type="number"
                  class="attachment-input"
                  placeholder="金币"
                />
              </div>
              <div class="attachment-item">
                <span class="attachment-icon">💎</span>
                <input
                  v-model="mailForm.attachments.diamond"
                  type="number"
                  class="attachment-input"
                  placeholder="钻石"
                />
              </div>
              <div class="attachment-item">
                <span class="attachment-icon">📦</span>
                <input
                  v-model="mailForm.attachments.item"
                  type="text"
                  class="attachment-input"
                  placeholder="道具ID"
                />
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>发送时间</label>
            <select v-model="mailForm.sendTime" class="form-select">
              <option value="now">立即发送</option>
              <option value="schedule">定时发送</option>
            </select>
          </div>

          <div v-if="mailForm.sendTime === 'schedule'" class="form-group">
            <label>定时时间</label>
            <input
              v-model="mailForm.scheduleTime"
              type="datetime-local"
              class="form-input"
            />
          </div>

          <div class="form-actions">
            <button class="btn btn-default" @click="saveDraft">
              📝 保存草稿
            </button>
            <button class="btn btn-info" @click="previewMail">👁️ 预览</button>
            <button class="btn btn-primary" @click="sendMail">
              ✉️ 发送邮件
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'templates'" class="templates-section">
      <div class="templates-header">
        <h3>📋 邮件模板</h3>
        <button class="btn btn-primary" @click="createTemplate">
          + 新建模板
        </button>
      </div>
      <div class="templates-list">
        <div
          v-for="template in templates"
          :key="template.id"
          class="template-card"
        >
          <div class="template-header">
            <h4>{{ template.title }}</h4>
            <div class="template-actions">
              <button
                class="btn btn-small btn-info"
                @click="useTemplate(template)"
              >
                使用
              </button>
              <button
                class="btn btn-small btn-default"
                @click="editTemplate(template)"
              >
                编辑
              </button>
              <button
                class="btn btn-small btn-danger"
                @click="deleteTemplate(template.id)"
              >
                删除
              </button>
            </div>
          </div>
          <div class="template-content">
            {{ template.content }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'history'" class="history-section">
      <div class="history-header">
        <h3>📜 发送记录</h3>
        <div class="history-filter">
          <select v-model="historyFilter.status" class="form-select">
            <option value="all">全部状态</option>
            <option value="sent">已发送</option>
            <option value="pending">待发送</option>
            <option value="failed">发送失败</option>
          </select>
          <button class="btn btn-primary" @click="loadHistory">🔄 刷新</button>
        </div>
      </div>
      <div class="history-table">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>标题</th>
              <th>收件人</th>
              <th>发送时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in mailHistory" :key="record.id">
              <td>{{ record.id }}</td>
              <td>{{ record.title }}</td>
              <td>{{ record.recipients }}</td>
              <td>{{ formatTime(record.sendTime) }}</td>
              <td>
                <span :class="['status-tag', record.status]">{{
                  getStatusText(record.status)
                }}</span>
              </td>
              <td>
                <button
                  class="btn btn-small btn-info"
                  @click="viewDetail(record)"
                >
                  查看
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import adminService from '../../services/adminService';

const tabs = [
  { id: 'compose', name: '发送邮件', icon: '✉️' },
  { id: 'templates', name: '邮件模板', icon: '📋' },
  { id: 'history', name: '发送记录', icon: '📜' },
];

const activeTab = ref('compose');

const mailForm = ref({
  recipientType: 'all',
  minLevel: '',
  maxLevel: '',
  userIds: '',
  title: '',
  content: '',
  attachments: {
    gold: '',
    diamond: '',
    item: '',
  },
  sendTime: 'now',
  scheduleTime: '',
});

const templates = ref([]);
const mailHistory = ref([]);
const loading = ref(false);

const historyFilter = ref({
  status: 'all',
});

/**
 * 加载邮件模板列表
 */
async function loadTemplates() {
  try {
    const response = await adminService.getMailTemplates();
    if (response.success) {
      templates.value = response.data || [];
    }
  } catch (error) {
    console.error('加载模板失败', error);
  }
}

/**
 * 加载发送记录
 */
async function loadHistory() {
  try {
    const response = await adminService.getMailHistory({
      status: historyFilter.value.status,
    });
    if (response.success) {
      mailHistory.value = response.data || [];
    }
  } catch (error) {
    console.error('加载发送记录失败', error);
  }
}

/**
 * 保存邮件草稿
 */
function saveDraft() {
  alert('草稿保存成功！');
}

/**
 * 预览邮件
 */
function previewMail() {
  alert('邮件预览功能');
}

/**
 * 发送邮件
 */
async function sendMail() {
  if (!mailForm.value.title || !mailForm.value.content) {
    alert('请填写邮件标题和内容');
    return;
  }

  loading.value = true;
  try {
    const response = await adminService.sendMail(mailForm.value);
    if (response.success) {
      alert('邮件发送成功！');
      mailForm.value = {
        recipientType: 'all',
        minLevel: '',
        maxLevel: '',
        userIds: '',
        title: '',
        content: '',
        attachments: { gold: '', diamond: '', item: '' },
        sendTime: 'now',
        scheduleTime: '',
      };
      await loadHistory();
    } else {
      alert('发送失败: ' + (response.message || '未知错误'));
    }
  } catch (error) {
    console.error('发送邮件失败', error);
    alert('发送失败: ' + error.message);
  } finally {
    loading.value = false;
  }
}

/**
 * 创建邮件模板
 */
async function createTemplate() {
  const title = prompt('请输入模板标题');
  if (!title) return;
  const content = prompt('请输入模板内容');
  if (!content) return;

  try {
    const response = await adminService.createMailTemplate({ title, content });
    if (response.success) {
      alert('模板创建成功！');
      await loadTemplates();
    } else {
      alert('创建失败: ' + (response.message || '未知错误'));
    }
  } catch (error) {
    alert('创建失败: ' + error.message);
  }
}

/**
 * 使用邮件模板
 * @param {object} template - 模板对象
 */
function useTemplate(template) {
  mailForm.value.title = template.title;
  mailForm.value.content = template.content;
  activeTab.value = 'compose';
}

/**
 * 编辑邮件模板
 * @param {object} template - 模板对象
 */
async function editTemplate(template) {
  const title = prompt('请输入新标题', template.title);
  if (title === null) return;
  const content = prompt('请输入新内容', template.content);
  if (content === null) return;

  try {
    const response = await adminService.updateMailTemplate(template.id, {
      title,
      content,
    });
    if (response.success) {
      alert('模板更新成功！');
      await loadTemplates();
    } else {
      alert('更新失败: ' + (response.message || '未知错误'));
    }
  } catch (error) {
    alert('更新失败: ' + error.message);
  }
}

/**
 * 删除邮件模板
 * @param {number|string} id - 模板ID
 */
async function deleteTemplate(id) {
  if (!confirm('确定要删除该模板吗？')) return;

  try {
    const response = await adminService.deleteMailTemplate(id);
    if (response.success) {
      alert('模板删除成功！');
      await loadTemplates();
    } else {
      alert('删除失败: ' + (response.message || '未知错误'));
    }
  } catch (error) {
    alert('删除失败: ' + error.message);
  }
}

/**
 * 查看邮件详情
 * @param {object} record - 邮件记录对象
 */
function viewDetail(record) {
  const attachments = record.attachments
    ? Object.entries(record.attachments)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
    : '无';

  alert(
    `标题: ${record.title}\n` +
      `收件人: ${record.recipients}\n` +
      `发送时间: ${record.sendTime}\n` +
      `状态: ${getStatusText(record.status)}\n` +
      `附件: ${attachments}\n` +
      `内容: ${record.content || '（无内容）'}`
  );
}

/**
 * 获取状态文本
 * @param {string} status - 状态值
 * @returns {string} 状态中文文本
 */
function getStatusText(status) {
  const statusMap = {
    sent: '已发送',
    pending: '待发送',
    failed: '发送失败',
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
  return time;
}

onMounted(() => {
  loadTemplates();
  loadHistory();
});
</script>

<style scoped>
.mails-page {
  padding: 0;
}

.mails-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: white;
  padding: 0 20px;
  border-radius: 8px;
}

.tab-item {
  padding: 16px 24px;
  cursor: pointer;
  font-size: 14px;
  color: #595959;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.tab-item:hover {
  color: #1890ff;
}

.tab-item.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
}

.compose-card,
.templates-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.card-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
}

.form-textarea.large {
  min-height: 200px;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #1890ff;
}

.level-range {
  display: flex;
  gap: 12px;
  align-items: center;
}

.level-range input {
  flex: 1;
}

.attachments {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.attachment-item {
  display: flex;
  gap: 8px;
  align-items: center;
  background: #fafafa;
  padding: 12px;
  border-radius: 6px;
}

.attachment-icon {
  font-size: 20px;
}

.attachment-input {
  width: 120px;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
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

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

.templates-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.templates-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.template-card {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.template-card:last-child {
  border-bottom: none;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.template-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.template-actions {
  display: flex;
  gap: 8px;
}

.template-content {
  color: #595959;
  font-size: 14px;
  line-height: 1.6;
}

.history-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 20px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.history-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.history-filter {
  display: flex;
  gap: 12px;
  align-items: center;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.data-table th {
  background: #fafafa;
  font-weight: 600;
  color: #262626;
  font-size: 14px;
}

.data-table td {
  font-size: 14px;
  color: #595959;
}

.status-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.sent {
  background: #f6ffed;
  color: #52c41a;
}

.status-tag.pending {
  background: #fffbe6;
  color: #faad14;
}

.status-tag.failed {
  background: #fff1f0;
  color: #ff4d4f;
}
</style>
