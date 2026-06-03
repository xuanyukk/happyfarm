/**
 * 文件名：currencyFormatter.test.js
 * 作者：开发者
 * 日期：2026-05-25
 * 版本：v1.0.0
 * 功能描述：货币格式化工具和上限校验单元测试
 * 更新记录：
 *   2026-05-25 - v1.0.0 - 初始版本创建
 */
/* eslint-env jest */

const { CurrencyFormatter } = require('../src/services/currencyConfigService');

describe('CurrencyFormatter - 货币格式化', () => {
  let formatter;

  beforeEach(() => {
    formatter = new CurrencyFormatter();
  });

  describe('基础格式化', () => {
    test('零值应返回"0"', () => {
      expect(formatter.format(0)).toBe('0');
    });

    test('个位数', () => {
      expect(formatter.format(1)).toBe('1');
      expect(formatter.format(999)).toBe('999');
    });

    test('千位数（不触发万/亿）', () => {
      expect(formatter.format(1000)).toBe('1,000');
      expect(formatter.format(9999)).toBe('9,999');
    });
  });

  describe('"万"单位格式化', () => {
    test('1万 → "1万"', () => {
      expect(formatter.format(10000)).toBe('1万');
    });

    test('150万 → "150万"', () => {
      expect(formatter.format(1500000)).toBe('150万');
    });

    test('9999万 → "9999万"', () => {
      expect(formatter.format(99990000)).toBe('9999万');
    });
  });

  describe('"亿"单位格式化', () => {
    test('1亿 → "1亿"', () => {
      expect(formatter.format(100000000)).toBe('1亿');
    });

    test('1.2亿 → "1.2亿"', () => {
      expect(formatter.format(120000000)).toBe('1.2亿');
    });

    test('10亿 → "10亿"', () => {
      expect(formatter.format(1000000000)).toBe('10亿');
    });

    test('100亿 → "100亿"', () => {
      expect(formatter.format(10000000000)).toBe('100亿');
    });

    test('999亿上限值 → "999.9亿"', () => {
      expect(formatter.format(99999999999)).toBe('999.9亿');
    });
  });

  describe('边界值测试', () => {
    test('负数应为0', () => {
      expect(formatter.format(-100)).toBe('0');
    });

    test('undefined/null 应为0', () => {
      expect(formatter.format(undefined)).toBe('0');
      expect(formatter.format(null)).toBe('0');
    });

    test('字符串数字应正常格式化', () => {
      expect(formatter.format('10000')).toBe('1万');
    });

    test('999亿上限值 - 截断显示', () => {
      const maxHold = 99999999999;
      expect(formatter.format(maxHold)).toBe('999.9亿');
    });

    test('99.9亿', () => {
      expect(formatter.format(9990000000)).toBe('99.9亿');
    });
  });

  describe('小数位控制', () => {
    test('小数部分为0时不显示', () => {
      expect(formatter.format(100000000)).toBe('1亿'); // 不含".0"
    });

    test('stripTrailingZero=false时保留小数位', () => {
      const fmt = new CurrencyFormatter({ stripTrailingZero: false });
      expect(fmt.format(100000000)).toBe('1.0亿');
    });

    test('decimals=0时不显示小数', () => {
      const fmt = new CurrencyFormatter({ decimals: 0 });
      // 1.5亿截断为1亿
      expect(fmt.format(150000000)).toBe('1亿');
    });
  });

  describe('自定义阈值', () => {
    test('自定义"万"阈值', () => {
      const fmt = new CurrencyFormatter({ wanThreshold: 5000 });
      expect(fmt.format(8000)).toBe('0.8万');
    });

    test('自定义"亿"阈值', () => {
      const fmt = new CurrencyFormatter({ yiThreshold: 50000000 });
      expect(fmt.format(80000000)).toBe('0.8亿');
    });
  });
});

describe('CurrencyConfig - 上限校验', () => {
  const { CurrencyConfig } = require('../src/services/currencyConfigService');

  describe('checkMaxHold', () => {
    test('未达到上限', () => {
      const config = new CurrencyConfig({
        config_id: 1,
        currency_name: '农场币',
        max_hold: 99999999999,
      });
      const result = config.checkMaxHold(100, 50);
      expect(result.isExceeded).toBe(false);
      expect(result.actualAdd).toBe(50);
      expect(result.availableSpace).toBe(99999999999 - 100);
    });

    test('刚好达到上限', () => {
      const config = new CurrencyConfig({
        config_id: 1,
        currency_name: '农场币',
        max_hold: 1000,
      });
      const result = config.checkMaxHold(900, 100);
      expect(result.isExceeded).toBe(false);
      expect(result.actualAdd).toBe(100);
    });

    test('超过上限-被截断', () => {
      const config = new CurrencyConfig({
        config_id: 1,
        currency_name: '农场币',
        max_hold: 1000,
      });
      const result = config.checkMaxHold(900, 200);
      expect(result.isExceeded).toBe(true);
      expect(result.actualAdd).toBe(100);
      expect(result.availableSpace).toBe(100);
    });

    test('已满-无法增加', () => {
      const config = new CurrencyConfig({
        config_id: 1,
        currency_name: '农场币',
        max_hold: 1000,
      });
      const result = config.checkMaxHold(1000, 100);
      expect(result.isExceeded).toBe(true);
      expect(result.actualAdd).toBe(0);
      expect(result.availableSpace).toBe(0);
    });

    test('999亿上限-大额交易', () => {
      const config = new CurrencyConfig({
        config_id: 1,
        currency_name: '农场币',
        max_hold: 99999999999,
      });
      const result = config.checkMaxHold(99999999990, 100);
      expect(result.isExceeded).toBe(true);
      expect(result.actualAdd).toBe(9);
    });
  });
});
