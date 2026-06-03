/**
 * 文件名：benchmark.config.js
 * 作者：开发者
 * 日期：2026-05-06
 * 版本：v1.0.0
 * 功能描述：性能基准测试配置
 */

export default {
  pages: [
    {
      name: 'Home',
      url: 'http://localhost:5173/',
      thresholds: {
        lcp: 2500,
        fid: 100,
        cls: 0.1,
        ttfb: 800
      }
    },
    {
      name: 'Shop',
      url: 'http://localhost:5173/shop',
      thresholds: {
        lcp: 3000,
        fid: 100,
        cls: 0.15,
        ttfb: 1000
      }
    }
  ],
  iterations: 3,
  output: {
    format: 'json',
    dir: 'benchmark-results'
  },
  viewport: {
    width: 1280,
    height: 720
  },
  throttling: {
    cpu: 1,
    network: 'WIFI'
  }
};
