/** * 文件名：DocsPage.vue * 作者：开发者 * 日期：2026-05-01 * 版本：v1.0.0 *
功能描述：数据库文档管理页面 * 更新记录： * 2026-05-01 - v1.0.0 - 初始版本创建
*/

<template>
  <div class="docs-page">
    <div class="page-header">
      <h1>📚 数据库文档管理</h1>
      <p class="page-desc">管理和导出数据库相关文档</p>
    </div>

    <div class="content">
      <!-- 操作卡片 -->
      <div class="card-grid">
        <!-- 导出文档 -->
        <div class="card">
          <div class="card-icon">
            <span>💾</span>
          </div>
          <h3>导出文档</h3>
          <p>保存文档到服务器并生成文件</p>
          <button
            :disabled="loading"
            class="btn btn-primary"
            @click="exportDocs"
          >
            {{ loading ? '导出中...' : '导出文档' }}
          </button>
        </div>

        <!-- 下载结构文档 -->
        <div class="card">
          <div class="card-icon">
            <span>📋</span>
          </div>
          <h3>表结构文档</h3>
          <p>下载数据库表结构说明文件</p>
          <button class="btn btn-secondary" @click="downloadStructureDoc">
            下载文档
          </button>
        </div>

        <!-- 下载数据文档 -->
        <div class="card">
          <div class="card-icon">
            <span>📊</span>
          </div>
          <h3>表数据文档</h3>
          <p>下载数据库表数据说明文件</p>
          <button class="btn btn-secondary" @click="downloadDataDoc">
            下载文档
          </button>
        </div>
      </div>

      <!-- 结果提示 -->
      <div
        v-if="result"
        :class="['result-box', result.success ? 'success' : 'error']"
      >
        <p>{{ result.message }}</p>
        <div v-if="result.data" class="result-data">
          <p>📄 表结构文档: {{ result.data.structureFile }}</p>
          <p>📄 表数据文档: {{ result.data.dataFile }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '../../services/api';

const loading = ref(false);
const result = ref(null);

/**
 * 导出文档
 */
async function exportDocs() {
  loading.value = true;
  result.value = null;

  try {
    const response = await api.post('/admin/docs/export');
    result.value = response.data;

    if (response.data.success) {
      console.log('文档导出成功');
    } else {
      console.error(response.data.message || '文档导出失败');
    }
  } catch (error) {
    console.error('导出文档失败:', error);
    result.value = {
      success: false,
      message: error.response?.data?.message || '文档导出失败',
    };
    console.error('文档导出失败');
  } finally {
    loading.value = false;
  }
}

/**
 * 下载表结构文档
 */
async function downloadStructureDoc() {
  try {
    const response = await api.get('/admin/docs/structure', {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'table_structure.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('表结构文档下载成功');
  } catch (error) {
    console.error('下载文档失败:', error);
    useToast('error', '文档下载失败');
  }
}

/**
 * 下载表数据文档
 */
async function downloadDataDoc() {
  try {
    const response = await api.get('/admin/docs/data', {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'table_data.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('表数据文档下载成功');
  } catch (error) {
    console.error('下载文档失败:', error);
    useToast('error', '文档下载失败');
  }
}
</script>

<style scoped>
.docs-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #1a1a1a;
}

.page-desc {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.content {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s ease;
}

.card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.card-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.card h3 {
  margin: 0 0 8px 0;
  color: #1a1a1a;
  font-size: 18px;
}

.card p {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.result-box {
  padding: 16px;
  border-radius: 6px;
  margin-top: 24px;
}

.result-box.success {
  background: #d1fae5;
  border: 1px solid #6ee7b7;
  color: #065f46;
}

.result-box.error {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
}

.result-box p {
  margin: 0;
}

.result-data {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.result-data p {
  margin: 4px 0;
  font-size: 13px;
}
</style>
