/** * 文件名：QueueManager.vue * 作者：开发者 * 日期：2026-03-22 * 版本：v1.0.0
* 功能描述：队列管理页面 - 任务队列监控与管理 * 更新记录： * 2026-03-22 - v1.0.0
- 初始创建，队列管理功能 */

<template>
  <div class="queue-manager">
    <div class="header">
      <h1 class="title">📋 队列管理系统</h1>
      <div class="header-actions">
        <button
          :class="['polling-btn', { active: queueStore.isPolling }]"
          @click="togglePolling"
        >
          <span v-if="queueStore.isPolling">⏸️ 停止轮询</span>
          <span v-else>▶️ 开始轮询</span>
        </button>
        <button
          class="refresh-btn"
          :disabled="queueStore.loading"
          @click="queueStore.refresh"
        >
          🔄 刷新
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div
      v-if="queueStore.loading && !queueStore.queueStats"
      class="loading-container"
    >
      <div class="loading-spinner"></div>
      <p class="loading-text">加载队列数据中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="queueStore.error" class="error-container">
      <span class="error-icon">⚠️</span>
      <p class="error-text">{{ queueStore.error }}</p>
      <button class="btn btn-primary" @click="queueStore.refresh">重试</button>
    </div>

    <div v-else class="content">
      <!-- 统计概览 -->
      <div class="stats-overview">
        <div class="stat-card total">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <div class="stat-value">{{ queueStore.totalJobs }}</div>
            <div class="stat-label">总任务数</div>
          </div>
        </div>
        <div class="stat-card completed">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <div class="stat-value">{{ queueStore.completedJobs }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
        <div class="stat-card failed">
          <div class="stat-icon">❌</div>
          <div class="stat-info">
            <div class="stat-value">{{ queueStore.failedJobs }}</div>
            <div class="stat-label">失败</div>
          </div>
        </div>
      </div>

      <!-- 队列列表 -->
      <div class="queues-section">
        <h2 class="section-title">队列列表</h2>
        <div class="queue-grid">
          <div
            v-for="queueType in queueStore.queueTypes"
            :key="queueType.name"
            :class="[
              'queue-card',
              { active: queueStore.selectedQueue?.name === queueType.name },
            ]"
            @click="queueStore.selectQueue(queueType.name)"
          >
            <div class="queue-header">
              <span class="queue-icon">{{ queueType.icon }}</span>
              <span class="queue-name">{{ queueType.label }}</span>
            </div>
            <div
              v-if="
                queueStore.queueStats && queueStore.queueStats[queueType.name]
              "
              class="queue-stats"
            >
              <div class="queue-stat-item">
                <span class="stat-label">等待</span>
                <span class="stat-value waiting">{{
                  queueStore.queueStats[queueType.name].waiting || 0
                }}</span>
              </div>
              <div class="queue-stat-item">
                <span class="stat-label">执行中</span>
                <span class="stat-value active">{{
                  queueStore.queueStats[queueType.name].active || 0
                }}</span>
              </div>
              <div class="queue-stat-item">
                <span class="stat-label">已完成</span>
                <span class="stat-value completed">{{
                  queueStore.queueStats[queueType.name].completed || 0
                }}</span>
              </div>
              <div class="queue-stat-item">
                <span class="stat-label">失败</span>
                <span class="stat-value failed">{{
                  queueStore.queueStats[queueType.name].failed || 0
                }}</span>
              </div>
              <div class="queue-stat-item">
                <span class="stat-label">延迟</span>
                <span class="stat-value delayed">{{
                  queueStore.queueStats[queueType.name].delayed || 0
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加任务区域 -->
      <div class="add-job-section">
        <h2 class="section-title">➕ 添加任务</h2>
        <div class="job-forms">
          <!-- 添加邮件任务 -->
          <div class="job-form-card">
            <h3 class="form-title">📧 邮件任务</h3>
            <div class="form-group">
              <label>收件人</label>
              <input
                v-model="emailForm.to"
                type="email"
                placeholder="example@email.com"
              />
            </div>
            <div class="form-group">
              <label>主题</label>
              <input
                v-model="emailForm.subject"
                type="text"
                placeholder="邮件主题"
              />
            </div>
            <div class="form-group">
              <label>内容</label>
              <textarea
                v-model="emailForm.html"
                rows="4"
                placeholder="邮件内容"
              ></textarea>
            </div>
            <button
              class="btn btn-primary"
              :disabled="submitting"
              @click="submitEmailJob"
            >
              {{ submitting ? '添加中...' : '添加邮件任务' }}
            </button>
          </div>

          <!-- 添加通知任务 -->
          <div class="job-form-card">
            <h3 class="form-title">🔔 通知任务</h3>
            <div class="form-group">
              <label>用户ID</label>
              <input
                v-model="notificationForm.userId"
                type="text"
                placeholder="用户ID"
              />
            </div>
            <div class="form-group">
              <label>通知类型</label>
              <select v-model="notificationForm.type">
                <option value="info">信息</option>
                <option value="success">成功</option>
                <option value="warning">警告</option>
                <option value="error">错误</option>
              </select>
            </div>
            <div class="form-group">
              <label>消息</label>
              <textarea
                v-model="notificationForm.message"
                rows="4"
                placeholder="通知消息"
              ></textarea>
            </div>
            <button
              class="btn btn-primary"
              :disabled="submitting"
              @click="submitNotificationJob"
            >
              {{ submitting ? '添加中...' : '添加通知任务' }}
            </button>
          </div>

          <!-- 快捷操作 -->
          <div class="job-form-card quick-actions">
            <h3 class="form-title">⚡ 快捷操作</h3>
            <button
              class="btn btn-success"
              :disabled="submitting"
              @click="submitBackupJob"
            >
              💾 添加备份任务
            </button>
            <button
              class="btn btn-warning"
              :disabled="submitting"
              @click="submitCacheInvalidationJob"
            >
              🗑️ 添加缓存失效任务
            </button>
          </div>
        </div>
      </div>

      <!-- 选中队列详情 -->
      <div v-if="queueStore.selectedQueue" class="queue-detail-section">
        <div class="detail-header">
          <h2 class="section-title">
            {{ getQueueIcon(queueStore.selectedQueue.name) }}
            {{ getQueueLabel(queueStore.selectedQueue.name) }} 详情
          </h2>
          <button class="close-btn" @click="queueStore.selectQueue(null)">
            ✕
          </button>
        </div>
        <div class="queue-detail-content">
          <pre>{{ JSON.stringify(queueStore.selectedQueue, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 文件名：QueueManager.vue
 * 作者：开发者
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：队列管理页面
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始创建
 */

import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { useQueueStore } from '../stores/queue';

const queueStore = useQueueStore();
const submitting = ref(false);

const emailForm = reactive({
  to: '',
  subject: '',
  html: '',
});

const notificationForm = reactive({
  userId: '',
  type: 'info',
  message: '',
});

const togglePolling = () => {
  if (queueStore.isPolling) {
    queueStore.stopPolling();
  } else {
    queueStore.startPolling();
  }
};

const submitEmailJob = async () => {
  if (!emailForm.to) {
    alert('请输入收件人');
    return;
  }

  submitting.value = true;
  try {
    await queueStore.addEmailJob(emailForm);
    alert('邮件任务添加成功！');
    emailForm.to = '';
    emailForm.subject = '';
    emailForm.html = '';
  } catch (err) {
    alert('添加失败：' + (err.response?.data?.message || err.message));
  } finally {
    submitting.value = false;
  }
};

const submitNotificationJob = async () => {
  if (!notificationForm.userId || !notificationForm.message) {
    alert('请填写完整信息');
    return;
  }

  submitting.value = true;
  try {
    await queueStore.addNotificationJob(notificationForm);
    alert('通知任务添加成功！');
    notificationForm.userId = '';
    notificationForm.message = '';
  } catch (err) {
    alert('添加失败：' + (err.response?.data?.message || err.message));
  } finally {
    submitting.value = false;
  }
};

const submitBackupJob = async () => {
  submitting.value = true;
  try {
    await queueStore.addBackupJob({ type: 'full' });
    alert('备份任务添加成功！');
  } catch (err) {
    alert('添加失败：' + (err.response?.data?.message || err.message));
  } finally {
    submitting.value = false;
  }
};

const submitCacheInvalidationJob = async () => {
  submitting.value = true;
  try {
    await queueStore.addCacheInvalidationJob({ pattern: '*' });
    alert('缓存失效任务添加成功！');
  } catch (err) {
    alert('添加失败：' + (err.response?.data?.message || err.message));
  } finally {
    submitting.value = false;
  }
};

const getQueueIcon = (name) => {
  const queueType = queueStore.queueTypes.find((q) => q.name === name);
  return queueType?.icon || '📋';
};

const getQueueLabel = (name) => {
  const queueType = queueStore.queueTypes.find((q) => q.name === name);
  return queueType?.label || name;
};

onMounted(() => {
  queueStore.fetchQueueStats();
});

onUnmounted(() => {
  queueStore.stopPolling();
});
</script>

<style scoped>
.queue-manager {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.title {
  font-size: 32px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.polling-btn,
.refresh-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(100, 116, 139, 0.3);
  background: rgba(255, 255, 255, 0.9);
}

.polling-btn:hover,
.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.polling-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  gap: 20px;
}

.loading-spinner {
  width: 56px;
  height: 56px;
  border: 4px solid rgba(102, 126, 234, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text,
.error-text {
  font-size: 18px;
  color: #4a5568;
}

.error-icon {
  font-size: 64px;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border-left: 4px solid;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.stat-card.total {
  border-left-color: #667eea;
}

.stat-card.completed {
  border-left-color: #48bb78;
}

.stat-card.failed {
  border-left-color: #f56565;
}

.stat-icon {
  font-size: 48px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #2d3748;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #718096;
  margin-top: 8px;
}

.section-title {
  font-size: 24px;
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 20px;
}

.queues-section,
.add-job-section,
.queue-detail-section {
  margin-bottom: 40px;
}

.queue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.queue-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 2px solid transparent;
}

.queue-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: rgba(102, 126, 234, 0.3);
}

.queue-card.active {
  border-color: #667eea;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(255, 255, 255, 0.95) 100%
  );
}

.queue-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.queue-icon {
  font-size: 32px;
}

.queue-name {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.queue-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
}

.queue-stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.queue-stat-item .stat-label {
  font-size: 12px;
  color: #718096;
}

.queue-stat-item .stat-value {
  font-size: 20px;
  font-weight: bold;
}

.queue-stat-item .stat-value.waiting {
  color: #ed8936;
}

.queue-stat-item .stat-value.active {
  color: #4299e1;
}

.queue-stat-item .stat-value.completed {
  color: #48bb78;
}

.queue-stat-item .stat-value.failed {
  color: #f56565;
}

.queue-stat-item .stat-value.delayed {
  color: #9f7aea;
}

.job-forms {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.job-form-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 8px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  width: 100%;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  margin-bottom: 12px;
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
}

.btn-warning {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
  color: white;
}

.btn-warning:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(237, 137, 54, 0.4);
}

.quick-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.queue-detail-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #718096;
  padding: 4px;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #4a5568;
}

.queue-detail-content pre {
  background: #f7fafc;
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .title {
    font-size: 24px;
  }

  .stats-overview {
    grid-template-columns: 1fr;
  }

  .queue-grid {
    grid-template-columns: 1fr;
  }

  .job-forms {
    grid-template-columns: 1fr;
  }
}
</style>
