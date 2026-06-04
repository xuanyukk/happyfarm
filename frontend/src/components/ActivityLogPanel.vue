/** * 文件名：ActivityLogPanel.vue * 作者：开发者 * 日期：2026-03-26 *
版本：v2.2.0 * 功能描述：活动日志面板组件 -
高性能、用户友好的玩家操作日志展示系统 * 更新记录： * 2026-03-26 - v2.0.0 -
全面优化，添加智能滚动、性能优化、视觉设计和响应式布局 * 2026-03-27 - v2.1.0 -
根据提示词优化活动日志系统，增强视觉效果和用户体验 * 2026-05-02 - v2.2.0 -
添加虚拟滚动支持，支持两种渲染模式（传统/虚拟） */

<template>
  <div class="activity-log-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <span class="panel-icon">📋</span>
      <span class="panel-title">最近活动</span>
      <div class="header-actions">
        <!-- 自动滚动控制 -->
        <button
          class="auto-scroll-btn"
          :class="{ active: autoScroll }"
          title="自动滚动"
          @click="toggleAutoScroll"
        >
          <span v-if="autoScroll">🔒</span>
          <span v-else>🔓</span>
        </button>

        <!-- 搜索框 -->
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索记录..."
            class="search-input"
            @input="handleSearch"
          />
          <span class="search-icon">🔍</span>
        </div>

        <!-- 刷新按钮 -->
        <button
          class="refresh-btn"
          :disabled="loading"
          @click="refreshActivities"
        >
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else>🔄</span>
        </button>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-section">
      <div class="filter-tabs">
        <button
          v-for="filter in timeFilters"
          :key="filter.value"
          class="filter-tab"
          :class="{ active: selectedTimeFilter === filter.value }"
          @click="selectedTimeFilter = filter.value"
        >
          {{ filter.label }}
        </button>
        <button
          class="filter-tab"
          :class="{ active: showCategoryFilter }"
          @click="showCategoryFilter = !showCategoryFilter"
        >
          类型筛选
        </button>
      </div>

      <!-- 分类筛选面板 -->
      <div v-if="showCategoryFilter" class="category-filter-panel">
        <label
          v-for="category in activityCategories"
          :key="category.value"
          class="category-checkbox"
        >
          <input
            v-model="selectedCategories"
            type="checkbox"
            :value="category.value"
            @change="filterActivities"
          />
          <span class="category-icon">{{ category.icon }}</span>
          <span class="category-name">{{ category.label }}</span>
        </label>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && activities.length === 0" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredActivities.length === 0" class="empty-state">
      <span class="empty-icon">📝</span>
      <p v-if="hasActiveFilters">没有符合条件的活动记录</p>
      <p v-else>暂无活动记录</p>
    </div>

    <!-- 有数据的情况 -->
    <template v-else>
      <!-- 渲染模式选择器 -->
      <div class="render-mode-selector">
        <span class="mode-label">渲染模式：</span>
        <div class="mode-buttons">
          <button
            v-for="mode in renderModes"
            :key="mode.value"
            class="mode-button"
            :class="{ active: renderMode === mode.value }"
            @click="switchRenderMode(mode.value)"
          >
            {{ mode.icon }} {{ mode.label }}
          </button>
        </div>
      </div>

      <!-- 日志列表 - 传统模式 -->
      <div
        v-if="renderMode === 'traditional'"
        ref="logListRef"
        class="log-list"
      >
        <!-- 日志记录 -->
        <div
          v-for="activity in filteredActivities"
          :key="activity.id"
          class="log-item"
          :class="[
            'type-' + activity.activity_type,
            'category-' + activity.activity_category,
          ]"
          @mouseenter="showItemMenu(activity.id)"
          @mouseleave="hideItemMenu(activity.id)"
        >
          <!-- 操作图标 -->
          <div class="log-icon" :class="'icon-' + activity.activity_category">
            {{ getActivityIcon(activity.activity_type) }}
          </div>

          <!-- 日志内容 -->
          <div class="log-content">
            <p class="log-message" v-html="formatMessage(activity)"></p>
            <span class="log-time">{{ formatTime(activity.create_time) }}</span>
          </div>

          <!-- 操作菜单 -->
          <div v-if="hoveredItemId === activity.id" class="item-menu">
            <button title="复制记录" @click.stop="copyRecord(activity)">
              📋
            </button>
            <button title="复制全部" @click.stop="copyAllRecords">📄</button>
            <button title="导出" @click.stop="exportRecords">💾</button>
          </div>
        </div>
      </div>

      <!-- 日志列表 - 虚拟滚动模式 -->
      <div v-else ref="logListRef" class="log-list virtual-scroll-list">
        <!-- 虚拟滚动容器 -->
        <div
          ref="virtualScrollRef"
          class="virtual-scroll-wrapper"
          @scroll="handleVirtualScroll"
        >
          <!-- 上方占位 -->
          <div
            class="scroll-placeholder-top"
            :style="{ height: virtualScrollData.offset + 'px' }"
          ></div>

          <!-- 可见日志 -->
          <div
            v-for="(activity, _index) in visibleActivities"
            :key="activity.id"
            class="log-item"
            :class="[
              'type-' + activity.activity_type,
              'category-' + activity.activity_category,
            ]"
            @mouseenter="showItemMenu(activity.id)"
            @mouseleave="hideItemMenu(activity.id)"
          >
            <!-- 操作图标 -->
            <div class="log-icon" :class="'icon-' + activity.activity_category">
              {{ getActivityIcon(activity.activity_type) }}
            </div>

            <!-- 日志内容 -->
            <div class="log-content">
              <p class="log-message" v-html="formatMessage(activity)"></p>
              <span class="log-time">{{
                formatTime(activity.create_time)
              }}</span>
            </div>

            <!-- 操作菜单 -->
            <div v-if="hoveredItemId === activity.id" class="item-menu">
              <button title="复制记录" @click.stop="copyRecord(activity)">
                📋
              </button>
              <button title="复制全部" @click.stop="copyAllRecords">📄</button>
              <button title="导出" @click.stop="exportRecords">💾</button>
            </div>
          </div>

          <!-- 下方占位 -->
          <div
            class="scroll-placeholder-bottom"
            :style="{ height: virtualScrollData.placeholderBottom + 'px' }"
          ></div>
        </div>
      </div>

      <!-- 新消息提示 -->
      <div
        v-if="hasNewMessages && !autoScroll"
        class="new-message-notification"
        @click="scrollToBottom"
      >
        <span>📢</span>
        <span>{{ newMessageCount }} 条新消息</span>
        <span>查看</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  onMounted,
  onUnmounted,
  nextTick,
  computed,
  watch,
} from 'vue';
import { gameService } from '../services/gameService';
import wsService from '../services/websocketService';

// 组件配置
const props = defineProps({
  refreshInterval: {
    type: Number,
    default: 30000,
  },
  limit: {
    type: Number,
    default: 20,
  },
  maxRecords: {
    type: Number,
    default: 100,
  },
  // 外部触发刷新的标志
  triggerRefresh: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['refresh']);

// 响应式数据
const activities = ref([]);
const loading = ref(false);
const autoScroll = ref(true);
const showCategoryFilter = ref(false);
const searchQuery = ref('');
const selectedTimeFilter = ref('today');
const selectedCategories = ref([]);
const hoveredItemId = ref(null);
const hasNewMessages = ref(false);
const newMessageCount = ref(0);
const lastActivityId = ref(0);
const userActive = ref(true);
const lastRefreshTime = ref(0);
const minRefreshInterval = 10000; // 最小刷新间隔10秒

// 虚拟滚动相关
const renderMode = ref('virtual'); // 'traditional' or 'virtual'
const virtualScrollRef = ref(null);
const virtualScrollData = reactive({
  start: 0,
  end: 0,
  offset: 0,
  placeholderBottom: 0,
  itemHeight: 120, // 预估每项高度
  bufferSize: 5, // 上下缓冲区
  visibleCount: 0,
});

// DOM 引用
const logListRef = ref(null);

// 定时器和状态
let refreshTimer = null;
let searchTimer = null;
let lastScrollPosition = 0;
let handleUserActivity = null;

// 配置数据
const activityCategories = [
  { value: 'crop', label: '作物', icon: '🌱' },
  { value: 'shop', label: '商店', icon: '🛒' },
  { value: 'land', label: '土地', icon: '🏞️' },
  { value: 'item', label: '道具', icon: '✨' },
  { value: 'currency', label: '货币', icon: '💰' },
  { value: 'task', label: '任务', icon: '📋' },
  { value: 'skill', label: '技能', icon: '⚡' },
  { value: 'player', label: '玩家', icon: '🎮' },
  { value: 'world', label: '世界', icon: '🌍' },
];

const timeFilters = [
  { value: 'today', label: '今日' },
  { value: 'yesterday', label: '昨日' },
  { value: 'week', label: '近7天' },
  { value: 'all', label: '全部' },
];

// 渲染模式配置
const renderModes = [
  { value: 'traditional', label: '传统', icon: '📦' },
  { value: 'virtual', label: '虚拟', icon: '⚡' },
];

// 虚拟滚动可见项目
const visibleActivities = computed(() => {
  if (renderMode.value === 'traditional') {
    return filteredActivities.value;
  }
  return filteredActivities.value.slice(
    virtualScrollData.start,
    virtualScrollData.end + 1
  );
});

// 图标映射
const getActivityIcon = (activityType) => {
  const iconMap = {
    plant: '🌱',
    harvest: '🌾',
    buy: '🛒',
    unlock: '🔓',
    upgrade: '⬆️',
    use_item: '✨',
    gain: '📈',
    lose: '📉',
    complete_task: '✅',
    learn_skill: '📚',
    sell: '💰',
    level_up: '🎖️',
    world_unlock: '🌍',
    quality_upgrade: '⭐',
    item_gain: '🎁',
    item_use: '⚡',
  };
  return iconMap[activityType] || '📋';
};

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}分钟前`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  } else {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
};

// 格式化消息
const formatMessage = (activity) => {
  let message = activity.message;

  // 高亮搜索关键词
  if (searchQuery.value) {
    const regex = new RegExp(`(${searchQuery.value})`, 'gi');
    message = message.replace(regex, '<span class="highlight">$1</span>');
  }

  return message;
};

// 过滤后的活动
const filteredActivities = computed(() => {
  let filtered = [...activities.value];

  // 时间过滤
  if (selectedTimeFilter.value !== 'all') {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    filtered = filtered.filter((activity) => {
      const activityDate = new Date(activity.create_time);

      switch (selectedTimeFilter.value) {
        case 'today':
          return activityDate >= todayStart;
        case 'yesterday': {
          const yesterdayStart = new Date(todayStart);
          yesterdayStart.setDate(yesterdayStart.getDate() - 1);
          return activityDate >= yesterdayStart && activityDate < todayStart;
        }
        case 'week': {
          const weekAgo = new Date(todayStart);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return activityDate >= weekAgo;
        }
        default:
          return true;
      }
    });
  }

  // 分类过滤
  if (selectedCategories.value.length > 0) {
    filtered = filtered.filter((activity) =>
      selectedCategories.value.includes(activity.activity_category)
    );
  }

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((activity) =>
      activity.message.toLowerCase().includes(query)
    );
  }

  return filtered;
});

// 是否有活动过滤
const hasActiveFilters = computed(() => {
  return (
    selectedTimeFilter.value !== 'all' ||
    selectedCategories.value.length > 0 ||
    searchQuery.value.length > 0
  );
});

// 智能滚动控制
const setupScrollObserver = () => {
  // 移除滚动观察器，不再自动加载更多
};

// 虚拟滚动处理
const initVirtualScroll = () => {
  if (!virtualScrollRef.value) return;

  const scrollRef =
    renderMode.value === 'virtual' ? virtualScrollRef.value : logListRef.value;
  if (!scrollRef) return;

  const itemHeight = virtualScrollData.itemHeight;
  const clientHeight = scrollRef.clientHeight || 400;

  virtualScrollData.visibleCount = Math.ceil(clientHeight / itemHeight);

  updateVirtualScrollVisibleRange();
};

// 更新虚拟滚动可见范围
const updateVirtualScrollVisibleRange = () => {
  if (renderMode.value !== 'virtual') return;

  const scrollRef = virtualScrollRef.value;
  if (!scrollRef) return;

  const scrollTop = scrollRef.scrollTop;
  const itemHeight = virtualScrollData.itemHeight;
  const bufferSize = virtualScrollData.bufferSize;
  const totalCount = virtualScrollData.visibleCount;
  const totalItems = filteredActivities.value.length;

  let start = Math.floor(scrollTop / itemHeight) - bufferSize;
  start = Math.max(0, start);

  let end = start + virtualScrollData.visibleCount + bufferSize;
  end = Math.min(totalItems - 1, end);

  virtualScrollData.start = start;
  virtualScrollData.end = end;
  virtualScrollData.offset = start * itemHeight;
  virtualScrollData.placeholderBottom = Math.max(
    0,
    (totalItems - end - 1) * itemHeight
  );
};

// 虚拟滚动事件处理
const handleVirtualScroll = () => {
  updateVirtualScrollVisibleRange();
};

// 切换渲染模式
const switchRenderMode = (mode) => {
  renderMode.value = mode;

  nextTick(() => {
    if (mode === 'virtual') {
      initVirtualScroll();
    }
  });
};

// 平滑滚动到底部
const scrollToBottom = async () => {
  // 点击新消息提示时，重置新消息状态
  hasNewMessages.value = false;
  newMessageCount.value = 0;
  autoScroll.value = true;

  await nextTick();

  // 根据渲染模式选择滚动容器
  let scrollContainer;
  if (renderMode.value === 'virtual') {
    scrollContainer = virtualScrollRef.value;
  } else {
    scrollContainer = logListRef.value;
  }

  if (!scrollContainer) return;

  const startScrollTop = scrollContainer.scrollTop;
  const targetScrollTop =
    scrollContainer.scrollHeight - scrollContainer.clientHeight;
  const distance = targetScrollTop - startScrollTop;

  // 如果距离很小，直接滚动到底部，避免不必要的动画
  if (Math.abs(distance) < 10) {
    scrollContainer.scrollTop = targetScrollTop;
    return;
  }

  const duration = 300;
  const startTime = performance.now();

  const scroll = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    scrollContainer.scrollTop = startScrollTop + distance * easeProgress;

    if (progress < 1) {
      requestAnimationFrame(scroll);
    }
  };

  requestAnimationFrame(scroll);
};

// 检测滚动状态
const checkScrollState = () => {
  // 根据渲染模式选择滚动容器
  let scrollContainer;
  if (renderMode.value === 'virtual') {
    scrollContainer = virtualScrollRef.value;
  } else {
    scrollContainer = logListRef.value;
  }

  if (!scrollContainer) return;

  const scrollBottom =
    scrollContainer.scrollHeight -
    scrollContainer.scrollTop -
    scrollContainer.clientHeight;

  // 如果用户手动滚动偏离底部超过200px，暂停自动滚动
  if (scrollBottom > 200 && autoScroll.value) {
    autoScroll.value = false;
  }

  lastScrollPosition = scrollContainer.scrollTop;
};

// 切换自动滚动
const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value;
  if (autoScroll.value) {
    scrollToBottom();
  }
};

// 显示/隐藏操作菜单
const showItemMenu = (id) => {
  hoveredItemId.value = id;
};

const hideItemMenu = () => {
  hoveredItemId.value = null;
};

// 复制记录
const copyRecord = (activity) => {
  const text = `${formatTime(activity.create_time)} - ${activity.message}`;
  navigator.clipboard.writeText(text).then(() => {
    // 可以添加复制成功提示
  });
};

// 复制全部记录
const copyAllRecords = () => {
  const text = filteredActivities.value
    .map(
      (activity) => `${formatTime(activity.create_time)} - ${activity.message}`
    )
    .join('\n');
  navigator.clipboard.writeText(text).then(() => {
    // 可以添加复制成功提示
  });
};

// 导出记录
const exportRecords = () => {
  const text = filteredActivities.value
    .map(
      (activity) => `${formatTime(activity.create_time)} - ${activity.message}`
    )
    .join('\n');

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `activity_log_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 搜索处理（节流）
const handleSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    // 搜索逻辑已在computed中处理
  }, 100);
};

// 移除加载更多活动函数，不再使用

// 刷新活动
const refreshActivities = async (force = false) => {
  // 检查是否满足刷新条件
  const now = Date.now();
  if (!force && now - lastRefreshTime.value < minRefreshInterval) {
    return;
  }

  // 检查用户是否活跃
  if (!force && !userActive.value) {
    return;
  }

  try {
    loading.value = true;

    // 构建请求参数
    const params = { limit: props.limit };
    if (lastActivityId.value > 0) {
      params.since_id = lastActivityId.value;
    }

    // 调用API获取活动
    const result = await gameService.getRecentActivities(
      props.limit,
      lastActivityId.value
    );

    if (result.success) {
      const newActivities = result.data;

      if (newActivities.length > 0) {
        // 更新最后活动ID
        lastActivityId.value = Math.max(
          ...newActivities.map((activity) => activity.id)
        );

        // 检测新消息
        if (activities.value.length > 0) {
          const newMessages = newActivities.filter(
            (activity) =>
              !activities.value.some((existing) => existing.id === activity.id)
          );
          if (newMessages.length > 0) {
            newMessageCount.value = newMessages.length;
            hasNewMessages.value = true;

            // 仅添加新活动到数组末尾，最新的在下方
            activities.value = [...activities.value, ...newActivities].slice(
              -props.maxRecords
            );
          }
        } else {
          // 首次加载，确保最新的活动在下方
          // 假设newActivities是按时间倒序排列的（最新的在前）
          // 反转数组，使最新的在下方
          activities.value = newActivities.reverse();
        }

        emit('refresh', activities.value);

        // 自动滚动到底部，确保最新信息在视野范围内
        if (autoScroll.value) {
          scrollToBottom();
        }
      }
    } else {
      console.error('获取活动日志失败:', result.message);
    }
  } catch (error) {
    console.error('获取活动日志失败:', error);
  } finally {
    loading.value = false;
    lastRefreshTime.value = Date.now();
  }
};

// 筛选活动
const filterActivities = () => {
  // 筛选逻辑已在computed中处理
};

// 监听外部触发刷新
watch(
  () => props.triggerRefresh,
  (newValue) => {
    if (newValue) {
      refreshActivities(true);
    }
  }
);

// 生命周期
onMounted(() => {
  refreshActivities();

  // 暴露refresh方法到window对象，供其他组件调用
  window.activityLogPanel = {
    refresh: refreshActivities,
  };

  // 设置滚动监听（同时支持两种渲染模式）
  if (logListRef.value) {
    logListRef.value.addEventListener('scroll', checkScrollState);
  }
  if (virtualScrollRef.value) {
    virtualScrollRef.value.addEventListener('scroll', checkScrollState);
  }

  // 初始化虚拟滚动
  nextTick(() => {
    initVirtualScroll();
  });

  // 设置定时器（使用智能刷新策略）
  if (props.refreshInterval > 0) {
    refreshTimer = setInterval(() => {
      // 动态调整刷新频率：用户活跃时使用正常间隔，不活跃时延长间隔
      const interval = userActive.value
        ? props.refreshInterval
        : props.refreshInterval * 3;
      clearInterval(refreshTimer);
      refreshActivities();
      refreshTimer = setInterval(() => {
        refreshActivities();
      }, interval);
    }, props.refreshInterval);
  }

  // 移除滚动观察器设置，不再自动加载更多

  // 监听用户活跃状态
  handleUserActivity = () => {
    userActive.value = true;
    // 30秒无活动后标记为不活跃
    clearTimeout(window.userInactiveTimer);
    window.userInactiveTimer = setTimeout(() => {
      userActive.value = false;
    }, 30000);
  };

  // 绑定事件监听器
  window.addEventListener('mousemove', handleUserActivity);
  window.addEventListener('keydown', handleUserActivity);
  window.addEventListener('scroll', handleUserActivity);

  // 初始标记为活跃
  handleUserActivity();

  // 监听WebSocket活动日志更新事件
  const onActivityLogUpdate = (activityLog) => {
    console.log('收到活动日志更新:', activityLog);
    if (activityLog && activityLog.id > lastActivityId.value) {
      activities.value = [...activities.value, activityLog].slice(
        -props.maxRecords
      );
      lastActivityId.value = activityLog.id;
      newMessageCount.value++;
      hasNewMessages.value = true;

      if (autoScroll.value) {
        scrollToBottom();
      }

      emit('refresh', activities.value);
    }
  };

  // 监听活动日志更新事件
  wsService.onActivityLogUpdated(onActivityLogUpdate);

  // 同时也监听其他游戏操作事件作为后备
  const refreshOnEvent = () => {
    refreshActivities(true);
  };

  wsService.onCropPlanted(refreshOnEvent);
  wsService.onCropHarvested(refreshOnEvent);
  wsService.onCropSold(refreshOnEvent);
  wsService.onHarvestAllCompleted(refreshOnEvent);
  wsService.onLandUnlocked(refreshOnEvent);
  wsService.onQualityUpgraded(refreshOnEvent);

  // 保存事件处理函数，以便在组件卸载时移除
  window.activityLogRefreshHandler = refreshOnEvent;
  window.activityLogUpdateHandler = onActivityLogUpdate;
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  if (searchTimer) {
    clearTimeout(searchTimer);
  }

  if (logListRef.value) {
    logListRef.value.removeEventListener('scroll', checkScrollState);
  }
  if (virtualScrollRef.value) {
    virtualScrollRef.value.removeEventListener('scroll', checkScrollState);
  }

  // 清理用户活跃状态监听器
  window.removeEventListener('mousemove', handleUserActivity);
  window.removeEventListener('keydown', handleUserActivity);
  window.removeEventListener('scroll', handleUserActivity);

  if (window.userInactiveTimer) {
    clearTimeout(window.userInactiveTimer);
  }

  // 移除WebSocket事件监听器
  if (window.activityLogRefreshHandler) {
    const refreshOnEvent = window.activityLogRefreshHandler;
    wsService.off('crop_planted', refreshOnEvent);
    wsService.off('crop_harvested', refreshOnEvent);
    wsService.off('crop_sold', refreshOnEvent);
    wsService.off('harvest_all_completed', refreshOnEvent);
    wsService.off('land_unlocked', refreshOnEvent);
    wsService.off('quality_upgraded', refreshOnEvent);
    delete window.activityLogRefreshHandler;
  }

  if (window.activityLogUpdateHandler) {
    wsService.off('activity_log_updated', window.activityLogUpdateHandler);
    delete window.activityLogUpdateHandler;
  }
});

defineExpose({
  refresh: refreshActivities,
  scrollToBottom,
});
</script>

<style scoped>
.activity-log-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius-lg);
  padding: 16px;
  animation: fadeIn 0.5s ease;
  position: relative;
}

/* 渲染模式选择器 */
.render-mode-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--border-radius-md);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.mode-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.mode-buttons {
  display: flex;
  gap: 6px;
}

.mode-button {
  padding: 6px 12px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.mode-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.mode-button.active {
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

/* 面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--glass-border);
  flex-wrap: wrap;
  gap: 10px;
}

.panel-icon {
  font-size: 20px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: white;
  flex: 1;
  margin-left: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.auto-scroll-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 16px;
}

.auto-scroll-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.auto-scroll-btn.active {
  background: rgba(76, 175, 80, 0.3);
  border-color: rgba(76, 175, 80, 0.5);
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding: 6px 32px 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius-md);
  color: white;
  font-size: 12px;
  width: 180px;
  transition: all var(--transition-fast);
}

.search-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  width: 220px;
}

.search-icon {
  position: absolute;
  right: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  pointer-events: none;
}

.refresh-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 16px;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: rotate(90deg);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 筛选器 */
.filter-section {
  margin-bottom: 16px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.filter-tab {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius-md);
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-tab:hover {
  background: rgba(255, 255, 255, 0.15);
}

.filter-tab.active {
  background: rgba(33, 150, 243, 0.3);
  border-color: rgba(33, 150, 243, 0.5);
  color: white;
}

.category-filter-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--border-radius-md);
  animation: slideDown 0.3s ease;
}

.category-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  cursor: pointer;
}

.category-checkbox input[type='checkbox'] {
  accent-color: var(--primary-500);
}

.category-icon {
  font-size: 14px;
}

/* 加载和空状态 */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.loading-state p,
.empty-state p {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

/* 日志列表 */
.log-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 450px;
  max-height: 500px;
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
  position: relative;
  animation: fadeIn 0.3s ease;
}

.log-item:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateX(4px);
}

.log-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 20px;
  flex-shrink: 0;
}

/* 分类颜色编码 */
.icon-crop {
  background: linear-gradient(135deg, #4caf50, #45a049);
}

.icon-shop {
  background: linear-gradient(135deg, #2196f3, #1976d2);
}

.icon-land {
  background: linear-gradient(135deg, #ff9800, #f57c00);
}

.icon-item {
  background: linear-gradient(135deg, #9c27b0, #7b1fa2);
}

.icon-currency {
  background: linear-gradient(135deg, #ffeb3b, #fbc02d);
}

.icon-task {
  background: linear-gradient(135deg, #00bcd4, #0097a7);
}

.icon-skill {
  background: linear-gradient(135deg, #ff5722, #e64a19);
}

/* 操作类型样式 */
.type-gain {
  border-left: 4px solid #4caf50;
}

.type-lose {
  border-left: 4px solid #f44336;
}

.type-complete_task {
  border-left: 4px solid #2196f3;
}

.type-learn_skill {
  border-left: 4px solid #9c27b0;
}

.log-content {
  flex: 1;
  min-width: 0;
}

.log-message {
  margin: 0 0 6px 0;
  font-size: 15px;
  color: white;
  line-height: 1.6;
  word-break: break-word;
  font-weight: 500;
}

.log-time {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.highlight {
  background: rgba(255, 255, 0, 0.3);
  padding: 1px 3px;
  border-radius: 2px;
}

/* 操作菜单 */
.item-menu {
  display: flex;
  gap: 4px;
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: var(--border-radius-md);
  padding: 4px;
  z-index: 10;
  animation: fadeIn 0.2s ease;
}

.item-menu button {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 12px;
  transition: background var(--transition-fast);
}

.item-menu button:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 加载更多 */
.load-more-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

/* 骨架屏 */
.skeleton-loader {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0;
}

.skeleton-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--border-radius-md);
}

.skeleton-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0.1)
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0.1)
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-line.short {
  width: 60%;
}

/* 新消息通知 */
.new-message-notification {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(33, 150, 243, 0.9);
  color: white;
  padding: 8px 16px;
  border-radius: var(--border-radius-md);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  animation: slideDown 0.3s ease;
  z-index: 20;
  backdrop-filter: blur(4px);
}

.new-message-notification:hover {
  background: rgba(33, 150, 243, 1);
}

/* 加载动画 */
.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

/* 滚动条 */
.log-list::-webkit-scrollbar {
  width: 6px;
}

.log-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.log-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.log-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

/* 动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .activity-log-panel {
    padding: 12px;
  }

  .panel-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .header-actions {
    justify-content: space-between;
  }

  .search-input {
    width: 140px;
  }

  .search-input:focus {
    width: 180px;
  }

  .log-list {
    max-height: 300px;
  }

  .log-item {
    padding: 10px;
  }

  .log-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .log-message {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .filter-tabs {
    justify-content: center;
  }

  .filter-tab {
    padding: 4px 8px;
    font-size: 11px;
  }

  .category-filter-panel {
    gap: 8px;
    padding: 8px;
  }

  .category-checkbox {
    font-size: 11px;
  }

  .log-list {
    max-height: 250px;
  }

  .log-item {
    gap: 8px;
  }

  .log-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .log-message {
    font-size: 12px;
  }

  .log-time {
    font-size: 11px;
  }
}

/* 虚拟滚动样式 */
.virtual-scroll-list {
  height: 100%;
}

.virtual-scroll-wrapper {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.scroll-placeholder-top,
.scroll-placeholder-bottom {
  width: 100%;
  transition: height 0.1s ease;
}

.virtual-scroll-wrapper::-webkit-scrollbar {
  width: 6px;
}

.virtual-scroll-wrapper::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.virtual-scroll-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.virtual-scroll-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}
</style>
