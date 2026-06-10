/**
 * 文件名：ResetPasswordPage.vue
 * 作者：开发者
 * 日期：2026-05-02
 * 版本：v1.0.0
 * 功能描述：重置密码页面 - 使用token重置用户密码
 * 更新记录：
 * 2026-05-02 - v1.0.0 - 初始创建，密码重置功能
 */

<template>
  <div class="container">
    <div class="form-container">
      <h2 class="title">重置密码</h2>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-else-if="success" class="success">{{ success }}</div>
      <div v-else-if="!isValidToken" class="error">重置链接无效或已过期</div>

      <template v-if="isValidToken && !success">
        <div class="user-info">
          <p>
            为 <strong>{{ userInfo?.username }}</strong> 重置密码
          </p>
        </div>

        <form class="form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="label">新密码</label>
            <div class="password-container">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="input"
                placeholder="请输入新密码（至少6位）"
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? '隐藏' : '显示' }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="label">确认密码</label>
            <div class="password-container">
              <input
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                class="input"
                placeholder="请再次输入新密码"
              />
              <button
                type="button"
                class="password-toggle"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                {{ showConfirmPassword ? '隐藏' : '显示' }}
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="button"
            :class="{ 'button-disabled': loading }"
          >
            {{ loading ? '重置中...' : '重置密码' }}
          </button>
        </form>
      </template>

      <div class="login-link">
        <router-link to="/login">返回登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { verifyResetToken, resetPassword } from '../services/authService';

const route = useRoute();

const form = ref({ password: '', confirmPassword: '' });
const error = ref('');
const success = ref('');
const loading = ref(false);
const isValidToken = ref(false);
const userInfo = ref(null);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

onMounted(async () => {
  const token = route.query.token;
  if (!token) {
    error.value = '缺少重置令牌';
    return;
  }

  try {
    const res = await verifyResetToken(token);
    isValidToken.value = true;
    userInfo.value = {
      username: res.username,
      email: res.email,
    };
  } catch (err) {
    error.value = err.response?.data?.message || '重置链接无效或已过期';
  }
});

const handleSubmit = async () => {
  error.value = '';
  success.value = '';
  loading.value = true;

  if (!form.value.password) {
    error.value = '新密码不能为空';
    loading.value = false;
    return;
  }
  if (form.value.password.length < 6) {
    error.value = '密码长度至少6位';
    loading.value = false;
    return;
  }
  if (form.value.password !== form.value.confirmPassword) {
    error.value = '两次输入的密码不一致';
    loading.value = false;
    return;
  }

  try {
    const token = route.query.token;
    const res = await resetPassword(token, form.value.password);
    success.value = res.message;
  } catch (err) {
    error.value = err.response?.data?.message || '重置失败，请重试';
    loading.value = false;
  }
};
</script>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.form-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
  width: 100%;
  max-width: 400px;
}

.title {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.error {
  color: red;
  margin-bottom: 15px;
  text-align: center;
}

.success {
  color: #28a745;
  margin-bottom: 15px;
  text-align: center;
  line-height: 1.6;
}

.user-info {
  text-align: center;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f0f7ff;
  border-radius: 4px;
  color: #007bff;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.label {
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.input {
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 16px;
}

.password-container {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 14px;
}

.button {
  padding: 12px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 10px;
}

.button-disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
}

.login-link a {
  color: #007bff;
  text-decoration: none;
}
</style>
