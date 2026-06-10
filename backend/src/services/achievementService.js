/**
 * 文件名：achievementService.js
 * 作者：Trae AI
 * 日期：2026-05-13
 * 版本：v2.8.0
 * 功能描述：成就服务，处理成就的检查、触发和奖励发放
 * 更新记录：
 *   2026-05-31 - v2.6.0 - 新增checkAndUpdateAchievements别名；新增getUnlockedAchievements函数
 *   2026-05-31 - v2.7.0 - 方案B：新增连击追踪+隐藏成就+收藏成就检测逻辑
 *   2026-06-09 - v2.8.0 - 时间字段统一：update_time → updated_at
 *   2026-06-11 - v2.8.1 - B2-5修复：switch-case添加default分支防止未覆盖成就分类穿透
 */

const pool = require('../config/db');
const logger = require('../config/logger');

/**
 * 检查并更新玩家成就进度
 * @param {string} playerId - 玩家ID
 * @param {string} achievementType - 成就类型 (如 'harvest', 'plant', 'sell')
 * @param {number} amount - 完成的数量
 */
const checkAchievements = async function (
  playerId,
  achievementType,
  amount = 1
) {
  const client = await pool.connect();
  let completedAchievements = [];
  try {
    await client.query('BEGIN');

    const achievementsQuery = `
      SELECT ad.*, COALESCE(pap.current_count, 0) as current_progress
      FROM achievement_definition ad
      LEFT JOIN player_achievement pap 
        ON ad.achievement_id = pap.achievement_id AND pap.player_id = $1
      WHERE ad.is_active = true
      ORDER BY ad.achievement_id
    `;
    const achievementsResult = await client.query(achievementsQuery, [
      playerId,
    ]);
    const achievements = achievementsResult.rows;

    for (const achievement of achievements) {
      let newProgress = achievement.current_progress;

      switch (achievement.category) {
        case 'farming':
          if (achievementType === 'harvest' || achievementType === 'plant') {
            newProgress = (achievement.current_progress || 0) + amount;
          }
          break;

        case 'economy':
          if (achievementType === 'sell' || achievementType === 'wealth') {
            newProgress = (achievement.current_progress || 0) + amount;
          }
          break;

        case 'level':
          if (achievementType === 'level_up') {
            const levelQuery = `
              SELECT player_level, farm_level, world_level 
              FROM player_base 
              WHERE player_id = $1
            `;
            const levelResult = await client.query(levelQuery, [playerId]);
            if (levelResult.rows.length > 0) {
              const levelData = levelResult.rows[0];
              if (achievement.achievement_name.includes('农场')) {
                newProgress = levelData.farm_level;
              } else if (achievement.achievement_name.includes('世界')) {
                newProgress = levelData.world_level;
              } else {
                newProgress = levelData.player_level;
              }
            }
          }
          break;

        case 'farm':
          if (
            achievementType === 'land_unlock' ||
            achievementType === 'quality_upgrade'
          ) {
            newProgress = (achievement.current_progress || 0) + amount;
          }
          break;

        case 'item':
          if (achievementType === 'use_item') {
            newProgress = (achievement.current_progress || 0) + amount;
          }
          break;

        case 'social':
          if (
            achievementType === 'daily_login' ||
            achievementType === 'add_friend'
          ) {
            newProgress = (achievement.current_progress || 0) + amount;
          }
          break;

        case 'event':
          if (achievementType === 'participate_event') {
            newProgress = (achievement.current_progress || 0) + amount;
          }
          break;

        default:
          // 未识别的成就分类，不做进度更新，防止穿透到错误逻辑
          break;
      }

      if (newProgress !== achievement.current_progress) {
        await updateAchievementProgress(
          client,
          playerId,
          achievement.achievement_id,
          newProgress
        );

        if (
          newProgress >= achievement.required_count &&
          achievement.current_progress < achievement.required_count
        ) {
          await completeAchievement(client, playerId, achievement);
          completedAchievements.push(achievement);
        }
      }
    }

    // B2-2修复：将连击/隐藏成就检测移至COMMIT之前
    // 确保检测在事务内完成，保持数据一致性
    try {
      if (achievementType === 'login') {
        await updateComboLogin(playerId);
      }
      if (achievementType === 'harvest') {
        await updateComboHarvest(playerId);
        await detectNightFarmer(playerId);
        await detectPerfectOperation(playerId, true);
        await checkCollectionProgress(playerId);
      }
      if (achievementType === 'plant') {
        await updateComboPlant(playerId);
        await detectPerfectOperation(playerId, true);
        await checkCollectionProgress(playerId);
      }
      if (achievementType === 'buy' || achievementType === 'wealth') {
        await detectBigSpender(playerId, amount);
      }
      if (achievementType === 'use_item') {
        await checkItemCollection(playerId);
      }
    } catch (comboError) {
      logger.warn('连击/隐藏成就检测失败', {
        playerId,
        achievementType,
        error: comboError.message,
      });
    }

    await client.query('COMMIT');
    logger.info('成就检查完成', {
      playerId,
      completedCount: completedAchievements.length,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('成就检查失败', { playerId, error: error.message });
    throw error;
  } finally {
    client.release();
  }

  return completedAchievements;
};

/**
 * 更新成就进度
 */
const updateAchievementProgress = async function (
  client,
  playerId,
  achievementId,
  progress
) {
  const upsertQuery = `
    INSERT INTO player_achievement 
      (player_id, achievement_id, current_count, updated_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    ON CONFLICT (player_id, achievement_id) DO UPDATE
      SET current_count = $3, updated_at = CURRENT_TIMESTAMP
  `;
  await client.query(upsertQuery, [playerId, achievementId, progress]);
};

/**
 * 完成成就并发放奖励
 */
const completeAchievement = async function (client, playerId, achievement) {
  // 标记成就为已完成
  const completeQuery = `
    INSERT INTO player_achievement 
      (player_id, achievement_id, current_count, is_completed, completed_at, updated_at)
    VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (player_id, achievement_id) DO UPDATE
      SET is_completed = true, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  `;
  await client.query(completeQuery, [
    playerId,
    achievement.achievement_id,
    achievement.required_count,
  ]);

  // 发放奖励
  if (achievement.reward_type === 'currency') {
    // B2-4修复：确保player_currency记录存在，避免SELECT返回空行
    await client.query(
      `INSERT INTO player_currency (player_id, currency_num) 
       VALUES ($1, 0) ON CONFLICT (player_id) DO NOTHING`,
      [playerId]
    );

    const balanceQuery = `
      SELECT currency_num FROM player_currency 
      WHERE player_id = $1 FOR UPDATE
    `;
    const balanceResult = await client.query(balanceQuery, [playerId]);
    const balanceBefore = parseInt(balanceResult.rows[0]?.currency_num || 0);
    const balanceAfter = balanceBefore + parseInt(achievement.reward_amount);

    const rewardQuery = `
      UPDATE player_currency 
      SET currency_num = currency_num + $1, 
          total_earn = total_earn + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE player_id = $2
    `;
    await client.query(rewardQuery, [achievement.reward_amount, playerId]);

    await client.query(
      `
      INSERT INTO player_currency_log 
        (player_id, type, amount, source, related_id, balance_before, balance_after)
      VALUES ($1, 1, $2, $3, $4, $5, $6)
    `,
      [
        playerId,
        achievement.reward_amount,
        'achievement_reward',
        achievement.achievement_id,
        balanceBefore,
        balanceAfter,
      ]
    );
  } else if (achievement.reward_type === 'item') {
    const rewardItemQuery = `
      INSERT INTO player_inventory 
        (player_id, item_type, item_obj_id, item_num, total_add, last_add_time)
      VALUES ($1, 2, $2, 1, 1, CURRENT_TIMESTAMP)
      ON CONFLICT (player_id, item_type, item_obj_id) DO UPDATE
        SET item_num = player_inventory.item_num + 1,
            total_add = player_inventory.total_add + 1,
            last_add_time = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
    `;
    await client.query(rewardItemQuery, [playerId, achievement.reward_item_id]);
  }

  logger.info('成就完成', {
    playerId,
    achievementName: achievement.achievement_name,
  });
};

/**
 * 获取玩家成就列表
 */
const getPlayerAchievements = async function (playerId) {
  const query = `
    SELECT 
      ad.*, 
      COALESCE(pap.current_count, 0) as current_progress,
      COALESCE(pap.is_completed, false) as completed,
      pap.completed_at
    FROM achievement_definition ad
    LEFT JOIN player_achievement pap 
      ON ad.achievement_id = pap.achievement_id AND pap.player_id = $1
    WHERE ad.is_active = true
    ORDER BY ad.achievement_id
  `;
  const result = await pool.query(query, [playerId]);
  return result.rows;
};

/**
 * 获取玩家已解锁的成就（已完成的成就）
 * @param {string} playerId - 玩家ID
 * @returns {Promise<Array>}
 */
const getUnlockedAchievements = async function (playerId) {
  const query = `
    SELECT 
      ad.*, 
      pap.current_count as current_progress,
      pap.is_completed as completed,
      pap.completed_at
    FROM achievement_definition ad
    INNER JOIN player_achievement pap 
      ON ad.achievement_id = pap.achievement_id AND pap.player_id = $1
    WHERE pap.is_completed = true
      AND ad.is_active = true
    ORDER BY pap.completed_at DESC
  `;
  const result = await pool.query(query, [playerId]);
  return result.rows;
};

/**
 * 更新登录连击
 * 记录连续登录天数，检测三日农夫、百日坚持等成就
 * @param {string} playerId - 玩家ID
 * @returns {Promise<Object>}
 */
const updateComboLogin = async function (playerId) {
  const client = await pool.connect();
  try {
    // B2-3修复：添加BEGIN事务和FOR UPDATE行锁
    await client.query('BEGIN');

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const result = await client.query(
      'SELECT * FROM player_combo_tracker WHERE player_id = $1 FOR UPDATE',
      [playerId]
    );

    let newComboDays;
    if (result.rows.length === 0) {
      await client.query(
        `INSERT INTO player_combo_tracker
           (player_id, login_combo_days, last_login_date)
         VALUES ($1, 1, $2)`,
        [playerId, today]
      );
      newComboDays = 1;
    } else {
      const row = result.rows[0];
      const lastLogin = row.last_login_date
        ? new Date(row.last_login_date).toISOString().split('T')[0]
        : null;

      if (lastLogin === today) {
        newComboDays = row.login_combo_days;
      } else if (lastLogin === yesterdayStr) {
        newComboDays = row.login_combo_days + 1;
      } else {
        newComboDays = 1;
      }

      await client.query(
        `UPDATE player_combo_tracker
         SET login_combo_days = $1,
             last_login_date = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE player_id = $3`,
        [newComboDays, today, playerId]
      );
    }

    logger.info('登录连击更新', { playerId, comboDays: newComboDays });

    await checkAchievements(playerId, 'daily_login');

    await client.query('COMMIT');
    return { loginComboDays: newComboDays };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('更新登录连击失败', { playerId, error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 更新收获连击
 * 检测单次会话内连续收获次数，达到50次触发连击达人(C-05)
 * @param {string} playerId - 玩家ID
 * @returns {Promise<Object>}
 */
const updateComboHarvest = async function (playerId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const now = new Date();
    const comboIntervalMs = 30 * 1000;
    const trackerResult = await client.query(
      'SELECT * FROM player_combo_tracker WHERE player_id = $1 FOR UPDATE',
      [playerId]
    );

    let newCombo;
    if (trackerResult.rows.length === 0) {
      await client.query(
        `INSERT INTO player_combo_tracker
           (player_id, session_harvest_combo, last_harvest_time)
         VALUES ($1, 1, $2)`,
        [playerId, now]
      );
      newCombo = 1;
    } else {
      const row = trackerResult.rows[0];
      const lastTime = row.last_harvest_time
        ? new Date(row.last_harvest_time).getTime()
        : 0;
      const elapsed = now.getTime() - lastTime;

      newCombo = elapsed <= comboIntervalMs ? row.session_harvest_combo + 1 : 1;

      await client.query(
        `UPDATE player_combo_tracker
         SET session_harvest_combo = $1,
             last_harvest_time = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE player_id = $3`,
        [newCombo, now, playerId]
      );
    }

    const achResult = await client.query(
      `SELECT * FROM achievement_definition
       WHERE achievement_name = $1 AND is_active = true`,
      ['连击达人']
    );

    if (achResult.rows.length > 0) {
      const achievement = achResult.rows[0];
      const progResult = await client.query(
        `SELECT current_count FROM player_achievement
         WHERE player_id = $1 AND achievement_id = $2`,
        [playerId, achievement.achievement_id]
      );
      const currentProgress =
        progResult.rows.length > 0 ? progResult.rows[0].current_count : 0;

      await updateAchievementProgress(
        client,
        playerId,
        achievement.achievement_id,
        newCombo
      );

      if (
        newCombo >= achievement.required_count &&
        currentProgress < achievement.required_count
      ) {
        await completeAchievement(client, playerId, achievement);
      }
    }

    await client.query('COMMIT');

    logger.info('收获连击更新', { playerId, harvestCombo: newCombo });
    return { sessionHarvestCombo: newCombo, comboAchieved: newCombo >= 50 };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('更新收获连击失败', { playerId, error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 更新种植连击
 * 检测单次会话内连续种植次数，达到100次触发闪电之手(C-06)
 * @param {string} playerId - 玩家ID
 * @returns {Promise<Object>}
 */
const updateComboPlant = async function (playerId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const now = new Date();
    const comboIntervalMs = 60 * 1000;
    const trackerResult = await client.query(
      'SELECT * FROM player_combo_tracker WHERE player_id = $1 FOR UPDATE',
      [playerId]
    );

    let newCombo;
    if (trackerResult.rows.length === 0) {
      await client.query(
        `INSERT INTO player_combo_tracker
           (player_id, session_plant_combo, last_plant_time)
         VALUES ($1, 1, $2)`,
        [playerId, now]
      );
      newCombo = 1;
    } else {
      const row = trackerResult.rows[0];
      const lastTime = row.last_plant_time
        ? new Date(row.last_plant_time).getTime()
        : 0;
      const elapsed = now.getTime() - lastTime;

      newCombo = elapsed <= comboIntervalMs ? row.session_plant_combo + 1 : 1;

      await client.query(
        `UPDATE player_combo_tracker
         SET session_plant_combo = $1,
             last_plant_time = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE player_id = $3`,
        [newCombo, now, playerId]
      );
    }

    const achResult = await client.query(
      `SELECT * FROM achievement_definition
       WHERE achievement_name = $1 AND is_active = true`,
      ['闪电之手']
    );

    if (achResult.rows.length > 0) {
      const achievement = achResult.rows[0];
      const progResult = await client.query(
        `SELECT current_count FROM player_achievement
         WHERE player_id = $1 AND achievement_id = $2`,
        [playerId, achievement.achievement_id]
      );
      const currentProgress =
        progResult.rows.length > 0 ? progResult.rows[0].current_count : 0;

      await updateAchievementProgress(
        client,
        playerId,
        achievement.achievement_id,
        newCombo
      );

      if (
        newCombo >= achievement.required_count &&
        currentProgress < achievement.required_count
      ) {
        await completeAchievement(client, playerId, achievement);
      }
    }

    await client.query('COMMIT');

    logger.info('种植连击更新', { playerId, plantCombo: newCombo });
    return { sessionPlantCombo: newCombo, comboAchieved: newCombo >= 100 };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('更新种植连击失败', { playerId, error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 检测大额购买
 * 单次购买超过50000金币触发败家子(H-05)
 * @param {string} playerId - 玩家ID
 * @param {number} amount - 购买金额
 * @returns {Promise<Object>}
 */
const detectBigSpender = async function (playerId, amount) {
  if (!amount || amount < 50000) {
    return { triggered: false };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const achResult = await client.query(
      `SELECT * FROM achievement_definition
       WHERE achievement_name = $1 AND is_active = true`,
      ['败家子']
    );

    if (achResult.rows.length > 0) {
      const achievement = achResult.rows[0];
      const progResult = await client.query(
        `SELECT is_completed FROM player_achievement
         WHERE player_id = $1 AND achievement_id = $2`,
        [playerId, achievement.achievement_id]
      );

      if (progResult.rows.length === 0 || !progResult.rows[0].is_completed) {
        await updateAchievementProgress(
          client,
          playerId,
          achievement.achievement_id,
          amount
        );

        if (amount >= achievement.required_count) {
          await completeAchievement(client, playerId, achievement);
        }
      }
    }

    await client.query('COMMIT');

    logger.info('大额购买检测', { playerId, amount });
    return { triggered: true, amount };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('大额购买检测失败', { playerId, error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 检测午夜农夫
 * 服务器时间00:00-05:00期间收获触发午夜农夫(H-04)
 * @param {string} playerId - 玩家ID
 * @returns {Promise<Object>}
 */
const detectNightFarmer = async function (playerId) {
  // B2-1修复：使用数据库时间替代客户端本地时间
  const timeResult = await pool.query(
    'SELECT EXTRACT(HOUR FROM CURRENT_TIMESTAMP) AS hour'
  );
  const hour = parseInt(timeResult.rows[0].hour);

  if (hour >= 5) {
    return { isNightTime: false, hour };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const achResult = await client.query(
      `SELECT * FROM achievement_definition
       WHERE achievement_name = $1 AND is_active = true`,
      ['午夜农夫']
    );

    if (achResult.rows.length > 0) {
      const achievement = achResult.rows[0];
      const progResult = await client.query(
        `SELECT current_count FROM player_achievement
         WHERE player_id = $1 AND achievement_id = $2`,
        [playerId, achievement.achievement_id]
      );
      const currentProgress =
        progResult.rows.length > 0 ? progResult.rows[0].current_count : 0;
      const newProgress = currentProgress + 1;

      await updateAchievementProgress(
        client,
        playerId,
        achievement.achievement_id,
        newProgress
      );

      if (
        newProgress >= achievement.required_count &&
        currentProgress < achievement.required_count
      ) {
        await completeAchievement(client, playerId, achievement);
      }
    }

    await client.query('COMMIT');

    logger.info('午夜农夫检测', { playerId, hour });
    return { isNightTime: true, hour };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('午夜农夫检测失败', { playerId, error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 检测完美主义
 * 连续10次种植/收获操作无失误触发完美主义(H-06)
 * @param {string} playerId - 玩家ID
 * @param {boolean} isSuccess - 本次操作是否成功
 * @returns {Promise<Object>}
 */
const detectPerfectOperation = async function (playerId, isSuccess) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const trackerResult = await client.query(
      `SELECT perfect_operation_combo FROM player_combo_tracker
       WHERE player_id = $1 FOR UPDATE`,
      [playerId]
    );

    let newCombo;
    if (isSuccess) {
      if (trackerResult.rows.length === 0) {
        await client.query(
          `INSERT INTO player_combo_tracker
             (player_id, perfect_operation_combo)
           VALUES ($1, 1)`,
          [playerId]
        );
        newCombo = 1;
      } else {
        newCombo = trackerResult.rows[0].perfect_operation_combo + 1;
        await client.query(
          `UPDATE player_combo_tracker
           SET perfect_operation_combo = $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE player_id = $2`,
          [newCombo, playerId]
        );
      }
    } else {
      if (trackerResult.rows.length > 0) {
        await client.query(
          `UPDATE player_combo_tracker
           SET perfect_operation_combo = 0,
               updated_at = CURRENT_TIMESTAMP
           WHERE player_id = $1`,
          [playerId]
        );
      }
      newCombo = 0;
    }

    const achResult = await client.query(
      `SELECT * FROM achievement_definition
       WHERE achievement_name = $1 AND is_active = true`,
      ['完美主义']
    );

    if (achResult.rows.length > 0) {
      const achievement = achResult.rows[0];
      const progResult = await client.query(
        `SELECT current_count FROM player_achievement
         WHERE player_id = $1 AND achievement_id = $2`,
        [playerId, achievement.achievement_id]
      );
      const currentProgress =
        progResult.rows.length > 0 ? progResult.rows[0].current_count : 0;

      await updateAchievementProgress(
        client,
        playerId,
        achievement.achievement_id,
        newCombo
      );

      if (
        newCombo >= achievement.required_count &&
        currentProgress < achievement.required_count
      ) {
        await completeAchievement(client, playerId, achievement);
      }
    }

    await client.query('COMMIT');

    logger.info('完美操作追踪', {
      playerId,
      isSuccess,
      perfectCombo: newCombo,
    });
    return { perfectCombo: newCombo };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('完美操作检测失败', { playerId, error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 检测全图鉴收集
 * 统计玩家已种植/收获的作物种类，达标后触发全图鉴收集(L-06)
 * @param {string} playerId - 玩家ID
 * @returns {Promise<Object>}
 */
const checkCollectionProgress = async function (playerId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const collectionResult = await client.query(
      `SELECT COUNT(DISTINCT crop_id) as collected_count
       FROM player_land_status
       WHERE player_id = $1
         AND crop_id IS NOT NULL
         AND is_unlocked = true`,
      [playerId]
    );

    const collectedCount = parseInt(
      collectionResult.rows[0]?.collected_count || 0
    );

    const achResult = await client.query(
      `SELECT * FROM achievement_definition
       WHERE achievement_name = $1 AND is_active = true`,
      ['全图鉴收集']
    );

    if (achResult.rows.length > 0) {
      const achievement = achResult.rows[0];
      const progResult = await client.query(
        `SELECT current_count FROM player_achievement
         WHERE player_id = $1 AND achievement_id = $2`,
        [playerId, achievement.achievement_id]
      );
      const currentProgress =
        progResult.rows.length > 0 ? progResult.rows[0].current_count : 0;

      await updateAchievementProgress(
        client,
        playerId,
        achievement.achievement_id,
        collectedCount
      );

      if (
        collectedCount >= achievement.required_count &&
        currentProgress < achievement.required_count
      ) {
        await completeAchievement(client, playerId, achievement);
      }
    }

    await client.query('COMMIT');

    logger.info('全图鉴收集检测', { playerId, collectedCount });
    return { collectedCount };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('全图鉴收集检测失败', { playerId, error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 检测道具收藏家
 * 统计玩家使用过的不同道具种类，达标后触发道具收藏家(L-03)
 * @param {string} playerId - 玩家ID
 * @returns {Promise<Object>}
 */
const checkItemCollection = async function (playerId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const usageResult = await client.query(
      `SELECT COUNT(DISTINCT item_id) as used_count
       FROM player_item_usage_log
       WHERE player_id = $1`,
      [playerId]
    );

    const usedCount = parseInt(usageResult.rows[0]?.used_count || 0);

    const achResult = await client.query(
      `SELECT * FROM achievement_definition
       WHERE achievement_name = $1 AND is_active = true`,
      ['道具收藏家']
    );

    if (achResult.rows.length > 0) {
      const achievement = achResult.rows[0];
      const progResult = await client.query(
        `SELECT current_count FROM player_achievement
         WHERE player_id = $1 AND achievement_id = $2`,
        [playerId, achievement.achievement_id]
      );
      const currentProgress =
        progResult.rows.length > 0 ? progResult.rows[0].current_count : 0;

      await updateAchievementProgress(
        client,
        playerId,
        achievement.achievement_id,
        usedCount
      );

      if (
        usedCount >= achievement.required_count &&
        currentProgress < achievement.required_count
      ) {
        await completeAchievement(client, playerId, achievement);
      }
    }

    await client.query('COMMIT');

    logger.info('道具收藏检测', { playerId, usedItemCount: usedCount });
    return { usedItemCount: usedCount };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('道具收藏检测失败', { playerId, error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  checkAchievements,
  checkAndUpdateAchievements: checkAchievements,
  getPlayerAchievements,
  getUnlockedAchievements,
  updateComboLogin,
  updateComboHarvest,
  updateComboPlant,
  detectBigSpender,
  detectNightFarmer,
  detectPerfectOperation,
  checkCollectionProgress,
  checkItemCollection,
};
