/**
 * 文件名：imageUtils.js
 * 作者：开发者
 * 日期：2026-05-02
 * 版本：v1.1.0
 * 功能描述：图片优化工具——WebP检测、占位图生成、响应式图片
 * 更新记录：
 *   2026-05-02 - v1.0.0 - 初始创建
 *   2026-05-28 - v1.1.0 - 补充文件头规范、新增占位图检测工具
 */

let webPSupported = null;

/**
 * 检测浏览器是否支持WebP格式
 * @returns {Promise<boolean>}
 */
export const supportsWebP = () => {
  if (webPSupported !== null) {
    return Promise.resolve(webPSupported);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => {
      webPSupported = img.width === 2;
      resolve(webPSupported);
    };
    img.src =
      'data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAABBxAR/Q9ERP8DAABWUDggGAAAADABAJ0BKgEAAQABgBWkAAPoAEAAAAA';
  });
};

/**
 * 获取优化后的图片URL（WebP优先）
 * @param {string} originalUrl - 原始图片URL
 * @param {object} options - 可选参数
 * @returns {Promise<string>}
 */
export const getOptimizedImage = async (originalUrl, options = {}) => {
  if (!originalUrl) return originalUrl;

  const { forceWebP = false, webPSuffix = '.webp' } = options;

  if (forceWebP || (await supportsWebP())) {
    return originalUrl.replace(/\.(jpg|jpeg|png|gif)$/i, webPSuffix);
  }

  return originalUrl;
};

/**
 * 创建响应式图片源
 * @param {string} baseUrl - 基础URL
 * @param {number[]} sizes - 尺寸数组
 * @returns {Array<{src: string, size: number}>}
 */
export const createResponsiveImages = (baseUrl, sizes = [300, 600, 900]) => {
  return sizes.map((size) => ({
    src: `${baseUrl}?w=${size}`,
    size,
  }));
};

/**
 * 预加载图片
 * @param {string} src - 图片URL
 * @returns {Promise<HTMLImageElement>}
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * 获取图片尺寸
 * @param {string} src - 图片URL
 * @returns {Promise<{width: number, height: number}>}
 */
export const getImageDimensions = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * 检测是否为占位图（Base64 DataURL）
 * @param {string} src - 图片URL
 * @returns {boolean}
 */
export const isPlaceholder = (src) => {
  return src && src.startsWith('data:');
};

export default {
  supportsWebP,
  getOptimizedImage,
  createResponsiveImages,
  preloadImage,
  getImageDimensions,
  isPlaceholder,
};
