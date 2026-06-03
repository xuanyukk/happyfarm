/**
 * 文件名：currencyFormatter.js
 * 作者：开发者
 * 日期：2026-05-25
 * 版本：v1.0.0
 * 功能描述：货币格式化工具，支持万/亿中文显示格式，可配置阈值和规则
 * 更新记录：
 *   2026-05-25 - v1.0.0 - 初始版本创建
 */

/**
 * 默认格式化规则
 */
const DEFAULT_RULES = {
  wanThreshold: 10000, // 超过1万启用"万"单位
  yiThreshold: 100000000, // 超过1亿启用"亿"单位
  decimals: 1, // 保留小数位数
  stripTrailingZero: true, // 小数部分为0时不显示
};

/**
 * 格式化货币数值为中文显示格式
 * @param {number} value - 货币数值
 * @param {object} rules - 自定义格式化规则（可选）
 * @returns {string} 格式化后的字符串，如"1万"、"1.2亿"、"999亿"
 *
 * 示例：
 *   formatCurrency(0)        → "0"
 *   formatCurrency(1000)     → "1,000"
 *   formatCurrency(10000)    → "1万"
 *   formatCurrency(1500000)  → "150万"
 *   formatCurrency(120000000)→ "1.2亿"
 *   formatCurrency(99900000000) → "999亿"
 */
export function formatCurrency(value, rules = {}) {
  const config = { ...DEFAULT_RULES, ...rules };
  const num = parseInt(value) || 0;

  if (num === 0) return '0';
  if (num < 0) return '0';

  if (num >= config.yiThreshold) {
    return formatYi(num, config);
  } else if (num >= config.wanThreshold) {
    return formatWan(num, config);
  }

  return num.toLocaleString('zh-CN');
}

/**
 * 格式化为"X亿"或"X.X亿"
 * @param {number} num - 数值
 * @param {object} config - 格式化配置
 * @returns {string}
 */
function formatYi(num, config) {
  const yiValue = num / 100000000;
  // 整数倍亿不显示小数（处理浮点精度）
  if (num % 100000000 === 0) {
    return Math.floor(yiValue) + '亿';
  }
  const formatted = formatDecimal(
    yiValue,
    config.decimals,
    config.stripTrailingZero
  );
  return formatted + '亿';
}

/**
 * 格式化为"X万"或"X.X万"
 * @param {number} num - 数值
 * @param {object} config - 格式化配置
 * @returns {string}
 */
function formatWan(num, config) {
  const wanValue = num / 10000;
  // 万级别数值较大时一般不显示小数（如1500000 → "150万"而非"150.0万"）
  if (wanValue >= 100) {
    return Math.floor(wanValue) + '万';
  }
  // 整数倍万不显示小数
  if (num % 10000 === 0) {
    return Math.floor(wanValue) + '万';
  }
  const formatted = formatDecimal(
    wanValue,
    config.decimals,
    config.stripTrailingZero
  );
  return formatted + '万';
}

/**
 * 格式化小数位（使用截断而非四舍五入，防止999.9999→1000的精度问题）
 * @param {number} value - 数值
 * @param {number} decimals - 小数位数
 * @param {boolean} stripZero - 是否去除末尾零
 * @returns {string}
 */
function formatDecimal(value, decimals, stripZero) {
  if (decimals > 0) {
    const multiplier = Math.pow(10, decimals);
    const truncated = Math.floor(value * multiplier) / multiplier;
    const fixed = truncated.toFixed(decimals);
    if (stripZero) {
      return parseFloat(fixed).toString();
    }
    return fixed;
  }
  return Math.floor(value).toString();
}

/**
 * 完整格式化（含货币符号）
 * @param {number} value - 货币数值
 * @param {string} symbol - 货币符号
 * @param {object} rules - 自定义格式化规则
 * @returns {string} 如"₣1万"、"₣999亿"
 */
export function formatCurrencyWithSymbol(value, symbol, rules) {
  return (symbol || '') + formatCurrency(value, rules);
}

/**
 * 默认导出单例格式化函数
 */
export default {
  format: formatCurrency,
  formatWithSymbol: formatCurrencyWithSymbol,
};
