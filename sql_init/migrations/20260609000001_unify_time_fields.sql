-- ============================================
-- 文件名: 20260609000001_unify_time_fields.sql
-- 作者: Trae AI
-- 日期: 2026-06-09
-- 版本: v4.73.0
-- 功能描述: 时间字段命名统一迁移脚本
--           create_time → created_at, update_time → updated_at
--           适用于玩家表(player_base, player_currency, player_inventory,
--           player_land_status)和数仓表(dim_player)
-- 执行顺序: 迁移脚本，在schema初始化之后执行
-- 依赖关系: 无（本脚本独立执行，检测字段是否存在）
-- ============================================

\echo '============================================'
\echo '开始时间字段命名统一迁移...'
\echo '============================================'

-- ============================================
-- 第一步：修复触发器函数，使其操作 updated_at
-- ============================================
\echo '步骤1: 修复 update_updated_at_column() 触发器函数...'

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

\echo '  ✓ 触发器函数已修复（NEW.update_time → NEW.updated_at）'

-- ============================================
-- 第二步：player_base 表字段重命名
-- ============================================
\echo '步骤2: player_base 表字段重命名...'

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'player_base' AND column_name = 'create_time'
    ) THEN
        ALTER TABLE player_base RENAME COLUMN create_time TO created_at;
        \echo '  ✓ player_base.create_time → created_at'
    ELSE
        \echo '  - player_base.create_time 不存在或已重命名，跳过'
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'player_base' AND column_name = 'update_time'
    ) THEN
        ALTER TABLE player_base RENAME COLUMN update_time TO updated_at;
        \echo '  ✓ player_base.update_time → updated_at'
    ELSE
        \echo '  - player_base.update_time 不存在或已重命名，跳过'
    END IF;
END $$;

-- 更新列注释
COMMENT ON COLUMN player_base.created_at IS '创建时间';
COMMENT ON COLUMN player_base.updated_at IS '更新时间';

-- ============================================
-- 第三步：player_currency 表字段重命名
-- ============================================
\echo '步骤3: player_currency 表字段重命名...'

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'player_currency' AND column_name = 'create_time'
    ) THEN
        ALTER TABLE player_currency RENAME COLUMN create_time TO created_at;
        \echo '  ✓ player_currency.create_time → created_at'
    ELSE
        \echo '  - player_currency.create_time 不存在或已重命名，跳过'
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'player_currency' AND column_name = 'update_time'
    ) THEN
        ALTER TABLE player_currency RENAME COLUMN update_time TO updated_at;
        \echo '  ✓ player_currency.update_time → updated_at'
    ELSE
        \echo '  - player_currency.update_time 不存在或已重命名，跳过'
    END IF;
END $$;

-- 更新列注释
COMMENT ON COLUMN player_currency.created_at IS '创建时间';
COMMENT ON COLUMN player_currency.updated_at IS '更新时间';

-- ============================================
-- 第四步：player_inventory 表字段重命名
-- ============================================
\echo '步骤4: player_inventory 表字段重命名...'

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'player_inventory' AND column_name = 'create_time'
    ) THEN
        ALTER TABLE player_inventory RENAME COLUMN create_time TO created_at;
        \echo '  ✓ player_inventory.create_time → created_at'
    ELSE
        \echo '  - player_inventory.create_time 不存在或已重命名，跳过'
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'player_inventory' AND column_name = 'update_time'
    ) THEN
        ALTER TABLE player_inventory RENAME COLUMN update_time TO updated_at;
        \echo '  ✓ player_inventory.update_time → updated_at'
    ELSE
        \echo '  - player_inventory.update_time 不存在或已重命名，跳过'
    END IF;
END $$;

-- 更新列注释
COMMENT ON COLUMN player_inventory.created_at IS '创建时间';
COMMENT ON COLUMN player_inventory.updated_at IS '更新时间';

-- ============================================
-- 第五步：player_land_status 表字段重命名
-- ============================================
\echo '步骤5: player_land_status 表字段重命名...'

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'player_land_status' AND column_name = 'update_time'
    ) THEN
        ALTER TABLE player_land_status RENAME COLUMN update_time TO updated_at;
        \echo '  ✓ player_land_status.update_time → updated_at'
    ELSE
        \echo '  - player_land_status.update_time 不存在或已重命名，跳过'
    END IF;
END $$;

-- 更新列注释
COMMENT ON COLUMN player_land_status.updated_at IS '更新时间';

-- ============================================
-- 第六步：dim_player 表字段重命名
-- ============================================
\echo '步骤6: dim_player 表字段重命名...'

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dim_player' AND column_name = 'create_time'
    ) THEN
        ALTER TABLE dim_player RENAME COLUMN create_time TO created_at;
        \echo '  ✓ dim_player.create_time → created_at'
    ELSE
        \echo '  - dim_player.create_time 不存在或已重命名，跳过'
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dim_player' AND column_name = 'update_time'
    ) THEN
        ALTER TABLE dim_player RENAME COLUMN update_time TO updated_at;
        \echo '  ✓ dim_player.update_time → updated_at'
    ELSE
        \echo '  - dim_player.update_time 不存在或已重命名，跳过'
    END IF;
END $$;

-- 更新列注释
COMMENT ON COLUMN dim_player.created_at IS '创建时间';
COMMENT ON COLUMN dim_player.updated_at IS '更新时间';

-- ============================================
-- 第七步：验证迁移结果
-- ============================================
\echo '============================================'
\echo '迁移完成，验证字段命名一致性...'
\echo '============================================'

DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    -- 检查是否还有使用旧字段名的表
    SELECT COUNT(*) INTO remaining_count
    FROM information_schema.columns
    WHERE column_name IN ('create_time', 'update_time')
      AND table_name IN ('player_base', 'player_currency', 'player_inventory', 'player_land_status', 'dim_player');

    IF remaining_count > 0 THEN
        RAISE WARNING '警告: 仍有 % 个旧字段名残留', remaining_count;
    ELSE
        RAISE NOTICE '✓ 所有玩家表/dim_player 时间字段已统一为 created_at/updated_at';
    END IF;

    -- 确认新字段名已生效
    SELECT COUNT(*) INTO remaining_count
    FROM information_schema.columns
    WHERE column_name IN ('created_at', 'updated_at')
      AND table_name IN ('player_base', 'player_currency', 'player_inventory', 'player_land_status', 'dim_player');

    RAISE NOTICE '✓ 共计 % 个字段使用统一命名 created_at/updated_at', remaining_count;
END $$;

\echo '============================================'
\echo '时间字段统一迁移完成！'
\echo '============================================'