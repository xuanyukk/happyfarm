/** * 文件名：LoginPage.vue * 作者：开发者 * 日期：2026-03-22 * 版本：v1.1.0 *
功能描述：登录页面 - 用户登录、密码显示切换 * 更新记录： * 2026-03-22 - v1.1.0 -
完全重写，添加玻璃拟态、背景装饰、加载动画 */
<template>
  <div class="login-page">
    <div class="background-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
      <div class="decoration-circle circle-3"></div>
    </div>
    <div class="form-container glass-strong">
      <div class="form-header">
        <div class="logo">
          <span class="logo-icon">🌾</span>
        </div>
        <h2 class="title">欢迎回来</h2>
        <p class="subtitle">登录您的快乐农场</p>
      </div>

      <form class="form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="label">
            <span class="label-icon">👤</span>
            用户名/邮箱
          </label>
          <input
            v-model="form.identifier"
            type="text"
            required
            class="input"
            placeholder="请输入用户名或邮箱"
          />
        </div>

        <div class="form-group">
          <label class="label">
            <span class="label-icon">🔒</span>
            密码
          </label>
          <div class="password-container">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              class="input"
              placeholder="请输入密码"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
            >
              <span v-if="showPassword">🙈</span>
              <span v-else>👁️</span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="submit-btn btn-primary"
        >
          <span v-if="loading" class="loading-spinner"></span>
          <span>{{ loading ? '登录中...' : '登录' }}</span>
        </button>
      </form>

      <div class="form-footer">
        <span>还没有账号？</span>
        <router-link to="/register" class="link">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '../services/authService';
import { useToastStore } from '../stores/toast';

const router = useRouter();
const toastStore = useToastStore();
const form = ref({
  identifier: '',
  password: '',
});
const loading = ref(false);
const showPassword = ref(false);

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
    toastStore.success('登录成功', '成功');
    loading.value = false;
    router.push('/');
  } catch (err) {
    toastStore.error(err.response?.data?.message || '登录失败，请重试', '错误');
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-400), var(--secondary-400));
  opacity: 0.15;
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  right: -50px;
  animation-delay: 2s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  right: 10%;
  animation-delay: 4s;
}

.form-container {
  width: 100%;
  max-width: 420px;
  padding: 40px 32px;
  border-radius: var(--border-radius-2xl);
  position: relative;
  z-index: 1;
  animation: scaleIn 0.4s ease;
}

.form-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  margin-bottom: 16px;
}

.logo-icon {
  font-size: 64px;
  display: inline-block;
  animation: bounce 2s ease-in-out infinite;
}

.title {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.subtitle {
  margin: 0;
  font-size: 15px;
  color: var(--text-secondary);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.label-icon {
  font-size: 16px;
}

.input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--glass-border);
  border-radius: var(--border-radius-md);
  font-size: 15px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: var(--text-primary);
  transition: all var(--transition-fast);
  box-sizing: border-box;
}

.input::placeholder {
  color: var(--text-muted);
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.password-container {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast);
}

.password-toggle:hover {
  transform: translateY(-50%) scale(1.1);
}

.submit-btn {
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.form-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--text-secondary);
}

.link {
  color: var(--primary-600);
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;
  transition: color var(--transition-fast);
}

.link:hover {
  color: var(--primary-700);
  text-decoration: underline;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 480px) {
  .form-container {
    padding: 32px 24px;
  }

  .title {
    font-size: 24px;
  }

  .logo-icon {
    font-size: 56px;
  }
}
</style>
