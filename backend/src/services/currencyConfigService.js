/**
 * 文件名：currencyConfigService.js
 * 作者：开发者
 * 日期：2026-05-25
 * 版本：v1.0.0
 * 功能描述：多货币体系配置管理服务，采用策略模式支持多货币类型扩展
 *         提供货币配置、上限校验、格式化显示、缓存管理等功能
 * 更新记录：
 *   2026-05-25 - v1.0.0 - 初始版本创建，实现多货币体系架构
 */

const pool = require('../config/db');
const logger = require('../config/logger');

/**
 * 货币类型常量
 */
const CURRENCY_TYPES = {
  FARM_COIN: { id: 1, code: 'farm_coin', name: '农场币' },
  GEM: { id: 2, code: 'gem', name: '农场宝石币' },
};

/**
 * 全局默认货币上限（999亿）
 */
const DEFAULT_MAX_HOLD = 99999999999; // 999亿

/**
 * 货币显示格式化规则配置（万/亿体系）
 */
const DEFAULT_FORMAT_RULES = {
  wanThreshold: 10000, // 超过1万启用"万"单位
  yiThreshold: 100000000, // 超过1亿启用"亿"单位
  decimals: 1, // 保留一位小数
  stripTrailingZero: true, // 小数部分为0时不显示
};

/**
 * 货币格式化策略类（策略模式）
 * 每新增货币类型只需新增一个策略类并注册到工厂
 */
class CurrencyFormatter {
  /**
   * @param {object} rules - 格式化规则
   */
  constructor(rules = {}) {
    this.rules = { ...DEFAULT_FORMAT_RULES, ...rules };
  }

  /**
   * 格式化货币数值为中文显示格式
   * @param {number} value - 货币数值
   * @returns {string} 格式化后的字符串
   */
  format(value) {
    const num = parseInt(value) || 0;
    if (num < 0) return '0';

    // 负数处理
    const isNegative = num < 0;
    const absNum = Math.abs(num);

    if (absNum >= this.rules.yiThreshold) {
      return this._formatYi(absNum, isNegative);
    } else if (absNum >= this.rules.wanThreshold) {
      return this._formatWan(absNum, isNegative);
    }
    return (isNegative ? '-' : '') + absNum.toLocaleString('zh-CN');
  }

  /**
   * 格式化为"X.X亿"
   * @param {number} num - 绝对值
   * @param {boolean} isNegative - 是否负数
   * @returns {string}
   */
  _formatYi(num, isNegative) {
    const yiValue = num / 100000000;
    const formatted = this._formatDecimal(
      yiValue,
      this.rules.decimals,
      num,
      100000000
    );
    return (isNegative ? '-' : '') + formatted + '亿';
  }

  /**
   * 格式化为"X.X万"
   * @param {number} num - 绝对值
   * @param {boolean} isNegative - 是否负数
   * @returns {string}
   */
  _formatWan(num, isNegative) {
    const wanValue = num / 10000;
    // 万级别数值较大时一般不显示小数
    if (wanValue >= 100) {
      return (isNegative ? '-' : '') + Math.floor(wanValue) + '万';
    }
    const formatted = this._formatDecimal(
      wanValue,
      this.rules.decimals,
      num,
      10000
    );
    return (isNegative ? '-' : '') + formatted + '万';
  }

  /**
   * 格式化小数位（使用截断而非四舍五入，避免999.9999→1000的精度问题）
   * @param {number} value - 已除完的数值
   * @param {number} decimals - 小数位数
   * @param {number} originalNum - 原始数值（用于检测整数倍关系）
   * @param {number} divisor - 除数（亿=100000000, 万=10000）
   * @returns {string}
   */
  _formatDecimal(value, decimals, originalNum, divisor) {
    // 处理浮点精度：如果原始数值是单位值的整数倍，不显示小数
    // 但当stripTrailingZero为false时，仍需按配置显示
    if (
      this.rules.stripTrailingZero !== false &&
      originalNum !== undefined &&
      divisor !== undefined
    ) {
      if (originalNum % divisor === 0) {
        return Math.floor(value).toString();
      }
    }

    // 使用截断（truncate）代替四舍五入，防止999.9999被round为1000
    if (decimals > 0) {
      const multiplier = Math.pow(10, decimals);
      const truncated = Math.floor(value * multiplier) / multiplier;
      const fixed = truncated.toFixed(decimals);

      if (this.rules.stripTrailingZero) {
        return parseFloat(fixed).toString();
      }
      return fixed;
    }

    return Math.floor(value).toString();
  }
}

/**
 * 货币配置数据对象（抽象基类）
 * 每类货币有不同的存储表、字段、业务逻辑
 */
class CurrencyConfig {
  /**
   * @param {object} config - 从currency_config表读取的配置
   */
  constructor(config) {
    this.configId = config.config_id;
    this.currencyName = config.currency_name;
    this.currencySymbol = config.currency_symbol;
    this.maxHold = parseInt(config.max_hold) || DEFAULT_MAX_HOLD;
    this.description = config.description;
    this.isActive = config.is_active !== false;
    this.formatRules = config.format_rules
      ? typeof config.format_rules === 'string'
        ? JSON.parse(config.format_rules)
        : config.format_rules
      : null;
    this.formatter = new CurrencyFormatter(this.formatRules || {});
  }

  /**
   * 校验是否超过持有上限
   * @param {number} currentAmount - 当前持有量
   * @param {number} addAmount - 拟增加数量
   * @returns {object} { isExceeded, availableSpace, actualAdd }
   */
  checkMaxHold(currentAmount, addAmount) {
    const current = parseInt(currentAmount) || 0;
    const add = parseInt(addAmount) || 0;
    const availableSpace = Math.max(0, this.maxHold - current);
    const actualAdd = Math.min(add, availableSpace);
    return {
      isExceeded: actualAdd < add,
      availableSpace,
      actualAdd,
      maxHold: this.maxHold,
    };
  }

  /**
   * 格式化货币数值
   * @param {number} value - 货币数值
   * @returns {string} 格式化后的显示字符串
   */
  format(value) {
    return this.formatter.format(value);
  }
}

/**
 * 农场币配置（策略模式具体实现）
 */
class FarmCoinConfig extends CurrencyConfig {
  constructor(config) {
    super(config);
    this.tableName = 'player_currency';
    this.amountField = 'currency_num';
  }
}

/**
 * 农场宝石币配置（策略模式具体实现）
 * 同表存储：与农场币共用 player_currency 表，通过独立字段隔离
 * 当前为基础框架阶段，仅支持数据存储与读取，预留扩展接口
 */
class GemConfig extends CurrencyConfig {
  constructor(config) {
    super(config);
    this.tableName = 'player_currency';
    this.amountField = 'gem_num';
    this.totalEarnField = 'gem_total_earn';
    this.totalSpendField = 'gem_total_spend';
  }

  /**
   * 获取宝石币读/写字段映射（供基础读写服务使用）
   * @returns {object} 字段名映射
   */
  getFieldMapping() {
    return {
      amountField: this.amountField,
      totalEarnField: this.totalEarnField,
      totalSpendField: this.totalSpendField,
      tableName: this.tableName,
    };
  }
}

/**
 * 货币配置工厂（抽象工厂模式）
 */
class CurrencyConfigFactory {
  static registry = {
    [CURRENCY_TYPES.FARM_COIN.code]: FarmCoinConfig,
    [CURRENCY_TYPES.GEM.code]: GemConfig,
  };

  /**
   * 注册新的货币类型
   * @param {string} code - 货币代码
   * @param {class} configClass - 货币配置类
   */
  static register(code, configClass) {
    CurrencyConfigFactory.registry[code] = configClass;
    logger.info('注册新货币类型', { code });
  }

  /**
   * 创建货币配置实例
   * @param {object} dbConfig - 数据库配置记录
   * @returns {CurrencyConfig} 货币配置实例
   */
  static create(dbConfig) {
    const code = dbConfig.currency_code || 'farm_coin';
    const ConfigClass = CurrencyConfigFactory.registry[code] || FarmCoinConfig;
    return new ConfigClass(dbConfig);
  }
}

// ---- 缓存管理 ----
const configCache = new Map();
let cacheExpiry = 0;
const CACHE_TTL = 60000; // 1分钟

/**
 * 从缓存或数据库获取所有货币配置
 * @returns {Promise<Map<string, CurrencyConfig>>} 货币配置映射
 */
async function getAllConfigs() {
  const now = Date.now();
  if (configCache.size > 0 && now < cacheExpiry) {
    return new Map(configCache);
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT config_id, currency_name, currency_symbol, max_hold,
              description, currency_code, is_active, format_rules
       FROM currency_config
       WHERE is_active = true
       ORDER BY config_id`
    );

    configCache.clear();
    for (const row of result.rows) {
      const config = CurrencyConfigFactory.create(row);
      configCache.set(row.config_id, config);
    }
    cacheExpiry = now + CACHE_TTL;
    return new Map(configCache);
  } catch (error) {
    logger.error('获取货币配置失败', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 获取单个货币配置
 * @param {number} configId - 配置ID（默认1=农场币）
 * @returns {Promise<CurrencyConfig>} 货币配置实例
 */
async function getConfig(configId = 1) {
  const configs = await getAllConfigs();
  const config = configs.get(configId);
  if (!config) {
    // 返回默认配置
    return new FarmCoinConfig({
      config_id: configId,
      currency_name: '农场币',
      currency_symbol: '₣',
      max_hold: DEFAULT_MAX_HOLD,
      description: '基础货币',
      is_active: true,
      format_rules: null,
    });
  }
  return config;
}

/**
 * 清除配置缓存
 */
function clearCache() {
  configCache.clear();
  cacheExpiry = 0;
  logger.info('货币配置缓存已清除');
}

/**
 * 校验货币增减是否超过上限
 * @param {number} playerId - 玩家ID
 * @param {number} addAmount - 拟增加数量
 * @param {number} configId - 货币配置ID
 * @returns {Promise<object>} 校验结果
 */
async function validateCurrencyAdd(playerId, addAmount, configId = 1) {
  const config = await getConfig(configId);
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT ${config.amountField} FROM ${config.tableName}
       WHERE player_id = $1`,
      [playerId]
    );

    if (result.rows.length === 0) {
      return {
        isExceeded: false,
        availableSpace: config.maxHold,
        actualAdd: Math.min(addAmount, config.maxHold),
        maxHold: config.maxHold,
        currentAmount: 0,
      };
    }

    const current = parseInt(result.rows[0][config.amountField]) || 0;
    const checkResult = config.checkMaxHold(current, addAmount);
    return {
      ...checkResult,
      currentAmount: current,
    };
  } catch (error) {
    logger.error('校验货币增加失败', { playerId, error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 批量更新所有货币配置（管理后台用）
 * @param {Array} configs - 配置数组
 * @param {number} operatorId - 操作员ID
 * @returns {Promise<object>} 更新结果
 */
async function batchUpdateConfigs(configs, operatorId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const results = [];
    for (const config of configs) {
      const result = await client.query(
        `UPDATE currency_config
         SET max_hold = $1,
             description = $2,
             is_active = $3,
             format_rules = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE config_id = $5
         RETURNING *`,
        [
          config.max_hold || DEFAULT_MAX_HOLD,
          config.description || '',
          config.is_active !== false,
          config.format_rules ? JSON.stringify(config.format_rules) : null,
          config.config_id || 1,
        ]
      );

      if (result.rows.length > 0) {
        // 记录变更日志
        await client.query(
          `INSERT INTO config_change_log
           (config_id, operator_id, action, new_value, reason, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            config.config_id || 1,
            operatorId,
            'UPDATE',
            JSON.stringify({
              max_hold: config.max_hold,
              description: config.description,
              is_active: config.is_active,
              format_rules: config.format_rules,
            }),
            '批量更新货币配置',
            '0.0.0.0',
          ]
        );
        results.push(result.rows[0]);
      }
    }

    await client.query('COMMIT');
    clearCache();
    logger.info('货币配置批量更新成功', { count: results.length, operatorId });
    return { success: true, count: results.length, data: results };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('批量更新货币配置失败', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 获取格式化的货币配置列表（含格式化预览值）
 * @returns {Promise<Array>} 配置列表
 */
async function getFormattedConfigList() {
  const configs = await getAllConfigs();
  const list = [];
  for (const [_id, config] of configs) {
    const testValues = [0, 1000, 10000, 1500000, 120000000, 99999999999];
    list.push({
      configId: config.configId,
      currencyName: config.currencyName,
      currencySymbol: config.currencySymbol,
      maxHold: config.maxHold,
      maxHoldFormatted: config.format(config.maxHold),
      description: config.description,
      isActive: config.isActive,
      formatRules: config.formatRules || DEFAULT_FORMAT_RULES,
      formatPreviews: testValues.map((v) => ({
        value: v,
        formatted: config.format(v),
      })),
    });
  }
  return list;
}

module.exports = {
  CURRENCY_TYPES,
  DEFAULT_MAX_HOLD,
  DEFAULT_FORMAT_RULES,
  CurrencyFormatter,
  CurrencyConfig,
  FarmCoinConfig,
  GemConfig,
  CurrencyConfigFactory,
  getAllConfigs,
  getConfig,
  clearCache,
  validateCurrencyAdd,
  batchUpdateConfigs,
  getFormattedConfigList,
};
