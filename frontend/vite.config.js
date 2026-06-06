// 文件名：vite.config.js
// 作者：开发者
// 日期：2026-03-19
// 版本：v2.0.0
// 功能描述：Vite构建配置，适配Vite 8.0，包含代码分割优化、图片优化、gzip压缩、Bundle分析
// 更新记录：
//   2026-05-06 - v1.3.0 - 添加manualChunks代码分割、bundle分析和图片优化配置
//   2026-05-07 - v1.4.0 - 添加gzip压缩配置、图片优化增强、性能优化配置
//   2026-05-21 - v2.0.0 - 完善Tree Shaking、优化manualChunks、添加Bundle分析功能

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isAnalyzeMode = mode === 'analyze';
  
  return {
    plugins: [
      vue(),
      // Gzip压缩配置
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240, // 10kb以上的文件才压缩
        algorithm: 'gzip',
        ext: '.gz',
        compressionOptions: { level: 9 },
      }),
      // Brotli压缩（更好的压缩率）
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'brotliCompress',
        ext: '.br',
        compressionOptions: { level: 11 },
      }),
      // Bundle 分析（仅在 analyze 模式下启用）
      isAnalyzeMode && visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    
    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: command === 'serve',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
          pure_funcs: ['console.log'],
          passes: 2
        },
        format: {
          comments: false
        }
      },
      
      cssCodeSplit: true,
      reportCompressedSize: true,
      chunkSizeWarningLimit: 500,
      emptyOutDir: true,
      
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('vue')) {
                return 'vue-vendor';
              }
              if (id.includes('axios')) {
                return 'axios-vendor';
              }
              if (id.includes('socket.io-client')) {
                return 'socket-vendor';
              }
              return 'vendor';
            }
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || 'asset';
            const ext = name.split('.').pop();
            if (/png|jpe?g|svg|gif|webp|avif|ico/i.test(ext)) {
              return 'assets/images/[name]-[hash].[ext]';
            }
            if (/css/i.test(ext)) {
              return 'assets/css/[name]-[hash].[ext]';
            }
            if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
              return 'assets/fonts/[name]-[hash].[ext]';
            }
            return 'assets/[name]-[hash].[ext]';
          }
        },
        treeshake: {
          moduleSideEffects: false,
          unknownGlobalSideEffects: false,
        },
      },
    },
    
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.webp', '**/*.avif'],
    
    server: {
      port: 5173,
      open: true,
      cors: true,
      host: 'localhost', // Windows下禁用0.0.0.0，避免安全风险
      // 启用热重载相关配置
      watch: {
        usePolling: true, // Docker环境需要轮询检测文件变化
      },
      proxy: {
        '/api': {
          target: 'http://backend:3000', // Docker环境直接使用容器名访问
          changeOrigin: true,
          secure: false,
        }
      }
    },
    
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia', 'axios', 'socket.io-client'],
      force: false,
    },
    
    preview: {
      port: 4173,
      open: true,
    },
  };
});
