/**
 * 文件名：27_optimization.sql
 * 作者：开发者
 * 日期：2026-05-31
 * 版本：v2.0.0
 * 功能描述：数据库优化脚本——约束、索引补充，延迟批量配置
 * 更新记录：
 *   2026-05-31 - v1.7.0 - 添加各类约束和索引优化
 *   2026-06-08 - v2.0.0 - 补充缺失索引：currency_config唯一索引、
 *                         item_config分类索引、shop_goods在售索引、
 *                         world_level等级查询索引、farm_level解锁索引
 */

-- ============================================================
-- 1. currency_config: 货币代码唯一索引 + 启用状态索引
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'currency_config' AND indexname = 'idx_currency_code_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_currency_code_unique
      ON currency_config (currency_code)
      WHERE currency_code IS NOT NULL;
    RAISE NOTICE 'currency_code 唯一索引已创建';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'currency_config' AND indexname = 'idx_currency_is_active'
  ) THEN
    CREATE INDEX idx_currency_is_active
      ON currency_config (is_active)
      WHERE is_active = TRUE;
    RAISE NOTICE 'currency_config 启用状态索引已创建';
  END IF;
END $$;

-- ============================================================
-- 2. item_config: 道具类型 + 效果类别索引
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'item_config' AND indexname = 'idx_item_type'
  ) THEN
    CREATE INDEX idx_item_type ON item_config (item_type);
    RAISE NOTICE 'item_type 索引已创建';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'item_config' AND indexname = 'idx_effect_category'
  ) THEN
    CREATE INDEX idx_effect_category ON item_config (effect_category);
    RAISE NOTICE 'effect_category 索引已创建';
  END IF;
END $$;

-- ============================================================
-- 3. shop_goods: 在售商品查询索引（替代原idx_unlock_level）
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'shop_goods' AND indexname = 'idx_shop_on_sale'
  ) THEN
    CREATE INDEX idx_shop_on_sale
      ON shop_goods (is_on_sale, unlock_world_level, unlock_player_level)
      WHERE is_on_sale = TRUE;
    RAISE NOTICE 'shop_goods 在售商品索引已创建';
  END IF;
END $$;

-- ============================================================
-- 4. world_level: 等级解锁条件查询索引
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'world_level' AND indexname = 'idx_world_unlock'
  ) THEN
    CREATE INDEX idx_world_unlock
      ON world_level (unlock_player_level, unlock_farm_level);
    RAISE NOTICE 'world_level 解锁条件索引已创建';
  END IF;
END $$;

-- ============================================================
-- 5. farm_level: 等级解锁条件查询索引
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'farm_level' AND indexname = 'idx_farm_unlock'
  ) THEN
    CREATE INDEX idx_farm_unlock
      ON farm_level (unlock_player_level, unlock_world_level);
    RAISE NOTICE 'farm_level 解锁条件索引已创建';
  END IF;
END $$;

-- ============================================================
-- 6. player_currency: 清理低价值单列索引
-- ============================================================
DO $$
BEGIN
  DROP INDEX IF EXISTS idx_currency_num;
  DROP INDEX IF EXISTS idx_gem_num;
  RAISE NOTICE 'player_currency 低价值单列索引已清理';
END $$;

\echo '数据库优化 v2.0.0 执行完成！'