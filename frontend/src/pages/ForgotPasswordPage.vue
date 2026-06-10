/**
 * 文件名：ForgotPasswordPage.vue
 * 作者：开发者
 * 日期：2026-05-02
 * 版本：v1.0.0
 * 功能描述：忘记密码页面 - 发送密码重置邮箱
 * 更新记录：
 * 2026-05-02 - v1.0.0 - 初始创建，密码重置功能
 */

<template>
  <div class="container">
    <div class="form-container">
      <h2 class="title">忘记密码</h2>
      <div v-if="success" class="success">{{ success }}</div>
      <div v-else-if="error" class="error">{{ error }}</div>

      <form v-if="!success" class="form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="label">邮箱地址</label>
          <input
            v-model="form.email"
            type="email"
            required
            class="input"
            placeholder="请输入注册时使用的邮箱"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="button"
          :class="{ 'button-disabled': loading }"
        >
          {{ loading ? '发送中...' : '发送重置链接' }}
        </button>
      </form>

      <div class="login-link">
        <router-link to="/login">返回登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { requestPasswordReset } from '../services/authService';

const form = ref({ email: '' });
const error = ref('');
const success = ref('');
const loading = ref(false);

const handleSubmit = async () => {
  error.value = '';
  success.value = '';
  loading.value = true;

  if (!form.value.email) {
    error.value = '邮箱不能为空';
    loading.value = false;
    return;
  }

  try {
    const res = await requestPasswordReset(form.value.email);
    success.value = res.message;
  } catch (err) {
    error.value = err.response?.data?.message || '发送失败，请重试';
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

.button {
  padding: 12px;
  background-color: #007bff;
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
