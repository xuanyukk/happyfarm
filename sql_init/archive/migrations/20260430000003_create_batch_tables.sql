-- ============================================
-- 迁移名称: create_batch_tables
-- 版本: v2.0.0
-- 日期: 2026-04-30
-- 描述: 创建批量操作功能表
-- 影响范围: 新增 batch_operation/batch_operation_detail/batch_file 表
-- 回滚操作: DROP TABLE IF EXISTS batch_file; DROP TABLE IF EXISTS batch_operation_detail; DROP TABLE IF EXISTS batch_operation;
-- 依赖: 29_admin_system.sql（管理员表）
-- ============================================

-- 批量操作记录表
CREATE TABLE IF NOT EXISTS batch_operation (
  id SERIAL PRIMARY KEY,
  operation_type VARCHAR(50) NOT NULL COMMENT '操作类型',
  target_module VARCHAR(50) NOT NULL COMMENT '目标模块',
  operator_id INTEGER REFERENCES admins(id),
  total_count INTEGER NOT NULL COMMENT '总条数',
  success_count INTEGER DEFAULT 0 COMMENT '成功数',
  fail_count INTEGER DEFAULT 0 COMMENT '失败数',
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')) COMMENT '状态',
  progress INTEGER DEFAULT 0 COMMENT '进度0-100',
  input_data JSONB COMMENT '输入数据',
  result_data JSONB COMMENT '结果数据',
  error_log TEXT COMMENT '错误日志',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 批量操作详情表
CREATE TABLE IF NOT EXISTS batch_operation_detail (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES batch_operation(id) ON DELETE CASCADE,
  target_id INTEGER COMMENT '目标记录ID',
  target_data JSONB COMMENT '目标数据',
  status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'FAIL', 'SKIP')) COMMENT '状态',
  error_message TEXT COMMENT '错误信息',
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 批量操作文件表
CREATE TABLE IF NOT EXISTS batch_file (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES batch_operation(id),
  file_name VARCHAR(255) NOT NULL COMMENT '文件名',
  file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
  file_type VARCHAR(50) COMMENT '文件类型',
  file_size BIGINT COMMENT '文件大小',
  uploader_id INTEGER REFERENCES admins(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_batch_operation_operator ON batch_operation(operator_id);
CREATE INDEX IF NOT EXISTS idx_batch_operation_status ON batch_operation(status);
CREATE INDEX IF NOT EXISTS idx_batch_operation_created ON batch_operation(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_detail_batch ON batch_operation_detail(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_file_batch ON batch_file(batch_id);

