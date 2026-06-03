// 文件名：backupService.test.js
// 作者：开发者
// 日期：2026-05-06
// 版本：v1.0.0
// 功能描述：备份服务的基础测试

describe('Backup Service', () => {
  test('should export an object with required methods', () => {
    const backupService = require('../src/services/backupService');
    
    expect(backupService).toBeDefined();
    expect(typeof backupService.createBackup).toBe('function');
    expect(typeof backupService.listBackups).toBe('function');
    expect(typeof backupService.getBackupDir).toBe('function');
  });

  test('should have restore-related methods', () => {
    const backupService = require('../src/services/backupService');
    
    expect(typeof backupService.restoreDatabase).toBe('function');
    expect(typeof backupService.getRestoreProgress).toBe('function');
    expect(typeof backupService.rollbackRestore).toBe('function');
    expect(typeof backupService.clearRestoreProgress).toBe('function');
  });
});