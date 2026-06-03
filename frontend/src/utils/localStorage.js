/**
 * 文件名：localStorage.js
 * 作者：开发者
 * 日期：2026-05-06
 * 版本：v1.0.0
 * 功能描述：localStorage封装工具，提供安全的持久化存储功能
 */

const STORAGE_PREFIX = 'happyfarm_';
const DEFAULT_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000; // 默认7天过期

class SafeStorage {
  constructor(options = {}) {
    this.prefix = options.prefix || STORAGE_PREFIX;
    this.defaultExpire = options.defaultExpire || DEFAULT_EXPIRE_TIME;
    this.supported = this._isSupported();
  }

  _isSupported() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  _getKey(key) {
    return `${this.prefix}${key}`;
  }

  set(key, value, options = {}) {
    if (!this.supported) return false;

    try {
      const data = {
        value,
        timestamp: Date.now(),
        expire: options.expire || this.defaultExpire,
      };

      localStorage.setItem(this._getKey(key), JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  }

  get(key, defaultValue = null) {
    if (!this.supported) return defaultValue;

    try {
      const item = localStorage.getItem(this._getKey(key));
      if (!item) return defaultValue;

      const data = JSON.parse(item);

      if (data.expire > 0 && Date.now() - data.timestamp > data.expire) {
        this.remove(key);
        return defaultValue;
      }

      return data.value;
    } catch (e) {
      console.error('Storage get error:', e);
      return defaultValue;
    }
  }

  remove(key) {
    if (!this.supported) return;

    try {
      localStorage.removeItem(this._getKey(key));
    } catch (e) {
      console.error('Storage remove error:', e);
    }
  }

  clearAll(onlyPrefixed = true) {
    if (!this.supported) return;

    try {
      if (onlyPrefixed) {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            keys.push(key);
          }
        }
        keys.forEach((key) => localStorage.removeItem(key));
      } else {
        localStorage.clear();
      }
    } catch (e) {
      console.error('Storage clear error:', e);
    }
  }

  has(key) {
    if (!this.supported) return false;
    return localStorage.getItem(this._getKey(key)) !== null;
  }

  getStorageInfo() {
    if (!this.supported) {
      return { supported: false, used: 0, remaining: 0 };
    }

    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          total += key.length + (localStorage.getItem(key)?.length || 0);
        }
      }

      return {
        supported: true,
        used: Math.round(total / 1024),
        usedBytes: total,
        remaining: 5 * 1024 - Math.round(total / 1024),
      };
    } catch (e) {
      return { supported: true, used: 0, remaining: 0 };
    }
  }
}

export const storage = new SafeStorage();

export const createPersistedState = (options = {}) => {
  const {
    key = 'pinia_state',
    paths = [],
    storage: customStorage = storage,
  } = options;

  return (context) => {
    const { store } = context;

    const savedState = customStorage.get(key);
    if (savedState) {
      const targetState =
        paths.length > 0
          ? Object.fromEntries(paths.map((path) => [path, savedState[path]]))
          : savedState;

      store.$patch(targetState);
    }

    store.$subscribe((mutation, state) => {
      const stateToPersist =
        paths.length > 0
          ? Object.fromEntries(paths.map((path) => [path, state[path]]))
          : state;

      customStorage.set(key, stateToPersist);
    });
  };
};

export default storage;
