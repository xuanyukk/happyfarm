/**
 * 文件名：diContainer.test.js
 * 作者：开发者
 * 日期：2026-05-01
 * 版本：v1.0.0
 * 功能描述：DI容器单元测试
 */

const { DIContainer } = require('../src/config/diContainer');

describe('DI容器测试', () => {
  let container;

  beforeEach(() => {
    container = new DIContainer();
  });

  describe('服务注册与解析', () => {
    test('应该能够注册和解析值服务', () => {
      const testValue = { foo: 'bar' };
      container.registerValue('testValue', testValue);
      
      const resolved = container.resolve('testValue');
      expect(resolved).toBe(testValue);
      expect(container.has('testValue')).toBe(true);
    });

    test('应该能够注册和解析单例服务', () => {
      class TestService {
        constructor() {
          this.id = Math.random();
        }
      }
      
      container.registerSingleton('testService', TestService);
      
      const instance1 = container.resolve('testService');
      const instance2 = container.resolve('testService');
      
      expect(instance1).toBe(instance2);
    });

    test('应该能够注册和解析工厂服务', () => {
      class TestService {
        constructor() {
          this.id = Math.random();
        }
      }
      
      container.registerFactory('testService', TestService);
      
      const instance1 = container.resolve('testService');
      const instance2 = container.resolve('testService');
      
      expect(instance1).not.toBe(instance2);
    });

    test('应该能够正确解析依赖关系', () => {
      class DepService {
        constructor() {
          this.name = 'depService';
        }
      }
      
      class MainService {
        constructor(depService) {
          this.dep = depService;
        }
      }
      
      container.registerSingleton('depService', DepService);
      container.registerSingleton('mainService', MainService, ['depService']);
      
      const mainService = container.resolve('mainService');
      expect(mainService.dep).toBeDefined();
      expect(mainService.dep.name).toBe('depService');
    });
  });

  describe('错误处理', () => {
    test('解析未注册的服务应该抛出错误', () => {
      expect(() => container.resolve('nonexistent')).toThrow();
    });

    test('应该能够检测循环依赖', () => {
      class A { constructor(b) { this.b = b; } }
      class B { constructor(a) { this.a = a; } }
      
      container.registerSingleton('a', A, ['b']);
      container.registerSingleton('b', B, ['a']);
      
      expect(() => container.resolve('a')).toThrow(/Circular dependency/);
    });
  });

  describe('管理功能', () => {
    test('应该能够获取已注册的服务列表', () => {
      container.registerValue('service1', {});
      container.registerValue('service2', {});
      
      const services = container.getRegisteredServices();
      expect(services).toContain('service1');
      expect(services).toContain('service2');
    });

    test('应该能够清除单例缓存', () => {
      class TestService { count = 0; }
      
      container.registerSingleton('testService', TestService);
      
      const instance1 = container.resolve('testService');
      container.clearInstance('testService');
      const instance2 = container.resolve('testService');
      
      expect(instance1).not.toBe(instance2);
    });

    test('应该能够清除所有单例缓存', () => {
      class Service1 {}
      class Service2 {}
      
      container.registerSingleton('service1', Service1);
      container.registerSingleton('service2', Service2);
      
      container.resolve('service1');
      container.resolve('service2');
      
      const diagnosticsBefore = container.getDiagnostics();
      expect(diagnosticsBefore.instanceCount).toBe(2);
      
      container.clearAllInstances();
      
      const diagnosticsAfter = container.getDiagnostics();
      expect(diagnosticsAfter.instanceCount).toBe(0);
    });

    test('应该能够注销服务', () => {
      container.registerValue('testService', {});
      expect(container.has('testService')).toBe(true);
      
      container.unregister('testService');
      expect(container.has('testService')).toBe(false);
    });

    test('应该能够重置整个容器', () => {
      container.registerValue('service1', {});
      container.registerValue('service2', {});
      container.resolve('service1');
      
      expect(container.getRegisteredServices().length).toBe(2);
      
      container.reset();
      
      expect(container.getRegisteredServices().length).toBe(0);
      expect(container.getDiagnostics().instanceCount).toBe(0);
    });

    test('应该能够获取诊断信息', () => {
      container.registerValue('testService', { foo: 'bar' });
      
      const diagnostics = container.getDiagnostics();
      expect(diagnostics.serviceCount).toBe(1);
      expect(Array.isArray(diagnostics.services)).toBe(true);
    });
  });

  describe('工厂函数支持', () => {
    test('应该支持工厂函数而非类', () => {
      const factory = (config) => ({
        value: config,
        createdAt: new Date()
      });
      
      container.registerValue('config', 'test-config');
      container.registerSingleton('factoryService', factory, ['config']);
      
      const service = container.resolve('factoryService');
      expect(service.value).toBe('test-config');
      expect(service.createdAt).toBeDefined();
    });
  });
});
