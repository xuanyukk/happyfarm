-- ============================================
-- 文件名: 16_player_level_config_data.sql
-- 作者: Trae AI
-- 日期: 2026-05-31
-- 版本: v4.68.0
-- 功能描述: 玩家等级经验配置初始数据（完整1-1000级）
-- 执行顺序: 03-16
-- 依赖关系: 02-36_player_level_config.sql
-- ============================================

-- 玩家等级经验曲线设计：
-- Lv  1-10:   新手期，每级100经验，线性增长
-- Lv 11-30:   成长期，每级100→500经验，柔和曲线
-- Lv 31-60:   进阶期，每级500→2000经验，加速增长
-- Lv 61-100:  高手期，每级2000→5000经验
-- Lv101-200:  精英期，每级5000→15000经验
-- Lv201-500:  大师期，每级15000→50000经验
-- Lv501-1000: 传说期，每级50000→250000经验

DO $$
DECLARE
    v_level INTEGER;
    v_exp_required BIGINT := 0;
    v_exp_to_next BIGINT;
    v_reward_gold BIGINT;
    v_reward_gems INTEGER;
    v_reward_items JSONB;
    v_stamina_inc INTEGER;
    v_max_stamina INTEGER := 200;
    v_is_milestone BOOLEAN;
BEGIN
    FOR v_level IN 1..1000 LOOP
        -- 计算升到本级所需经验
        CASE
            WHEN v_level <= 10 THEN
                v_exp_to_next := 100 * v_level;
            WHEN v_level <= 30 THEN
                v_exp_to_next := 100 + ROUND((v_level - 10) * 20.0);
            WHEN v_level <= 60 THEN
                v_exp_to_next := 500 + ROUND((v_level - 30) * 50.0);
            WHEN v_level <= 100 THEN
                v_exp_to_next := 2000 + ROUND((v_level - 60) * 75.0);
            WHEN v_level <= 200 THEN
                v_exp_to_next := 5000 + ROUND((v_level - 100) * 100.0);
            WHEN v_level <= 500 THEN
                v_exp_to_next := 15000 + ROUND((v_level - 200) * 116.67);
            ELSE
                v_exp_to_next := 50000 + ROUND((v_level - 500) * 400.0);
        END CASE;

        v_exp_required := v_exp_required + v_exp_to_next;

        -- 里程碑判定
        v_is_milestone := (v_level % 100 = 0 OR v_level % 50 = 0);

        -- 体力上限：基础200，每10级+2，每50级额外+5，每100级额外+10
        v_stamina_inc := 0;
        IF v_level % 10 = 0 THEN
            v_stamina_inc := 2;
        END IF;
        IF v_level % 50 = 0 THEN
            v_stamina_inc := v_stamina_inc + 5;
        END IF;
        IF v_level % 100 = 0 THEN
            v_stamina_inc := v_stamina_inc + 10;
        END IF;

        -- 累计体力上限（简化：直接设目标值）
        v_max_stamina := 200 + (v_level / 10)::INTEGER * 2
                        + (v_level / 50)::INTEGER * 5
                        + (v_level / 100)::INTEGER * 10;

        -- 升级奖励
        v_reward_gold := 0;
        v_reward_gems := 0;
        v_reward_items := NULL;

        IF v_level % 5 = 0 THEN
            v_reward_gold := v_level * 50;
        END IF;
        IF v_level % 10 = 0 THEN
            v_reward_gold := v_reward_gold + v_level * 100;
            v_reward_gems := v_level / 10;
        END IF;
        IF v_level % 50 = 0 THEN
            v_reward_gold := v_reward_gold + v_level * 500;
            v_reward_gems := v_reward_gems + 50;
            v_reward_items := JSONB_BUILD_ARRAY(
                JSONB_BUILD_OBJECT('item_id', 18, 'count', 3),
                JSONB_BUILD_OBJECT('item_id', 4, 'count', 2)
            );
        END IF;
        IF v_level % 100 = 0 THEN
            v_reward_gold := v_reward_gold + v_level * 2000;
            v_reward_gems := v_reward_gems + 200;
            v_reward_items := JSONB_BUILD_ARRAY(
                JSONB_BUILD_OBJECT('item_id', 19, 'count', 5),
                JSONB_BUILD_OBJECT('item_id', 5, 'count', 5),
                JSONB_BUILD_OBJECT('item_id', 9, 'count', 10)
            );
        END IF;

        INSERT INTO player_level_config (
            player_level,
            exp_required,
            exp_to_next,
            reward_gold,
            reward_gems,
            reward_items,
            stamina_increase,
            max_stamina,
            is_milestone
        ) VALUES (
            v_level,
            v_exp_required,
            v_exp_to_next,
            v_reward_gold,
            v_reward_gems,
            v_reward_items,
            v_stamina_inc,
            v_max_stamina,
            v_is_milestone
        );
    END LOOP;
END $$;

\echo '玩家等级经验配置数据插入成功！共1000条记录。'