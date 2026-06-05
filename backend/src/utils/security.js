/**
 * 文件名：security.js
 * 作者：开发者
 * 日期：2026-05-07
 * 版本：v1.0.0
 * 功能描述：安全工具模块 - 提供XSS防护、SQL注入防护、输入验证等功能
 * 更新记录：
 *   2026-05-07 - v1.0.0 - 初始创建，全面安全功能
 */

/**
 * XSS防护 - HTML转义
 */
const escapeHtml = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * 检测XSS攻击
 */
const hasDangerousXSS = (str) => {
  if (!str || typeof str !== 'string') return false;
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:/i,
    /vbscript:/i,
    /expression/i,
    /eval\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
    /Function\s*\(/i,
    /document\.cookie/i,
    /document\.write/i,
    /innerHTML\s*=/i,
    /<iframe/i,
    /<embed/i,
    /<object/i,
    /<link/i,
    /<meta/i,
    /&#x/i,       // HTML实体编码绕过
    /&#\d+/i,     // HTML数字实体编码绕过
    /%3C/i,       // URL编码 <
    /%3E/i,       // URL编码 >
    /\\x[0-9a-fA-F]{2}/i, // 十六进制编码绕过
  ];
  return dangerousPatterns.some((pattern) => pattern.test(str));
};

/**
 * 清理HTML属性
 */
const sanitizeAttributes = (html) => {
  if (!html || typeof html !== 'string') return html;
  return html.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
};

/**
 * 检测SQL注入
 * 注意：正则检测仅作为辅助层，核心防护依赖参数化查询（pool.query(query, [params])）
 * 所有 Service 层已统一使用参数化查询，此处提供额外防御层
 */
const hasSQLInjection = (str) => {
  if (!str || typeof str !== 'string') return false;
  const injectionPatterns = [
    /(\bor\b|\band\b).*(=|like)/i,
    /('|"|;).*(--|#)/,
    /union\s+select/i,
    /(\bor\b|\band\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i,
    /drop\s+(table|database)/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+\w+\s+set/i,
    // 新增：高级绕过检测
    /exec\s*\(/i,                    // 存储过程执行
    /xp_cmdshell/i,                  // SQL Server 命令执行
    /information_schema/i,           // 数据库元数据探测
    /sleep\s*\(/i,                   // 时间盲注
    /benchmark\s*\(/i,               // MySQL 基准测试盲注
    /waitfor\s+delay/i,              // SQL Server 时间盲注
    /\/\*!.*\*\//i,                  // MySQL 条件注释绕过
    /\\x[0-9a-fA-F]{2}/i,            // 十六进制编码绕过
    /0x[0-9a-fA-F]+/i,               // 十六进制字面量
    /UNICODE\s*\(/i,                  // Unicode 编码绕过
    /char\s*\(/i,                     // ASCII 字符函数绕过
    /concat\s*\(/i,                   // 字符串拼接绕过
    /load_file\s*\(/i,               // 文件读取函数
    /into\s+(outfile|dumpfile)/i,    // 文件写入
  ];
  return injectionPatterns.some((pattern) => pattern.test(str));
};

/**
 * 验证数字输入
 */
const validateNumber = (input) => {
  const num = Number(input);
  return !isNaN(num) && isFinite(num);
};

/**
 * 验证用户名格式
 */
const validateUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  const pattern = /^[a-zA-Z0-9_]{3,20}$/;
  return pattern.test(username);
};

/**
 * 验证邮箱格式
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
};

/**
 * 验证密码强度
 */
const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) return false;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  return hasUpperCase && hasLowerCase && hasNumbers;
};

/**
 * 验证输入长度
 */
const validateLength = (input, min, max) => {
  if (!input || typeof input !== 'string') return false;
  return input.length >= min && input.length <= max;
};

/**
 * 检测路径遍历攻击
 */
const hasPathTraversal = (path) => {
  if (!path || typeof path !== 'string') return false;
  return path.includes('../') || path.includes('..\\');
};

/**
 * 规范化路径
 */
const sanitizePath = (path) => {
  if (!path || typeof path !== 'string') return path;
  return path.replace(/\.\.(\/|\\)/g, '');
};

/**
 * 验证JWT token格式
 */
const isValidToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  const pattern = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+$/;
  return pattern.test(token);
};

/**
 * 验证CSRF token
 */
const isValidCSRFToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  return token.length >= 16;
};

/**
 * 检查超级管理员权限
 */
const isSuperAdmin = (user) => {
  if (!user) return false;
  return user.role === 'superadmin' || user.is_super_admin === true;
};

/**
 * 验证角色权限边界
 */
const hasPermission = (user, requiredRole) => {
  if (!user) return false;
  const roleHierarchy = ['user', 'moderator', 'admin', 'superadmin'];
  const userRoleIndex = roleHierarchy.indexOf(user.role);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
  return userRoleIndex >= requiredRoleIndex;
};

/**
 * 检查资源所有权
 */
const ownsResource = (user, resource) => {
  if (!user || !resource) return false;
  return user.id === resource.user_id || user.id === resource.owner_id;
};

/**
 * 检查是否可以修改角色
 */
const canModifyRole = (currentUser, targetUser) => {
  if (!currentUser || !targetUser) return false;
  if (currentUser.id === targetUser.id) return false;
  const roleHierarchy = ['user', 'moderator', 'admin', 'superadmin'];
  const currentRoleIndex = roleHierarchy.indexOf(currentUser.role);
  const targetRoleIndex = roleHierarchy.indexOf(targetUser.role);
  return currentRoleIndex > targetRoleIndex;
};

/**
 * 安全的用户数据提取（移除敏感信息）
 */
const extractSafeUserData = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    is_active: user.is_active,
    is_admin: user.is_admin,
    role: user.role,
    created_at: user.created_at,
  };
};

module.exports = {
  escapeHtml,
  hasDangerousXSS,
  sanitizeAttributes,
  hasSQLInjection,
  validateNumber,
  validateUsername,
  validateEmail,
  validatePasswordStrength,
  validateLength,
  hasPathTraversal,
  sanitizePath,
  isValidToken,
  isValidCSRFToken,
  isSuperAdmin,
  hasPermission,
  ownsResource,
  canModifyRole,
  extractSafeUserData,
};
