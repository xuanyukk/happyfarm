/**
 * 文件名：01_enable_pgcrypto.sql
 * 作者：开发者
 * 日期：2026-05-01
 * 版本：1.0.0
 * 功能描述：启用 pgcrypto 扩展，用于密码加密等功能
 */

-- 启用 pgcrypto 扩展（需超级用户权限）
CREATE EXTENSION IF NOT EXISTS pgcrypto;
