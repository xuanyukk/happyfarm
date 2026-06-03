/**
 * 文件名：achievementService.test.js
 * 作者：SOLO Code Audit
 * 日期：2026-05-30
 * 版本：v1.1.0
 * 功能描述：成就服务单元测试——验证 Bug #1/#2/#3 修复效果
 *         覆盖：函数签名/IP表名列名一致性/SQL语句Schema校验/奖励逻辑
 * 更新记录：
 *   2026-05-01 - v1.0.0 - 初始创建（原始函数名已不匹配实际导出）
 *   2026-05-30 - v1.1.0 - 修复函数名匹配，新增Schema验证和Bug修复验证
 */

const fs = require('fs');
const path = require('path');
const serviceProvider = require('../src/config/serviceProvider');

// 懒加载服务模块，避免在 describe 顶层触发 require
const loadAchievementServiceSrc = () =>
  fs.readFileSync(
    path.resolve(__dirname, '../src/services/achievementService.js'),
    'utf-8'
  );

// 解析SQL DDL文件的简单工具
const parseDDL = (filePath) => {
  const fullPath = path.resolve(__dirname, '../../sql_init/02_schema', filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Schema file not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
};

// 提取指定表的 CREATE TABLE 中的列名
const extractColumns = (ddl, tableName = null) => {
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]+?)\)\s*;/gi;
  let match;
  while ((match = tableRegex.exec(ddl)) !== null) {
    const currentTable = match[1];
    if (tableName && currentTable !== tableName) continue;
    const body = match[2];
    const cols = [];
    body.split('\n').forEach((line) => {
      const colMatch = line.match(/^\s*(\w+)\s+\w+/);
      if (colMatch && !['CONSTRAINT', 'PRIMARY', 'FOREIGN', 'CHECK', 'UNIQUE'].includes(colMatch[1])) {
        cols.push(colMatch[1]);
      }
    });
    return cols;
  }
  return [];
};

// 提取 UNIQUE 约束的列
const extractUniqueConstraints = (ddl) => {
  const matches = ddl.match(/UNIQUE\s*\(([^)]+)\)/gi) || [];
  return matches.map((m) => {
    const inner = m.match(/\(([^)]+)\)/)[1];
    return inner.split(',').map((s) => s.trim());
  });
};

describe('AchievementService - Bug修复验证测试', () => {
  beforeAll(() => {
    serviceProvider.registerAll();
  });

  // ====== 第1层：基本函数存在性测试 ======
  describe('基本函数存在性', () => {
    it('achievementService 已注册', () => {
      const svc = serviceProvider.get('achievementService');
      expect(svc).toBeDefined();
    });

    it('checkAchievements 函数存在 (修复：原 test 引用不存在的 checkAndUpdateAchievements)', () => {
      const svc = serviceProvider.get('achievementService');
      expect(typeof svc.checkAchievements).toBe('function');
    });

    it('getPlayerAchievements 函数存在 (修复：原 test 引用不存在的 getAchievementProgress)', () => {
      const svc = serviceProvider.get('achievementService');
      expect(typeof svc.getPlayerAchievements).toBe('function');
    });
  });

  // ====== 第2层：SQL表名一致性验证（Bug #1 核心修复） ======
  describe('Bug #1 修复：表名与列名一致性', () => {
    const srcContent = loadAchievementServiceSrc();

    // Schema 验证
    const achievementSchema = parseDDL('28_achievement_system.sql');
    const schemaTableNames = (achievementSchema.match(/CREATE\s+TABLE[^(]+(\w+)\s*\(/gi) || [])
      .map((m) => m.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i)[1]);

    it('源码中不应引用不存在的表 player_achievement_progress', () => {
      expect(srcContent).not.toMatch(/player_achievement_progress/);
    });

    it('源码引用的 player_achievement 表应与 Schema 一致', () => {
      expect(schemaTableNames).toContain('player_achievement');
      // 验证源码确实使用了正确的表名
      const achievementRefs = (srcContent.match(/\bplayer_achievement\b/g) || []).length;
      expect(achievementRefs).toBeGreaterThanOrEqual(4);
    });

    it('源码引用的 achievement_definition 表应与 Schema 一致', () => {
      expect(schemaTableNames).toContain('achievement_definition');
      const defRefs = (srcContent.match(/\bachievement_definition\b/g) || []).length;
      expect(defRefs).toBeGreaterThanOrEqual(2);
    });

    it('JOIN 条件应使用正确列名 achievement_id (而非 id)', () => {
      expect(srcContent).toMatch(/ad\.achievement_id\s*=\s*pap\.achievement_id/);
    });

    it('ORDER BY 应使用 achievement_id (而非 id)', () => {
      const orderByMatches = srcContent.match(/ORDER\s+BY\s+ad\.achievement_id/gi);
      expect(orderByMatches).toBeTruthy();
      expect(orderByMatches.length).toBeGreaterThanOrEqual(2);
    });

    // Schema 列名验证
    it('player_achievement 表应包含 required 列', () => {
      const columns = extractColumns(achievementSchema, 'player_achievement');
      expect(columns).toContain('player_id');
      expect(columns).toContain('achievement_id');
      expect(columns).toContain('current_count');
      expect(columns).toContain('is_completed');
      expect(columns).toContain('completed_at');
    });

    it('源码 INSERT/UPDATE 应使用 current_count (而非 progress)', () => {
      // 搜索 INSERT 和 UPDATE 语句中的列名
      const inserts = (srcContent.match(/INSERT\s+INTO\s+player_achievement[\s\S]*?VALUES/gi) || []);
      const updates = (srcContent.match(/SET\s+[\s\S]*?(?:WHERE|;)/gi) || []);
      const allDml = [...inserts, ...updates].join('\n');

      expect(allDml).toContain('current_count');
      expect(allDml).not.toMatch(/\bprogress\b/);
    });

    it('源码 INSERT/UPDATE 应使用 is_completed (而非 completed)', () => {
      const inserts = (srcContent.match(/INSERT\s+INTO\s+player_achievement[\s\S]*?VALUES/gi) || []);
      const updates = (srcContent.match(/SET\s+[\s\S]*?(?:WHERE|;)/gi) || []);
      const allDml = [...inserts, ...updates].join('\n');

      expect(allDml).toContain('is_completed');
      expect(allDml).not.toMatch(/\bcompleted\b/);
    });
  });

  // ====== 第3层：成就奖励道具插入验证（Bug #2 核心修复） ======
  describe('Bug #2 修复：成就奖励道具插入', () => {
    const srcContent = loadAchievementServiceSrc();
    const inventorySchema = parseDDL('14_player_inventory.sql');
    const inventoryColumns = extractColumns(inventorySchema);
    const inventoryUniqueConstraints = extractUniqueConstraints(inventorySchema);

    it('player_inventory 表应存在', () => {
      const tableMatch = inventorySchema.match(
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(/i
      );
      expect(tableMatch).toBeTruthy();
      expect(tableMatch[1]).toContain('player_inventory');
    });

    it('player_inventory 的正确列名应为 item_obj_id (非 item_id)', () => {
      expect(inventoryColumns).toContain('item_obj_id');
      expect(inventoryColumns).not.toContain('item_id');
    });

    it('player_inventory 的正确列名应为 item_num (非 quantity)', () => {
      expect(inventoryColumns).toContain('item_num');
      expect(inventoryColumns).not.toContain('quantity');
    });

    it('player_inventory 应包含 item_type 列', () => {
      expect(inventoryColumns).toContain('item_type');
    });

    it('player_inventory UNIQUE 约束应为 (player_id, item_type, item_obj_id)', () => {
      const expectedConstraint = ['player_id', 'item_type', 'item_obj_id'];
      const foundConstraint = inventoryUniqueConstraints.some(
        (cols) =>
          cols.length === expectedConstraint.length &&
          expectedConstraint.every((c) => cols.includes(c))
      );
      expect(foundConstraint).toBe(true);
    });

    it('奖励 INSERT 应使用 item_obj_id (非 item_id)', () => {
      const rewardInsertMatch = srcContent.match(
        /INSERT\s+INTO\s+player_inventory\s*\(([^)]+)\)/i
      );
      expect(rewardInsertMatch).toBeTruthy();
      const columns = rewardInsertMatch[1].split(',').map((c) => c.trim());
      expect(columns).toContain('item_obj_id');
      expect(columns).not.toContain('item_id');
    });

    it('奖励 INSERT 应包含 item_type 且值为 2', () => {
      // 跨行匹配：item_type 和 VALUES 可能在不同行
      const itemTypeInInsert = (
        srcContent.includes('item_type') &&
        /VALUES\s*\(\s*\$\d+\s*,\s*2\b/.test(srcContent)
      );
      expect(itemTypeInInsert).toBe(true);
    });

    it('奖励 INSERT 应使用 item_num (非 quantity)', () => {
      const rewardInsertMatch = srcContent.match(
        /INSERT\s+INTO\s+player_inventory\s*\(([^)]+)\)/i
      );
      expect(rewardInsertMatch).toBeTruthy();
      const columns = rewardInsertMatch[1].split(',').map((c) => c.trim());
      expect(columns).toContain('item_num');
      expect(columns).not.toContain('quantity');
    });

    it('ON CONFLICT 应匹配 Schema 的唯一约束 (player_id, item_type, item_obj_id)', () => {
      expect(srcContent).toMatch(
        /ON\s+CONFLICT\s*\(\s*player_id\s*,\s*item_type\s*,\s*item_obj_id\s*\)/
      );
    });

    it('UPDATE 应使用 item_num (非 quantity)', () => {
      expect(srcContent).toMatch(/SET\s+item_num\s*=\s*player_inventory\.item_num\s*\+/);
      expect(srcContent).not.toMatch(/SET\s+quantity\s*=/);
    });

    it('应包含 total_add 和 last_add_time 字段', () => {
      const insertMatch = srcContent.match(
        /INSERT\s+INTO\s+player_inventory\s*\(([^)]+)\)/i
      );
      expect(insertMatch).toBeTruthy();
      const columns = insertMatch[1].split(',').map((c) => c.trim());
      expect(columns).toContain('total_add');
      expect(columns).toContain('last_add_time');
    });
  });

  // ====== 第4层：成就货币日志插入验证（Bug #3 核心修复） ======
  describe('Bug #3 修复：成就货币日志插入', () => {
    const srcContent = loadAchievementServiceSrc();
    const currencyLogSchema = parseDDL('13_player_currency_log.sql');
    const logColumns = extractColumns(currencyLogSchema);

    it('player_currency_log 的正确列名应为 type (非 currency_type/change_type)', () => {
      expect(logColumns).toContain('type');
      expect(logColumns).not.toContain('currency_type');
      expect(logColumns).not.toContain('change_type');
    });

    it('player_currency_log 的正确列名应为 amount (非 change_amount)', () => {
      expect(logColumns).toContain('amount');
      expect(logColumns).not.toContain('change_amount');
    });

    it('player_currency_log 的正确列名应为 source (必填)', () => {
      expect(logColumns).toContain('source');
    });

    it('player_currency_log 应包含 balance_before 和 balance_after (必填)', () => {
      expect(logColumns).toContain('balance_before');
      expect(logColumns).toContain('balance_after');
    });

    it('player_currency_log 应包含 related_id 列', () => {
      expect(logColumns).toContain('related_id');
    });

    it('日志 INSERT 应使用正确的列名', () => {
      const logInsertMatch = srcContent.match(
        /INSERT\s+INTO\s+player_currency_log\s*\(([^)]+)\)/i
      );
      expect(logInsertMatch).toBeTruthy();
      const columns = logInsertMatch[1].split(',').map((c) => c.trim());

      // 必须包含这些列
      expect(columns).toContain('type');
      expect(columns).toContain('amount');
      expect(columns).toContain('source');
      expect(columns).toContain('related_id');
      expect(columns).toContain('balance_before');
      expect(columns).toContain('balance_after');

      // 不应包含这些旧列名
      expect(columns).not.toContain('currency_type');
      expect(columns).not.toContain('change_type');
      expect(columns).not.toContain('change_amount');
      expect(columns).not.toContain('description');
    });

    it('日志 INSERT 应使用 achievement_reward 作为 source 值', () => {
      expect(srcContent).toMatch(/'achievement_reward'/);
    });

    it('应正确查询 balance_before 并计算 balance_after', () => {
      // 验证有 FOR UPDATE 查询余额
      expect(srcContent).toMatch(/SELECT\s+currency_num\s+FROM\s+player_currency\s+WHERE\s+player_id\s*=.*FOR\s+UPDATE/i);
      // 验证计算 balance_after
      expect(srcContent).toMatch(/balanceAfter/);
    });
  });

  // ====== 第5层：综合回归测试 ======
  describe('综合回归', () => {
    const srcContent = loadAchievementServiceSrc();

    it('函数导出应包含 checkAchievements 和 getPlayerAchievements', () => {
      expect(srcContent).toMatch(/module\.exports\s*=\s*\{[\s\S]*checkAchievements/);
      expect(srcContent).toMatch(/module\.exports\s*=\s*\{[\s\S]*getPlayerAchievements/);
    });

    it('不应存在任何对不存在的 player_achievement_progress 表的引用', () => {
      // 全局搜索确保所有引用都已修复
      const occurrences = (srcContent.match(/player_achievement_progress/g) || []).length;
      expect(occurrences).toBe(0);
    });

    it('不应使用 ad.id（应使用 ad.achievement_id）', () => {
      // 搜索 "ad.id" 但不匹配 "ad.achievement_id"
      const badRefs = (srcContent.match(/ad\.id\b(?!entifier)/g) || []);
      // 应该只匹配 ad.id_entifier 或以其他方式包含 achievement_id
      // 实际上 ad.id 不应出现除非是 ad.achievement_id 的一部分
      const standaloneRefs = (srcContent.match(/\bad\.id\b/g) || []).length;
      // ad.achievement_id 包含 "ad.id"，使用更精确的匹配
      const lines = srcContent.split('\n');
      let badCount = 0;
      lines.forEach((line) => {
        if (/\bad\.id\b/.test(line) && !/\bad\.achievement_id\b/.test(line)) {
          badCount++;
        }
      });
      expect(badCount).toBe(0);
    });

    it('所有函数应存在且类型正确', () => {
      const svc = serviceProvider.get('achievementService');
      expect(typeof svc.checkAchievements).toBe('function');
      expect(typeof svc.getPlayerAchievements).toBe('function');
    });
  });
});