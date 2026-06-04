/** * 文件名：ShopPage.vue * 作者：开发者 * 日期：2026-03-22 * 版本：v2.1.0 *
功能描述：农场商店页面 - 商品浏览、购买、数量选择、详细信息展示 * 更新记录： *
2026-03-22 - v1.1.0 - 完全重写，添加网格布局、购买确认弹窗、光泽效果 *
2026-03-23 - v1.2.0 - 添加一键最大、最小和手动输入数量功能 * 2026-03-25 - v2.0.0
- 商店界面优化：改进布局、卡片展示，添加详细信息面板 * 2026-05-02 - v2.1.0 -
添加虚拟滚动支持，提升大量商品时的性能 */
<template>
  <div class="shop-page">
    <header class="header glass">
      <button class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
        <span>返回</span>
      </button>
      <div class="header-title">
        <span class="title-icon">🛒</span>
        <h1>农场商店</h1>
      </div>
      <div class="currency-display">
        <span class="currency-icon">💰</span>
        <span class="currency-amount">{{
          playerStore.playerData?.currency_num || 0
        }}</span>
        <span class="currency-label">农场币</span>
      </div>
    </header>

    <main class="main">
      <div v-if="shopStore.loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">正在加载商品...</p>
      </div>
      <div v-else-if="shopStore.error" class="error-container">
        <span class="error-icon">⚠️</span>
        <p class="error-text">{{ shopStore.error }}</p>
        <button class="btn btn-primary" @click="retryLoad">重新加载</button>
      </div>
      <div v-else class="goods-container">
        <div class="category-tabs">
          <button
            v-for="category in categories"
            :key="category.id"
            class="category-tab"
            :class="{ active: activeCategory === category.id }"
            @click="activeCategory = category.id"
          >
            <span class="category-icon">{{ category.icon }}</span>
            <span class="category-name">{{ category.name }}</span>
          </button>
        </div>

        <div class="render-mode-selector">
          <span class="mode-label">渲染模式：</span>
          <div class="mode-buttons">
            <button
              v-for="mode in renderModes"
              :key="mode.value"
              class="mode-button"
              :class="{ active: renderMode === mode.value }"
              @click="renderMode = mode.value"
            >
              {{ mode.icon }} {{ mode.label }}
            </button>
          </div>
        </div>

        <!-- 传统模式 - 完整网格 -->
        <div
          v-if="renderMode === 'traditional'"
          class="goods-grid traditional-mode"
        >
          <div
            v-for="goods in filteredGoods"
            :key="goods.goods_id"
            class="goods-item card"
            :class="{
              'goods-item-seed': goods.goods_type === 1,
              'goods-item-item': goods.goods_type === 2,
              unlocked: isGoodsUnlocked(goods),
              locked: !isGoodsUnlocked(goods),
            }"
            :title="
              !isGoodsUnlocked(goods)
                ? `解锁要求：玩家${goods.unlock_player_level}级，世界${goods.unlock_world_level}级`
                : ''
            "
            @click="showPurchaseModal(goods)"
          >
            <div
              class="goods-badge"
              :class="'badge-' + getCropTypeClass(goods)"
            >
              <span>{{ getCropTypeLabel(goods) }}</span>
            </div>
            <div class="goods-icon-wrapper">
              <div class="goods-icon">{{ getGoodsIcon(goods) }}</div>
            </div>
            <div class="goods-info">
              <h3 class="goods-name">{{ goods.goods_name }}</h3>
              <p class="goods-desc">{{ goods.description }}</p>
              <div class="goods-tags">
                <span v-if="goods.goods_type === 1" class="goods-tag">
                  ⏱️ {{ goods.growth_cycle }}分钟
                </span>
                <span v-if="goods.goods_type === 1" class="goods-tag">
                  📦 {{ goods.min_yield }}-{{ goods.max_yield }}
                </span>
                <span v-if="goods.goods_type === 2" class="goods-tag">
                  ✨ {{ getEffectDisplay(goods) }}
                </span>
              </div>
            </div>
            <div class="goods-footer">
              <div class="goods-price">
                <span class="coin-icon">💰</span>
                <span class="price-value">{{ goods.price_num }}</span>
              </div>
              <button
                class="buy-btn btn-primary btn-sm"
                :class="{ 'btn-disabled': !isGoodsUnlocked(goods) }"
                :disabled="!isGoodsUnlocked(goods)"
                @click.stop="showPurchaseModal(goods)"
              >
                {{ isGoodsUnlocked(goods) ? '购买' : '未解锁' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 虚拟滚动模式 -->
        <div v-else ref="gridScrollRef" class="goods-grid virtual-grid">
          <div class="virtual-scroll-wrapper" @scroll="handleVirtualScroll">
            <div
              class="scroll-placeholder-top"
              :style="{ height: virtualScrollData.offset + 'px' }"
            ></div>
            <div
              v-for="goods in visibleGoods"
              :key="goods.goods_id"
              class="goods-item card"
              :class="{
                'goods-item-seed': goods.goods_type === 1,
                'goods-item-item': goods.goods_type === 2,
                unlocked: isGoodsUnlocked(goods),
                locked: !isGoodsUnlocked(goods),
              }"
              :title="
                !isGoodsUnlocked(goods)
                  ? `解锁要求：玩家${goods.unlock_player_level}级，世界${goods.unlock_world_level}级`
                  : ''
              "
              @click="showPurchaseModal(goods)"
            >
              <div
                class="goods-badge"
                :class="'badge-' + getCropTypeClass(goods)"
              >
                <span>{{ getCropTypeLabel(goods) }}</span>
              </div>
              <div class="goods-icon-wrapper">
                <div class="goods-icon">{{ getGoodsIcon(goods) }}</div>
              </div>
              <div class="goods-info">
                <h3 class="goods-name">{{ goods.goods_name }}</h3>
                <p class="goods-desc">{{ goods.description }}</p>
                <div class="goods-tags">
                  <span v-if="goods.goods_type === 1" class="goods-tag">
                    ⏱️ {{ goods.growth_cycle }}分钟
                  </span>
                  <span v-if="goods.goods_type === 1" class="goods-tag">
                    📦 {{ goods.min_yield }}-{{ goods.max_yield }}
                  </span>
                  <span v-if="goods.goods_type === 2" class="goods-tag">
                    ✨ {{ getEffectDisplay(goods) }}
                  </span>
                </div>
              </div>
              <div class="goods-footer">
                <div class="goods-price">
                  <span class="coin-icon">💰</span>
                  <span class="price-value">{{ goods.price_num }}</span>
                </div>
                <button
                  class="buy-btn btn-primary btn-sm"
                  :class="{ 'btn-disabled': !isGoodsUnlocked(goods) }"
                  :disabled="!isGoodsUnlocked(goods)"
                  @click.stop="showPurchaseModal(goods)"
                >
                  {{ isGoodsUnlocked(goods) ? '购买' : '未解锁' }}
                </button>
              </div>
            </div>
            <div
              class="scroll-placeholder-bottom"
              :style="{ height: virtualScrollData.placeholderBottom + 'px' }"
            ></div>
          </div>
        </div>
      </div>
    </main>

    <Transition name="scale">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content glass-strong modal-large">
          <div class="modal-header">
            <h2 class="modal-title">确认购买</h2>
            <button class="modal-close" @click="closeModal">×</button>
          </div>
          <div v-if="selectedGoods" class="modal-body modal-body-flex">
            <div class="purchase-left">
              <div class="selected-goods-large">
                <div class="selected-icon-large">
                  {{ getGoodsIcon(selectedGoods) }}
                </div>
                <div class="selected-info-large">
                  <h3 class="selected-name">{{ selectedGoods.goods_name }}</h3>
                  <div
                    class="selected-type-badge"
                    :class="'badge-' + getCropTypeClass(selectedGoods)"
                  >
                    {{ getCropTypeLabel(selectedGoods) }}
                  </div>
                  <p class="selected-desc">{{ selectedGoods.description }}</p>
                </div>
              </div>

              <div class="quantity-section">
                <label class="quantity-label">购买数量</label>
                <div class="quantity-controls">
                  <button class="quantity-btn" @click="setQuantity(1)">
                    最小
                  </button>
                  <button
                    class="quantity-btn"
                    :disabled="quantity <= 1"
                    @click="decreaseQuantity"
                  >
                    -
                  </button>
                  <input
                    v-model.number="quantity"
                    type="number"
                    class="quantity-input"
                    :min="1"
                    :max="maxQuantity"
                  />
                  <button
                    class="quantity-btn"
                    :disabled="quantity >= maxQuantity"
                    @click="increaseQuantity"
                  >
                    +
                  </button>
                  <button
                    class="quantity-btn"
                    @click="setQuantity(maxQuantity)"
                  >
                    最大
                  </button>
                </div>
              </div>

              <div class="total-section">
                <span class="total-label">总计</span>
                <div class="total-price">
                  <span class="coin-icon">💰</span>
                  <span class="total-value">{{ totalPrice }}</span>
                </div>
              </div>
            </div>

            <div class="purchase-right">
              <div class="detail-panel">
                <h4 class="detail-title">📋 商品详情</h4>

                <div
                  v-if="selectedGoods.goods_type === 1"
                  class="detail-section"
                >
                  <h5 class="detail-section-title">🌱 种子信息</h5>
                  <div class="detail-item">
                    <span class="detail-label">生长周期</span>
                    <span class="detail-value"
                      >{{ selectedGoods.growth_cycle }} 分钟</span
                    >
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">产量范围</span>
                    <span class="detail-value"
                      >{{ selectedGoods.min_yield }} -
                      {{ selectedGoods.max_yield }}</span
                    >
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">出售单价</span>
                    <span class="detail-value"
                      >💰 {{ selectedGoods.sell_price }}</span
                    >
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">种子成本</span>
                    <span class="detail-value"
                      >💰 {{ selectedGoods.seed_cost }}</span
                    >
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">单位时间收益</span>
                    <span class="detail-value"
                      >{{ selectedGoods.gp_per_min }} GP/min</span
                    >
                  </div>
                </div>

                <div
                  v-if="selectedGoods.goods_type === 1"
                  class="detail-section"
                >
                  <h5 class="detail-section-title">⭐ 经验收益</h5>
                  <div class="detail-item">
                    <span class="detail-label">玩家经验</span>
                    <span class="detail-value exp-positive"
                      >+{{ selectedGoods.player_exp_base }} /个</span
                    >
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">农场经验</span>
                    <span class="detail-value exp-positive"
                      >+{{ selectedGoods.farm_exp_base }} /个</span
                    >
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">世界经验</span>
                    <span class="detail-value exp-positive"
                      >+{{ selectedGoods.world_exp_base }} /个</span
                    >
                  </div>
                </div>

                <div
                  v-if="selectedGoods.goods_type === 2"
                  class="detail-section"
                >
                  <h5 class="detail-section-title">✨ 道具效果</h5>
                  <div class="detail-item">
                    <span class="detail-label">道具类型</span>
                    <span class="detail-value">{{
                      getItemTypeLabel(selectedGoods)
                    }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">效果描述</span>
                    <span class="detail-value exp-positive">{{
                      getDetailEffectDisplay(selectedGoods)
                    }}</span>
                  </div>
                  <div v-if="selectedGoods.effect_duration" class="detail-item">
                    <span class="detail-label">持续时间</span>
                    <span class="detail-value"
                      >{{ selectedGoods.effect_duration }} 分钟</span
                    >
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">最大堆叠</span>
                    <span class="detail-value">{{
                      selectedGoods.max_stack
                    }}</span>
                  </div>
                </div>

                <div class="detail-section">
                  <h5 class="detail-section-title">🔓 解锁要求</h5>
                  <div class="detail-item">
                    <span class="detail-label">玩家等级</span>
                    <span
                      class="detail-value"
                      :class="
                        (playerStore.playerData?.player_level || 1) >=
                        selectedGoods.unlock_player_level
                          ? 'text-success'
                          : 'text-error'
                      "
                    >
                      {{ selectedGoods.unlock_player_level }}级
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">世界等级</span>
                    <span
                      class="detail-value"
                      :class="
                        (playerStore.playerData?.world_level || 1) >=
                        selectedGoods.unlock_world_level
                          ? 'text-success'
                          : 'text-error'
                      "
                    >
                      {{ selectedGoods.unlock_world_level }}级
                    </span>
                  </div>
                </div>

                <div class="detail-section">
                  <h5 class="detail-section-title">📊 本次购买</h5>
                  <div class="detail-item">
                    <span class="detail-label">购买数量</span>
                    <span class="detail-value">{{ quantity }} 个</span>
                  </div>
                  <div class="detail-item highlight">
                    <span class="detail-label">总计价格</span>
                    <span class="detail-value price-highlight"
                      >💰 {{ totalPrice }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeModal">取消</button>
            <button
              class="btn btn-primary"
              :disabled="!canAfford || !isGoodsUnlocked(selectedGoods)"
              @click="handleBuy"
            >
              {{
                !isGoodsUnlocked(selectedGoods)
                  ? '未解锁'
                  : canAfford
                    ? '确认购买'
                    : '农场币不足'
              }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, reactive, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { usePlayerStore } from '../stores/player';
import { useShopStore } from '../stores/shop';
import { useToastStore } from '../stores/toast';

// 定义组件名称，用于 keep-alive 缓存
defineOptions({
  name: 'ShopPage',
});

const router = useRouter();
const playerStore = usePlayerStore();
const shopStore = useShopStore();
const toastStore = useToastStore();
const showModal = ref(false);
const selectedGoods = ref(null);
const quantity = ref(1);
const activeCategory = ref(0);

const categories = [
  { id: 0, name: '全部', icon: '📦' },
  { id: 1, name: '种子', icon: '🌱' },
  { id: 2, name: '道具', icon: '✨' },
];

// 渲染模式
const renderMode = ref('virtual');
const renderModes = [
  { value: 'traditional', label: '传统', icon: '📦' },
  { value: 'virtual', label: '虚拟', icon: '⚡' },
];

// 虚拟滚动相关
const gridScrollRef = ref(null);
const virtualScrollData = reactive({
  start: 0,
  end: 0,
  offset: 0,
  placeholderBottom: 0,
  itemHeight: 320, // 估算每个商品卡片的高度（与传统模式一致）
  bufferSize: 4, // 上下缓冲区
  visibleCount: 0,
});

// 虚拟滚动可见商品
const visibleGoods = computed(() => {
  if (renderMode.value === 'traditional') {
    return filteredGoods.value;
  }
  return filteredGoods.value.slice(
    virtualScrollData.start,
    virtualScrollData.end + 1
  );
});

// 虚拟滚动处理
const handleVirtualScroll = () => {
  if (renderMode.value !== 'virtual' || !gridScrollRef.value) return;

  const scrollContainer = gridScrollRef.value.querySelector(
    '.virtual-scroll-wrapper'
  );
  if (!scrollContainer) return;

  const scrollTop = scrollContainer.scrollTop;
  const totalItems = filteredGoods.value.length;
  const itemHeight = virtualScrollData.itemHeight;
  const bufferSize = virtualScrollData.bufferSize;

  // 计算开始索引
  let start = Math.floor(scrollTop / itemHeight) - bufferSize;
  start = Math.max(0, start);

  // 计算结束索引
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

// 初始化虚拟滚动
const initVirtualScroll = () => {
  if (!gridScrollRef.value) return;

  const scrollContainer = gridScrollRef.value.querySelector(
    '.virtual-scroll-wrapper'
  );
  if (!scrollContainer) return;

  const clientHeight = scrollContainer.clientHeight || 400;
  virtualScrollData.visibleCount = Math.ceil(
    clientHeight / virtualScrollData.itemHeight
  );
  handleVirtualScroll();
};

// 监听分类变化时重置虚拟滚动
watch(activeCategory, () => {
  virtualScrollData.start = 0;
  virtualScrollData.end =
    virtualScrollData.visibleCount + virtualScrollData.bufferSize;
  virtualScrollData.offset = 0;
  virtualScrollData.placeholderBottom = 0;
  nextTick(() => {
    initVirtualScroll();
  });
});

const filteredGoods = computed(() => {
  if (activeCategory.value === 0) {
    return shopStore.goods;
  }
  return shopStore.goods.filter((g) => g.goods_type === activeCategory.value);
});

const totalPrice = computed(() => {
  if (!selectedGoods.value) return 0;
  return selectedGoods.value.price_num * quantity.value;
});

const maxQuantity = computed(() => {
  const balance = playerStore.playerData?.currency_num || 0;
  if (!selectedGoods.value || selectedGoods.value.price_num === 0) return 9999;
  return Math.floor(balance / selectedGoods.value.price_num) || 1;
});

const canAfford = computed(() => {
  const balance = playerStore.playerData?.currency_num || 0;
  return balance >= totalPrice.value;
});

const getGoodsIcon = (goods) => {
  if (goods.goods_type === 1) {
    const seedIcons = [
      '🌾',
      '🌽',
      '🥔',
      '🥕',
      '🥬',
      '🫘',
      '🍅',
      '🥒',
      '🌶️',
      '🍆',
      '🥬',
      '🥬',
      '🥬',
      '🥬',
      '🥬',
      '🍓',
      '🍉',
      '🍇',
      '🥭',
      '🥝',
      '🫐',
      '🍒',
      '🌺',
      '⭐',
    ];
    return seedIcons[(goods.goods_obj_id - 1) % seedIcons.length] || '🌱';
  }
  const itemIcons = ['💊', '💊', '💊', '⚡', '⚡', '⚡'];
  return itemIcons[(goods.goods_obj_id - 1) % itemIcons.length] || '✨';
};

const getCropTypeClass = (goods) => {
  if (goods.goods_type === 2) return 'item';
  const typeMap = {
    basic: 'basic',
    economic: 'economic',
    rare: 'rare',
    top: 'top',
  };
  return typeMap[goods.crop_type] || 'basic';
};

const getCropTypeLabel = (goods) => {
  if (goods.goods_type === 2) return '道具';
  const typeMap = {
    basic: '基础',
    economic: '经济',
    rare: '稀有',
    top: '顶级',
  };
  return typeMap[goods.crop_type] || '基础';
};

const getEffectDisplay = (goods) => {
  if (goods.goods_type !== 2) return '';

  // 体力药水特殊处理
  if (goods.goods_obj_id >= 14 && goods.goods_obj_id <= 16) {
    const staminaMap = {
      14: '+50 体力',
      15: '+200 体力',
      16: '体力全满',
    };
    return staminaMap[goods.goods_obj_id] || '';
  }

  // 皮肤道具特殊处理
  if (goods.goods_obj_id >= 17 && goods.goods_obj_id <= 19) {
    const durationMap = {
      17: '7天',
      18: '15天',
      19: '30天',
    };
    return durationMap[goods.goods_obj_id] || '';
  }

  if (goods.item_type === 1) {
    return '+' + Math.round((goods.effect_value - 1) * 100) + '%';
  }
  return '-' + Math.round((1 - goods.effect_value) * 100) + '%';
};

const getDetailEffectDisplay = (goods) => {
  if (goods.goods_type !== 2) return '';

  const detailMap = {
    1: '作物产量 +20%',
    2: '作物产量 +50%',
    3: '作物产量 +100%',
    4: '生长速度 +20%',
    5: '生长速度 +50%',
    6: '生长速度 +80%',
    7: '作物产量 +200%',
    8: '生长速度 +150%',
    9: '50%概率双倍收获',
    10: '当前作物立即成熟',
    11: '全局产量 +50%，持续24小时',
    12: '作物品质提升1级',
    13: '本次操作获得双倍经验',
    14: '立即恢复50点体力',
    15: '立即恢复200点体力',
    16: '体力恢复至最大值',
    17: '激活春季农场皮肤，持续7天',
    18: '激活夏季农场皮肤，持续15天',
    19: '激活秋季农场皮肤，持续30天',
  };

  return detailMap[goods.goods_obj_id] || '';
};

const getItemTypeLabel = (goods) => {
  if (goods.goods_type !== 2) return '';

  const typeMap = {
    1: '增产道具',
    2: '加速道具',
    3: '特殊道具',
    4: '经验道具',
    5: '体力道具',
    6: '皮肤装饰',
  };

  if (goods.goods_obj_id >= 14 && goods.goods_obj_id <= 16) return '体力道具';
  if (goods.goods_obj_id >= 17 && goods.goods_obj_id <= 19) return '皮肤装饰';
  if (goods.goods_obj_id === 9 || goods.goods_obj_id === 10) return '特殊道具';
  if (goods.goods_obj_id >= 12 && goods.goods_obj_id <= 13) return '经验道具';

  return typeMap[goods.item_type] || '道具';
};

const isGoodsUnlocked = (goods) => {
  const playerLevel = playerStore.playerData?.player_level || 1;
  const worldLevel = playerStore.playerData?.world_level || 1;
  return (
    playerLevel >= goods.unlock_player_level &&
    worldLevel >= goods.unlock_world_level
  );
};

onMounted(async () => {
  await loadData();
  nextTick(() => {
    initVirtualScroll();
  });
});

const loadData = async () => {
  await Promise.all([
    playerStore.fetchPlayerData(),
    shopStore.fetchGoods(),
    playerStore.fetchLevelProgress(),
  ]);
};

const retryLoad = () => {
  loadData();
};

const showPurchaseModal = (goods) => {
  selectedGoods.value = goods;
  quantity.value = 1;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedGoods.value = null;
  quantity.value = 1;
};

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

const increaseQuantity = () => {
  if (quantity.value < maxQuantity.value) {
    quantity.value++;
  }
};

const setQuantity = (num) => {
  quantity.value = num;
};

const handleBuy = async () => {
  if (
    !selectedGoods.value ||
    !canAfford.value ||
    !isGoodsUnlocked(selectedGoods.value)
  )
    return;

  try {
    await shopStore.buyGoods(selectedGoods.value.goods_id, quantity.value);
    showMessage(
      `🎉 购买 ${selectedGoods.value.goods_name} x${quantity.value} 成功！`,
      'success'
    );
    closeModal();
    await loadData();
  } catch (err) {
    showMessage(err.response?.data?.message || err.message, 'error');
  }
};

const showMessage = (msg, type = 'success') => {
  const titleMap = {
    success: '成功',
    error: '错误',
    warning: '警告',
    info: '提示',
  };
  const toastMethod =
    type === 'success'
      ? toastStore.success
      : type === 'error'
        ? toastStore.error
        : type === 'warning'
          ? toastStore.warning
          : toastStore.info;
  toastMethod(msg, titleMap[type]);
};

const goBack = () => router.push('/');
</script>

<style scoped>
.shop-page {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-radius: var(--border-radius-xl);
  animation: fadeIn 0.5s ease;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius-md);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(-4px);
}

.back-icon {
  font-size: 18px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 28px;
  animation: float 3s ease-in-out infinite;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.currency-display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: linear-gradient(
    135deg,
    rgba(251, 191, 36, 0.3) 0%,
    rgba(245, 158, 11, 0.3) 100%
  );
  border-radius: var(--border-radius-lg);
  border: 1px solid rgba(251, 191, 36, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  animation: pulse-glow 2s ease-in-out infinite;
}

.currency-icon {
  font-size: 24px;
  animation: bounce 2s ease-in-out infinite;
}

.currency-amount {
  font-size: 24px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.currency-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.category-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius-lg);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  backdrop-filter: blur(10px);
}

.category-tab:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.category-tab.active {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  border-color: var(--primary-400);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.category-icon {
  font-size: 20px;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  animation: fadeIn 0.5s ease;
}

.loading-text,
.error-text {
  font-size: 18px;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.error-icon {
  font-size: 48px;
}

.goods-container {
  animation: fadeInUp 0.5s ease;
}

.goods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
  height: 100%;
  overflow-y: auto;
  padding: 8px;
}

.goods-grid.traditional-mode {
  height: calc(100vh - 200px);
  min-height: 650px;
  max-height: 85vh;
}

.goods-item {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 20px;
  cursor: pointer;
  overflow: hidden;
  transition: all var(--transition-normal);
  min-height: 320px;
}

.goods-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.goods-item.locked {
  opacity: 0.6;
  filter: grayscale(70%);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  position: relative;
}

.goods-item.locked::after {
  content: '未解锁';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  z-index: 2;
}

.goods-item.locked:hover {
  opacity: 0.8;
  filter: grayscale(30%);
  border-color: rgba(255, 255, 255, 0.5);
}

.btn-disabled {
  background: #ccc !important;
  border-color: #ccc !important;
  cursor: not-allowed !important;
}

.btn-disabled:hover {
  transform: none !important;
  box-shadow: none !important;
}

.goods-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  transition: left 0.5s;
}

.goods-item:hover::before {
  left: 100%;
}

.goods-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 12px;
  z-index: 1;
}

.badge-basic {
  background: linear-gradient(135deg, var(--success-500), var(--success-600));
  color: white;
}

.badge-economic {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
}

.badge-rare {
  background: linear-gradient(135deg, var(--warning-500), var(--warning-600));
  color: white;
}

.badge-top {
  background: linear-gradient(135deg, var(--gold-500), var(--gold-600));
  color: white;
}

.badge-item {
  background: linear-gradient(135deg, var(--purple-500), var(--purple-600));
  color: white;
}

.goods-icon-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 18px;
}

.goods-icon {
  font-size: 72px;
  text-align: center;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.15));
}

.goods-info {
  flex: 1;
  text-align: center;
  margin-bottom: 18px;
}

.goods-name {
  margin: 0 0 10px 0;
  font-size: 19px;
  font-weight: 800;
  color: var(--text-primary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.goods-desc {
  margin: 0 0 14px 0;
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.goods-tags {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.goods-tag {
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border-radius: 14px;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
}

.goods-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--glass-border);
}

.goods-price {
  display: flex;
  align-items: center;
  gap: 6px;
}

.coin-icon {
  font-size: 18px;
}

.price-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--gold-600);
}

.buy-btn {
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 600;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 480px;
  border-radius: var(--border-radius-xl);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: scaleIn 0.3s ease;
}

.modal-large {
  max-width: 900px;
}

.modal-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  max-height: 60vh;
}

.modal-body-flex {
  flex: 1;
  display: flex;
  gap: 24px;
  padding: 24px;
  overflow-y: auto;
  max-height: 60vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--glass-border);
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast);
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
}

.modal-body-flex {
  display: flex;
  gap: 24px;
  padding: 24px;
}

.purchase-left {
  flex: 1;
  min-width: 0;
}

.purchase-right {
  width: 320px;
  flex-shrink: 0;
}

.selected-goods-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-lg);
  margin-bottom: 24px;
}

.selected-icon-large {
  font-size: 80px;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
}

.selected-info-large {
  text-align: center;
  width: 100%;
}

.selected-name {
  margin: 0 0 8px 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.selected-type-badge {
  display: inline-block;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 12px;
  margin-bottom: 12px;
}

.selected-desc {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.quantity-section {
  margin-bottom: 24px;
}

.quantity-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
}

.quantity-input {
  width: 80px;
  height: 40px;
  border: 2px solid var(--glass-border);
  border-radius: var(--border-radius-md);
  background: white;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  outline: none;
  transition: all var(--transition-fast);
}

.quantity-input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.quantity-btn {
  width: auto;
  min-width: 40px;
  height: 40px;
  padding: 0 12px;
  border: none;
  border-radius: var(--border-radius-md);
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.quantity-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.total-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(
    135deg,
    rgba(251, 191, 36, 0.1),
    rgba(245, 158, 11, 0.1)
  );
  border-radius: var(--border-radius-md);
  margin-bottom: 24px;
}

.total-label {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
}

.total-price {
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--gold-600);
}

.detail-panel {
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-lg);
  padding: 24px;
  height: 100%;
  overflow-y: auto;
  font-size: 15px;
  line-height: 1.6;
}

.detail-title {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section-title {
  margin: 0 0 14px 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--glass-border);
  align-items: center;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item.highlight {
  background: rgba(251, 191, 36, 0.12);
  margin: 0 -12px;
  padding: 14px 12px;
  border-radius: var(--border-radius-sm);
  border-bottom: none;
}

.detail-label {
  font-size: 15px;
  color: var(--text-secondary);
  font-weight: 500;
}

.detail-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.exp-positive {
  color: var(--success-600);
}

.exp-warning {
  color: var(--warning-600);
}

.text-success {
  color: var(--success-600);
}

.text-error {
  color: var(--error-600);
}

.price-highlight {
  font-size: 18px;
  color: var(--gold-600);
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 0 24px 24px;
}

.scale-enter-active,
.scale-leave-active {
  transition: all var(--transition-normal);
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(251, 191, 36, 0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 1024px) {
  .modal-body-flex {
    flex-direction: column;
  }

  .purchase-right {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .shop-page {
    padding: 12px;
  }

  .header {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .header-title {
    order: -1;
  }

  .goods-grid {
    grid-template-columns: 1fr;
  }

  .category-tabs {
    overflow-x: auto;
    padding-bottom: 4px;
  }
}

/* 渲染模式选择器 */
.render-mode-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--border-radius-md);
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.mode-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.mode-buttons {
  display: flex;
  gap: 8px;
}

.mode-button {
  padding: 6px 14px;
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

/* 虚拟滚动网格 */
.virtual-grid {
  height: calc(100vh - 200px);
  min-height: 650px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.virtual-scroll-wrapper {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  padding: 8px;
}

.scroll-placeholder-top,
.scroll-placeholder-bottom {
  width: 100%;
  transition: height 0.1s ease;
}

/* 虚拟滚动容器的滚动条 */
.virtual-scroll-wrapper::-webkit-scrollbar {
  width: 6px;
}

.virtual-scroll-wrapper::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.virtual-scroll-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.virtual-scroll-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
