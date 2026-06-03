/**
 * 文件名：frontend/src/utils/validation.js
 * 作者：AI助手
 * 日期：2026-04-26
 * 版本：v2.1.0
 * 功能描述：表单验证工具类
 * 更新记录：
 *   2026-04-26 - v2.0.0 - 初始创建
 *   2026-05-28 - v2.1.0 - 修复passwordConfirm双参数校验逻辑、补充作物相关校验
 */

export const validators = {
  required: {
    username: (value) => {
      if (!value) return '用户名不能为空';
      if (value.length < 3) return '用户名至少3个字符';
      if (value.length > 50) return '用户名不能超过50个字符';
      return null;
    },
    email: (value) => {
      if (!value) return '邮箱不能为空';
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regex.test(value)) return '邮箱格式不正确';
      return null;
    },
    password: (value) => {
      if (!value) return '密码不能为空';
      if (value.length < 6) return '密码至少6个字符';
      return null;
    },
  },

  confirmPassword: (value, confirmValue) => {
    if (!confirmValue) return '请确认密码';
    if (value !== confirmValue) return '两次密码输入不一致';
    return null;
  },

  username: (value) => {
    if (!value) return '用户名不能为空';
    if (value.length < 3) return '用户名至少3个字符';
    if (value.length > 50) return '用户名不能超过50个字符';
    return null;
  },

  email: (value) => {
    if (!value) return '邮箱不能为空';
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(value)) return '邮箱格式不正确';
    return null;
  },

  password: (value) => {
    if (!value) return '密码不能为空';
    if (value.length < 6) return '密码至少6个字符';
    return null;
  },

  farmlandCount: (value) => {
    const num = parseInt(value);
    if (isNaN(num)) return '请输入有效的数字';
    if (num < 1) return '至少需要1块土地';
    if (num > 100) return '最多100块土地';
    return null;
  },

  validateForm: (formData, schema) => {
    const errors = {};
    let isValid = true;
    for (const [field, validatorConfig] of Object.entries(schema)) {
      let error = null;
      if (typeof validatorConfig === 'function') {
        error = validatorConfig(formData[field], formData);
      } else if (Array.isArray(validatorConfig)) {
        for (const validator of validatorConfig) {
          error = validator(formData[field], formData);
          if (error) break;
        }
      }
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    }

    return { isValid, errors };
  },
};
