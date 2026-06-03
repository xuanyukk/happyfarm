/**
 * 文件名：ark-api.cjs
 * 作者：开发者
 * 日期：2026-05-29
 * 版本：v1.1.0
 * 功能描述：火山引擎方舟(Ark)API共享工具模块——为所有图标生成脚本
 *          提供统一的API调用、配置加载、图片处理等基础功能
 * 更新记录：
 *   2026-05-29 - v1.0.0 - 初始创建，从硅基流动迁移至火山引擎方舟
 *   2026-05-29 - v1.1.0 - 新增：模型管理与负载均衡、图片质量保障模块、
 *                         自动格式检测与修正、断点恢复支持
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

/**
 * 加载.env环境变量配置
 */
function loadEnvConfig() {
  const envPath = path.join(__dirname, ".env");

  if (!fs.existsSync(envPath)) {
    console.log(
      "\x1b[33m[提示]\x1b[0m 未找到 .env 文件，使用环境变量。\n" +
        "  可复制 .env.example 为 .env 并填入ARK_API_KEY。\n"
    );
  } else {
    const content = fs.readFileSync(envPath, "utf-8");
    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.substring(0, eqIdx).trim();
          const value = trimmed.substring(eqIdx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }

  return {
    apiKey: process.env.ARK_API_KEY || "",
    apiBaseUrl:
      process.env.ARK_API_BASE_URL ||
      "https://ark.cn-beijing.volces.com/api/v3",
    cropModel:
      process.env.ARK_CROP_MODEL || "doubao-seedream-4-5-251128",
    uiModel:
      process.env.ARK_UI_MODEL || "doubao-seedream-4-5-251128",
    outputDir:
      process.env.OUTPUT_DIR || "frontend/public/assets",
    cropMaxConcurrent:
      parseInt(process.env.ARK_CROP_MAX_CONCURRENT) || 2,
    cropRequestDelayMs:
      parseInt(process.env.ARK_CROP_REQUEST_DELAY_MS) || 3000,
    uiMaxConcurrent:
      parseInt(process.env.ARK_UI_MAX_CONCURRENT) || 2,
    uiRequestDelayMs:
      parseInt(process.env.ARK_UI_REQUEST_DELAY_MS) || 3000
  };
}

/**
 * HTTP请求封装，支持JSON和二进制响应
 */
function httpRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const transport = urlObj.protocol === "https:" ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || "POST",
      headers: options.headers || {},
      timeout: 180000
    };

    const req = transport.request(reqOptions, (res) => {
      const chunks = [];
      const contentType = res.headers["content-type"] || "";
      res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      res.on("end", () => {
        const rawBuf = Buffer.concat(chunks);

        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (contentType.startsWith("image/")) {
            resolve({
              _rawImage: true,
              b64_json: rawBuf.toString("base64")
            });
            return;
          }

          try {
            const json = JSON.parse(rawBuf.toString("utf-8"));
            resolve(json);
          } catch (e) {
            resolve({
              _rawImage: true,
              b64_json: rawBuf.toString("base64")
            });
          }
        } else {
          let errorMsg;
          try {
            const json = JSON.parse(rawBuf.toString("utf-8"));
            errorMsg = json.error
              ? JSON.stringify(json.error)
              : json.message || rawBuf.toString("utf-8");
          } catch (e) {
            errorMsg = rawBuf.toString("utf-8").substring(0, 500);
          }
          reject(
            new Error(`API错误 ${res.statusCode}: ${errorMsg}`)
          );
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("请求超时 (180s)"));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * 调用火山引擎方舟图片生成API (Seedream模型)
 * @param {Object} config - 配置对象
 * @param {string} prompt - 提示词
 * @param {string} model - 模型ID
 * @param {string} size - 图片尺寸 "1024x1024"
 * @param {number} retries - 重试次数
 * @returns {Promise<string>} base64编码的图片数据
 */
async function generateArkImage(config, prompt, model, size, retries = 3) {
  const apiUrl = `${config.apiBaseUrl}/images/generations`;

  const payload = {
    model: model,
    prompt: prompt,
    size: size,
    sequential_image_generation: "disabled"
  };

  const headers = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json"
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await httpRequest(apiUrl, { headers }, payload);

      if (response._rawImage && response.b64_json) {
        return response.b64_json;
      }

      if (response.data && response.data.length > 0) {
        const imgData = response.data[0];

        if (imgData.b64_json) {
          return imgData.b64_json;
        }

        if (imgData.url) {
          const imgResponse = await httpRequest(
            imgData.url,
            { method: "GET", headers: {} },
            null
          );
          if (imgResponse._rawImage && imgResponse.b64_json) {
            return imgResponse.b64_json;
          }
          return imgResponse;
        }
      }

      throw new Error(
        "API响应中未找到图片数据: " +
          JSON.stringify(response).substring(0, 300)
      );
    } catch (error) {
      if (attempt < retries) {
        const waitMs = 5000 * attempt;
        console.log(
          `  \x1b[33m重试 ${attempt}/${retries}... (${waitMs / 1000}s后)\x1b[0m`
        );
        await sleep(waitMs);
      } else {
        throw error;
      }
    }
  }
}

/**
 * 保存图片，自动检测格式并修正扩展名
 * Seedream模型返回JPEG格式，自动将.png改为.jpg
 * @param {string} base64Data - base64编码的图片数据
 * @param {string} filePath - 期望的文件路径
 * @returns {string} 实际保存的文件路径
 */
function saveImage(base64Data, filePath) {
  const buffer = Buffer.from(base64Data, "base64");
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const ext = path.extname(filePath);
  const basePath = filePath.slice(0, -ext.length);

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    if (ext.toLowerCase() === ".png") {
      filePath = basePath + ".jpg";
    }
  }

  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    if (ext.toLowerCase() === ".jpg") {
      filePath = basePath + ".png";
    }
  }

  fs.writeFileSync(filePath, buffer);
  return filePath;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// 模型管理与负载均衡模块
// ============================================================================

/**
 * 已开通模型注册表（基于已开通模型清单_20260529.txt）
 * 仅包含可用于图片生成的模型
 */
const MODEL_REGISTRY = {
  "doubao-seedream-4-5-251128": {
    name: "Seedream 4.5",
    quotaTotal: 200,
    quotaUnit: "张",
    priority: 1,
    active: true,
    modelId: "doubao-seedream-4-5-251128"
  },
  "doubao-seedream-5.0-lite": {
    name: "Seedream 5.0 Lite",
    quotaTotal: 50,
    quotaUnit: "张",
    priority: 2,
    active: true,
    modelId: "doubao-seedream-5-0-lite-250428"
  }
};

/**
 * 模型使用追踪器
 * 跟踪各模型的使用情况，支持断点恢复
 */
class ModelUsageTracker {
  constructor(storagePath) {
    this.storagePath = storagePath || path.join(__dirname, ".model-usage.json");
    this.usage = {};
    this.completedTasks = new Set();
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = JSON.parse(fs.readFileSync(this.storagePath, "utf-8"));
        this.usage = data.usage || {};
        this.completedTasks = new Set(data.completedTasks || []);
      }
    } catch (e) {
      this.usage = {};
      this.completedTasks = new Set();
    }
  }

  _save() {
    fs.writeFileSync(
      this.storagePath,
      JSON.stringify(
        {
          usage: this.usage,
          completedTasks: [...this.completedTasks]
        },
        null,
        2
      )
    );
  }

  getUsage(modelKey) {
    if (!this.usage[modelKey]) {
      this.usage[modelKey] = 0;
    }
    return this.usage[modelKey];
  }

  incrementUsage(modelKey) {
    if (!this.usage[modelKey]) {
      this.usage[modelKey] = 0;
    }
    this.usage[modelKey]++;
    this._save();
  }

  isTaskCompleted(taskKey) {
    return this.completedTasks.has(taskKey);
  }

  markTaskCompleted(taskKey) {
    this.completedTasks.add(taskKey);
    this._save();
  }

  getRemainingQuota(modelKey) {
    const model = MODEL_REGISTRY[modelKey];
    if (!model) return 0;
    return model.quotaTotal - this.getUsage(modelKey);
  }

  getUsageReport() {
    const lines = [];
    for (const [key, model] of Object.entries(MODEL_REGISTRY)) {
      if (!model.active) continue;
      const used = this.getUsage(key);
      const remaining = model.quotaTotal - used;
      const pct = ((used / model.quotaTotal) * 100).toFixed(1);
      lines.push(
        `  ${model.name}: ${used}/${model.quotaTotal}${model.quotaUnit} (${pct}%) 剩余${remaining}`
      );
    }
    return lines.join("\n");
  }

  getActiveModels() {
    return Object.entries(MODEL_REGISTRY)
      .filter(([, m]) => m.active)
      .sort(([, a], [, b]) => a.priority - b.priority);
  }
}

/**
 * 模型管理器
 * 实现负载均衡、自动切换、断点恢复
 */
class ModelManager {
  constructor(config) {
    this.config = config;
    this.tracker = new ModelUsageTracker();
    this.currentModelKey = config.cropModel;
  }

  /**
   * 选择下一个可用模型
   * 优先使用主模型，额度耗尽后切换备用
   */
  selectModel() {
    const activeModels = this.tracker.getActiveModels();

    for (const [key, model] of activeModels) {
      const remaining = this.tracker.getRemainingQuota(key);
      if (remaining > 0) {
        return { key, model, remaining };
      }
    }

    return null;
  }

  /**
   * 获取当前可用模型ID
   */
  getModelId() {
    const selected = this.selectModel();
    if (!selected) {
      throw new Error(
        "所有模型额度已耗尽！\n" + this.tracker.getUsageReport()
      );
    }

    if (selected.key !== this.currentModelKey) {
      console.log(
        "  \x1b[33m[模型切换]\x1b[0m {} → {} (主模型额度已用尽)",
        MODEL_REGISTRY[this.currentModelKey]
          ? MODEL_REGISTRY[this.currentModelKey].name
          : this.currentModelKey,
        selected.model.name
      );
      this.currentModelKey = selected.key;
    }

    return selected.model.modelId;
  }

  /**
   * 记录模型使用
   */
  recordUsage() {
    this.tracker.incrementUsage(this.currentModelKey);
  }

  /**
   * 检查任务是否已完成（断点恢复）
   */
  isTaskCompleted(taskKey) {
    return this.tracker.isTaskCompleted(taskKey);
  }

  /**
   * 标记任务完成
   */
  markTaskCompleted(taskKey) {
    this.tracker.markTaskCompleted(taskKey);
  }

  /**
   * 打印使用报告
   */
  printReport() {
    console.log(
      "\n\x1b[36m--- 模型使用报告 ---\x1b[0m"
    );
    console.log(this.tracker.getUsageReport());
  }

  /**
   * 获取当前模型优先级：主模型剩余比例
   */
  getCapacityInfo() {
    const primaryModel = this.config.cropModel;
    const remaining = this.tracker.getRemainingQuota(primaryModel);
    const model = MODEL_REGISTRY[primaryModel];
    if (!model) return { remaining: 0, ratio: 0 };
    return {
      remaining,
      total: model.quotaTotal,
      ratio: ((remaining / model.quotaTotal) * 100).toFixed(1)
    };
  }
}

/**
 * 带模型管理的图片生成
 */
async function generateArkImageWithManager(
  config,
  prompt,
  manager,
  size,
  retries
) {
  const modelId = manager.getModelId();
  const imageData = await generateArkImage(
    config,
    prompt,
    modelId,
    size,
    retries
  );
  manager.recordUsage();
  return imageData;
}

// ============================================================================
// 图片质量保障模块
// ============================================================================

/**
 * 验证生成的图片质量
 * @param {string} imageData - base64编码的图片数据
 * @returns {Object} 质量评估结果
 */
function validateImageQuality(imageData) {
  const buffer = Buffer.from(imageData, "base64");
  const result = {
    valid: true,
    format: "未知",
    size: buffer.length,
    issues: []
  };

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    result.format = "JPEG";
    if (buffer.length < 1024) {
      result.valid = false;
      result.issues.push("文件过小，可能损坏");
    }
    if (buffer.length > 10 * 1024 * 1024) {
      result.issues.push("JPEG文件过大(>{})".format("10MB"));
    }
  } else if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    result.format = "PNG";
    result.width = buffer.readUInt32BE(16);
    result.height = buffer.readUInt32BE(20);
    result.colorType = buffer[25];
    if (buffer.length < 1024) {
      result.valid = false;
      result.issues.push("文件过小，可能损坏");
    }
  } else {
    result.valid = false;
    result.issues.push("无法识别的图片格式");
  }

  if (buffer.length < 10 * 1024) {
    result.issues.push("文件小于10KB，质量可能不佳");
  }

  if (buffer.length > 5 * 1024 * 1024) {
    result.issues.push("文件大于5MB，建议压缩");
  }

  return result;
}

/**
 * 图片质量标准
 */
const QUALITY_STANDARDS = {
  minFileSize: 10 * 1024,
  maxFileSize: 5 * 1024 * 1024,
  requiredAspectRatio: 1.0,
  aspectRatioTolerance: 0.05,
  minWidth: 1920,
  minHeight: 1920
};

module.exports = {
  PROJECT_ROOT,
  loadEnvConfig,
  httpRequest,
  generateArkImage,
  generateArkImageWithManager,
  saveImage,
  ensureDir,
  sleep,
  ModelManager,
  ModelUsageTracker,
  MODEL_REGISTRY,
  validateImageQuality,
  QUALITY_STANDARDS
};