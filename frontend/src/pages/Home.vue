/**
 * 文件名：Home.vue
 * 作者：开发者
 * 日期：2026-03-22
 * 版本：v2.16.0
 * 功能描述：农场主页面 - 显示农场视图、用户信息、地块管理、活动日志、退出游戏功能
 * 更新记录：
 *   2026-06-10 - v2.16.0 - 美化：修复quick-btn缺少position:relative导致
 *             ::before定位异常；header背景透明度0.18→0.35增强可读性；
 *             侧边栏接入玻璃容器样式；快速操作按钮颜色统一（收获=绿、
 *             种植=金、道具=暖棕）
 *   2026-03-22 - v1.5.0 - 完全重写，添加玻璃拟态、动画系统、一键收获功能；
 *             实现真正的一键收获功能；优化解锁地块弹窗，显示详细解锁要求；
 *             添加一键种植功能；修复一键种植只种部分地块的问题
 *   2026-03-23 - v1.9.0 - 优化品质提升界面，显示所有品质的完整解锁要求
 *             （等级、费用等）；优化各等级显示，添加独立经验条；创建个人
 *             中心界面显示完整玩家信息；把农场和世界等级经验条移到个人中心，
 *             主页只保留玩家经验条；添加玩家昵称编辑、头像选择功能；页面加载
 *             时自动检查升级；优化未解锁地块弹窗显示完整要求
 *   2026-03-24 - v1.13.0 - 昵称显示注册用户名，头像保存到数据库；添加作物信息
 *             弹窗，显示未成熟作物详细信息；收获作物显示三种经验获取；在个人
 *             中心添加三种经验值（玩家、农场、世界）的显示卡片；移除单独经验值
 *             模块，农场和世界等级进度参照玩家经验样式
 *   2026-03-25 - v2.2.0 - 调整头部布局，玩家、农场、世界信息垂直排列；修改剩余
 *             经验值显示；实施第一优先级优化：移除固定全量轮询，添加页面可见性
 *             控制、闲置自动降频、弹窗屏蔽刷新；实施第二优先级优化：添加局部更新
 *             功能，使用requestAnimationFrame优化渲染
 *   2026-03-26 - v2.4.0 - 添加活动日志面板，显示玩家最近的游戏操作日志；添加
 *             退出游戏按钮和确认对话框，实现安全退出功能
 *   2026-03-28 - v2.5.0 - 品质UI、等级进度、作物成长可视化完整实现；实时状态
 *             更新、性能优化、内存管理已完成
 *   2026-03-29 - v2.6.0 - 优化getLandPosition函数性能，添加缓存机制减少DOM查询频率
 *   2026-04-30 - v2.7.0 - 添加页面初始化加载覆盖层，显示进度条和详细加载信息
 *   2026-05-02 - v2.12.0 - 添加虚拟滚动和分页加载功能，支持三种渲染模式：
 *             traditional（传统）、infinite（分页）、virtual（虚拟）
 *   2026-05-22 - v2.13.0 - 使用拆分出的独立组件（UserInfo、CurrencyDisplay、
 *             Navbar、LoadingOverlay）重构代码，消除重复
 *   2026-06-09 - v2.15.0 - 提取 ProfileModal/OfflineRewardsModal 组件和
 *             useAnimations composable
 */
<template>
  <div class="home-page">
    <!-- 初始化加载覆盖层 -->
    <LoadingOverlay
      :visible="isInitialLoading"
      :progress="loadingProgress"
      :detail="loadingDetail"
    />

    <header class="header glass">
      <div class="header-left">
        <UserInfo @click-avatar="() => (showProfile = true)" />
        <div
          class="stamina-display"
          :class="{
            'low-stamina':
              staminaData.currentStamina < staminaData.maxStamina * 0.2,
          }"
        >
          <span class="stamina-icon">⚡</span>
          <span class="stamina-value"
            >{{ staminaData.currentStamina }}/{{ staminaData.maxStamina }}</span
          >
          <span v-if="staminaData.recoverTime" class="recover-time">
            ({{ formatStaminaTime(staminaData.recoverTime) }})
          </span>
        </div>
      </div>
      <div class="header-right">
        <CurrencyDisplay :amount="playerStore.playerData?.currency_num || 0" />
        <div
          class="world-level-display"
          @mouseenter="showWorldTooltip = true"
          @mouseleave="showWorldTooltip = false"
        >
          <span class="world-icon">🌍</span>
          <span class="world-level-text"
            >Lv.{{ playerStore.playerData?.world_level || 1 }}</span
          >
          <div v-if="showWorldTooltip" class="world-tooltip">
            <div class="tooltip-title">
              世界等级 {{ playerStore.playerData?.world_level || 1 }}
            </div>
            <div
              v-if="playerStore.levelProgress?.worldLevelInfo"
              class="tooltip-content"
            >
              <p>
                {{ playerStore.levelProgress.worldLevelInfo.world_name || '' }}
              </p>
              <p
                v-if="
                  playerStore.levelProgress.worldLevelInfo.unlock_player_level
                "
              >
                下一级需要玩家等级:
                {{
                  playerStore.levelProgress.worldLevelInfo.unlock_player_level
                }}
              </p>
            </div>
          </div>
        </div>
        <SoundSettings />
        <Navbar
          @shop="goToShop"
          @inventory="goToInventory"
          @currency-log="goToCurrencyLog"
          @game-events="goToGameEvents"
          @achievements="() => (showAchievements = true)"
          @daily-tasks="goToDailyTasks"
          @queue-manager="goToQueueManager"
          @logout="() => (showLogoutModal = true)"
        />
      </div>
    </header>

    <main class="main">
      <div v-if="farmStore.loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">加载农场数据中...</p>
      </div>
      <div v-else-if="farmStore.error" class="error-container">
        <span class="error-icon">⚠️</span>
        <p class="error-text">{{ farmStore.error }}</p>
      </div>
      <div v-else class="main-content">
        <div class="farm-section">
          <div class="quick-actions">
            <button
              class="quick-btn btn-success"
              :disabled="isHarvestingAll"
              @click="harvestAllMatured"
            >
              <span v-if="isHarvestingAll">⏳</span>
              <span v-else>🌾</span>
              <span v-if="isHarvestingAll"> 收获中...</span>
              <span v-else> 一键收获</span>
            </button>
            <button
              class="quick-btn btn-primary"
              @click="showQuickPlantModalFunc"
            >
              <span>🌱</span>
              一键种植
            </button>
            <button class="quick-btn btn-item" @click="openItemModal">
              <span>🧪</span>
              使用道具
            </button>
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
          </div>

          <!-- 传统模式 -->
          <LandGrid
            v-if="renderMode === 'traditional'"
            ref="landGridRef"
            @land-click="handleLandClick"
            @quality-click="handleQualityClick"
            @use-item="handleLandUseItem"
          />

          <!-- 优化模式（分页加载或虚拟滚动） -->
          <LandGridOptimized
            v-else
            ref="landGridOptimizedRef"
            :lands="farmStore.lands"
            :mode="renderMode"
            :initial-visible="20"
            :page-size="20"
            :item-height="180"
            @land-click="handleLandClick"
            @quality-click="handleQualityClick"
          />
        </div>
        <div class="sidebar-section">
          <ActivityLogPanel
            ref="activityLogRef"
            :limit="15"
            :refresh-interval="30000"
          />
        </div>
      </div>
    </main>

    <ActionModal v-model="showUnlockModal" title="解锁地块">
      <div v-if="selectedLand" class="unlock-content">
        <div class="land-preview">
          <span class="land-icon">🏗️</span>
          <span class="land-number">地块 {{ selectedLand.land_num }}</span>
        </div>
        <p v-if="selectedLand.description" class="unlock-desc">
          {{ selectedLand.description }}
        </p>
        <div class="unlock-requirements">
          <div class="requirement-item">
            <span class="req-icon">💡</span>
            <span class="req-label">解锁要求</span>
          </div>
          <div
            v-if="
              selectedLand.unlock_player_level !== null &&
              selectedLand.unlock_player_level !== undefined &&
              selectedLand.unlock_player_level > 0
            "
            class="requirement-item"
            :class="{
              'not-met':
                (playerStore.playerData?.player_level || 1) <
                selectedLand.unlock_player_level,
            }"
          >
            <span class="req-label">玩家等级</span>
            <span class="req-value">
              {{ playerStore.playerData?.player_level || 1 }} /
              {{ selectedLand.unlock_player_level }}
            </span>
          </div>
          <div
            v-if="
              selectedLand.unlock_farm_level !== null &&
              selectedLand.unlock_farm_level !== undefined &&
              selectedLand.unlock_farm_level > 0
            "
            class="requirement-item"
            :class="{
              'not-met':
                (playerStore.playerData?.farm_level || 1) <
                selectedLand.unlock_farm_level,
            }"
          >
            <span class="req-label">农场等级</span>
            <span class="req-value">
              {{ playerStore.playerData?.farm_level || 1 }} /
              {{ selectedLand.unlock_farm_level }}
            </span>
          </div>
          <div
            v-if="
              selectedLand.unlock_world_level !== null &&
              selectedLand.unlock_world_level !== undefined &&
              selectedLand.unlock_world_level > 0
            "
            class="requirement-item"
            :class="{
              'not-met':
                (playerStore.playerData?.world_level || 1) <
                selectedLand.unlock_world_level,
            }"
          >
            <span class="req-label">世界等级</span>
            <span class="req-value">
              {{ playerStore.playerData?.world_level || 1 }} /
              {{ selectedLand.unlock_world_level }}
            </span>
          </div>
          <div v-if="selectedLand.unlock_cost > 0" class="requirement-item">
            <span class="req-label">需要农场币</span>
            <span class="req-value">
              <span class="coin-icon">💰</span>
              {{ selectedLand.unlock_cost }}
            </span>
          </div>
          <div
            v-if="selectedLand.unlock_cost > 0"
            class="requirement-item"
            :class="{
              'not-met':
                playerStore.playerData?.currency_num < selectedLand.unlock_cost,
            }"
          >
            <span class="req-label">当前余额</span>
            <span class="req-value">
              <span class="coin-icon">💰</span>
              {{ playerStore.playerData?.currency_num || 0 }}
            </span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showUnlockModal = false">
            取消
          </button>
          <button
            class="btn btn-primary"
            :disabled="!canUnlockLand"
            @click="handleUnlock"
          >
            确认解锁
          </button>
        </div>
      </div>
    </ActionModal>

    <ActionModal v-model="showPlantModal" title="种植作物">
      <div class="plant-content">
        <div v-if="shopStore.inventory.seeds.length === 0" class="empty-seeds">
          <img
            class="empty-seeds-img"
            :src="getEmptyStateImage('seeds')"
            alt="没有种子"
            @error="onSeedImgError"
          />
          <p>没有种子，去商店购买吧！</p>
          <button class="btn btn-primary" @click="goToShop">去商店</button>
        </div>
        <div v-else class="seed-list">
          <div
            v-for="seed in shopStore.inventory.seeds"
            :key="seed.item_obj_id"
            class="seed-item card"
            @click="handleSelectSeed(seed)"
          >
            <div class="seed-info">
              <img
                class="seed-icon-img"
                :src="getSeedIconImage(seed.item_obj_id)"
                :alt="seed.item_name"
                @error="onSeedImgError"
              />
              <span class="seed-name">{{ seed.item_name }}</span>
            </div>
            <span class="seed-count badge-primary">x{{ seed.item_num }}</span>
          </div>
        </div>
      </div>
    </ActionModal>

    <ActionModal v-model="showHarvestModal" title="收获作物">
      <div v-if="selectedLand" class="harvest-content">
        <div class="harvest-preview">
          <span class="harvest-icon">🎉</span>
          <p class="harvest-message">{{ selectedLand.crop_name }} 已成熟！</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showHarvestModal = false">
            取消
          </button>
          <button class="btn btn-success" @click="handleHarvest">收获</button>
        </div>
      </div>
    </ActionModal>

    <ActionModal v-model="showQualityModal" title="提升品质">
      <div v-if="selectedLand" class="quality-content">
        <div class="quality-preview">
          <span class="quality-icon">✨</span>
          <div class="quality-current">
            <span class="quality-label">当前品质</span>
            <span class="quality-value"
              >{{ selectedLand.quality_name }} ({{
                selectedLand.current_quality
              }})</span
            >
          </div>
        </div>
        <div class="quality-list">
          <div
            v-for="quality in qualities"
            :key="quality.quality_id"
            class="quality-item"
            :class="{
              current: quality.quality_id === selectedLand.current_quality,
              unlocked: quality.quality_id < selectedLand.current_quality,
              next: quality.quality_id === selectedLand.current_quality + 1,
            }"
          >
            <div class="quality-header">
              <span class="quality-badge">{{ quality.quality_name }}</span>
              <span
                v-if="quality.quality_id === selectedLand.current_quality"
                class="status-badge current-badge"
                >当前</span
              >
              <span
                v-else-if="quality.quality_id < selectedLand.current_quality"
                class="status-badge unlocked-badge"
                >已解锁</span
              >
              <span v-else class="status-badge locked-badge">未解锁</span>
            </div>
            <p class="quality-desc">{{ quality.description }}</p>
            <div class="quality-requirements">
              <div class="req-row">
                <span class="req-label">玩家等级</span>
                <span
                  class="req-value"
                  :class="{
                    'not-met':
                      playerStore.playerData?.player_level <
                      quality.unlock_player_level,
                  }"
                >
                  {{ playerStore.playerData?.player_level || 0 }} /
                  {{ quality.unlock_player_level }}
                </span>
              </div>
              <div class="req-row">
                <span class="req-label">农场等级</span>
                <span
                  class="req-value"
                  :class="{
                    'not-met':
                      playerStore.playerData?.farm_level <
                      quality.unlock_farm_level,
                  }"
                >
                  {{ playerStore.playerData?.farm_level || 0 }} /
                  {{ quality.unlock_farm_level }}
                </span>
              </div>
              <div class="req-row">
                <span class="req-label">世界等级</span>
                <span
                  class="req-value"
                  :class="{
                    'not-met':
                      playerStore.playerData?.world_level <
                      quality.unlock_world_level,
                  }"
                >
                  {{ playerStore.playerData?.world_level || 0 }} /
                  {{ quality.unlock_world_level }}
                </span>
              </div>
              <div v-if="quality.quality_id > 1" class="req-row">
                <span class="req-label">升级费用</span>
                <span
                  class="req-value cost-value"
                  :class="{
                    'not-met':
                      playerStore.playerData?.currency_num <
                      quality.cover_cost_num,
                  }"
                >
                  <span class="coin-icon">💰</span>
                  {{ quality.cover_cost_num }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="nextQuality" class="next-upgrade">
          <p class="upgrade-hint">下一级品质：{{ nextQuality.quality_name }}</p>
        </div>
        <p v-else class="max-quality">🎉 已达到最高品质！</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showQualityModal = false">
            取消
          </button>
          <button
            v-if="nextQuality"
            class="btn btn-primary"
            :disabled="!canUpgradeQuality"
            @click="handleUpgradeQuality"
          >
            确认提升
          </button>
        </div>
      </div>
    </ActionModal>

    <ActionModal v-model="showItemModal" title="使用道具">
      <div class="item-content">
        <div v-if="farmStore.items.length === 0" class="empty-items">
          <span class="empty-icon">🎁</span>
          <p>没有可用道具，去商店购买吧！</p>
        </div>
        <div v-else class="item-list">
          <div
            v-for="item in farmStore.items"
            :key="item.item_obj_id"
            class="item-item card"
            @click="handleSelectItem(item)"
          >
            <div class="item-info">
              <span class="item-icon">✨</span>
              <div>
                <span class="item-name">{{ item.item_name }}</span>
                <span class="item-desc">{{ item.item_desc }}</span>
              </div>
            </div>
            <span class="item-count badge-warning">x{{ item.item_num }}</span>
          </div>
        </div>
      </div>
    </ActionModal>

    <ActionModal v-model="showQuickPlantModal" title="一键种植">
      <div v-if="showQuickPlantModal" class="quick-plant-content">
        <div v-if="shopStore.inventory.seeds.length === 0" class="empty-seeds">
          <img
            class="empty-seeds-img"
            :src="getEmptyStateImage('seeds')"
            alt="没有种子"
            @error="onSeedImgError"
          />
          <p>没有种子，去商店购买吧！</p>
          <button class="btn btn-primary" @click="goToShop">去商店</button>
        </div>
        <div v-else class="seed-list">
          <div class="plant-info">
            <p class="plant-count">
              可种植地块数：<strong>{{ availableLands.length }}</strong>
            </p>
          </div>
          <div
            v-for="seed in shopStore.inventory.seeds"
            :key="seed.item_obj_id"
            class="seed-item card"
            :class="{
              selected:
                selectedQuickPlantSeed?.item_obj_id === seed.item_obj_id,
            }"
            @click="selectQuickPlantSeed(seed)"
          >
            <div class="seed-info">
              <img
                class="seed-icon-img"
                :src="getSeedIconImage(seed.item_obj_id)"
                :alt="seed.item_name"
                @error="onSeedImgError"
              />
              <div>
                <span class="seed-name">{{ seed.item_name }}</span>
                <span class="seed-count">库存：x{{ seed.item_num }}</span>
              </div>
            </div>
            <span
              v-if="selectedQuickPlantSeed?.item_obj_id === seed.item_obj_id"
              class="selected-badge"
              >✓</span
            >
          </div>
        </div>
        <div v-if="selectedQuickPlantSeed" class="quick-plant-actions">
          <button
            class="btn btn-secondary"
            @click="showQuickPlantModal = false"
          >
            取消
          </button>
          <button
            class="btn btn-primary"
            :disabled="
              availableLands.length === 0 ||
              selectedQuickPlantSeed.item_num === 0 ||
              isQuickPlanting
            "
            @click="handleQuickPlant"
          >
            <span v-if="isQuickPlanting">⏳ 种植中...</span>
            <span v-else
              >种植
              {{
                Math.min(availableLands.length, selectedQuickPlantSeed.item_num)
              }}
              块</span
            >
          </button>
        </div>
      </div>
    </ActionModal>

    <!-- 个人中心弹窗 -->
    <ProfileModal v-model="showProfile" @open-avatar-selector="showAvatarSelector = true" />

    <ActionModal v-model="showAvatarSelector" title="选择头像">
      <div class="avatar-selector-content">
        <div class="avatar-grid">
          <div
            v-for="(avatar, index) in avatarOptions"
            :key="index"
            class="avatar-option"
            :class="{
              selected:
                selectedAvatar === avatar ||
                (selectedAvatar === null && playerAvatar === avatar),
            }"
            @click="selectAvatar(avatar)"
          >
            <span class="avatar-emoji">{{ avatar }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="cancelAvatarSelector">
            取消
          </button>
          <button class="btn btn-primary" @click="confirmAvatar">确认</button>
        </div>
      </div>
    </ActionModal>

    <CropInfoModal
      :visible="showCropInfoModal"
      :crop-info="selectedCropInfo"
      :harvest-time="selectedHarvestTime"
      :land-quality="selectedLandQuality"
      @close="showCropInfoModal = false"
    />

    <ActionModal v-model="showLogoutModal" title="退出游戏">
      <div class="logout-content">
        <div class="logout-icon">👋</div>
        <h3 class="logout-title">确定要退出游戏吗？</h3>
        <p class="logout-desc">您将被带回到登录页面</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showLogoutModal = false">
            取消
          </button>
          <button class="btn btn-danger" @click="handleLogout">确定退出</button>
        </div>
      </div>
    </ActionModal>

    <!-- 成就系统 -->
    <ActionModal v-model="showAchievements" title="成就系统">
      <AchievementList />
    </ActionModal>

    <!-- 成就解锁通知 -->
    <AchievementNotification ref="achievementNotificationRef" />

    <!-- 动画组件 -->
    <PlantAnimation
      v-for="anim in plantAnimations"
      :key="anim.id"
      :x="anim.x"
      :y="anim.y"
      @complete="removeAnimation('plant', anim.id)"
    />
    <HarvestAnimation
      v-for="anim in harvestAnimations"
      :key="anim.id"
      :x="anim.x"
      :y="anim.y"
      :show-coins="anim.showCoins"
      @complete="removeAnimation('harvest', anim.id)"
    />
    <UnlockAnimation
      v-for="anim in unlockAnimations"
      :key="anim.id"
      :x="anim.x"
      :y="anim.y"
      @complete="removeAnimation('unlock', anim.id)"
    />
    <UpgradeAnimation
      v-for="anim in upgradeAnimations"
      :key="anim.id"
      :x="anim.x"
      :y="anim.y"
      :new-quality="anim.newQuality"
      :quality-name="anim.qualityName"
      @complete="removeAnimation('upgrade', anim.id)"
    />
    <FloatingText
      v-for="ft in floatingTexts"
      :key="ft.id"
      :text="ft.text"
      :type="ft.type"
      :x="ft.x"
      :y="ft.y"
      @complete="removeFloatingText(ft.id)"
    />

    <ItemUseAnimation
      v-for="anim in itemUseAnimations"
      :key="anim.id"
      :x="anim.x"
      :y="anim.y"
      :item-name="anim.itemName"
      :item-icon="anim.itemIcon"
      :boost-text="anim.boostText"
      @complete="removeItemUseAnimation(anim.id)"
    />

    <ItemDropPopup :drops="itemDropPopups" />

    <!-- 离线收益弹窗 -->
    <OfflineRewardsModal v-model="showOfflineRewards" :offline-rewards-data="offlineRewardsData" />
  </div>
</template>

<script setup>
import {
  onMounted,
  ref,
  watch,
  onUnmounted,
  computed,
  shallowRef,
  shallowReactive,
} from 'vue';
import { useRouter } from 'vue-router';
import { usePlayerStore } from '../stores/player';
import { useFarmStore } from '../stores/farm';
import { useShopStore } from '../stores/shop';
import { useToastStore } from '../stores/toast';
import { useLoadingStore } from '../stores/loading';
import { gameService } from '../services/gameService';
import { logout } from '../services/authService';
import wsService from '../services/websocketService';
import LandGrid from '../components/LandGrid.vue';
import { LandGridOptimized } from '../components/optimization.js';
import ActionModal from '../components/ActionModal.vue';
import CropInfoModal from '../components/CropInfoModal.vue';
import ActivityLogPanel from '../components/ActivityLogPanel.vue';
import AchievementList from '../components/AchievementList.vue';
import AchievementNotification from '../components/AchievementNotification.vue';
import PlantAnimation from '../components/PlantAnimation.vue';
import HarvestAnimation from '../components/HarvestAnimation.vue';
import UnlockAnimation from '../components/UnlockAnimation.vue';
import UpgradeAnimation from '../components/UpgradeAnimation.vue';
import SoundSettings from '../components/SoundSettings.vue';
import UserInfo from '../components/UserInfo.vue';
import CurrencyDisplay from '../components/CurrencyDisplay.vue';
import Navbar from '../components/Navbar.vue';
import LoadingOverlay from '../components/LoadingOverlay.vue';
import FloatingText from '../components/FloatingText.vue';
import ItemUseAnimation from '../components/ItemUseAnimation.vue';
import ItemDropPopup from '../components/ItemDropPopup.vue';
import ProfileModal from '../components/ProfileModal.vue';
import OfflineRewardsModal from '../components/OfflineRewardsModal.vue';
import { useAnimations } from '../composables/useAnimations';
import { getSeedIconImage, getEmptyStateImage } from '../utils/imagePaths';
import soundManager from '../services/soundManager';

// 定义组件名称，用于 keep-alive 缓存
defineOptions({
  name: 'Home',
});

/** 种子/空状态图片加载失败时隐藏图片 */
function onSeedImgError(event) {
  event.target.style.display = 'none';
}

const router = useRouter();
const playerStore = usePlayerStore();
const farmStore = useFarmStore();
const shopStore = useShopStore();
const toastStore = useToastStore();
const loadingStore = useLoadingStore();

const showUnlockModal = ref(false);
const showPlantModal = ref(false);
const showHarvestModal = ref(false);
const showQualityModal = ref(false);
const showItemModal = ref(false);
const showQuickPlantModal = ref(false);
const selectedLand = ref(null);
const selectedItem = ref(null);
const selectedQuickPlantSeed = ref(null);
const showProfile = ref(false);
const showAvatarSelector = ref(false);
const selectedAvatar = ref(null);
const showCropInfoModal = ref(false);
const selectedCropInfo = ref(null);
const selectedHarvestTime = ref(null);
const selectedLandQuality = ref(null);
const activityLogRef = ref(null);
const showLogoutModal = ref(false);
const showAchievements = ref(false);
const showOfflineRewards = ref(false);
const offlineRewardsData = ref(null);
const showDetails = ref(false);
const achievementNotificationRef = ref(null);
const landGridRef = ref(null);
const landGridOptimizedRef = ref(null);

// 体力值状态
const staminaData = ref({
  currentStamina: 100,
  maxStamina: 200,
  recoverTime: null,
});
const staminaTimer = ref(null);

// 世界等级悬浮状态
const showWorldTooltip = ref(false);

// 渲染模式：traditional（传统）、infinite（分页）、virtual（虚拟）
const renderMode = ref('infinite');

// 渲染模式配置
const renderModes = [
  { value: 'traditional', label: '传统', icon: '📦' },
  { value: 'infinite', label: '分页', icon: '🔄' },
  { value: 'virtual', label: '虚拟', icon: '⚡' },
];

// 初始化加载状态
const isInitialLoading = ref(true);
const loadingProgress = ref(0);
const loadingDetail = ref('正在连接服务器...');

// 动画系统（composable）
const {
  plantAnimations,
  harvestAnimations,
  unlockAnimations,
  upgradeAnimations,
  itemUseAnimations,
  itemDropPopups,
  floatingTexts,
  landPositionsCache,
  addPlantAnimation,
  addHarvestAnimation,
  addUnlockAnimation,
  addUpgradeAnimation,
  addItemUseAnimation,
  addItemDrops,
  removeAnimation,
  removeItemUseAnimation,
  addFloatingText,
  removeFloatingText,
  updateLandPositionsCache,
  getLandPosition,
  clearLandCache,
} = useAnimations(landGridRef);

const playerAvatar = computed(() => {
  return playerStore.playerData?.avatar || '👤';
});

const avatarOptions = [
  '👤',
  '👨',
  '👩',
  '🧑',
  '👶',
  '👴',
  '👵',
  '🧔',
  '👱',
  '🧑‍🦰',
  '👨‍🦰',
  '👩‍🦰',
  '🧑‍🦱',
  '👨‍🦱',
  '👩‍🦱',
  '🧑‍🦲',
  '👨‍🦲',
  '👩‍🦲',
  '👨‍🦼',
  '👩‍🦼',
  '🦸',
  '🦸‍♂️',
  '🦸‍♀️',
  '🧙',
  '🧙‍♂️',
  '🧙‍♀️',
  '🧝',
  '🧝‍♂️',
  '🧝‍♀️',
  '🧛',
  '🧛‍♂️',
  '🧛‍♀️',
  '🧟',
  '🧟‍♂️',
  '🧟‍♀️',
  '🧞',
  '🧞‍♂️',
  '🧞‍♀️',
  '🧜',
  '🧜‍♂️',
  '🧜‍♀️',
  '🧚',
  '🧚‍♂️',
  '🧚‍♀️',
  '👼',
  '🤴',
  '👸',
  '🎅',
  '🤶',
  '🦹',
  '🦹‍♂️',
  '🦹‍♀️',
];

let refreshTimer = null;
let growthTimer = null;
let lastActivityTime = ref(Date.now());
let isPageVisible = ref(true);
let isIdle = ref(false);
const IDLE_THRESHOLD = 30000;
const NORMAL_GROWTH_INTERVAL = 1000;
const IDLE_GROWTH_INTERVAL = 5000;

const activeModals = computed(() => {
  return (
    showUnlockModal.value ||
    showPlantModal.value ||
    showHarvestModal.value ||
    showQualityModal.value ||
    showItemModal.value ||
    showQuickPlantModal.value ||
    showProfile.value ||
    showAvatarSelector.value ||
    showCropInfoModal.value ||
    showLogoutModal.value
  );
});

const qualities = [
  {
    quality_id: 1,
    quality_name: '普通',
    cover_cost_num: 0,
    unlock_player_level: 200,
    unlock_farm_level: 100,
    unlock_world_level: 10,
    description: '基础地块品质，无额外加成',
  },
  {
    quality_id: 2,
    quality_name: '铜',
    cover_cost_num: 5000,
    unlock_player_level: 400,
    unlock_farm_level: 200,
    unlock_world_level: 20,
    description: '铜品质地块，产量小幅提升',
  },
  {
    quality_id: 3,
    quality_name: '铁',
    cover_cost_num: 20000,
    unlock_player_level: 600,
    unlock_farm_level: 300,
    unlock_world_level: 30,
    description: '铁品质地块，产量中等提升',
  },
  {
    quality_id: 4,
    quality_name: '金',
    cover_cost_num: 50000,
    unlock_player_level: 700,
    unlock_farm_level: 350,
    unlock_world_level: 40,
    description: '金品质地块，产量大幅提升',
  },
  {
    quality_id: 5,
    quality_name: '翡翠',
    cover_cost_num: 200000,
    unlock_player_level: 800,
    unlock_farm_level: 400,
    unlock_world_level: 50,
    description: '翡翠品质地块，产量显著提升',
  },
  {
    quality_id: 6,
    quality_name: '钻石',
    cover_cost_num: 500000,
    unlock_player_level: 850,
    unlock_farm_level: 450,
    unlock_world_level: 60,
    description: '钻石品质地块，产量极高',
  },
  {
    quality_id: 7,
    quality_name: '狱',
    cover_cost_num: 2000000,
    unlock_player_level: 950,
    unlock_farm_level: 480,
    unlock_world_level: 80,
    description: '狱品质地块，产量恐怖',
  },
  {
    quality_id: 8,
    quality_name: '无尽',
    cover_cost_num: 10000000,
    unlock_player_level: 1000,
    unlock_farm_level: 500,
    unlock_world_level: 100,
    description: '无尽品质地块，产量极限',
  },
];

const nextQuality = computed(() => {
  if (!selectedLand.value) return null;
  const currentQuality = selectedLand.value.current_quality || 1;
  if (currentQuality >= 8) return null;
  return qualities.find((q) => q.quality_id === currentQuality + 1);
});

const canUpgradeQuality = computed(() => {
  if (!nextQuality.value || !playerStore.playerData) return false;
  return (
    playerStore.playerData.currency_num >= nextQuality.value.cover_cost_num
  );
});

const canUnlockLand = computed(() => {
  if (!selectedLand.value || !playerStore.playerData) return false;

  const land = selectedLand.value;
  const playerData = playerStore.playerData;

  if (
    land.unlock_player_level &&
    playerData.player_level < land.unlock_player_level
  )
    return false;
  if (land.unlock_farm_level && playerData.farm_level < land.unlock_farm_level)
    return false;
  if (
    land.unlock_world_level &&
    playerData.world_level < land.unlock_world_level
  )
    return false;
  if (land.unlock_cost > 0 && playerData.currency_num < land.unlock_cost)
    return false;

  return true;
});

const availableLands = computed(() => {
  return farmStore.lands.filter((land) => land.is_unlocked && !land.crop_id);
});

const getFarmLevelProgress = () => {
  if (!playerStore.levelProgress?.farmLevelInfo) return 0;
  const farmInfo = playerStore.levelProgress.farmLevelInfo;
  const currentLevel = playerStore.playerData?.player_level || 1;
  const requiredLevel = farmInfo.unlock_player_level;
  return Math.min(100, Math.max(0, (currentLevel / requiredLevel) * 100));
};

const getWorldLevelProgress = () => {
  if (!playerStore.levelProgress?.worldLevelInfo) return 0;
  const worldInfo = playerStore.levelProgress.worldLevelInfo;
  const currentLevel = playerStore.playerData?.player_level || 1;
  const requiredLevel = worldInfo.unlock_player_level;
  return Math.min(100, Math.max(0, (currentLevel / requiredLevel) * 100));
};

const harvestAllMatured = async () => {
  try {
    isHarvestingAll.value = true;
    showMessage('🌾 正在收获成熟作物...', 'info');

    const result = await farmStore.harvestAllMatured();
    if (result.success) {
      const maturedLands = farmStore.lands.filter(
        (land) => land.is_unlocked && land.crop_id && farmStore.isMatured(land)
      );
      maturedLands.forEach((land) => {
        addHarvestAnimation(land.land_num, true);
      });

      if (result.itemDrops && result.itemDrops.length > 0) {
        result.itemDrops.forEach((drop) => {
          itemDropPopups.value.push({
            id: `drop-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            itemName: drop.itemName || `道具#${drop.itemId}`,
            count: drop.count || 1,
            source: '一键收获掉落',
            cropName: drop.cropName || '',
            landNum: drop.landNum || '',
            icon:
              {
                1: '🌾',
                2: '🌾',
                3: '🌾',
                4: '⚡',
                5: '⚡',
                6: '⚡',
                7: '🌾',
                8: '⚡',
                9: '🍀',
                10: '⏳',
                11: '🌟',
                12: '🌍',
                13: '🧪',
                14: '💰',
                15: '📖',
                16: '📗',
                17: '🎁',
                18: '💊',
                19: '💊',
                20: '💊',
              }[drop.itemId] || '🎁',
            rarity:
              {
                1: 'common',
                2: 'uncommon',
                3: 'rare',
                4: 'common',
                5: 'uncommon',
                6: 'rare',
                7: 'epic',
                8: 'epic',
                9: 'uncommon',
                10: 'rare',
                11: 'legendary',
                12: 'rare',
                13: 'uncommon',
                14: 'uncommon',
                15: 'rare',
                16: 'rare',
                17: 'legendary',
                18: 'common',
                19: 'uncommon',
                20: 'epic',
              }[drop.itemId] || 'common',
            duration: 4000,
          });
        });
      }

      let messageText = `🌾 ${result.message} 总产量：${result.totalYield}`;
      if (result.totalExp) {
        messageText += ` | 获得经验：玩家+${result.totalExp.playerExp} 农场+${result.totalExp.farmExp} 世界+${result.totalExp.worldExp}`;
      }
      showMessage(messageText, 'success');
      await shopStore.fetchInventory();
      await playerStore.fetchPlayerData();
      await playerStore.fetchLevelProgress();
      activityLogRef.value?.refresh();
    } else {
      soundManager.play('error');
      showMessage(result.message || '收获失败', 'error');
    }
  } catch (err) {
    soundManager.play('error');
    showMessage(err.response?.data?.message || err.message, 'error');
  } finally {
    isHarvestingAll.value = false;
  }
};

const updateActivity = () => {
  lastActivityTime.value = Date.now();
  isIdle.value = false;
};

const checkIdleStatus = () => {
  const now = Date.now();
  if (now - lastActivityTime.value >= IDLE_THRESHOLD) {
    isIdle.value = true;
  }
};

let animationFrameId = null;

const updateGrowthProgress = () => {
  if (!isPageVisible.value || activeModals.value) {
    return;
  }

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  animationFrameId = requestAnimationFrame(() => {
    farmStore.lands.forEach((land) => {
      if (land.crop_id && land.harvest_time) {
        farmStore.updateLandLocally(land.land_num, {
          growthProgress: farmStore.getGrowthProgress(land),
          isMatured: farmStore.isMatured(land),
        });
      }
    });
    animationFrameId = null;
  });
};

const checkMaturedCrops = () => {
  if (!isPageVisible.value || activeModals.value) {
    return;
  }

  const hasMatured = farmStore.lands.some(
    (land) => land.crop_id && !land.notifiedMature && farmStore.isMatured(land)
  );

  if (hasMatured) {
    farmStore.lands.forEach((land) => {
      if (land.crop_id && !land.notifiedMature && farmStore.isMatured(land)) {
        farmStore.updateLandLocally(land.land_num, { notifiedMature: true });
      }
    });
    triggerDataSync();
  }
};

const triggerDataSync = async () => {
  if (activeModals.value) {
    return;
  }

  try {
    await Promise.all([farmStore.fetchLands(), playerStore.fetchPlayerData()]);
  } catch (error) {
    console.error('数据同步失败', error);
  }
};

const restartGrowthTimer = () => {
  if (growthTimer) {
    clearInterval(growthTimer);
  }

  const interval = isIdle.value ? IDLE_GROWTH_INTERVAL : NORMAL_GROWTH_INTERVAL;

  growthTimer = setInterval(() => {
    updateGrowthProgress();
    checkMaturedCrops();
    checkIdleStatus();
  }, interval);
};

const handleVisibilityChange = () => {
  isPageVisible.value = !document.hidden;

  if (isPageVisible.value) {
    updateActivity();
    restartGrowthTimer();
    triggerDataSync();
  } else {
    if (growthTimer) {
      clearInterval(growthTimer);
    }
  }
};

const handleUserActivity = () => {
  updateActivity();
  if (isIdle.value) {
    restartGrowthTimer();
  }
};

onMounted(async () => {
  try {
    loadingDetail.value = '正在加载玩家数据...';
    loadingProgress.value = 10;
    await playerStore.fetchPlayerData();

    loadingDetail.value = '正在加载等级进度...';
    loadingProgress.value = 30;
    await playerStore.fetchLevelProgress();

    loadingDetail.value = '正在加载地块数据...';
    loadingProgress.value = 50;
    // IS-05：fetchLands 内部会自动调用 checkBoostExpiration 检测道具过期
    await farmStore.fetchLands();

    loadingDetail.value = '正在加载作物配置...';
    loadingProgress.value = 70;
    await farmStore.fetchCrops();

    loadingDetail.value = '正在加载道具配置...';
    loadingProgress.value = 80;
    await farmStore.fetchItems();

    loadingDetail.value = '正在加载库存数据...';
    loadingProgress.value = 90;
    await shopStore.fetchInventory();

    loadingDetail.value = '正在检查升级...';
    loadingProgress.value = 95;
    try {
      await gameService.checkAndUpgrade();
      await playerStore.fetchPlayerData();
      await playerStore.fetchLevelProgress();
    } catch (upgradeError) {
      console.log('检查升级完成或无需要升级', upgradeError);
    }

    loadingDetail.value = '初始化完成！';
    loadingProgress.value = 100;
    await new Promise((resolve) => setTimeout(resolve, 300));
    isInitialLoading.value = false;

    fetchStamina();
    startStaminaTimer();
    fetchOfflineRewards();
  } catch (error) {
    console.error('初始化数据加载失败', error);
    loadingDetail.value = '加载失败，请刷新页面';
    showMessage('初始化失败，请刷新页面重试', 'error');
    isInitialLoading.value = false;
  }

  // 注册WebSocket消息处理
  registerWebSocketHandlers();

  restartGrowthTimer();

  document.addEventListener('visibilitychange', handleVisibilityChange);
  document.addEventListener('mousemove', handleUserActivity);
  document.addEventListener('keydown', handleUserActivity);
  document.addEventListener('click', handleUserActivity);
  document.addEventListener('scroll', handleUserActivity);
  window.addEventListener('resize', clearLandCache);
  window.addEventListener('scroll', clearLandCache);
});

onUnmounted(() => {
  if (growthTimer) {
    clearInterval(growthTimer);
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  if (staminaTimer.value) {
    clearInterval(staminaTimer.value);
  }

  // 清理WebSocket处理函数
  unregisterWebSocketHandlers();

  document.removeEventListener('visibilitychange', handleVisibilityChange);
  document.removeEventListener('mousemove', handleUserActivity);
  document.removeEventListener('keydown', handleUserActivity);
  document.removeEventListener('click', handleUserActivity);
  document.removeEventListener('scroll', handleUserActivity);
  window.removeEventListener('resize', clearLandCache);
  window.removeEventListener('scroll', clearLandCache);
});

watch(
  () => showPlantModal.value,
  (val) => {
    if (val) {
      shopStore.fetchInventory();
    }
  }
);

watch(
  () => showQuickPlantModal.value,
  (val) => {
    if (val) {
      shopStore.fetchInventory();
      selectedQuickPlantSeed.value = null;
    }
  }
);

const showQuickPlantModalFunc = () => {
  showQuickPlantModal.value = true;
};

const openItemModal = async () => {
  if (farmStore.items.value.length === 0) {
    await farmStore.fetchItems(true);
  }
  showItemModal.value = true;
};

const handleLandUseItem = async (land) => {
  handleLandClick(land);
  if (farmStore.items.value.length === 0) {
    await farmStore.fetchItems(true);
  }
  showItemModal.value = true;
};

const selectQuickPlantSeed = (seed) => {
  selectedQuickPlantSeed.value = seed;
};

// 添加加载状态
const isQuickPlanting = ref(false);
const isHarvestingAll = ref(false);

const handleQuickPlant = async () => {
  if (!selectedQuickPlantSeed.value || availableLands.value.length === 0)
    return;

  const seed = { ...selectedQuickPlantSeed.value };
  const idleLands = [...availableLands.value];
  const maxCount = Math.min(idleLands.length, seed.item_num);
  let successCount = 0;
  const failedLands = [];

  try {
    isQuickPlanting.value = true;
    showMessage(`🌱 正在种植 ${seed.item_name}...`, 'info');

    for (let i = 0; i < maxCount; i++) {
      const land = idleLands[i];
      try {
        await farmStore.plantCropWithoutFetch(land.land_num, seed.item_obj_id);
        addPlantAnimation(land.land_num);
        successCount++;
      } catch (landError) {
        failedLands.push({
          landNum: land.land_num,
          error: landError.response?.data?.message || landError.message,
        });
      }
    }

    if (successCount > 0) {
      let message = `🌱 成功种植 ${seed.item_name} x${successCount} 块！`;
      if (failedLands.length > 0) {
        message += ` 失败 ${failedLands.length} 块`;
      }
      showMessage(message, 'success');
      await shopStore.fetchInventory();
      activityLogRef.value?.refresh();
    } else {
      let errorMessage = '种植失败';
      if (failedLands.length > 0) {
        errorMessage = failedLands[0].error;
      }
      showMessage(errorMessage, 'error');
    }
  } catch (err) {
    showMessage(err.response?.data?.message || err.message, 'error');
  } finally {
    isQuickPlanting.value = false;
    showQuickPlantModal.value = false;
    selectedQuickPlantSeed.value = null;
  }
};

const handleLandClick = (land) => {
  if (!land.is_unlocked) {
    selectedLand.value = land;
    console.log('点击未解锁地块，地块数据:', land);
    showUnlockModal.value = true;
  } else if (land.crop_id && farmStore.isMatured(land)) {
    selectedLand.value = land;
    showHarvestModal.value = true;
  } else if (land.crop_id && !farmStore.isMatured(land)) {
    const cropInfo = farmStore.crops.find((c) => c.crop_id === land.crop_id);
    selectedCropInfo.value = cropInfo || null;
    selectedHarvestTime.value = land.harvest_time;
    selectedLandQuality.value = land.current_quality;
    showCropInfoModal.value = true;
  } else if (!land.crop_id) {
    selectedLand.value = land;
    showPlantModal.value = true;
  }
};

const handleQualityClick = (land) => {
  selectedLand.value = land;
  showQualityModal.value = true;
};

const handleUnlock = async () => {
  try {
    await farmStore.unlockLand(selectedLand.value.land_num);
    addUnlockAnimation(selectedLand.value.land_num);
    showMessage('🎉 解锁成功！', 'success');
    activityLogRef.value?.refresh();
  } catch (err) {
    soundManager.play('error');
    showMessage(err.response?.data?.message || err.message, 'error');
  } finally {
    showUnlockModal.value = false;
  }
};

const handleSelectSeed = async (seed) => {
  try {
    await farmStore.plantCrop(selectedLand.value.land_num, seed.item_obj_id);
    addPlantAnimation(selectedLand.value.land_num);
    showMessage(`🌱 种植 ${seed.item_name} 成功！`, 'success');
    activityLogRef.value?.refresh();
  } catch (err) {
    soundManager.play('error');
    showMessage(err.response?.data?.message || err.message, 'error');
  } finally {
    showPlantModal.value = false;
  }
};

const handleHarvest = async () => {
  try {
    const result = await farmStore.harvestCrop(selectedLand.value.land_num);
    addHarvestAnimation(selectedLand.value.land_num, true);

    const pos = getLandPosition(selectedLand.value.land_num);
    if (result.exp && result.exp.playerExp > 0) {
      addFloatingText(`+${result.exp.playerExp} EXP`, 'exp', pos.x, pos.y - 20);
    }

    if (result.itemDrops && result.itemDrops.length > 0) {
      addItemDrops(
        result.itemDrops,
        result.cropName,
        selectedLand.value.land_num
      );
    }

    let messageText = `🌾 收获 ${result.cropName} x${result.yield}！`;
    if (result.exp) {
      messageText += ` | 获得经验：玩家+${result.exp.playerExp} 农场+${result.exp.farmExp} 世界+${result.exp.worldExp}`;
    }
    showMessage(messageText, 'success');
    await shopStore.fetchInventory();
    await playerStore.fetchPlayerData();
    await playerStore.fetchLevelProgress();
    activityLogRef.value?.refresh();
  } catch (err) {
    soundManager.play('error');
    showMessage(err.response?.data?.message || err.message, 'error');
  } finally {
    showHarvestModal.value = false;
  }
};

const handleUpgradeQuality = async () => {
  try {
    const result = await farmStore.upgradeLandQuality(
      selectedLand.value.land_num,
      selectedLand.value.current_quality + 1
    );
    addUpgradeAnimation(
      selectedLand.value.land_num,
      selectedLand.value.current_quality + 1,
      result.qualityName
    );
    showMessage(`✨ 品质提升到 ${result.qualityName}！`, 'success');
    activityLogRef.value?.refresh();
  } catch (err) {
    soundManager.play('error');
    showMessage(err.response?.data?.message || err.message, 'error');
  } finally {
    showQualityModal.value = false;
  }
};

const handleSelectItem = async (item) => {
  const needLand = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13];
  const noNeedLand = [11, 14, 15, 16, 17, 18, 19, 20];

  if (needLand.includes(item.item_obj_id) && !selectedLand.value) {
    showMessage('请先选中一个地块', 'warning');
    return;
  }

  const landNum = needLand.includes(item.item_obj_id)
    ? selectedLand.value.land_num
    : undefined;

  try {
    const result = await farmStore.useItem(item.item_obj_id, landNum);

    const iconMap = {
      1: '🌾',
      2: '🌾',
      3: '🌾',
      4: '⚡',
      5: '⚡',
      6: '⚡',
      7: '🌾',
      8: '⚡',
      9: '🍀',
      10: '⏳',
      11: '🌟',
      12: '🌍',
      13: '🧪',
      14: '💰',
      15: '📖',
      16: '📗',
      17: '🎁',
      18: '💊',
      19: '💊',
      20: '💊',
    };
    const boostMap = {
      1: '产量+20%',
      2: '产量+50%',
      3: '产量+100%',
      4: '速度+20%',
      5: '速度+50%',
      6: '速度+80%',
      7: '产量+200%',
      8: '速度+150%',
      9: '双倍收获50%',
      10: '立即成熟',
      11: '全局+50%/24h',
      12: '品质+1级',
      13: '双倍经验',
      14: '随机金币',
      15: '随机奖励',
      16: '农场经验+5000',
      17: '世界经验+2000',
      18: '体力+50',
      19: '体力+200',
      20: '体力全满',
    };

    if (landNum) {
      addItemUseAnimation(
        item.item_name,
        iconMap[item.item_obj_id] || '✨',
        boostMap[item.item_obj_id] || '',
        landNum
      );
    }

    const resultMessageMap = {
      14: '💰 金币 +' + (result.data?.goldAmount || '随机'),
      15: '🎁 获得随机道具奖励',
      16: '📖 农场经验 +5000',
      17: '📗 世界经验 +2000',
      18: '💊 体力 +50',
      19: '💊 体力 +200',
      20: '💊 体力已恢复至满',
    };

    showMessage(
      resultMessageMap[item.item_obj_id] || `✨ 使用 ${item.item_name} 成功！`,
      'success'
    );

    if (!needLand.includes(item.item_obj_id)) {
      await playerStore.fetchPlayerData();
      await playerStore.fetchLevelProgress();
    }
    await shopStore.fetchInventory();
    activityLogRef.value?.refresh();
  } catch (err) {
    showMessage(err.response?.data?.message || err.message, 'error');
  } finally {
    showItemModal.value = false;
  }
};

const showMessage = (msg, type = 'success', duration = 3000) => {
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

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const selectAvatar = (avatar) => {
  selectedAvatar.value = avatar;
};

const cancelAvatarSelector = () => {
  selectedAvatar.value = null;
  showAvatarSelector.value = false;
};

const confirmAvatar = async () => {
  if (!selectedAvatar.value) {
    showAvatarSelector.value = false;
    return;
  }

  try {
    await playerStore.updateAvatar(selectedAvatar.value);
    showMessage('头像更换成功！', 'success');
  } catch (err) {
    showMessage(err.response?.data?.message || err.message, 'error');
  } finally {
    selectedAvatar.value = null;
    showAvatarSelector.value = false;
  }
};

const goToShop = () => {
  showPlantModal.value = false;
  router.push('/shop');
};
const goToInventory = () => router.push('/inventory');
const goToCurrencyLog = () => router.push('/currency-log');
const goToQueueManager = () => router.push('/queue-manager');
const goToGameEvents = () => router.push('/game-events');
const goToDailyTasks = () => router.push('/daily-tasks');

const formatStaminaTime = (totalSeconds) => {
  if (!totalSeconds || totalSeconds <= 0) return '';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins > 0) {
    return `${mins}分${secs}秒`;
  }
  return `${secs}秒`;
};

const fetchStamina = async () => {
  try {
    const result = await gameService.getStamina();
    if (result.success && result.data) {
      staminaData.value = result.data;
    }
  } catch (err) {
    console.error('获取体力失败', err);
  }
};

const startStaminaTimer = () => {
  if (staminaTimer.value) {
    clearInterval(staminaTimer.value);
  }
  staminaTimer.value = setInterval(fetchStamina, 30000);
};

const fetchOfflineRewards = async () => {
  try {
    const result = await gameService.getOfflineRewards();
    if (result.success && result.data && result.data.hasRewards) {
      offlineRewardsData.value = result.data;
      showDetails.value = false;
      showOfflineRewards.value = true;
    }
  } catch (err) {
    console.error('获取离线收益失败', err);
  }
};

const handleLogout = async () => {
  try {
    // 断开WebSocket连接
    wsService.disconnect();
    await logout();
    showLogoutModal.value = false;
    router.push('/login');
  } catch (error) {
    console.error('退出登录失败:', error);
    showMessage('退出登录失败，请重试', 'error');
  }
};

// WebSocket消息处理函数
const wsHandlers = {
  landUnlocked: (data) => {
    showMessage(`🎉 地块 ${data.landNum} 解锁成功！`, 'success');
    farmStore.fetchLands();
  },
  qualityUpgraded: (data) => {
    showMessage(
      `✨ 地块 ${data.landNum} 品质提升到 ${data.qualityName}！`,
      'success'
    );
    farmStore.fetchLands();
  },
  cropPlanted: (data) => {
    showMessage(`🌱 种植 ${data.cropName} 成功！`, 'success');
    farmStore.fetchLands();
  },
  cropHarvested: (data) => {
    let messageText = `🌾 收获 ${data.cropName} x${data.yield}！`;
    if (data.exp) {
      messageText += ` | 获得经验：玩家+${data.exp.playerExp} 农场+${data.exp.farmExp} 世界+${data.exp.worldExp}`;
    }
    showMessage(messageText, 'success');
    farmStore.fetchLands();
    playerStore.fetchPlayerData();
    playerStore.fetchLevelProgress();
    shopStore.fetchInventory();
  },
  cropSold: (data) => {
    showMessage(`💰 出售作物获得 ${data.totalAmount} 农场币！`, 'success');
    playerStore.fetchPlayerData();
  },
  harvestAllCompleted: (data) => {
    let messageText = `🌾 ${data.message} 总产量：${data.totalYield}`;
    if (data.totalExp) {
      messageText += ` | 获得经验：玩家+${data.totalExp.playerExp} 农场+${data.totalExp.farmExp} 世界+${data.totalExp.worldExp}`;
    }
    showMessage(messageText, 'success');
    farmStore.fetchLands();
    playerStore.fetchPlayerData();
    playerStore.fetchLevelProgress();
    shopStore.fetchInventory();
  },
  achievementUnlocked: (data) => {
    if (data.achievements && data.achievements.length > 0) {
      data.achievements.forEach((achievement) => {
        showMessage(
          `🏆 成就解锁：${achievement.achievement_name}！`,
          'success'
        );
        // 显示成就解锁通知
        if (achievementNotificationRef.value) {
          achievementNotificationRef.value.showNotification(achievement);
        }
      });
    }
  },
  notification: (data) => {
    showMessage(data.message, 'info');
  },
};

// 注册WebSocket消息处理
const registerWebSocketHandlers = () => {
  Object.entries(wsHandlers).forEach(([event, handler]) => {
    wsService.on(event, handler);
  });
};

// 清理WebSocket消息处理
const unregisterWebSocketHandlers = () => {
  Object.entries(wsHandlers).forEach(([event, handler]) => {
    wsService.off(event, handler);
  });
};
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 12px 20px 100px;
  gap: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-radius: var(--radius-xl);
  background: rgba(255,252,245,.35);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  animation: fadeIn .5s ease;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  font-size: 1.125rem;
  color: var(--text-primary);
}

.error-icon {
  font-size: 48px;
}

.main-content {
  display: flex;
  gap: 20px;
  animation: fadeInUp 0.5s ease;
}

.farm-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-section {
  width: 360px;
  flex-shrink: 0;
  padding: 16px;
  border-radius: var(--radius-xl);
  background: rgba(255,252,245,.25);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  box-shadow: 0 4px 24px rgba(0,0,0,.06);
}

.farm-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeInUp 0.5s ease;
}

.quick-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: .875rem;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  color: white;
  overflow: hidden;
  transition: all .25s cubic-bezier(.4,0,.2,1);
}

.quick-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), transparent);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.quick-btn:hover::before {
  opacity: 1;
}

.quick-btn:not(:disabled):hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.quick-btn:not(:disabled):active {
  transform: translateY(-1px) scale(0.97);
  transition: transform 0.1s ease;
}

/* 快速操作按钮颜色统一 */
.quick-btn.btn-primary {
  background: linear-gradient(135deg, var(--gold-400) 0%, var(--gold-600) 100%);
  color: #3d2e0a;
}

.quick-btn.btn-primary:not(:disabled):hover {
  background: linear-gradient(135deg, #f5d060 0%, #d4a017 100%);
  box-shadow: 0 8px 25px rgba(212, 160, 23, 0.3);
}

.quick-btn.btn-item {
  background: linear-gradient(135deg, #b8956a 0%, #8b6914 100%);
  color: white;
}

.quick-btn.btn-item:not(:disabled):hover {
  background: linear-gradient(135deg, #d4b88c 0%, #a07828 100%);
  box-shadow: 0 8px 25px rgba(139, 105, 20, 0.3);
}

.quick-btn.btn-success:not(:disabled):hover {
  box-shadow: 0 8px 25px rgba(74, 124, 89, 0.35);
}

.render-mode-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.mode-label {
  font-size: .8125rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.mode-buttons {
  display: flex;
  gap: 6px;
  background: rgba(139,105,20,.08);
  padding: 3px;
  border-radius: var(--radius-full);
}

.mode-button {
  padding: 6px 14px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: .75rem;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.mode-button:hover {
  background: rgba(139,105,20,.08);
  color: var(--text-primary);
}

.mode-button.active {
  background: linear-gradient(135deg, var(--primary-400), var(--primary-600));
  color: white;
  box-shadow: 0 2px 8px rgba(74,124,89,.25);
}

.unlock-content,
.harvest-content,
.quality-content,
.plant-content,
.item-content {
  padding: 8px 0;
}

.land-preview,
.harvest-preview,
.quality-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.land-icon,
.harvest-icon,
.quality-icon {
  font-size: 64px;
}

.empty-seeds-img {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-bottom: 0.5rem;
}

.land-number,
.harvest-message,
.quality-current {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.unlock-desc {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 20px;
  font-size: 15px;
}

.unlock-requirements {
  padding: 20px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
  margin-bottom: 20px;
}

.requirement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--glass-border);
}

.requirement-item:last-child {
  border-bottom: none;
}

.requirement-item.not-met {
  color: var(--error-600);
}

.req-icon {
  font-size: 18px;
}

.req-label {
  font-size: 14px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.req-value {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 18px;
  font-weight: 700;
  color: var(--gold-600);
}

.coin-icon {
  font-size: 20px;
}

.quality-label,
.next-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.quality-value,
.next-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.quality-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.quality-item {
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
  border: 2px solid transparent;
  transition: all var(--transition-fast);
}

.quality-item.current {
  border-color: var(--primary-500);
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.1),
    rgba(99, 102, 241, 0.05)
  );
}

.quality-item.next {
  border-color: var(--success-500);
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.1),
    rgba(34, 197, 94, 0.05)
  );
}

.quality-item.unlocked {
  opacity: 0.7;
}

.quality-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.quality-badge {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.current-badge {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
}

.unlocked-badge {
  background: linear-gradient(135deg, var(--success-500), var(--success-600));
  color: white;
}

.locked-badge {
  background: var(--bg-secondary);
  color: var(--text-muted);
}

.quality-desc {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.quality-requirements {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.req-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.req-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.req-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.req-value.not-met {
  color: var(--error-600);
}

.cost-value {
  display: flex;
  align-items: center;
  gap: 4px;
}

.next-upgrade {
  text-align: center;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
  margin-bottom: 16px;
}

.upgrade-hint {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.next-quality {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
  margin-bottom: 20px;
}

.max-quality {
  text-align: center;
  padding: 20px;
  color: var(--success-600);
  font-weight: 600;
  font-size: 16px;
}

.empty-seeds,
.empty-items {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 20px;
  text-align: center;
}

.empty-seeds p,
.empty-items p {
  color: var(--text-secondary);
  font-size: 15px;
}

.seed-list,
.item-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;
}

.seed-item,
.item-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.seed-item:hover,
.item-item:hover {
  transform: translateX(4px);
}

.seed-info,
.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.seed-icon-img,
.item-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.seed-name,
.item-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.item-desc {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.seed-count,
.item-count {
  font-size: 14px;
  font-weight: 700;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.message {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: 2000;
  min-width: 300px;
  max-width: 90vw;
}

.message.success {
  border-left: 4px solid var(--success-500);
}

.message.error {
  border-left: 4px solid var(--error-500);
}

.message.info {
  border-left: 4px solid var(--primary-500);
}

.message-icon {
  font-size: 20px;
}

.message-text {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.message-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast);
}

.message-close:hover {
  color: var(--text-primary);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all var(--transition-normal);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(30px);
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }

  .sidebar-section {
    width: 100%;
  }
}

@media (max-width: 1024px) {
  .home-page {
    padding: 12px;
  }

  .header {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .header-left,
  .header-right {
    width: 100%;
  }

  .header-right {
    flex-direction: column;
  }

  .nav {
    width: 100%;
    justify-content: center;
  }

  .nav-btn {
    flex: 1;
    justify-content: center;
  }

  .levels {
    flex-wrap: wrap;
  }
}

.quick-plant-content {
  padding: 8px 0;
}

.plant-info {
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
  margin-bottom: 16px;
  text-align: center;
}

.plant-count {
  margin: 0;
  font-size: 15px;
  color: var(--text-secondary);
}

.plant-count strong {
  color: var(--primary-600);
  font-size: 20px;
}

.quick-plant-content .seed-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;
}

.quick-plant-content .seed-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.quick-plant-content .seed-item:hover {
  transform: translateX(4px);
}

.quick-plant-content .seed-item.selected {
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.2),
    rgba(99, 102, 241, 0.1)
  );
  border: 2px solid var(--primary-500);
}

.quick-plant-content .seed-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quick-plant-content .seed-icon-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.quick-plant-content .seed-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.quick-plant-content .seed-count {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  display: block;
  margin-top: 4px;
}

.selected-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  box-shadow: var(--shadow-md);
}

.quick-plant-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--glass-border);
}

.profile-content {
  padding: 8px 0;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--glass-border);
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-400), var(--purple-500));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  animation: float 3s ease-in-out infinite;
}

.avatar-icon-large {
  font-size: 40px;
}

.profile-name-info {
  flex: 1;
}

.profile-username {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.profile-join-date {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.profile-section {
  margin-bottom: 20px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.level-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.level-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
  border: 2px solid transparent;
  transition: all var(--transition-fast);
}

.player-level-card {
  border-color: var(--success-500);
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.1),
    rgba(34, 197, 94, 0.05)
  );
}

.farm-level-card {
  border-color: var(--primary-500);
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.1),
    rgba(99, 102, 241, 0.05)
  );
}

.world-level-card {
  border-color: var(--gold-500);
  background: linear-gradient(
    135deg,
    rgba(251, 191, 36, 0.1),
    rgba(251, 191, 36, 0.05)
  );
}

.card-icon {
  font-size: 32px;
}

.card-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.card-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.card-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.exp-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.exp-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
  border: 2px solid transparent;
  transition: all var(--transition-fast);
}

.player-exp-card {
  border-color: var(--success-500);
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.1),
    rgba(34, 197, 94, 0.05)
  );
}

.farm-exp-card {
  border-color: var(--primary-500);
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.1),
    rgba(99, 102, 241, 0.05)
  );
}

.world-exp-card {
  border-color: var(--gold-500);
  background: linear-gradient(
    135deg,
    rgba(251, 191, 36, 0.1),
    rgba(251, 191, 36, 0.05)
  );
}

.exp-card-icon {
  font-size: 32px;
}

.exp-card-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.exp-card-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.exp-card-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.progress-info {
  display: flex;
  flex-direction: row;
  gap: 16px;
  margin-top: 8px;
  align-items: center;
}

.progress-info .progress-text {
  font-size: 12px;
  white-space: nowrap;
}

.currency-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(
    135deg,
    rgba(251, 191, 36, 0.15),
    rgba(245, 158, 11, 0.1)
  );
  border-radius: var(--border-radius-md);
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.currency-icon-large {
  font-size: 48px;
}

.currency-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.currency-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.currency-value-large {
  font-size: 28px;
  font-weight: 700;
  color: var(--gold-600);
}

.progress-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-card {
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
}

.progress-header {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.progress-bar-small {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-fill-small {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.player-progress {
  background: linear-gradient(90deg, var(--success-400), var(--success-500));
}

.farm-progress {
  background: linear-gradient(90deg, var(--primary-400), var(--primary-500));
}

.world-progress {
  background: linear-gradient(90deg, var(--gold-400), var(--gold-500));
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.avatar-selector-content {
  padding: 8px 0;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
}

.avatar-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.avatar-option:hover {
  transform: scale(1.1);
  background: rgba(99, 102, 241, 0.1);
}

.avatar-option.selected {
  border-color: var(--primary-500);
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.15),
    rgba(99, 102, 241, 0.05)
  );
}

.avatar-emoji {
  font-size: 28px;
}

.nickname-input-container {
  margin-bottom: 8px;
}

.nickname-input {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid var(--glass-border);
  border-radius: var(--border-radius-md);
  background: white;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  outline: none;
  transition: all var(--transition-fast);
}

.nickname-input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.profile-player-id {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.avatar-edit-hint {
  position: absolute;
  bottom: 4px;
  right: 4px;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  white-space: nowrap;
}

.profile-avatar {
  position: relative;
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.profile-avatar:hover {
  transform: scale(1.05);
}
.logout-content {
  padding: 16px 0;
  text-align: center;
}

.logout-icon {
  font-size: 72px;
  margin-bottom: 16px;
  animation: wave 1.5s ease-in-out infinite;
}

@keyframes wave {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(10deg);
  }
  75% {
    transform: rotate(-10deg);
  }
}

.logout-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.logout-desc {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.btn-danger {
  background: linear-gradient(135deg, var(--error-500), var(--error-600));
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: var(--border-radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
}

.stamina-display {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-md);
  margin-top: 8px;
}

.stamina-display.low-stamina {
  background: rgba(244, 67, 54, 0.2);
  animation: low-stamina-pulse 1s infinite;
}

@keyframes low-stamina-pulse {
  0%,
  100% {
    box-shadow: 0 0 4px rgba(244, 67, 54, 0.2);
  }
  50% {
    box-shadow: 0 0 12px rgba(244, 67, 54, 0.6);
  }
}

.stamina-icon {
  font-size: 18px;
}

.stamina-value {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

.low-stamina .stamina-value {
  color: #ff4444;
}

.recover-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.world-level-display {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-md);
  cursor: pointer;
}

.world-icon {
  font-size: 18px;
}

.world-level-text {
  font-size: 16px;
  font-weight: 700;
  color: #ffd700;
}

.world-tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  z-index: 100;
  min-width: 200px;
  white-space: nowrap;
}

.tooltip-title {
  font-size: 14px;
  font-weight: 700;
  color: #ffd700;
  margin-bottom: 8px;
}

.tooltip-content {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.tooltip-content p {
  margin: 4px 0;
}

.offline-rewards-content {
  padding: 16px 0;
  text-align: center;
}

.offline-icon {
  font-size: 64px;
  margin-bottom: 12px;
}

.offline-duration {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.offline-reward-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.offline-reward-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
}

.reward-icon {
  font-size: 24px;
}

.reward-label {
  flex: 1;
  text-align: left;
  font-size: 14px;
  color: var(--text-secondary);
}

.reward-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--gold-600);
}

.offline-details-section {
  margin-top: 16px;
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
}

.details-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 16px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
  transition: all 0.2s ease;
}

.details-toggle:hover {
  background: var(--bg-hover);
}

.toggle-text {
  font-size: 14px;
  color: var(--text-secondary);
}

.toggle-icon {
  font-size: 12px;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 500px;
}

.offline-details {
  margin-top: 16px;
  text-align: left;
}

.detail-section {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-md);
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: var(--text-secondary);
  margin-right: 8px;
  min-width: 80px;
}

.detail-value {
  color: var(--text-primary);
  font-weight: 500;
}

.detail-formula {
  color: var(--accent-color);
  font-family: monospace;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
}
</style>
