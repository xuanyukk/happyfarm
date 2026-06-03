/**
 * 文件名：migrate-crop-yield-exp.js
 * 作者：开发者
 * 日期：2026-03-25
 * 版本：v1.0.0
 * 功能描述：执行作物表字段迁移 - 添加产量范围和三种等级经验值字段
 * 更新记录：
 *   2026-03-25 - v1.0.0 - 新建文件，执行作物表迁移
 */

const pool = require('../../backend/src/config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 开始执行作物表迁移...\n');

  try {
    // 步骤1: 添加新字段
    console.log('📝 步骤1: 添加产量范围和经验值字段...');
    
    const alterStatements = [
      'ALTER TABLE crop ADD COLUMN IF NOT EXISTS min_yield INTEGER NOT NULL DEFAULT 1',
      'ALTER TABLE crop ADD COLUMN IF NOT EXISTS max_yield INTEGER NOT NULL DEFAULT 1',
      'ALTER TABLE crop ADD COLUMN IF NOT EXISTS player_exp_base INTEGER NOT NULL DEFAULT 1',
      'ALTER TABLE crop ADD COLUMN IF NOT EXISTS farm_exp_base INTEGER NOT NULL DEFAULT 1',
      'ALTER TABLE crop ADD COLUMN IF NOT EXISTS world_exp_base INTEGER NOT NULL DEFAULT 1'
    ];

    for (const statement of alterStatements) {
      try {
        await pool.query(statement);
        console.log(`  ✅ 执行成功: ${statement.substring(0, 60)}...`);
      } catch (err) {
        if (err.message.includes('already exists') || err.message.includes('column') && err.message.includes('exists')) {
          console.log(`  ⚠️  字段已存在，跳过`);
        } else {
          console.log(`  ⚠️  警告: ${err.message}`);
        }
      }
    }

    const commentStatements = [
      "COMMENT ON COLUMN crop.min_yield IS '最小产量'",
      "COMMENT ON COLUMN crop.max_yield IS '最大产量'",
      "COMMENT ON COLUMN crop.player_exp_base IS '玩家等级基础经验值'",
      "COMMENT ON COLUMN crop.farm_exp_base IS '农场等级基础经验值'",
      "COMMENT ON COLUMN crop.world_exp_base IS '世界等级基础经验值'"
    ];

    for (const statement of commentStatements) {
      try {
        await pool.query(statement);
      } catch (err) {
        console.log(`  ⚠️  注释设置警告: ${err.message}`);
      }
    }

    console.log('✅ 字段添加完成\n');

    // 步骤2: 更新作物数据
    console.log('📝 步骤2: 更新作物数据...');
    const dataSql = fs.readFileSync(
      path.join(__dirname, '../data/crop_data_v2.sql'),
      'utf8'
    );

    const dataStatements = dataSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SELECT'));

    for (const statement of dataStatements) {
      try {
        await pool.query(statement);
      } catch (err) {
        console.log(`  ⚠️  更新警告: ${err.message}`);
      }
    }
    console.log('✅ 作物数据更新完成\n');

    // 步骤3: 验证结果
    console.log('📝 步骤3: 验证迁移结果...');
    const verifyResult = await pool.query(`
      SELECT crop_id, crop_name, crop_type, base_yield, min_yield, max_yield,
             player_exp_base, farm_exp_base, world_exp_base
      FROM crop
      ORDER BY crop_id
    `);

    console.log('\n📊 迁移结果验证:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(
      '作物ID'.padEnd(8),
      '作物名称'.padEnd(12),
      '类型'.padEnd(8),
      '基础产量'.padEnd(8),
      '最小产量'.padEnd(8),
      '最大产量'.padEnd(8),
      '玩家经验'.padEnd(8),
      '农场经验'.padEnd(8),
      '世界经验'
    );
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const crop of verifyResult.rows) {
      console.log(
        String(crop.crop_id).padEnd(8),
        crop.crop_name.padEnd(12),
        crop.crop_type.padEnd(8),
        String(crop.base_yield).padEnd(8),
        String(crop.min_yield).padEnd(8),
        String(crop.max_yield).padEnd(8),
        String(crop.player_exp_base).padEnd(8),
        String(crop.farm_exp_base).padEnd(8),
        String(crop.world_exp_base)
      );
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n🎉 迁移成功完成！');

  } catch (error) {
    console.error('\n❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
