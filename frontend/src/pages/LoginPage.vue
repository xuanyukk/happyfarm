/**
 * 文件名：LoginPage.vue
 * 作者：开发者
 * 日期：2026-03-22
 * 版本：v2.0.0
 * 功能描述：登录页面 - 农场沉浸式登录体验
 * 更新记录：
 *   2026-03-22 - v1.1.0 - 完全重写，添加玻璃拟态、背景装饰、加载动画
 *   2026-06-08 - v2.0.0 - 农场沉浸式重设计：大地色系、温暖质感、去卡片化
 */
<template>
  <Transition name="page-fade">
    <div class="login-page">
      <!-- 远景装饰：天空 + 麦田 -->
      <div class="login-backdrop">
        <div class="sky-layer">
          <div class="cloud cloud-1"></div>
          <div class="cloud cloud-2"></div>
          <div class="cloud cloud-3"></div>
        </div>
        <div class="field-layer"></div>
      </div>

      <!-- 飘落粒子装饰 -->
      <div class="falling-particles" aria-hidden="true">
        <span class="particle p1">🍂</span>
        <span class="particle p2">🌿</span>
        <span class="particle p3">🍃</span>
        <span class="particle p4">✨</span>
        <span class="particle p5">🍂</span>
        <span class="particle p6">🌿</span>
      </div>

      <!-- 主内容区 -->
      <div class="login-content">
        <div class="brand-section">
          <div class="brand-icon" aria-hidden="true">
            <img
              class="brand-icon-img"
              :src="brandIconSrc"
              alt="开心农场"
              @error="(e) => (e.target.style.display = 'none')"
            />
          </div>
          <h1 class="brand-title">开心农场</h1>
          <p class="brand-tagline">种下快乐，收获美好</p>
        </div>

        <div class="form-panel">
          <form class="login-form" @submit.prevent="handleSubmit">
            <div class="field">
              <label class="field-label">用户名 / 邮箱</label>
              <input
                v-model="form.identifier"
                type="text"
                required
                class="input"
                placeholder="请输入用户名或邮箱"
                autocomplete="username"
              />
            </div>

            <div class="field">
              <label class="field-label">密码</label>
              <div class="password-wrap">
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  class="input"
                  placeholder="请输入密码"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="toggle-password"
                  :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                  @click="showPassword = !showPassword"
                >
                  {{ showPassword ? '隐藏' : '显示' }}
                </button>
              </div>
            </div>

            <button type="submit" :disabled="loading" class="login-btn-submit">
              <span v-if="loading" class="loading-spinner"></span>
              <span>{{ loading ? '正在进入农场...' : '进入农场' }}</span>
            </button>
          </form>

          <p class="form-hint">
            还没有农场？<router-link to="/register" class="link">创建你的农场</router-link>
          </p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
/**
 * 文件名：LoginPage.vue (script)
 * 功能：登录逻辑——表单验证、API调用、路由跳转
 */
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '../services/authService';
import { useToastStore } from '../stores/toast';
import { getUICommonImage } from '../utils/imagePaths';

const router = useRouter();
const toastStore = useToastStore();

const form = ref({
  identifier: '',
  password: '',
});
const loading = ref(false);
const showPassword = ref(false);

/** 品牌图标路径 */
const brandIconSrc = computed(() => getUICommonImage('icon_wheat'));

/**
 * 处理登录表单提交
 * 验证表单 → 调用登录API → 跳转首页
 */
const handleSubmit = async () => {
  loading.value = true;

  if (!form.value.identifier) {
    toastStore.error('用户名/邮箱不能为空', '错误');
    loading.value = false;
    return;
  }
  if (!form.value.password) {
    toastStore.error('密码不能为空', '错误');
    loading.value = false;
    return;
  }

  try {
    await login({
      identifier: form.value.identifier,
      password: form.value.password,
    });
    toastStore.success('欢迎来到开心农场！', '登录成功');
    loading.value = false;
    router.push('/');
  } catch (err) {
    toastStore.error(
      err.response?.data?.message || '登录失败，请检查账号密码',
      '错误'
    );
    loading.value = false;
  }
};
</script>

<style scoped>
/* ====== 页面过场动画 ====== */
.page-fade-enter-active {
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

/* ====== 布局 ====== */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

/* ====== 远景背景层 ====== */
.login-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.sky-layer {
  position: absolute;
  inset: 0 0 55% 0;
  background: linear-gradient(
    180deg,
    var(--sky-300) 0%,
    #dce8f4 40%,
    #e8efe0 80%,
    var(--bg-tertiary) 100%
  );
}

.field-layer {
  position: absolute;
  inset: 45% 0 0 0;
  background: linear-gradient(
    180deg,
    var(--bg-tertiary) 0%,
    #a3b87a 30%,
    var(--primary-400) 65%,
    var(--primary-600) 100%
  );
}

/* 麦田横纹纹理 */
.field-layer::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    rgba(255, 252, 230, 0.04) 3px,
    rgba(255, 252, 230, 0.04) 4px
  );
  mask-image: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.3) 30%, rgba(0,0,0,.5) 100%);
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.3) 30%, rgba(0,0,0,.5) 100%);
}

/* ====== 云朵装饰 ====== */
.cloud {
  position: absolute;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 50%;
  filter: blur(8px);
}

.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
}

.cloud-1 {
  width: 120px;
  height: 40px;
  top: 12%;
  left: 10%;
  animation: cloudDrift 28s linear infinite;
}
.cloud-1::before {
  width: 50px;
  height: 50px;
  top: -25px;
  left: 25px;
}
.cloud-1::after {
  width: 70px;
  height: 45px;
  top: -15px;
  right: 10px;
}

.cloud-2 {
  width: 90px;
  height: 30px;
  top: 22%;
  right: 15%;
  animation: cloudDrift 22s linear infinite;
  animation-delay: -8s;
}
.cloud-2::before {
  width: 40px;
  height: 40px;
  top: -20px;
  left: 20px;
}

.cloud-3 {
  width: 100px;
  height: 35px;
  top: 8%;
  left: 55%;
  animation: cloudDrift 32s linear infinite;
  animation-delay: -15s;
}
.cloud-3::before {
  width: 45px;
  height: 45px;
  top: -22px;
  left: 30px;
}
.cloud-3::after {
  width: 60px;
  height: 38px;
  top: -10px;
  right: 15px;
}

@keyframes cloudDrift {
  from {
    transform: translateX(-30%);
  }
  to {
    transform: translateX(calc(100vw + 30%));
  }
}

/* ====== 飘落粒子 ====== */
.falling-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.particle {
  position: absolute;
  font-size: 1.2rem;
  opacity: 0;
  animation: particleFall linear infinite;
}

.p1 { left: 8%;  animation-duration: 12s; animation-delay: 0s; }
.p2 { left: 25%; animation-duration: 10s; animation-delay: -3s; }
.p3 { left: 45%; animation-duration: 14s; animation-delay: -6s; }
.p4 { left: 65%; animation-duration: 11s; animation-delay: -2s; }
.p5 { left: 80%; animation-duration: 13s; animation-delay: -8s; }
.p6 { left: 92%; animation-duration: 9s;  animation-delay: -5s; }

@keyframes particleFall {
  0% {
    transform: translateY(-10vh) rotate(0deg) scale(0.8);
    opacity: 0;
  }
  10% {
    opacity: 0.5;
  }
  85% {
    opacity: 0.5;
  }
  100% {
    transform: translateY(105vh) rotate(360deg) scale(1.2);
    opacity: 0;
  }
}

/* ====== 主内容区 ====== */
.login-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  width: 100%;
  max-width: 400px;
}

/* ====== 品牌区 ====== */
.brand-section {
  text-align: center;
  animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
}

.brand-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 12px;
  position: relative;
}

.brand-icon-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(100, 60, 20, 0.15));
  animation: floatGentle 3s ease-in-out infinite;
}

/* 品牌图标光晕 */
.brand-icon::after {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(212, 160, 23, 0.2) 0%,
    transparent 70%
  );
  animation: brandGlow 2.5s ease-in-out infinite;
}

@keyframes brandGlow {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

.brand-title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.04em;
  margin: 0 0 8px;
  position: relative;
  display: inline-block;
}

/* 标题金色下划线装饰 */
.brand-title::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--gold-500), transparent);
  border-radius: 2px;
}

.brand-tagline {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  letter-spacing: 0.08em;
  margin: 0;
  animation: taglineBreathe 4s ease-in-out infinite;
}

@keyframes taglineBreathe {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

/* ====== 表单面板 ====== */
.form-panel {
  width: 100%;
  background: rgba(255, 252, 245, 0.25);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 252, 245, 0.3);
  border-radius: var(--radius-xl);
  padding: 28px 24px;
  box-shadow: var(--shadow-lg);
  animation: fadeInScale 0.5s 0.15s cubic-bezier(0.4, 0, 0.2, 1) both;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ====== 表单字段 ====== */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
}

.password-wrap {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 0.8125rem;
  cursor: pointer;
  padding: 6px 10px;
  line-height: 1;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.toggle-password:hover {
  background: rgba(139, 105, 20, 0.08);
  color: var(--text-primary);
}

/* ====== 登录按钮（独立设计，不复用全局 .btn） ====== */
.login-btn-submit {
  width: 100%;
  margin-top: 4px;
  padding: 14px 24px;
  font-size: 1.05rem;
  font-weight: 700;
  font-family: var(--font-display);
  letter-spacing: 0.06em;
  color: var(--text-on-dark);
  background: linear-gradient(135deg, var(--primary-700), var(--primary-500));
  border: 2px solid transparent;
  border-radius: var(--radius-full);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all var(--transition-normal);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.login-btn-submit::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    transparent 0%,
    rgba(212, 160, 23, 0.12) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.login-btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(44, 77, 55, 0.3),
    0 0 20px rgba(212, 160, 23, 0.15);
  border-color: var(--gold-500);
}

.login-btn-submit:hover:not(:disabled)::before {
  transform: translateX(100%);
}

.login-btn-submit:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.login-btn-submit .loading-spinner {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

/* ====== 底部提示 ====== */
.form-hint {
  text-align: center;
  margin: 18px 0 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.link {
  color: var(--primary-600);
  font-weight: 600;
  text-decoration: none;
  margin-left: 2px;
  transition: color var(--transition-fast);
}

.link:hover {
  color: var(--primary-700);
}

/* ====== 响应式 ====== */
@media (max-width: 480px) {
  .login-page {
    padding: 16px;
  }

  .login-content {
    gap: 24px;
  }

  .brand-icon,
  .brand-icon-img {
    width: 60px;
    height: 60px;
  }

  .brand-title {
    font-size: 1.75rem;
  }

  .form-panel {
    padding: 22px 18px;
    border-radius: var(--radius-lg);
  }

  .login-btn-submit {
    padding: 12px 20px;
    font-size: 0.95rem;
  }
}
</style>