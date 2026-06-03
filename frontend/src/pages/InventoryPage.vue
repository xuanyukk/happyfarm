/** * 文件名：InventoryPage.vue * 作者：开发者 * 日期：2026-03-22 * 版本：v2.0.0
* 功能描述：背包页面 - 作物、种子、工具展示与管理 * 更新记录： * 2026-03-22 -
v1.0.0 - 初始创建，背包功能实现 * 2026-05-02 - v2.0.0 -
添加虚拟滚动支持，优化大量物品时的性能 */

<template>
  <div class="inventory-page">
    <header class="header glass">
      <button class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
        <span>返回</span>
      </button>
      <div class="header-title">
        <span class="title-icon">🎒</span>
        <h1>我的背包</h1>
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
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
        <button
          v-if="activeTab === 'crops'"
          class="tab-btn btn-warning"
          @click="toggleBatchSellMode"
        >
          <span class="tab-icon">{{ isBatchSellMode ? '✓' : '📦' }}</span>
          <span>{{ isBatchSellMode ? '完成选择' : '批量出售' }}</span>
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

      <div class="inventory-content">
        <div v-if="activeTab === 'seeds'">
          <div v-if="renderMode === 'traditional'" class="items-grid">
            <div
              v-for="item in shopStore.inventory.seeds"
              :key="item.item_obj_id"
              class="item-card card"
              @click="showItemDetail(item, 'seed')"
            >
              <div class="item-icon">
                <img
                  :src="getInventoryIcon(item, 'seed')"
                  :alt="item.item_name"
                  class="item-icon-image"
                  @error="(e) => (e.target.style.display = 'none')"
                />
              </div>
              <div class="item-name">{{ item.item_name }}</div>
              <div class="item-count">
                x{{ formatItemCount(item.item_num) }}
              </div>
            </div>
            <div v-if="shopStore.inventory.seeds.length === 0" class="empty">
              <img
                :src="getEmptyStateImage('seeds')"
                alt="暂无种子"
                class="empty-icon-image"
                @error="
                  (e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }
                "
              />
              <span class="empty-icon-fallback" style="display: none">🌱</span>
              <p>暂无种子</p>
            </div>
          </div>

          <div v-else ref="gridScrollRefSeeds" class="items-grid virtual-grid">
            <div
              class="virtual-scroll-wrapper"
              @scroll="handleVirtualScroll('seeds')"
            >
              <div
                class="scroll-placeholder-top"
                :style="{ height: virtualScrollDataSeeds.offset + 'px' }"
              ></div>
              <div
                v-for="(item, index) in visibleItemsSeeds"
                :key="item.item_obj_id"
                class="item-card card"
                @click="showItemDetail(item, 'seed')"
              >
                <div class="item-icon">
                  <img
                    :src="getInventoryIcon(item, 'seed')"
                    :alt="item.item_name"
                    class="item-icon-image"
                    @error="(e) => (e.target.style.display = 'none')"
                  />
                </div>
                <div class="item-name">{{ item.item_name }}</div>
                <div class="item-count">
                  x{{ formatItemCount(item.item_num) }}
                </div>
              </div>
              <div
                class="scroll-placeholder-bottom"
                :style="{
                  height: virtualScrollDataSeeds.placeholderBottom + 'px',
                }"
              ></div>
            </div>
            <div v-if="shopStore.inventory.seeds.length === 0" class="empty">
              <img
                :src="getEmptyStateImage('seeds')"
                alt="暂无种子"
                class="empty-icon-image"
                @error="
                  (e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }
                "
              />
              <span class="empty-icon-fallback" style="display: none">🌱</span>
              <p>暂无种子</p>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'crops'">
          <div v-if="renderMode === 'traditional'" class="items-grid">
            <div
              v-for="item in shopStore.inventory.crops"
              :key="item.item_obj_id"
              class="item-card card"
              :class="{
                'batch-selected':
                  isBatchSellMode &&
                  selectedBatchItems.some(
                    (s) => s.item_obj_id === item.item_obj_id
                  ),
              }"
              @click="handleItemCardClick(item)"
            >
              <div
                v-if="isBatchSellMode"
                class="batch-checkbox"
                @click.stop="toggleBatchSelect(item)"
              >
                <span
                  v-if="
                    selectedBatchItems.some(
                      (s) => s.item_obj_id === item.item_obj_id
                    )
                  "
                  class="check-icon"
                  >✓</span
                >
              </div>
              <div class="item-icon">
                <img
                  :src="getInventoryIcon(item, 'crop')"
                  :alt="item.item_name"
                  class="item-icon-image"
                  @error="(e) => (e.target.style.display = 'none')"
                />
              </div>
              <div class="item-name">{{ item.item_name }}</div>
              <div class="item-count">
                x{{ formatItemCount(item.item_num) }}
              </div>
              <button
                v-if="!isBatchSellMode"
                class="sell-btn btn-success btn-sm"
                @click.stop="showSellModal(item)"
              >
                💰 出售
              </button>
              <div
                v-if="
                  isBatchSellMode &&
                  selectedBatchItems.some(
                    (s) => s.item_obj_id === item.item_obj_id
                  )
                "
                class="batch-quantity"
              >
                <button class="qty-btn" @click.stop="setBatchQuantity(item, 1)">
                  最小
                </button>
                <button
                  class="qty-btn"
                  @click.stop="decreaseBatchQuantity(item)"
                >
                  -
                </button>
                <input
                  type="number"
                  class="qty-input"
                  :value="getBatchQuantity(item)"
                  :min="1"
                  :max="item.item_num"
                  @input="updateBatchQuantity(item, $event)"
                />
                <button
                  class="qty-btn"
                  @click.stop="increaseBatchQuantity(item)"
                >
                  +
                </button>
                <button
                  class="qty-btn"
                  @click.stop="setBatchQuantity(item, item.item_num)"
                >
                  最大
                </button>
              </div>
            </div>
            <div v-if="shopStore.inventory.crops.length === 0" class="empty">
              <img
                :src="getEmptyStateImage('crops')"
                alt="暂无作物"
                class="empty-icon-image"
                @error="
                  (e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }
                "
              />
              <span class="empty-icon-fallback" style="display: none">🌾</span>
              <p>暂无作物</p>
            </div>
          </div>

          <div v-else ref="gridScrollRefCrops" class="items-grid virtual-grid">
            <div
              class="virtual-scroll-wrapper"
              @scroll="handleVirtualScroll('crops')"
            >
              <div
                class="scroll-placeholder-top"
                :style="{ height: virtualScrollDataCrops.offset + 'px' }"
              ></div>
              <div
                v-for="(item, index) in visibleItemsCrops"
                :key="item.item_obj_id"
                class="item-card card"
                :class="{
                  'batch-selected':
                    isBatchSellMode &&
                    selectedBatchItems.some(
                      (s) => s.item_obj_id === item.item_obj_id
                    ),
                }"
                @click="handleItemCardClick(item)"
              >
                <div
                  v-if="isBatchSellMode"
                  class="batch-checkbox"
                  @click.stop="toggleBatchSelect(item)"
                >
                  <span
                    v-if="
                      selectedBatchItems.some(
                        (s) => s.item_obj_id === item.item_obj_id
                      )
                    "
                    class="check-icon"
                    >✓</span
                  >
                </div>
                <div class="item-icon">
                  <img
                    :src="getInventoryIcon(item, 'crop')"
                    :alt="item.item_name"
                    class="item-icon-image"
                    @error="(e) => (e.target.style.display = 'none')"
                  />
                </div>
                <div class="item-name">{{ item.item_name }}</div>
                <div class="item-count">
                  x{{ formatItemCount(item.item_num) }}
                </div>
                <button
                  v-if="!isBatchSellMode"
                  class="sell-btn btn-success btn-sm"
                  @click.stop="showSellModal(item)"
                >
                  💰 出售
                </button>
                <div
                  v-if="
                    isBatchSellMode &&
                    selectedBatchItems.some(
                      (s) => s.item_obj_id === item.item_obj_id
                    )
                  "
                  class="batch-quantity"
                >
                  <button
                    class="qty-btn"
                    @click.stop="setBatchQuantity(item, 1)"
                  >
                    最小
                  </button>
                  <button
                    class="qty-btn"
                    @click.stop="decreaseBatchQuantity(item)"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    class="qty-input"
                    :value="getBatchQuantity(item)"
                    :min="1"
                    :max="item.item_num"
                    @input="updateBatchQuantity(item, $event)"
                  />
                  <button
                    class="qty-btn"
                    @click.stop="increaseBatchQuantity(item)"
                  >
                    +
                  </button>
                  <button
                    class="qty-btn"
                    @click.stop="setBatchQuantity(item, item.item_num)"
                  >
                    最大
                  </button>
                </div>
              </div>
              <div
                class="scroll-placeholder-bottom"
                :style="{
                  height: virtualScrollDataCrops.placeholderBottom + 'px',
                }"
              ></div>
            </div>
            <div v-if="shopStore.inventory.crops.length === 0" class="empty">
              <img
                :src="getEmptyStateImage('crops')"
                alt="暂无作物"
                class="empty-icon-image"
                @error="
                  (e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }
                "
              />
              <span class="empty-icon-fallback" style="display: none">🌾</span>
              <p>暂无作物</p>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'items'">
          <div class="sort-bar">
            <span class="sort-label">排序：</span>
            <button
              v-for="opt in itemSortOptions"
              :key="opt.value"
              class="sort-btn"
              :class="{ active: itemSortBy === opt.value }"
              @click="itemSortBy = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
          <div v-if="renderMode === 'traditional'" class="items-grid">
            <div
              v-for="item in sortedItems"
              :key="item.item_obj_id"
              class="item-card card"
              :class="'quality-' + getItemQuality(item)"
              @click="showItemDetail(item, 'item')"
            >
              <div class="item-icon">
                <img
                  :src="getInventoryIcon(item, 'item')"
                  :alt="item.item_name"
                  class="item-icon-image"
                  @error="(e) => (e.target.style.display = 'none')"
                />
              </div>
              <div class="item-name">{{ item.item_name }}</div>
              <div class="item-count">
                x{{ formatItemCount(item.item_num) }}
              </div>
            </div>
            <div v-if="shopStore.inventory.items.length === 0" class="empty">
              <img
                :src="getEmptyStateImage('items')"
                alt="暂无道具"
                class="empty-icon-image"
                @error="
                  (e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }
                "
              />
              <span class="empty-icon-fallback" style="display: none">✨</span>
              <p>暂无道具</p>
            </div>
          </div>

          <div v-else ref="gridScrollRefItems" class="items-grid virtual-grid">
            <div
              class="virtual-scroll-wrapper"
              @scroll="handleVirtualScroll('items')"
            >
              <div
                class="scroll-placeholder-top"
                :style="{ height: virtualScrollDataItems.offset + 'px' }"
              ></div>
              <div
                v-for="(item, index) in visibleItemsItems"
                :key="item.item_obj_id"
                class="item-card card"
                :class="'quality-' + getItemQuality(item)"
                @click="showItemDetail(item, 'item')"
              >
                <div class="item-icon">
                  <img
                    :src="getInventoryIcon(item, 'item')"
                    :alt="item.item_name"
                    class="item-icon-image"
                    @error="(e) => (e.target.style.display = 'none')"
                  />
                </div>
                <div class="item-name">{{ item.item_name }}</div>
                <div class="item-count">
                  x{{ formatItemCount(item.item_num) }}
                </div>
              </div>
              <div
                class="scroll-placeholder-bottom"
                :style="{
                  height: virtualScrollDataItems.placeholderBottom + 'px',
                }"
              ></div>
            </div>
            <div v-if="shopStore.inventory.items.length === 0" class="empty">
              <img
                :src="getEmptyStateImage('items')"
                alt="暂无道具"
                class="empty-icon-image"
                @error="
                  (e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }
                "
              />
              <span class="empty-icon-fallback" style="display: none">✨</span>
              <p>暂无道具</p>
            </div>
          </div>
        </div>
      </div>

      <Transition name="scale">
        <div
          v-if="showItemModal"
          class="modal-overlay"
          @click.self="closeItemModal"
        >
          <div class="modal-content glass-strong">
            <div class="modal-header">
              <h2 class="modal-title">物品详情</h2>
              <button class="modal-close" @click="closeItemModal">×</button>
            </div>
            <div v-if="selectedItem" class="modal-body">
              <div class="selected-goods">
                <div class="selected-icon">
                  {{ getItemIcon(selectedItemType) }}
                </div>
                <div class="selected-info">
                  <h3 class="selected-name">{{ selectedItem.item_name }}</h3>
                  <p class="selected-desc">
                    {{ selectedItem.item_desc || '暂无描述' }}
                  </p>
                </div>
              </div>
              <div class="item-details">
                <div class="detail-item">
                  <span class="detail-label">物品ID</span>
                  <span class="detail-value">{{
                    selectedItem.item_obj_id
                  }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">物品类型</span>
                  <span class="detail-value">{{
                    getItemTypeName(selectedItemType)
                  }}</span>
                </div>
                <div v-if="selectedItem.crop_type" class="detail-item">
                  <span class="detail-label">作物类型</span>
                  <span class="detail-value">{{
                    getCropTypeName(selectedItem.crop_type)
                  }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">当前数量</span>
                  <span class="detail-value">{{ selectedItem.item_num }}</span>
                </div>
                <div v-if="selectedItem.buy_price" class="detail-item">
                  <span class="detail-label">购买价格</span>
                  <span class="detail-value"
                    >💰 {{ selectedItem.buy_price }}</span
                  >
                </div>
                <div v-if="selectedItem.sell_price" class="detail-item">
                  <span class="detail-label">出售价格</span>
                  <span class="detail-value"
                    >💰 {{ selectedItem.sell_price }}</span
                  >
                </div>
                <div v-if="selectedItem.seed_cost" class="detail-item">
                  <span class="detail-label">种子成本</span>
                  <span class="detail-value"
                    >💰 {{ selectedItem.seed_cost }}</span
                  >
                </div>
                <div v-if="selectedItem.growth_cycle" class="detail-item">
                  <span class="detail-label">成熟时间</span>
                  <span class="detail-value"
                    >⏱️ {{ selectedItem.growth_cycle }} 分钟</span
                  >
                </div>
                <div v-if="selectedItem.base_yield" class="detail-item">
                  <span class="detail-label">基础产量</span>
                  <span class="detail-value">{{
                    selectedItem.base_yield
                  }}</span>
                </div>
                <div v-if="selectedItem.gp_per_min" class="detail-item">
                  <span class="detail-label">单位时间收益</span>
                  <span class="detail-value"
                    >{{ selectedItem.gp_per_min }} GP/min</span
                  >
                </div>
                <div v-if="selectedItem.world_id" class="detail-item">
                  <span class="detail-label">解锁世界等级</span>
                  <span class="detail-value">{{ selectedItem.world_id }}</span>
                </div>
                <div
                  v-if="selectedItem.total_add !== undefined"
                  class="detail-item"
                >
                  <span class="detail-label">累计获得</span>
                  <span class="detail-value">{{ selectedItem.total_add }}</span>
                </div>
                <div
                  v-if="selectedItem.total_use !== undefined"
                  class="detail-item"
                >
                  <span class="detail-label">累计使用</span>
                  <span class="detail-value">{{ selectedItem.total_use }}</span>
                </div>
                <div v-if="selectedItem.last_add_time" class="detail-item">
                  <span class="detail-label">最后获得</span>
                  <span class="detail-value">{{
                    formatTime(selectedItem.last_add_time)
                  }}</span>
                </div>
                <div v-if="selectedItem.last_use_time" class="detail-item">
                  <span class="detail-label">最后使用</span>
                  <span class="detail-value">{{
                    formatTime(selectedItem.last_use_time)
                  }}</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                v-if="selectedItemType !== 'crop'"
                class="btn btn-primary"
                @click="handleInventoryUseItem"
              >
                使用
              </button>
              <button class="btn btn-secondary" @click="closeItemModal">
                关闭
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="scale">
        <div
          v-if="showSellModalFlag"
          class="modal-overlay"
          @click.self="closeSellModal"
        >
          <div class="modal-content glass-strong">
            <div class="modal-header">
              <h2 class="modal-title">确认出售</h2>
              <button class="modal-close" @click="closeSellModal">×</button>
            </div>
            <div v-if="selectedSellItem" class="modal-body">
              <div class="selected-goods">
                <img
                  v-if="selectedSellItem"
                  :src="getInventoryIcon(selectedSellItem, 'crop')"
                  :alt="selectedSellItem.item_name"
                  class="selected-icon-image"
                  @error="(e) => (e.target.style.display = 'none')"
                />
                <div class="selected-info">
                  <h3 class="selected-name">
                    {{ selectedSellItem.item_name }}
                  </h3>
                  <p class="selected-desc">出售作物获得农场币</p>
                </div>
              </div>
              <div class="quantity-section">
                <label class="quantity-label">出售数量</label>
                <div class="quantity-controls">
                  <button class="quantity-btn" @click="setSellQuantity(1)">
                    最小
                  </button>
                  <button
                    class="quantity-btn"
                    :disabled="sellQuantity <= 1"
                    @click="decreaseSellQuantity"
                  >
                    -
                  </button>
                  <input
                    v-model.number="sellQuantity"
                    type="number"
                    class="quantity-input"
                    :min="1"
                    :max="selectedSellItem?.item_num || 1"
                  />
                  <button
                    class="quantity-btn"
                    :disabled="
                      sellQuantity >= (selectedSellItem?.item_num || 1)
                    "
                    @click="increaseSellQuantity"
                  >
                    +
                  </button>
                  <button
                    class="quantity-btn"
                    @click="setSellQuantity(selectedSellItem?.item_num || 1)"
                  >
                    最大
                  </button>
                </div>
              </div>
              <div class="total-section">
                <span class="total-label">预计收入</span>
                <div class="total-price">
                  <span class="coin-icon">💰</span>
                  <span class="total-value">{{ totalSellPrice }}</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeSellModal">
                取消
              </button>
              <button class="btn btn-success" @click="confirmSell">
                确认出售
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </main>

    <Transition name="slide-up">
      <div
        v-if="isBatchSellMode && selectedBatchItems.length > 0"
        class="batch-sell-bar"
      >
        <div class="batch-info">
          <span class="batch-count"
            >已选 {{ selectedBatchItems.length }} 种物品</span
          >
          <span class="batch-total">预计收入：💰 {{ totalBatchIncome }}</span>
        </div>
        <div class="batch-actions">
          <button class="btn btn-secondary" @click="cancelBatchSell">
            取消
          </button>
          <button class="btn btn-success" @click="confirmBatchSell">
            确认出售
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, reactive, nextTick, watch } from 'vue';
import {
  getCropIconImage,
  getSeedIconImage,
  getItemIconImage,
  getEmptyStateImage,
} from '../utils/imagePaths';
import { useRouter } from 'vue-router';
import { usePlayerStore } from '../stores/player';
import { useShopStore } from '../stores/shop';
import { useFarmStore } from '../stores/farm';
import { useToastStore } from '../stores/toast';

const formatItemCount = (count) => {
  if (count >= 99) return '99+';
  return String(count);
};

// 定义组件名称，用于 keep-alive 缓存
defineOptions({
  name: 'InventoryPage',
});

const getInventoryIcon = function (item, tabType) {
  if (tabType === 'seed') return getSeedIconImage(item.item_obj_id);
  if (tabType === 'crop') return getCropIconImage(item.item_obj_id);
  return getItemIconImage(item.item_obj_id);
};

const router = useRouter();
const playerStore = usePlayerStore();
const shopStore = useShopStore();
const farmStore = useFarmStore();
const toastStore = useToastStore();

const tabs = [
  { key: 'seeds', label: '种子', icon: '🌱' },
  { key: 'crops', label: '作物', icon: '🌾' },
  { key: 'items', label: '道具', icon: '✨' },
];

const renderModes = [
  { value: 'traditional', label: '传统模式', icon: '📄' },
  { value: 'virtual', label: '虚拟滚动', icon: '⚡' },
];

const activeTab = ref('seeds');
const renderMode = ref('virtual');

const itemSortBy = ref('quality');
const itemSortOptions = [
  { value: 'quality', label: '品质' },
  { value: 'name', label: '名称' },
  { value: 'count', label: '数量' },
];

const getItemQuality = (item) => {
  const qualityMap = {
    1: 1,
    4: 1,
    14: 1,
    15: 1,
    18: 1,
    2: 2,
    5: 2,
    9: 2,
    13: 2,
    3: 3,
    6: 3,
    10: 3,
    7: 4,
    8: 4,
    11: 4,
    19: 4,
    12: 5,
    16: 5,
    17: 5,
    20: 5,
  };
  return qualityMap[item.item_type] || 1;
};

const sortedItems = computed(() => {
  const items = [...(shopStore.inventory.items || [])];
  if (itemSortBy.value === 'quality') {
    items.sort((a, b) => getItemQuality(b) - getItemQuality(a));
  } else if (itemSortBy.value === 'name') {
    items.sort((a, b) => (a.item_name || '').localeCompare(b.item_name || ''));
  } else if (itemSortBy.value === 'count') {
    items.sort((a, b) => (b.item_num || 0) - (a.item_num || 0));
  }
  return items;
});

const showItemModal = ref(false);
const selectedItem = ref(null);
const selectedItemType = ref('');

const showSellModalFlag = ref(false);
const selectedSellItem = ref(null);
const sellQuantity = ref(1);

const isBatchSellMode = ref(false);
const selectedBatchItems = ref([]);

const gridScrollRefSeeds = ref(null);
const gridScrollRefCrops = ref(null);
const gridScrollRefItems = ref(null);

const ITEM_HEIGHT = 240;
const BUFFER_SIZE = 5;

const virtualScrollDataSeeds = reactive({
  scrollTop: 0,
  offset: 0,
  placeholderBottom: 0,
  startIndex: 0,
  endIndex: 0,
});

const virtualScrollDataCrops = reactive({
  scrollTop: 0,
  offset: 0,
  placeholderBottom: 0,
  startIndex: 0,
  endIndex: 0,
});

const virtualScrollDataItems = reactive({
  scrollTop: 0,
  offset: 0,
  placeholderBottom: 0,
  startIndex: 0,
  endIndex: 0,
});

const visibleItemsSeeds = computed(() => {
  const items = shopStore.inventory.seeds;
  return items.slice(
    virtualScrollDataSeeds.startIndex,
    virtualScrollDataSeeds.endIndex
  );
});

const visibleItemsCrops = computed(() => {
  const items = shopStore.inventory.crops;
  return items.slice(
    virtualScrollDataCrops.startIndex,
    virtualScrollDataCrops.endIndex
  );
});

const visibleItemsItems = computed(() => {
  const items = shopStore.inventory.items;
  return items.slice(
    virtualScrollDataItems.startIndex,
    virtualScrollDataItems.endIndex
  );
});

const totalSellPrice = computed(() => {
  if (!selectedSellItem.value) return 0;
  const price = selectedSellItem.value.sell_price || 1;
  return price * sellQuantity.value;
});

const totalBatchIncome = computed(() => {
  return selectedBatchItems.value.reduce((total, item) => {
    const price = item.sell_price || 1;
    return total + price * item.quantity;
  }, 0);
});

const initVirtualScroll = (type) => {
  nextTick(() => {
    let ref, data, items;
    switch (type) {
      case 'seeds':
        ref = gridScrollRefSeeds;
        data = virtualScrollDataSeeds;
        items = shopStore.inventory.seeds;
        break;
      case 'crops':
        ref = gridScrollRefCrops;
        data = virtualScrollDataCrops;
        items = shopStore.inventory.crops;
        break;
      case 'items':
        ref = gridScrollRefItems;
        data = virtualScrollDataItems;
        items = shopStore.inventory.items;
        break;
    }

    if (ref.value && items) {
      const wrapper = ref.value.querySelector('.virtual-scroll-wrapper');
      if (wrapper) {
        const containerHeight = wrapper.clientHeight;
        const visibleCount =
          Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER_SIZE * 2;
        data.startIndex = 0;
        data.endIndex = Math.min(visibleCount, items.length);
        data.offset = 0;
        data.placeholderBottom = Math.max(
          0,
          (items.length - visibleCount) * ITEM_HEIGHT
        );
      }
    }
  });
};

const handleVirtualScroll = (type) => {
  let ref, data, items;
  switch (type) {
    case 'seeds':
      ref = gridScrollRefSeeds;
      data = virtualScrollDataSeeds;
      items = shopStore.inventory.seeds;
      break;
    case 'crops':
      ref = gridScrollRefCrops;
      data = virtualScrollDataCrops;
      items = shopStore.inventory.crops;
      break;
    case 'items':
      ref = gridScrollRefItems;
      data = virtualScrollDataItems;
      items = shopStore.inventory.items;
      break;
  }

  if (!ref.value || !items) return;

  const wrapper = ref.value.querySelector('.virtual-scroll-wrapper');
  if (!wrapper) return;

  const scrollTop = wrapper.scrollTop;
  data.scrollTop = scrollTop;

  const containerHeight = wrapper.clientHeight;
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE
  );
  const visibleCount =
    Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER_SIZE * 2;
  const endIndex = Math.min(startIndex + visibleCount, items.length);

  data.startIndex = startIndex;
  data.endIndex = endIndex;
  data.offset = startIndex * ITEM_HEIGHT;
  data.placeholderBottom = Math.max(0, (items.length - endIndex) * ITEM_HEIGHT);
};

onMounted(async () => {
  await Promise.all([
    playerStore.fetchPlayerData(),
    shopStore.fetchInventory(),
  ]);

  initVirtualScroll('seeds');
  initVirtualScroll('crops');
  initVirtualScroll('items');
});

watch(
  () => shopStore.inventory.seeds,
  () => {
    initVirtualScroll('seeds');
  },
  { deep: true }
);

watch(
  () => shopStore.inventory.crops,
  () => {
    initVirtualScroll('crops');
  },
  { deep: true }
);

watch(
  () => shopStore.inventory.items,
  () => {
    initVirtualScroll('items');
  },
  { deep: true }
);

watch(activeTab, (newTab) => {
  initVirtualScroll(newTab);
});

const showItemDetail = (item, type) => {
  selectedItem.value = item;
  selectedItemType.value = type;
  showItemModal.value = true;
};

const closeItemModal = () => {
  showItemModal.value = false;
  selectedItem.value = null;
  selectedItemType.value = '';
};

const handleInventoryUseItem = async () => {
  if (!selectedItem.value) return;
  const item = selectedItem.value;
  const needLand = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13];
  const noNeedLand = [11, 14, 15, 16, 17, 18, 19, 20];

  if (needLand.includes(item.item_obj_id)) {
    toastStore.error(`「${item.item_name}」需要在农场页面上选中地块后使用`);
    return;
  }

  if (item.item_num <= 0) {
    toastStore.warning('该道具数量不足');
    return;
  }

  try {
    await farmStore.useItem(item.item_obj_id, undefined);
    closeItemModal();
    toastStore.success(`✅ 使用 ${item.item_name} 成功！`);
    await shopStore.fetchInventory();
    await playerStore.fetchPlayerData();
  } catch (err) {
    toastStore.error(err.response?.data?.message || err.message || '使用失败');
  }
};

const showSellModal = (item) => {
  selectedSellItem.value = item;
  sellQuantity.value = 1;
  showSellModalFlag.value = true;
};

const closeSellModal = () => {
  showSellModalFlag.value = false;
  selectedSellItem.value = null;
  sellQuantity.value = 1;
};

const decreaseSellQuantity = () => {
  if (sellQuantity.value > 1) {
    sellQuantity.value--;
  }
};

const increaseSellQuantity = () => {
  if (
    selectedSellItem.value &&
    sellQuantity.value < selectedSellItem.value.item_num
  ) {
    sellQuantity.value++;
  }
};

const setSellQuantity = (num) => {
  sellQuantity.value = num;
};

const confirmSell = async () => {
  if (!selectedSellItem.value) return;

  try {
    const result = await shopStore.sellCrop(
      selectedSellItem.value.item_obj_id,
      sellQuantity.value
    );
    showMessage(
      `🎉 出售 ${selectedSellItem.value.item_name} x${sellQuantity.value} 成功！获得 ${result.income} 农场币`,
      'success'
    );
    closeSellModal();
    if (window.activityLogPanel) {
      window.activityLogPanel.refresh();
    }
  } catch (err) {
    showMessage(err.response?.data?.message || err.message, 'error');
  }
};

const getItemIcon = (type) => {
  const icons = {
    seed: '🌱',
    crop: '🌾',
    item: '✨',
  };
  return icons[type] || '📦';
};

const getItemTypeName = (type) => {
  const names = {
    seed: '种子',
    crop: '作物',
    item: '道具',
  };
  return names[type] || '物品';
};

const getCropTypeName = (type) => {
  const names = {
    basic: '基础',
    economic: '经济',
    rare: '稀有',
    top: '顶级',
  };
  return names[type] || type;
};

const formatTime = (time) => {
  if (!time) return '-';
  const date = new Date(time);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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

const toggleBatchSellMode = () => {
  isBatchSellMode.value = !isBatchSellMode.value;
  if (!isBatchSellMode.value) {
    selectedBatchItems.value = [];
  }
};

const toggleBatchSelect = (item) => {
  const index = selectedBatchItems.value.findIndex(
    (s) => s.item_obj_id === item.item_obj_id
  );
  if (index > -1) {
    selectedBatchItems.value.splice(index, 1);
  } else {
    selectedBatchItems.value.push({
      ...item,
      quantity: 1,
    });
  }
};

const getBatchQuantity = (item) => {
  const selected = selectedBatchItems.value.find(
    (s) => s.item_obj_id === item.item_obj_id
  );
  return selected ? selected.quantity : 0;
};

const updateBatchQuantity = (item, event) => {
  const selected = selectedBatchItems.value.find(
    (s) => s.item_obj_id === item.item_obj_id
  );
  if (selected) {
    let val = parseInt(event.target.value) || 1;
    val = Math.max(1, Math.min(val, item.item_num));
    selected.quantity = val;
  }
};

const handleItemCardClick = (item) => {
  if (isBatchSellMode.value) {
    const isSelected = selectedBatchItems.value.some(
      (s) => s.item_obj_id === item.item_obj_id
    );
    if (!isSelected) {
      toggleBatchSelect(item);
    }
  } else {
    showItemDetail(item, 'crop');
  }
};

const increaseBatchQuantity = (item) => {
  const selected = selectedBatchItems.value.find(
    (s) => s.item_obj_id === item.item_obj_id
  );
  if (selected && selected.quantity < item.item_num) {
    selected.quantity++;
  }
};

const decreaseBatchQuantity = (item) => {
  const selected = selectedBatchItems.value.find(
    (s) => s.item_obj_id === item.item_obj_id
  );
  if (selected && selected.quantity > 1) {
    selected.quantity--;
  }
};

const setBatchQuantity = (item, num) => {
  const selected = selectedBatchItems.value.find(
    (s) => s.item_obj_id === item.item_obj_id
  );
  if (selected) {
    selected.quantity = num;
  }
};

const cancelBatchSell = () => {
  isBatchSellMode.value = false;
  selectedBatchItems.value = [];
};

const confirmBatchSell = async () => {
  if (selectedBatchItems.value.length === 0) return;

  let totalIncome = 0;
  let successCount = 0;

  try {
    for (const item of selectedBatchItems.value) {
      const result = await shopStore.sellCrop(item.item_obj_id, item.quantity);
      totalIncome += result.income;
      successCount++;
    }

    showMessage(
      `🎉 成功出售 ${successCount} 种物品！获得 ${totalIncome} 农场币`,
      'success'
    );
    cancelBatchSell();
    await shopStore.fetchInventory();
    await playerStore.fetchPlayerData();
    if (window.activityLogPanel) {
      window.activityLogPanel.refresh();
    }
  } catch (err) {
    if (successCount > 0) {
      showMessage(
        `🎉 成功出售 ${successCount} 种物品！部分失败：${err.response?.data?.message || err.message}`,
        'success'
      );
      if (window.activityLogPanel) {
        window.activityLogPanel.refresh();
      }
    } else {
      showMessage(err.response?.data?.message || err.message, 'error');
    }
  }
};
</script>

<style scoped>
.inventory-page {
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
  animation: fadeInUp 0.5s ease;
}

.tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  justify-content: center;
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border: none;
  border-radius: var(--border-radius-xl);
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.tab-btn.active {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  font-weight: 700;
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.tab-icon {
  font-size: 18px;
}

.render-mode-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-lg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
}

.mode-label {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.mode-buttons {
  display: flex;
  gap: 8px;
}

.mode-button {
  padding: 8px 16px;
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius-md);
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.mode-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.mode-button.active {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  font-weight: 600;
  border-color: transparent;
}

.inventory-content {
  flex: 1;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.virtual-grid {
  display: block;
  height: calc(100vh - 400px);
  overflow: hidden;
}

.virtual-scroll-wrapper {
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.scroll-placeholder-top,
.scroll-placeholder-bottom {
  width: 100%;
}

.virtual-grid .item-card {
  margin-bottom: 16px;
}

.item-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  text-align: center;
  overflow: hidden;
  transition: all var(--transition-normal);
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.item-card.quality-1 {
  border: 2px solid #9e9e9e;
}

.item-card.quality-2 {
  border: 2px solid #4caf50;
}

.item-card.quality-3 {
  border: 2px solid #2196f3;
}

.item-card.quality-4 {
  border: 2px solid #9c27b0;
}

.item-card.quality-5 {
  border: 2px solid #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.sort-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-md);
}

.sort-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.sort-btn {
  padding: 4px 12px;
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius-sm);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.sort-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.sort-btn.active {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  border-color: var(--primary-500);
  color: #fff;
  font-weight: 600;
}

.item-card::before {
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

.item-card:hover::before {
  left: 100%;
}

.item-icon {
  margin-bottom: 12px;
  animation: float 3s ease-in-out infinite;
}

.item-icon-image {
  width: 48px;
  height: 48px;
  object-fit: contain;
  image-rendering: auto;
}

.selected-icon-image {
  width: 64px;
  height: 64px;
  object-fit: contain;
  image-rendering: auto;
  border-radius: 12px;
}

.item-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.item-count {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin-bottom: 12px;
}

.sell-btn {
  width: 100%;
  padding: 8px 16px;
  font-size: 13px;
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
  overflow-y: auto;
  animation: scaleIn 0.3s ease;
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

.selected-goods {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
  margin-bottom: 24px;
}

.selected-icon {
  font-size: 48px;
}

.selected-info {
  flex: 1;
}

.selected-name {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.selected-desc {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
}

.detail-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.detail-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
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

.qty-input {
  width: 60px;
  height: 32px;
  border: 2px solid var(--glass-border);
  border-radius: var(--border-radius-sm);
  background: white;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  outline: none;
  transition: all var(--transition-fast);
}

.qty-input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.quantity-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--success-500), var(--success-600));
  color: white;
  font-size: 20px;
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

.empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.empty-icon {
  font-size: 64px;
  opacity: 0.5;
  animation: float 3s ease-in-out infinite;
}

.empty-icon-image {
  width: 80px;
  height: 80px;
  object-fit: contain;
  opacity: 0.4;
  animation: float 3s ease-in-out infinite;
  image-rendering: auto;
}

.empty-icon-fallback {
  font-size: 64px;
  opacity: 0.5;
  animation: float 3s ease-in-out infinite;
}

.empty p {
  margin: 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
}

@media (max-width: 768px) {
  .inventory-page {
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

  .tabs {
    gap: 8px;
  }

  .tab-btn {
    padding: 10px 20px;
    font-size: 14px;
  }

  .items-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

.item-card.batch-selected {
  border: 2px solid var(--success-500);
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.15),
    rgba(34, 197, 94, 0.05)
  );
}

.batch-checkbox {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--success-500), var(--success-600));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  z-index: 10;
}

.check-icon {
  color: white;
  font-size: 18px;
  font-weight: 700;
}

.batch-quantity {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  width: 100%;
  justify-content: center;
}

.qty-btn {
  width: auto;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: none;
  border-radius: var(--border-radius-sm);
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

.qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.batch-sell-bar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 16px 24px;
  background: white;
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-xl);
  z-index: 3000;
  min-width: 350px;
  max-width: 90vw;
  animation: slideUp 0.3s ease;
}

.batch-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.batch-count {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.batch-total {
  font-size: 20px;
  font-weight: 700;
  color: var(--gold-600);
}

.batch-actions {
  display: flex;
  gap: 12px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
