/**
 * 文件名：performanceMonitor.js
 * 作者：开发者
 * 日期：2026-05-06
 * 版本：v1.0.0
 * 功能描述：前端性能监控工具，监控页面加载、资源加载、交互性能等
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = [];
    this.init();
  }

  init() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.collectNavigationTiming();
      this.collectResourceTiming();
      this.collectPaintTiming();
      this.setupLCPObserver();
      this.setupFIDObserver();
      this.setupCLSObserver();
      this.collectDeviceInfo();
    }
  }

  collectNavigationTiming() {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      this.metrics.navigation = {
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.startTime,
        loadComplete: navigation.loadEventEnd - navigation.startTime,
        domInteractive: navigation.domInteractive - navigation.startTime,
        ttfb: navigation.responseStart - navigation.requestStart,
      };
    }
  }

  collectResourceTiming() {
    const resources = performance.getEntriesByType('resource');
    this.metrics.resources = resources.map((r) => ({
      name: r.name,
      duration: r.duration,
      transferSize: r.transferSize,
      initiatorType: r.initiatorType,
    }));
  }

  collectPaintTiming() {
    const paints = performance.getEntriesByType('paint');
    this.metrics.paint = paints.reduce((acc, paint) => {
      acc[paint.name] = paint.startTime;
      return acc;
    }, {});
  }

  setupLCPObserver() {
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = {
            value: lastEntry.startTime,
            element: lastEntry.element?.tagName || 'unknown',
          };
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported:', e);
      }
    }
  }

  setupFIDObserver() {
    if ('PerformanceObserver' in window) {
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstEntry = entries[0];
          if (firstEntry) {
            this.metrics.fid = {
              value: firstEntry.processingStart - firstEntry.startTime,
            };
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported:', e);
      }
    }
  }

  setupCLSObserver() {
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        let clsEntries = [];

        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              clsEntries.push(entry);
            }
          }
          this.metrics.cls = {
            value: clsValue,
            entries: clsEntries.length,
          };
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported:', e);
      }
    }
  }

  collectDeviceInfo() {
    this.metrics.device = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      connection: navigator.connection?.effectiveType || 'unknown',
      memory: navigator.deviceMemory || 'unknown',
      cores: navigator.hardwareConcurrency || 'unknown',
    };
  }

  getMetrics() {
    return this.metrics;
  }

  getCoreWebVitals() {
    return {
      lcp: this.metrics.lcp?.value,
      fid: this.metrics.fid?.value,
      cls: this.metrics.cls?.value,
      ttfb: this.metrics.navigation?.ttfb,
    };
  }

  sendToServer(url = '/api/frontend-metrics') {
    if (url && this.metrics) {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...this.metrics,
          timestamp: Date.now(),
          url: window.location.href,
        }),
        keepalive: true,
      }).catch((err) => {
        console.warn('Failed to send performance metrics:', err);
      });
    }
  }

  destroy() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

export default new PerformanceMonitor();
