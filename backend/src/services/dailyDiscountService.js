/**
 * 文件名：dailyDiscountService.js
 * 作者：Trae AI
 * 日期：2026-05-31
 * 版本：v1.0.0
 * 功能描述：每日折扣商品服务——刷新折扣、查询折扣、计算折扣价格
 * 更新记录：
 *   2026-05-31 - v1.0.0 - 方案B：初始创建
 */

const pool = require('../config/db');
const logger = require('../config/logger');

/**
 * 刷新每日折扣商品
 * 清除旧折扣，随机抽取3个商品进行限时折扣
 * @returns {Promise<Object>} 包含当日折扣商品列表
 */
const refreshDailyDiscounts = async function () {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const today = new Date().toISOString().split('T')[0];
    const todayEnd = new Date(today + 'T23:59:59+08:00').toISOString();

    // B5-1修复：添加FOR UPDATE行锁防止并发刷新生成超过3个折扣
    const existingResult = await client.query(
      'SELECT COUNT(*) as cnt FROM daily_discount_goods WHERE start_time::date = $1::date AND is_active = TRUE FOR UPDATE',
      [today]
    );
    if (parseInt(existingResult.rows[0].cnt) >= 3) {
      await client.query('ROLLBACK');
      logger.info('每日折扣已存在，跳过刷新', {
        today,
        count: parseInt(existingResult.rows[0].cnt),
      });
      const discounts = await getDailyDiscounts();
      return discounts;
    }

    await client.query(
      `UPDATE daily_discount_goods
       SET is_active = FALSE
       WHERE end_time < CURRENT_TIMESTAMP AND is_active = TRUE`
    );

    const candidateResult = await client.query(
      `SELECT sg.goods_id, sg.goods_name, sg.price_type, sg.price_num,
              sg.goods_type, sg.goods_obj_id
       FROM shop_goods sg
       WHERE sg.is_on_sale = TRUE
         AND sg.goods_type = 2
         AND sg.price_num > 0
         AND sg.goods_id NOT IN (
           SELECT goods_id FROM daily_discount_goods
           WHERE start_time::date >= (CURRENT_DATE - INTERVAL '2 days')::date
         )
       ORDER BY RANDOM()
       LIMIT 3`
    );

    if (candidateResult.rows.length === 0) {
      await client.query('COMMIT');
      logger.info('无可用折扣候选商品');
      return { discounts: [], message: '今日无可用的折扣商品' };
    }

    const discounts = [];
    for (const goods of candidateResult.rows) {
      const discountRate = (Math.floor(Math.random() * 5) * 5 + 70) / 100;
      const discountPrice = Math.floor(
        parseInt(goods.price_num) * discountRate
      );

      const insertResult = await client.query(
        `INSERT INTO daily_discount_goods
         (goods_id, discount_rate, discount_price, start_time, end_time, is_active)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, TRUE)
         ON CONFLICT (goods_id, start_time) DO UPDATE
         SET discount_rate = $2, discount_price = $3, is_active = TRUE
         RETURNING discount_id`,
        [goods.goods_id, discountRate, discountPrice, todayEnd]
      );

      discounts.push({
        discountId: insertResult.rows[0].discount_id,
        goodsId: goods.goods_id,
        goodsName: goods.goods_name,
        originalPrice: parseInt(goods.price_num),
        discountRate,
        discountPrice,
      });
    }

    await client.query('COMMIT');

    logger.info('每日折扣刷新成功', {
      today,
      count: discounts.length,
      discounts: discounts.map((d) => ({
        name: d.goodsName,
        rate: d.discountRate,
      })),
    });

    return {
      message: `成功生成${discounts.length}个每日折扣`,
      discounts,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('刷新每日折扣失败', { error: error.message });
    throw new Error('刷新每日折扣失败');
  } finally {
    client.release();
  }
};

/**
 * 获取当前有效的每日折扣商品列表
 * @returns {Promise<Array>} 折扣商品列表（含完整商品信息）
 */
const getDailyDiscounts = async function () {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
        dd.discount_id,
        dd.goods_id,
        dd.discount_rate,
        dd.discount_price,
        dd.start_time,
        dd.end_time,
        dd.is_active,
        sg.goods_name,
        sg.goods_type,
        sg.goods_obj_id,
        sg.price_type,
        sg.price_num as original_price,
        sg.description,
        sg.stock_limit,
        sg.is_on_sale
       FROM daily_discount_goods dd
       INNER JOIN shop_goods sg ON dd.goods_id = sg.goods_id
       WHERE dd.is_active = TRUE
         AND dd.end_time > CURRENT_TIMESTAMP
       ORDER BY dd.discount_rate ASC`
    );

    return result.rows.map((row) => ({
      discountId: row.discount_id,
      goodsId: row.goods_id,
      goodsName: row.goods_name,
      goodsType: row.goods_type,
      goodsObjId: row.goods_obj_id,
      originalPrice: parseInt(row.original_price),
      discountRate: parseFloat(row.discount_rate),
      discountPrice: parseInt(row.discount_price),
      priceType: parseInt(row.price_type) || 1,
      startTime: row.start_time,
      endTime: row.end_time,
      isActive: row.is_active,
      description: row.description,
      stockLimit: row.stock_limit,
      isOnSale: row.is_on_sale,
      discountPercent: Math.round((1 - parseFloat(row.discount_rate)) * 100),
    }));
  } catch (error) {
    logger.error('获取每日折扣失败', { error: error.message });
    throw new Error('获取每日折扣失败');
  } finally {
    client.release();
  }
};

/**
 * 根据商品ID获取单个折扣信息
 * @param {number} goodsId - 商品ID
 * @returns {Promise<Object|null>}
 */
const getDiscountByGoodsId = async function (goodsId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM daily_discount_goods
       WHERE goods_id = $1
         AND is_active = TRUE
         AND end_time > CURRENT_TIMESTAMP
       LIMIT 1`,
      [goodsId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    // B5-2修复：数据库错误应向上抛出，而非静默返回null
    logger.error('获取商品折扣失败', { goodsId, error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 计算折扣价格
 * @param {number} originalPrice - 原价
 * @param {number} discountRate - 折扣率(0.50-0.95)
 * @returns {number} 折扣后价格（向下取整，最低1）
 */
const calculateDiscountPrice = function (originalPrice, discountRate) {
  const price = Math.floor(originalPrice * discountRate);
  return Math.max(1, price);
};

module.exports = {
  refreshDailyDiscounts,
  getDailyDiscounts,
  getDiscountByGoodsId,
  calculateDiscountPrice,
};
