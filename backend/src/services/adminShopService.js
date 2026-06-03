/**
 * 文件名: adminShopService.js
 * 作者: Trae AI
 * 日期: 2026-05-31
 * 版本: v1.0.0
 * 功能描述: 管理后台商店商品管理服务，提供商品的CRUD操作
 * 更新记录:
 *   2026-05-31 - v1.0.0 - 初始版本创建，实现商店商品管理CRUD
 */

const pool = require('../config/db');
const logger = require('../config/logger');

/**
 * 获取商店商品列表
 * @param {Object} params - 查询参数 { goodsType, search, isOnSale }
 * @returns {Array} 商品列表
 */
async function getShopGoodsList(params = {}) {
  try {
    let query = 'SELECT * FROM shop_goods WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (params.goodsType) {
      query += ` AND goods_type = $${paramIndex++}`;
      queryParams.push(params.goodsType);
    }

    if (params.search) {
      query += ` AND goods_name ILIKE $${paramIndex++}`;
      queryParams.push(`%${params.search}%`);
    }

    if (params.isOnSale !== undefined && params.isOnSale !== null && params.isOnSale !== '') {
      query += ` AND is_on_sale = $${paramIndex++}`;
      queryParams.push(params.isOnSale === 'true' || params.isOnSale === true);
    }

    query += ' ORDER BY goods_type, goods_id';

    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    logger.error('获取商店商品列表失败', { error: error.message });
    throw error;
  }
}

/**
 * 获取商店商品详情
 * @param {number} goodsId - 商品ID
 * @returns {Object} 商品详情
 */
async function getShopGoodsDetail(goodsId) {
  try {
    const query = 'SELECT * FROM shop_goods WHERE goods_id = $1';
    const result = await pool.query(query, [goodsId]);
    if (result.rows.length === 0) {
      throw new Error('商品不存在');
    }
    return result.rows[0];
  } catch (error) {
    logger.error('获取商店商品详情失败', { goodsId, error: error.message });
    throw error;
  }
}

/**
 * 创建商店商品
 * @param {Object} data - 商品数据
 * @returns {Object} 创建的商品
 */
async function createShopGoods(data) {
  try {
    const query = `
      INSERT INTO shop_goods (
        goods_type, goods_obj_id, goods_name, price_type, price_num,
        unlock_world_level, unlock_player_level, stock_limit,
        sales_volume, is_on_sale, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      data.goodsType, data.goodsObjId, data.goodsName, data.priceType || 1,
      data.priceNum, data.unlockWorldLevel || 1, data.unlockPlayerLevel || 1,
      data.stockLimit || 9999, data.salesVolume || 0,
      data.isOnSale !== undefined ? data.isOnSale : true,
      data.description || ''
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error('创建商店商品失败', { error: error.message });
    throw error;
  }
}

/**
 * 更新商店商品
 * @param {number} goodsId - 商品ID
 * @param {Object} data - 更新数据
 * @returns {Object} 更新后的商品
 */
async function updateShopGoods(goodsId, data) {
  try {
    const checkQuery = 'SELECT * FROM shop_goods WHERE goods_id = $1';
    const checkResult = await pool.query(checkQuery, [goodsId]);
    if (checkResult.rows.length === 0) {
      throw new Error('商品不存在');
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    const fieldMap = {
      goodsType: 'goods_type',
      goodsObjId: 'goods_obj_id',
      goodsName: 'goods_name',
      priceType: 'price_type',
      priceNum: 'price_num',
      unlockWorldLevel: 'unlock_world_level',
      unlockPlayerLevel: 'unlock_player_level',
      stockLimit: 'stock_limit',
      salesVolume: 'sales_volume',
      isOnSale: 'is_on_sale',
      description: 'description'
    };

    Object.entries(fieldMap).forEach(([key, column]) => {
      if (data[key] !== undefined) {
        fields.push(`${column} = $${paramIndex++}`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('没有需要更新的字段');
    }

    values.push(goodsId);
    const query = `
      UPDATE shop_goods SET ${fields.join(', ')}
      WHERE goods_id = $${paramIndex}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error('更新商店商品失败', { goodsId, error: error.message });
    throw error;
  }
}

/**
 * 删除商店商品
 * @param {number} goodsId - 商品ID
 * @returns {Object} 删除结果
 */
async function deleteShopGoods(goodsId) {
  try {
    const checkQuery = 'SELECT * FROM shop_goods WHERE goods_id = $1';
    const checkResult = await pool.query(checkQuery, [goodsId]);
    if (checkResult.rows.length === 0) {
      throw new Error('商品不存在');
    }

    const query = 'DELETE FROM shop_goods WHERE goods_id = $1';
    await pool.query(query, [goodsId]);
    return { message: '商品已删除' };
  } catch (error) {
    logger.error('删除商店商品失败', { goodsId, error: error.message });
    throw error;
  }
}

/**
 * 切换商品上架状态
 * @param {number} goodsId - 商品ID
 * @param {boolean} isOnSale - 上架状态
 * @returns {Object} 更新后的商品
 */
async function toggleShopGoodsStatus(goodsId, isOnSale) {
  try {
    const query = `
      UPDATE shop_goods SET is_on_sale = $1
      WHERE goods_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [isOnSale, goodsId]);
    if (result.rows.length === 0) {
      throw new Error('商品不存在');
    }
    return result.rows[0];
  } catch (error) {
    logger.error('切换商品状态失败', { goodsId, error: error.message });
    throw error;
  }
}

module.exports = {
  getShopGoodsList,
  getShopGoodsDetail,
  createShopGoods,
  updateShopGoods,
  deleteShopGoods,
  toggleShopGoodsStatus
};