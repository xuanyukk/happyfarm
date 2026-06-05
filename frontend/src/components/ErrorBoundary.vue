/**
 * 文件名：ErrorBoundary.vue
 * 作者：开发者
 * 日期：2026-03-28
 * 版本：v1.1.0
 * 功能描述：错误边界组件，捕获应用错误并提供友好的错误界面
 * 更新记录：
 *   2026-03-28 - v1.0.0 - 初始创建，错误边界功能
 *   2026-05-23 - v1.1.0 - 集成客户端日志上报API
 */

<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <div class="error-icon">⚠️</div>
      <h2 class="error-title">发生了错误</h2>
      <p class="error-message">{{ errorMessage }}</p>
      <div v-if="showDetails" class="error-details">
        <pre>{{ errorDetails }}</pre>
      </div>
      <div class="error-actions">
        <button class="btn btn-primary" @click="reloadPage">刷新页面</button>
        <button class="btn btn-secondary" @click="goHome">返回首页</button>
        <button class="btn btn-link" @click="toggleDetails">
          {{ showDetails ? '隐藏' : '显示' }}详细信息
        </button>
      </div>
      <div v-if="showReport" class="error-report">
        <h3>报告问题</h3>
        <textarea
          v-model="reportDescription"
          class="report-textarea"
          placeholder="请描述您在做什么操作时遇到的问题..."
          rows="4"
        ></textarea>
        <button
          class="btn btn-success"
          :disabled="isSubmitting"
          @click="submitReport"
        >
          {{ isSubmitting ? '提交中...' : '提交报告' }}
        </button>
      </div>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script setup>
import { ref, onErrorCaptured, provide } from 'vue';
import { useRouter } from 'vue-router';
import logger from '../services/logger';
import api from '../services/api';

const router = useRouter();
const hasError = ref(false);
const errorMessage = ref('应用遇到了意外错误');
const errorDetails = ref('');
const showDetails = ref(false);
const showReport = ref(false);
const reportDescription = ref('');
const isSubmitting = ref(false);

const setError = (error, info) => {
  hasError.value = true;
  errorMessage.value = error.message || '发生了未知错误';
  errorDetails.value = error.stack || info || '';

  logger.error('Error boundary captured error', { error, info });
};

const reloadPage = () => {
  window.location.reload();
};

const goHome = () => {
  hasError.value = false;
  router.push('/');
};

const toggleDetails = () => {
  showDetails.value = !showDetails.value;
};

const submitReport = async () => {
  if (!reportDescription.value.trim()) {
    return;
  }

  isSubmitting.value = true;
  try {
    const reportData = {
      level: 'error',
      type: 'user_report',
      message: '用户报告的错误',
      stack: errorDetails.value,
      module: 'ErrorBoundary',
      context: {
        errorMessage: errorMessage.value,
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
      userDescription: reportDescription.value,
      timestamp: new Date().toISOString(),
    };

    logger.info('Submitting user error report', reportData);

    // 使用客户端日志上报API
    await api.post('/client-logs', reportData);

    logger.info('Error report submitted successfully');

    showReport.value = false;
    reportDescription.value = '';
  } catch (error) {
    logger.error('Failed to submit report', { error });
  } finally {
    isSubmitting.value = false;
  }
};

onErrorCaptured((error, instance, info) => {
  setError(error, info);
  return true;
});

provide('setErrorBoundary', setError);

const resetError = () => {
  hasError.value = false;
  errorMessage.value = '';
  errorDetails.value = '';
  showDetails.value = false;
  showReport.value = false;
  reportDescription.value = '';
};

provide('resetErrorBoundary', resetError);
</script>

<style scoped>
.error-boundary {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.error-content {
  background: white;
  border-radius: 16px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.error-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
}

.error-message {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 24px;
  line-height: 1.5;
}

.error-details {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
  max-height: 200px;
  overflow-y: auto;
}

.error-details pre {
  font-size: 12px;
  color: #4b5563;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.error-report {
  border-top: 1px solid #e5e7eb;
  padding-top: 24px;
  text-align: left;
}

.error-report h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.report-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  margin-bottom: 12px;
  font-family: inherit;
}

.report-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
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

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-success {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
}

.btn-link {
  background: transparent;
  color: #667eea;
  padding: 8px 12px;
}

.btn-link:hover:not(:disabled) {
  text-decoration: underline;
}
</style>
