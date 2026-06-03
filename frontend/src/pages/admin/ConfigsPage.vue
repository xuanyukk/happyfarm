/** * 文件名：ConfigsPage.vue * 作者：Trae AI * 日期：2026-04-30 * 版本：v1.1.0
* 功能描述：游戏参数配置管理页面(含变更历史增强) * 更新记录： * 2026-04-30 -
v1.0.0 - 初始版本创建 * 2026-05-26 - v1.1.0 -
增强：标签页式变更历史、版本对比、回滚预览、变更统计 */

<template>
  <div class="configs-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">⚙️ 游戏参数配置</h1>
      <p class="page-description">管理游戏的各项参数配置</p>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <input
          v-model="filters.search"
          type="text"
          placeholder="搜索配置名称或键..."
          class="filter-input"
          @keyup.enter="handleSearch"
        />
        <select
          v-model="filters.category"
          class="filter-select"
          @change="handleCategoryChange"
        >
          <option value="">全部分类</option>
          <option
            v-for="category in configStore.categories"
            :key="category"
            :value="category"
          >
            {{ getCategoryName(category) }}
          </option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="handleSearch">🔍 搜索</button>
        <button class="btn btn-default" @click="handleReset">🔄 重置</button>
        <button class="btn btn-success" @click="showCreateModal = true">
          ➕ 新增配置
        </button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ configStore.configs.length }}</div>
          <div class="stat-label">总配置数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✏️</div>
        <div class="stat-content">
          <div class="stat-value">{{ activeConfigsCount }}</div>
          <div class="stat-label">启用配置</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔒</div>
        <div class="stat-content">
          <div class="stat-value">{{ readonlyConfigsCount }}</div>
          <div class="stat-label">只读配置</div>
        </div>
      </div>
    </div>

    <!-- 配置列表 -->
    <div class="configs-table-container">
      <div v-if="configStore.loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="configStore.error" class="error">
        <p>❌ {{ configStore.error }}</p>
        <button class="btn btn-primary" @click="fetchData">重试</button>
      </div>

      <div v-else-if="configStore.configs.length === 0" class="empty">
        <p>📭 暂无配置数据</p>
      </div>

      <div v-else>
        <!-- 按分类分组显示 -->
        <div
          v-for="(configs, category) in groupedConfigs"
          :key="category"
          class="config-group"
        >
          <h3 class="group-title">
            {{ getCategoryIcon(category) }} {{ getCategoryName(category) }}
          </h3>
          <div class="config-list">
            <div
              v-for="config in configs"
              :key="config.key"
              class="config-item"
            >
              <div class="config-header">
                <div class="config-info">
                  <span class="config-key">[{{ config.key }}]</span>
                  <span class="config-name">{{ config.name }}</span>
                  <span v-if="config.is_readonly" class="badge badge-info"
                    >只读</span
                  >
                  <span
                    v-if="config.is_required_approval"
                    class="badge badge-warning"
                    >需审批</span
                  >
                  <span v-if="!config.is_active" class="badge badge-danger"
                    >已禁用</span
                  >
                </div>
                <div class="config-actions">
                  <button
                    class="btn btn-sm btn-primary"
                    @click="handleEdit(config)"
                  >
                    编辑
                  </button>
                  <button
                    class="btn btn-sm btn-default"
                    @click="handleHistory(config)"
                  >
                    历史
                  </button>
                  <button
                    v-if="!config.is_readonly"
                    class="btn btn-sm btn-danger"
                    @click="handleDelete(config)"
                  >
                    删除
                  </button>
                </div>
              </div>

              <div class="config-content">
                <div class="config-description">{{ config.description }}</div>
                <div class="config-value">
                  <span class="value-label">当前值：</span>
                  <span class="value-content">{{ displayValue(config) }}</span>
                  <span
                    v-if="config.value !== config.default_value"
                    class="default-indicator"
                  >
                    (默认: {{ displayDefaultValue(config) }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑弹窗 -->
    <div
      v-if="showCreateModal || showEditModal"
      class="modal-overlay"
      @click.self="closeModal"
    >
      <div class="modal">
        <div class="modal-header">
          <h2>{{ showCreateModal ? '新增配置' : '编辑配置' }}</h2>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label>配置键</label>
              <input
                v-model="formData.key"
                type="text"
                class="form-control"
                :disabled="showEditModal"
                required
              />
            </div>

            <div class="form-group">
              <label>配置名称</label>
              <input
                v-model="formData.name"
                type="text"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label>描述</label>
              <textarea
                v-model="formData.description"
                class="form-control"
                rows="3"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>分类</label>
                <select
                  v-model="formData.category"
                  class="form-control"
                  required
                >
                  <option value="">请选择分类</option>
                  <option value="PLAYER">玩家系统</option>
                  <option value="FARM">农场系统</option>
                  <option value="ECONOMY">经济系统</option>
                  <option value="EVENT">活动系统</option>
                  <option value="SYSTEM">系统设置</option>
                </select>
              </div>

              <div class="form-group">
                <label>数据类型</label>
                <select
                  v-model="formData.data_type"
                  class="form-control"
                  required
                >
                  <option value="STRING">字符串</option>
                  <option value="INTEGER">整数</option>
                  <option value="FLOAT">浮点数</option>
                  <option value="BOOLEAN">布尔值</option>
                  <option value="ENUM">枚举</option>
                  <option value="JSON">JSON</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>值</label>
                <input
                  v-model="formData.value"
                  type="text"
                  class="form-control"
                  required
                />
              </div>

              <div class="form-group">
                <label>默认值</label>
                <input
                  v-model="formData.default_value"
                  type="text"
                  class="form-control"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>排序</label>
                <input
                  v-model.number="formData.sort_order"
                  type="number"
                  class="form-control"
                  :min="0"
                />
              </div>

              <div class="form-group">
                <label>设置</label>
                <div class="checkbox-group">
                  <label>
                    <input v-model="formData.is_readonly" type="checkbox" />
                    只读
                  </label>
                  <label>
                    <input
                      v-model="formData.is_required_approval"
                      type="checkbox"
                    />
                    需审批
                  </label>
                </div>
              </div>
            </div>

            <div v-if="formData.data_type === 'ENUM'" class="form-group">
              <label>枚举选项（每行一个）</label>
              <textarea
                v-model="enumOptionsText"
                class="form-control"
                rows="4"
                placeholder="option1&#10;option2&#10;option3"
              ></textarea>
            </div>

            <div class="form-group">
              <label>变更原因</label>
              <input
                v-model="formData.reason"
                type="text"
                class="form-control"
                :placeholder="
                  showCreateModal ? '说明创建原因...' : '说明变更原因...'
                "
              />
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="handleSubmit">保存</button>
        </div>
      </div>
    </div>

    <!-- 历史版本弹窗(标签页增强版) -->
    <div
      v-if="showHistoryModal"
      class="modal-overlay"
      @click.self="closeHistoryModal"
    >
      <div class="modal modal-xlarge">
        <div class="modal-header">
          <h2>📜 变更历史 - {{ historyConfig?.name }}</h2>
          <button class="close-btn" @click="closeHistoryModal">✕</button>
        </div>
        <div class="modal-body">
          <!-- 标签页导航 -->
          <div class="history-tabs">
            <button
              class="tab-btn"
              :class="{ active: historyActiveTab === 'history' }"
              @click="switchHistoryTab('history')"
            >
              📋 变更历史
            </button>
            <button
              class="tab-btn"
              :class="{ active: historyActiveTab === 'compare' }"
              @click="switchHistoryTab('compare')"
            >
              🔄 版本对比
            </button>
            <button
              class="tab-btn"
              :class="{ active: historyActiveTab === 'stats' }"
              @click="switchHistoryTab('stats')"
            >
              📊 变更统计
            </button>
          </div>

          <!-- 加载状态 -->
          <div v-if="configStore.loading" class="loading">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>

          <!-- 变更历史标签 -->
          <div v-else-if="historyActiveTab === 'history'" class="tab-content">
            <div v-if="historyRecords.length === 0" class="empty">
              <p>📭 暂无历史版本</p>
            </div>
            <div v-else class="history-list">
              <div
                v-for="(record, index) in historyRecords"
                :key="record.id"
                class="history-item"
              >
                <div class="history-header">
                  <span class="version-badge">v{{ record.version }}</span>
                  <span
                    class="change-type"
                    :class="record.change_type.toLowerCase()"
                  >
                    {{ getChangeTypeLabel(record.change_type) }}
                  </span>
                  <span class="change-time">{{
                    formatTime(record.created_at)
                  }}</span>
                </div>

                <div class="history-content">
                  <div class="history-detail-row">
                    <span class="detail-label">操作人：</span>
                    <span>{{ record.operator_name || '系统' }}</span>
                    <span v-if="record.ip_address" class="detail-extra">
                      (IP: {{ record.ip_address }})
                    </span>
                  </div>
                  <div v-if="record.change_reason" class="history-detail-row">
                    <span class="detail-label">原因：</span>
                    <span>{{ record.change_reason }}</span>
                  </div>

                  <!-- 变更字段列表 -->
                  <div
                    v-if="
                      record.changed_fields && record.changed_fields.length > 0
                    "
                    class="changed-fields"
                  >
                    <span class="detail-label">变更字段：</span>
                    <span
                      v-for="field in record.changed_fields"
                      :key="field"
                      class="field-tag"
                      >{{ field }}</span
                    >
                  </div>

                  <!-- 值变化展示 -->
                  <div
                    v-if="
                      record.change_type === 'UPDATE' ||
                      record.change_type === 'RESTORE'
                    "
                    class="value-diff"
                  >
                    <div class="diff-item">
                      <span class="diff-label">变更前：</span>
                      <span class="diff-value old-value">
                        {{ formatDiffValue(record.old_value) }}
                      </span>
                    </div>
                    <div class="diff-item">
                      <span class="diff-label">变更后：</span>
                      <span class="diff-value new-value">
                        {{ formatDiffValue(record.new_value) }}
                      </span>
                    </div>
                  </div>

                  <div class="history-actions">
                    <button
                      v-if="index > 0"
                      class="btn btn-sm btn-warning"
                      @click="handleRollbackPreview(record)"
                    >
                      🔍 回滚预览
                    </button>
                    <button
                      class="btn btn-sm btn-default"
                      @click="handleExportHistory(historyConfig.key, 'json')"
                    >
                      📥 导出JSON
                    </button>
                    <button
                      class="btn btn-sm btn-default"
                      @click="handleExportHistory(historyConfig.key, 'csv')"
                    >
                      📥 导出CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分页 -->
            <div v-if="historyTotalPages > 1" class="pagination">
              <button
                :disabled="historyPage <= 1"
                class="btn btn-sm btn-default"
                @click="changeHistoryPage(historyPage - 1)"
              >
                上一页
              </button>
              <span class="page-info"
                >第 {{ historyPage }} / {{ historyTotalPages }} 页 (共{{
                  historyTotal
                }}条)</span
              >
              <button
                :disabled="historyPage >= historyTotalPages"
                class="btn btn-sm btn-default"
                @click="changeHistoryPage(historyPage + 1)"
              >
                下一页
              </button>
            </div>
          </div>

          <!-- 版本对比标签 -->
          <div v-else-if="historyActiveTab === 'compare'" class="tab-content">
            <div class="compare-controls">
              <div class="form-row">
                <div class="form-group">
                  <label>版本 1</label>
                  <select v-model="compareVersion1" class="form-control">
                    <option value="">请选择版本</option>
                    <option
                      v-for="v in availableVersions"
                      :key="v.version"
                      :value="v.version"
                    >
                      v{{ v.version }} - {{ v.operator_name }} ({{
                        formatTime(v.created_at)
                      }})
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>版本 2</label>
                  <select v-model="compareVersion2" class="form-control">
                    <option value="">请选择版本</option>
                    <option
                      v-for="v in availableVersions"
                      :key="v.version"
                      :value="v.version"
                    >
                      v{{ v.version }} - {{ v.operator_name }} ({{
                        formatTime(v.created_at)
                      }})
                    </option>
                  </select>
                </div>
              </div>
              <button
                class="btn btn-primary"
                :disabled="!compareVersion1 || !compareVersion2"
                @click="handleCompare"
              >
                🔄 对比版本
              </button>
            </div>

            <!-- Diff 结果 -->
            <div v-if="configStore.versionDiff" class="diff-result">
              <div class="diff-summary">
                <p>
                  对比 v{{ configStore.versionDiff.version1.version }} → v{{
                    configStore.versionDiff.version2.version
                  }}
                </p>
                <p>
                  变更字段：<strong>{{
                    configStore.versionDiff.summary.changedFields
                  }}</strong>
                  / {{ configStore.versionDiff.summary.totalFields }} 个字段
                </p>
              </div>
              <div class="diff-changes">
                <div
                  v-for="change in configStore.versionDiff.changes"
                  :key="change.field"
                  class="diff-change-item"
                  :class="{ 'diff-changed': change.changed }"
                >
                  <div class="diff-field-name">[{{ change.field }}]</div>
                  <div v-if="change.changed" class="diff-field-values">
                    <div class="diff-old">
                      <span class="diff-marker">-</span>
                      {{ formatDiffValue(change.oldValue) }}
                    </div>
                    <div class="diff-new">
                      <span class="diff-marker">+</span>
                      {{ formatDiffValue(change.newValue) }}
                    </div>
                  </div>
                  <div v-else class="diff-field-unchanged">
                    <span class="diff-marker-unchanged">=</span>
                    {{ formatDiffValue(change.value) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 变更统计标签 -->
          <div v-else-if="historyActiveTab === 'stats'" class="tab-content">
            <div v-if="configStore.changeStats" class="stats-content">
              <div class="stat-big-number">
                <div class="stat-big-value">
                  {{ configStore.changeStats.totalChanges }}
                </div>
                <div class="stat-big-label">总变更次数</div>
              </div>

              <!-- 按类型分布 -->
              <div class="stats-section">
                <h4>按变更类型分布</h4>
                <div class="stats-bar-list">
                  <div
                    v-for="type in configStore.changeStats.byType"
                    :key="type.change_type"
                    class="stats-bar-item"
                  >
                    <span class="stats-bar-label">
                      {{ getChangeTypeLabel(type.change_type) }}
                    </span>
                    <div class="stats-bar-track">
                      <div
                        class="stats-bar-fill"
                        :style="{ width: getBarWidth(type.count) }"
                      ></div>
                    </div>
                    <span class="stats-bar-count">{{ type.count }}</span>
                  </div>
                </div>
              </div>

              <!-- 按操作人员统计 -->
              <div class="stats-section">
                <h4>按操作人员统计（Top 20）</h4>
                <div class="stats-operator-list">
                  <div
                    v-for="op in configStore.changeStats.byOperator"
                    :key="op.operator_id"
                    class="operator-item"
                  >
                    <span class="operator-name">{{
                      op.operator_name || '系统'
                    }}</span>
                    <span class="operator-count">{{ op.count }} 次</span>
                  </div>
                </div>
              </div>

              <!-- 最近变更 -->
              <div class="stats-section">
                <h4>最近变更</h4>
                <div class="recent-changes">
                  <div
                    v-for="rc in configStore.changeStats.recentChanges"
                    :key="rc.created_at"
                    class="recent-item"
                  >
                    <span class="recent-key">[{{ rc.config_key }}]</span>
                    <span>{{ getChangeTypeLabel(rc.change_type) }}</span>
                    <span class="recent-operator"
                      >by {{ rc.operator_name || '系统' }}</span
                    >
                    <span class="recent-time">{{
                      formatTime(rc.created_at)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty">
              <p>📭 暂无统计数据</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeHistoryModal">
            关闭
          </button>
        </div>
      </div>
    </div>

    <!-- 回滚预览/确认弹窗 -->
    <div
      v-if="showRollbackModal"
      class="modal-overlay"
      @click.self="closeRollbackModal"
    >
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>🔄 回滚预览与确认</h2>
          <button class="close-btn" @click="closeRollbackModal">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="configStore.loading" class="loading">
            <div class="loading-spinner"></div>
            <p>加载预览数据...</p>
          </div>
          <div v-else-if="configStore.rollbackPreview">
            <div class="rollback-info">
              <p>
                将从
                <strong
                  >当前版本 v{{
                    configStore.rollbackPreview.currentVersion
                  }}</strong
                >
                回滚到
                <strong
                  >v{{ configStore.rollbackPreview.targetVersion }}</strong
                >
              </p>
              <p>
                目标版本创建时间：{{
                  formatTime(configStore.rollbackPreview.targetCreatedAt)
                }}
              </p>
              <p>
                目标版本创建人：{{
                  configStore.rollbackPreview.targetOperatorName || '系统'
                }}
              </p>
              <p v-if="configStore.rollbackPreview.targetChangeReason">
                目标版本原因：{{
                  configStore.rollbackPreview.targetChangeReason
                }}
              </p>
            </div>

            <div
              v-if="configStore.rollbackPreview.changes.length > 0"
              class="rollback-changes"
            >
              <h4>
                将变更
                {{ configStore.rollbackPreview.summary.totalChangedFields }}
                个字段：
              </h4>
              <div
                v-for="change in configStore.rollbackPreview.changes"
                :key="change.field"
                class="rollback-change-item"
              >
                <div class="rollback-field-name">[{{ change.field }}]</div>
                <div class="rollback-field-values">
                  <div class="diff-old">
                    <span class="diff-marker">- 当前：</span>
                    {{ formatDiffValue(change.currentValue) }}
                  </div>
                  <div class="diff-new">
                    <span class="diff-marker">+ 回滚为：</span>
                    {{ formatDiffValue(change.rollbackValue) }}
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>回滚原因 <span style="color: red">*</span></label>
              <textarea
                v-model="rollbackReason"
                class="form-control"
                rows="3"
                placeholder="请填写回滚原因，这是必填项..."
              ></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeRollbackModal">
            取消
          </button>
          <button
            class="btn btn-danger"
            :disabled="!rollbackReason.trim() || configStore.loading"
            @click="confirmRollback"
          >
            ⚠️ 确认回滚
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div
      v-if="showDeleteModal"
      class="modal-overlay"
      @click.self="closeDeleteModal"
    >
      <div class="modal modal-small">
        <div class="modal-header">
          <h2>⚠️ 确认删除</h2>
          <button class="close-btn" @click="closeDeleteModal">✕</button>
        </div>
        <div class="modal-body">
          <p>
            确定要删除配置 <strong>{{ deleteConfig?.name }}</strong> 吗？
          </p>
          <p class="warning-text">此操作不可恢复！</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeDeleteModal">
            取消
          </button>
          <button class="btn btn-danger" @click="confirmDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useConfigStore } from '../../stores/config';
import { useToastStore } from '../../stores/toast';

const configStore = useConfigStore();
const toastStore = useToastStore();

// 筛选
const filters = ref({
  search: '',
  category: '',
});

// 弹窗状态
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showHistoryModal = ref(false);
const showDeleteModal = ref(false);
const showRollbackModal = ref(false);

// 历史弹窗标签页
const historyActiveTab = ref('history');
const historyPage = ref(1);
const historyLimit = ref(20);

// 版本对比
const compareVersion1 = ref('');
const compareVersion2 = ref('');

// 回滚原因
const rollbackReason = ref('');
const rollbackTargetVersion = ref(null);

// 表单数据
const formData = ref({
  key: '',
  name: '',
  description: '',
  category: '',
  data_type: 'STRING',
  value: '',
  default_value: '',
  is_readonly: false,
  is_required_approval: false,
  sort_order: 0,
  reason: '',
});

// 枚举选项文本
const enumOptionsText = ref('');

// 当前操作的配置
const editingConfig = ref(null);
const historyConfig = ref(null);
const deleteConfig = ref(null);

// 计算属性
const activeConfigsCount = computed(
  () => configStore.configs.filter((c) => c.is_active).length
);

const readonlyConfigsCount = computed(
  () => configStore.configs.filter((c) => c.is_readonly).length
);

const groupedConfigs = computed(() => {
  const map = {};
  configStore.configs.forEach((config) => {
    if (!map[config.category]) {
      map[config.category] = [];
    }
    map[config.category].push(config);
  });
  return map;
});

// 变更历史相关计算属性
const historyRecords = computed(() => configStore.configHistory.records || []);
const historyTotal = computed(() => configStore.configHistory.total || 0);
const historyTotalPages = computed(
  () => configStore.configHistory.totalPages || 0
);

// 可用版本列表(用于版本对比选择)
const availableVersions = computed(() => historyRecords.value);

// 辅助方法
const getChangeTypeLabel = (type) => {
  const labels = {
    CREATE: '创建',
    UPDATE: '更新',
    DELETE: '删除',
    RESTORE: '回滚',
  };
  return labels[type] || type;
};

const formatDiffValue = (val) => {
  if (val === null || val === undefined) return '(空)';
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  return String(val);
};

const getBarWidth = (count) => {
  const arr = configStore.changeStats?.byType || [];
  if (arr.length === 0) return '0%';
  const max = Math.max(...arr.map((t) => t.count));
  return max > 0 ? (count / max) * 100 + '%' : '0%';
};

const fetchData = async () => {
  await Promise.all([
    configStore.fetchCategories(),
    configStore.fetchConfigs(filters.value),
  ]);
};

const handleSearch = async () => {
  await configStore.fetchConfigs(filters.value);
};

const handleCategoryChange = async () => {
  await configStore.fetchConfigs(filters.value);
};

const handleReset = async () => {
  filters.value = { search: '', category: '' };
  await configStore.fetchConfigs();
};

// 显示值处理
const displayValue = (config) => {
  if (config.data_type === 'BOOLEAN') {
    return config.value === 'true' ? '是' : '否';
  }
  return config.value || '(空)';
};

const displayDefaultValue = (config) => {
  if (config.data_type === 'BOOLEAN') {
    return config.default_value === 'true' ? '是' : '否';
  }
  return config.default_value || '(空)';
};

// 分类相关
const getCategoryName = (category) => {
  const names = {
    PLAYER: '玩家系统',
    FARM: '农场系统',
    ECONOMY: '经济系统',
    EVENT: '活动系统',
    SYSTEM: '系统设置',
  };
  return names[category] || category;
};

const getCategoryIcon = (category) => {
  const icons = {
    PLAYER: '👤',
    FARM: '🌾',
    ECONOMY: '💰',
    EVENT: '🎉',
    SYSTEM: '⚙️',
  };
  return icons[category] || '📦';
};

// 弹窗操作
const closeModal = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  resetForm();
};

const resetForm = () => {
  formData.value = {
    key: '',
    name: '',
    description: '',
    category: '',
    data_type: 'STRING',
    value: '',
    default_value: '',
    is_readonly: false,
    is_required_approval: false,
    sort_order: 0,
    reason: '',
  };
  enumOptionsText.value = '';
  editingConfig.value = null;
};

const handleEdit = (config) => {
  editingConfig.value = config;
  formData.value = {
    key: config.key,
    name: config.name,
    description: config.description || '',
    category: config.category,
    data_type: config.data_type,
    value: config.value,
    default_value: config.default_value || '',
    is_readonly: config.is_readonly,
    is_required_approval: config.is_required_approval,
    sort_order: config.sort_order || 0,
    reason: '',
  };

  if (config.enum_options) {
    try {
      const options =
        typeof config.enum_options === 'string'
          ? JSON.parse(config.enum_options)
          : config.enum_options;
      enumOptionsText.value = Array.isArray(options) ? options.join('\n') : '';
    } catch {
      enumOptionsText.value = '';
    }
  } else {
    enumOptionsText.value = '';
  }

  showEditModal.value = true;
};

const handleHistory = async (config) => {
  historyConfig.value = config;
  historyPage.value = 1;
  historyActiveTab.value = 'history';
  compareVersion1.value = '';
  compareVersion2.value = '';
  configStore.versionDiff = null;
  configStore.changeStats = null;
  await configStore.fetchConfigHistory(config.key, 1, historyLimit.value);
  showHistoryModal.value = true;
};

const closeHistoryModal = () => {
  showHistoryModal.value = false;
  historyConfig.value = null;
  configStore.configHistory = {
    records: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  };
  configStore.versionDiff = null;
  configStore.changeStats = null;
  historyActiveTab.value = 'history';
  compareVersion1.value = '';
  compareVersion2.value = '';
};

// 标签页切换
const switchHistoryTab = async (tab) => {
  historyActiveTab.value = tab;
  if (tab === 'stats' && !configStore.changeStats) {
    await configStore.fetchChangeStats(historyConfig.value?.key || '');
  }
};

// 分页
const changeHistoryPage = async (page) => {
  historyPage.value = page;
  await configStore.fetchConfigHistory(
    historyConfig.value.key,
    page,
    historyLimit.value
  );
};

// 版本对比
const handleCompare = async () => {
  if (!compareVersion1.value || !compareVersion2.value) return;
  await configStore.compareVersions(
    historyConfig.value.key,
    compareVersion1.value,
    compareVersion2.value
  );
};

// 回滚预览
const handleRollbackPreview = async (record) => {
  rollbackTargetVersion.value = record.version;
  rollbackReason.value = '';
  try {
    await configStore.fetchRollbackPreview(
      historyConfig.value.key,
      record.version
    );
    showRollbackModal.value = true;
  } catch (error) {
    toastStore.error('获取回滚预览失败');
  }
};

const closeRollbackModal = () => {
  showRollbackModal.value = false;
  configStore.rollbackPreview = null;
  rollbackReason.value = '';
  rollbackTargetVersion.value = null;
};

const confirmRollback = async () => {
  if (!rollbackReason.value.trim()) {
    toastStore.error('请填写回滚原因');
    return;
  }
  try {
    await configStore.rollbackConfig(
      historyConfig.value.key,
      rollbackTargetVersion.value,
      rollbackReason.value
    );
    toastStore.success('配置回滚成功');
    closeRollbackModal();
    // 刷新历史列表
    await configStore.fetchConfigHistory(
      historyConfig.value.key,
      historyPage.value,
      historyLimit.value
    );
  } catch (error) {
    toastStore.error('回滚失败: ' + (error.message || error));
  }
};

// 导出历史
const handleExportHistory = async (key, format) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/admin/configs/${key}/history/export?format=${format}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
      }
    );
    if (format === 'csv') {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `config_history_${key}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    } else {
      const data = await response.json();
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `config_history_${key}_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
    }
  } catch (error) {
    toastStore.error('导出失败');
  }
};

const handleDelete = (config) => {
  deleteConfig.value = config;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  deleteConfig.value = null;
};

const confirmDelete = async () => {
  try {
    await configStore.deleteConfig(deleteConfig.value.key);
    toastStore.success('配置删除成功');
    closeDeleteModal();
  } catch (error) {
    toastStore.error('删除失败: ' + (error.message || error));
  }
};

const handleSubmit = async () => {
  try {
    // 处理枚举选项
    if (formData.value.data_type === 'ENUM' && enumOptionsText.value) {
      const options = enumOptionsText.value
        .split('\n')
        .map((o) => o.trim())
        .filter((o) => o);
      formData.value.enum_options = options;
    }

    if (showCreateModal.value) {
      await configStore.createConfig(formData.value);
      toastStore.success('配置创建成功');
    } else {
      await configStore.updateConfig(formData.value.key, formData.value);
      toastStore.success('配置更新成功');
    }
    closeModal();
  } catch (error) {
    toastStore.error('保存失败: ' + (error.message || error));
  }
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return date.toLocaleString('zh-CN');
};

// 生命周期
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.configs-page {
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

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filter-group {
  display: flex;
  gap: 12px;
}

.filter-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-width: 200px;
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

.configs-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
  min-height: 400px;
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

.config-group {
  margin-bottom: 32px;
}

.group-title {
  font-size: 18px;
  color: #333;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #1890ff;
}

.config-item {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.3s;
}

.config-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #1890ff;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.config-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.config-key {
  font-family: monospace;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  color: #666;
  font-size: 14px;
}

.config-name {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.config-actions {
  display: flex;
  gap: 8px;
}

.config-content {
  color: #666;
}

.config-description {
  margin-bottom: 8px;
}

.config-value {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.value-label {
  font-weight: 500;
}

.value-content {
  background: #e6f7ff;
  padding: 4px 12px;
  border-radius: 4px;
  color: #1890ff;
  font-family: monospace;
}

.default-indicator {
  color: #999;
  font-size: 14px;
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.badge-info {
  background: #e6f7ff;
  color: #1890ff;
}

.badge-warning {
  background: #fff7e6;
  color: #fa8c16;
}

.badge-danger {
  background: #fff1f0;
  color: #f5222d;
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 800px;
}

.modal-small {
  max-width: 400px;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

.checkbox-group {
  display: flex;
  gap: 20px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal;
  margin: 0;
}

/* 历史记录样式 */
.history-list {
  max-height: 60vh;
  overflow-y: auto;
}

.history-item {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.version-badge {
  background: #1890ff;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 600;
  font-family: monospace;
}

.change-type {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.change-type.create {
  background: #f6ffed;
  color: #52c41a;
}

.change-type.update {
  background: #e6f7ff;
  color: #1890ff;
}

.change-type.delete {
  background: #fff1f0;
  color: #f5222d;
}

.change-type.rollback {
  background: #fff7e6;
  color: #fa8c16;
}

.change-time {
  color: #999;
  font-size: 14px;
  margin-left: auto;
}

.value-diff {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 12px;
}

.diff-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.diff-label {
  color: #666;
  font-size: 14px;
}

.diff-value {
  padding: 4px 12px;
  border-radius: 4px;
  font-family: monospace;
}

.old-value {
  background: #fff1f0;
  color: #f5222d;
  text-decoration: line-through;
}

.new-value {
  background: #f6ffed;
  color: #52c41a;
}

.history-reason {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f9f9f9;
  border-radius: 6px;
}

.reason-label {
  font-weight: 500;
  color: #666;
}

.reason-text {
  color: #333;
}

.history-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.operator {
  color: #666;
  font-size: 14px;
}

.warning-text {
  color: #f5222d;
  font-weight: 500;
  margin: 0;
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

.btn-default {
  background: #f0f0f0;
  color: #333;
}

.btn-default:hover {
  background: #d9d9d9;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 13px;
}

.btn-warning {
  background: #fa8c16;
  color: white;
}

.btn-warning:hover {
  background: #ffa940;
}

/* 增强版历史弹窗样式 */
.modal-xlarge {
  max-width: 1000px;
}

/* 标签页 */
.history-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e8e8e8;
}

.tab-btn {
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 15px;
  color: #666;
  transition: all 0.3s;
}

.tab-btn:hover {
  color: #1890ff;
}

.tab-btn.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  font-weight: 600;
}

.tab-content {
  min-height: 300px;
}

/* 变更字段标签 */
.changed-fields {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.field-tag {
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-family: monospace;
}

.detail-label {
  font-weight: 500;
  color: #666;
}

.detail-extra {
  color: #999;
  font-size: 13px;
  margin-left: 8px;
}

.history-detail-row {
  margin-bottom: 8px;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.page-info {
  color: #666;
  font-size: 14px;
}

/* 版本对比 */
.compare-controls {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

/* Diff 结果 */
.diff-result {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.diff-summary {
  padding: 12px 16px;
  background: #f0f5ff;
  border-bottom: 1px solid #d6e4ff;
  font-size: 14px;
  color: #1d39c4;
}

.diff-summary p {
  margin: 4px 0;
}

.diff-changes {
  padding: 8px 0;
}

.diff-change-item {
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.diff-change-item.diff-changed {
  background: #fffbe6;
}

.diff-field-name {
  font-weight: 600;
  font-family: monospace;
  color: #333;
  margin-bottom: 6px;
}

.diff-field-values {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.diff-field-unchanged {
  color: #999;
}

.diff-old {
  color: #f5222d;
  background: #fff1f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  word-break: break-all;
}

.diff-new {
  color: #52c41a;
  background: #f6ffed;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  word-break: break-all;
}

.diff-marker {
  font-weight: bold;
  margin-right: 4px;
}

.diff-marker-unchanged {
  font-weight: bold;
  margin-right: 4px;
  color: #999;
}

/* 变更统计 */
.stats-content {
  padding: 8px 0;
}

.stat-big-number {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 24px;
}

.stat-big-value {
  font-size: 48px;
  font-weight: bold;
}

.stat-big-label {
  font-size: 16px;
  opacity: 0.9;
  margin-top: 8px;
}

.stats-section {
  margin-bottom: 20px;
}

.stats-section h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.stats-bar-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stats-bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stats-bar-label {
  width: 80px;
  font-size: 14px;
  color: #666;
  text-align: right;
  flex-shrink: 0;
}

.stats-bar-track {
  flex: 1;
  height: 24px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.stats-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #40a9ff);
  border-radius: 4px;
  transition: width 0.6s ease;
}

.stats-bar-count {
  width: 50px;
  font-size: 14px;
  color: #333;
  font-weight: 600;
  text-align: left;
}

.stats-operator-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.operator-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f8f9fa;
  border-radius: 20px;
}

.operator-name {
  font-weight: 500;
  color: #333;
}

.operator-count {
  color: #1890ff;
  font-weight: 600;
}

.recent-changes {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 14px;
}

.recent-key {
  color: #666;
  font-family: monospace;
}

.recent-operator {
  color: #999;
}

.recent-time {
  color: #999;
  margin-left: auto;
  font-size: 13px;
}

/* 回滚预览弹窗 */
.rollback-info {
  padding: 16px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
  margin-bottom: 16px;
}

.rollback-info p {
  margin: 6px 0;
  color: #ad6800;
}

.rollback-changes {
  margin: 16px 0;
}

.rollback-changes h4 {
  margin: 0 0 12px 0;
  color: #d4380d;
}

.rollback-change-item {
  padding: 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  margin-bottom: 8px;
}

.rollback-field-name {
  font-weight: 600;
  font-family: monospace;
  color: #d4380d;
  margin-bottom: 6px;
}

.rollback-field-values {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
