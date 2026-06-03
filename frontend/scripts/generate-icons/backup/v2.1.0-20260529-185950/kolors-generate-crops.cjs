/**
 * 文件名：kolors-generate-crops.cjs
 * 作者：开发者
 * 日期：2026-05-29
 * 版本：v1.2.0
 * 功能描述：开心农场基础/经济作物图标生成工具——调用硅基流动Qwen/Qwen-Image API
 *          生成34种基础/经济作物的五阶段生长图和成品图标。
 *          因Kwai-Kolors/Kolors模型不支持游戏像素风格，v1.2起切换至Qwen。
 * 更新记录：
 *   2026-05-28 - v1.0.0 - 初始创建
 *   2026-05-29 - v1.1.0 - 添加成品图标(product)生成功能
 *   2026-05-29 - v1.2.0 - 模型从Kolors切换至Qwen/Qwen-Image，尺寸升级256x256，
 *                         image_size改由KOLORS_IMAGE_SIZE环境变量控制，
 *                         默认推理步数30/引导系数10，新增双语负向提示词和透明背景
 *
 * 使用方法：
 *   1. 复制 .env.example 为 .env，填入 SILICONFLOW_API_KEY
 *   2. 运行: node kolors-generate-crops.cjs [选项]
 *   3. 选项：
 *      --type basic     仅生成基础作物 (1-15, 90张)
 *      --type economic  仅生成经济作物 (16-34, 114张)
 *      --type stages    仅生成生长阶段图 (170张)
 *      --type products  仅生成成品图标 (34张)
 *      --type single    生成单张测试图
 *      --id <数字>       指定作物ID (配合--type使用)
 *      --stage <1-5>    指定生长阶段 (配合--id使用)
 *      --dry-run        预览所有prompt但不生成
 *
 * 总计：34种作物 × 5阶段 + 34成品 = 204张图片
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const { getAllKolorsTasks } = require("./kolors-crops.cjs");
const { buildKolorsPrompt, getDefaultParams } = require("./kolors-prompt-builder.cjs");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

function loadEnvConfig() {
  const envPath = path.join(__dirname, ".env");
  const examplePath = path.join(__dirname, ".env.example");

  if (!fs.existsSync(envPath)) {
    console.log(
      "\x1b[33m[提示]\x1b[0m 未找到 .env 文件，使用环境变量。\n" +
        "  可复制 .env.example 为 .env 并填入API密钥。\n"
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
    apiKey: process.env.SILICONFLOW_API_KEY,
    apiBaseUrl:
      process.env.API_BASE_URL || "https://api.siliconflow.cn/v1",
    model:
      process.env.KOLORS_MODEL || "Qwen/Qwen-Image",
    imageSize:
      process.env.KOLORS_IMAGE_SIZE || "256x256",
    numInferenceSteps:
      parseInt(process.env.KOLORS_NUM_INFERENCE_STEPS) || 30,
    guidanceScale:
      parseFloat(process.env.KOLORS_GUIDANCE_SCALE) || 10,
    outputDir:
      process.env.OUTPUT_DIR || "frontend/public/assets",
    maxConcurrent:
      parseInt(process.env.KOLORS_MAX_CONCURRENT) || 3,
    requestDelayMs:
      parseInt(process.env.KOLORS_REQUEST_DELAY_MS) || 1500
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    type: "all",
    dryRun: false,
    id: null,
    stage: null
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--type" && i + 1 < args.length) {
      result.type = args[i + 1];
      i++;
    } else if (args[i] === "--dry-run") {
      result.dryRun = true;
    } else if (args[i] === "--id" && i + 1 < args.length) {
      result.id = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === "--stage" && i + 1 < args.length) {
      result.stage = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === "--help") {
      printHelp();
      process.exit(0);
    }
  }
  return result;
}

function printHelp() {
  console.log(`
\x1b[36mKolors 开心农场基础作物生成工具\x1b[0m
======================================
用法: node kolors-generate-crops.cjs [选项]

选项:
  --type <类型>    生成指定类型图片
                   all      - 全部基础+经济作物 (默认, 204张)
                   basic    - 基础作物 1-15 (90张: 75阶段+15成品)
                   economic - 经济作物 16-34 (114张: 95阶段+19成品)
                   stages   - 仅生长阶段图 (170张)
                   products - 仅成品图标 (34张)
                   single   - 生成单张测试图
  --id <数字>      仅生成指定作物ID (配合--type使用)
  --stage <1-5>    指定生长阶段 (配合--id使用)
  --dry-run        预览所有prompt但不实际生成
  --help           显示此帮助信息

示例:
  node kolors-generate-crops.cjs --type basic           # 生成全部基础作物
  node kolors-generate-crops.cjs --type economic --id 16 # 生成草莓全部5阶段+成品
  node kolors-generate-crops.cjs --id 1 --stage 5       # 生成小麦成熟阶段
  node kolors-generate-crops.cjs --type products      # 生成全部成品图标
  node kolors-generate-crops.cjs --type single           # 生成单张测试图
  node kolors-generate-crops.cjs --dry-run                # 预览全部prompt

覆盖: 34种 (基础15种 + 经济19种), 每种5阶段+1成品 = 204张
`);
}

function filterTasks(allTasks, args) {
  let tasks = [...allTasks];

  switch (args.type) {
    case "basic":
      tasks = tasks.filter((t) => t.id >= 1 && t.id <= 15);
      break;
    case "economic":
      tasks = tasks.filter((t) => t.id >= 16 && t.id <= 34);
      break;
    case "stages":
      tasks = tasks.filter((t) => t.type === 'growth_stage');
      break;
    case "products":
      tasks = tasks.filter((t) => t.type === 'product');
      break;
    case "single":
      tasks = [tasks[0]];
      break;
    case "all":
    default:
      break;
  }

  if (args.id !== null) {
    tasks = tasks.filter((t) => t.id === args.id);
  }

  if (args.stage !== null) {
    tasks = tasks.filter((t) => t.stage === args.stage);
  }

  return tasks;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function saveImage(base64Data, filePath) {
  const buffer = Buffer.from(base64Data, "base64");
  fs.writeFileSync(filePath, buffer);
}

async function httpRequest(url, options, body) {
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
      res.on("data", (chunk) => {
        chunks.push(Buffer.from(chunk));
      });
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
          try {
            const json = JSON.parse(rawBuf.toString("utf-8"));
            reject(
              new Error(
                `API错误 ${res.statusCode}: ${
                  json.message || json.error || rawBuf.toString("utf-8")
                }`
              )
            );
          } catch (e) {
            reject(
              new Error(
                `API错误 ${res.statusCode}: ${rawBuf.toString("utf-8").substring(0, 200)}`
              )
            );
          }
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

async function generateKolorsImage(config, prompt, task, retries = 3) {
  const apiUrl = `${config.apiBaseUrl}/images/generations`;

  const params = getDefaultParams({
    model: config.model,
    image_size: config.imageSize,
    num_inference_steps: config.numInferenceSteps,
    guidance_scale: config.guidanceScale
  });
  params.prompt = prompt;

  const headers = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json"
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await httpRequest(apiUrl, { headers }, params);

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
            { method: "GET" },
            null
          );
          if (imgResponse._rawImage && imgResponse.b64_json) {
            return imgResponse.b64_json;
          }
          return Buffer.from(imgResponse).toString("base64");
        }
      }

      if (response.images && response.images.length > 0) {
        const img = response.images[0];
        if (img.url) {
          const imgResponse = await httpRequest(
            img.url,
            { method: "GET" },
            null
          );
          return Buffer.from(imgResponse).toString("base64");
        }
        if (img.b64_json) {
          return img.b64_json;
        }
      }

      throw new Error(
        "API响应中未找到图片数据: " + JSON.stringify(response).substring(0, 200)
      );
    } catch (error) {
      if (attempt < retries) {
        const waitMs = 4000 * attempt;
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processTasks(tasks, config, args) {
  const totalOutputDir = path.resolve(PROJECT_ROOT, config.outputDir);
  ensureDir(totalOutputDir);

  const total = tasks.length;
  let completed = 0;
  let failed = 0;
  let skipped = 0;
  const startTime = Date.now();

  console.log(`\n\x1b[36m开始生成 ${total} 张Kolors基础作物图片...\x1b[0m\n`);

  if (args.dryRun) {
    console.log("\x1b[33m[DRY-RUN 模式] 仅预览prompt，不实际生成\x1b[0m\n");
  }

  const progressFile = path.join(__dirname, ".kolors-progress.json");
  let progress = {};
  if (fs.existsSync(progressFile)) {
    try {
      progress = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
    } catch (e) {
      progress = {};
    }
  }

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const prompt = buildKolorsPrompt(task);
    const outputDir = path.resolve(totalOutputDir, task.outputDir);
    ensureDir(outputDir);
    const filePath = path.join(outputDir, task.filename);

    const taskKey = `${task.outputDir}/${task.filename}`;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const pct = ((i / total) * 100).toFixed(1);

    if (progress[taskKey]) {
      console.log(
        `[\x1b[90m${elapsed}s\x1b[0m] [\x1b[90m${pct}%\x1b[0m] \x1b[90m跳过\x1b[0m  ${taskKey} (已完成)`
      );
      skipped++;
      continue;
    }

    if (args.dryRun) {
      console.log(
        `[\x1b[90m${elapsed}s\x1b[0m] [\x1b[90m${pct}%\x1b[0m] \x1b[36m预览\x1b[0m  ${taskKey}`
      );
      console.log(
        `     [${task.data.name} ${task.data.stageLabel} ${task.data.category}] ${prompt.substring(0, 150)}...\n`
      );
      continue;
    }

    try {
      console.log(
        `[\x1b[90m${elapsed}s\x1b[0m] [\x1b[90m${pct}%\x1b[0m] \x1b[33m生成中\x1b[0m ${taskKey} \x1b[32m[${task.data.name} ${task.data.stageLabel} ${task.data.category}]\x1b[0m`
      );

      const imageData = await generateKolorsImage(config, prompt, task);
      saveImage(imageData, filePath);

      progress[taskKey] = true;
      fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));

      completed++;
      console.log(
        `[\x1b[90m${elapsed}s\x1b[0m] [\x1b[90m${pct}%\x1b[0m] \x1b[32m完成\x1b[0m  ${taskKey}`
      );
    } catch (error) {
      failed++;
      console.error(
        `[\x1b[90m${elapsed}s\x1b[0m] [\x1b[90m${pct}%\x1b[0m] \x1b[31m失败\x1b[0m  ${taskKey}: ${error.message}`
      );
    }

    if (i < tasks.length - 1) {
      await sleep(config.requestDelayMs);
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\n\x1b[36m═══════════════════════════════════\x1b[0m`);
  console.log(`\x1b[36mKolors基础作物生成完成!\x1b[0m`);
  console.log(`  总任务: ${total}`);
  console.log(`  \x1b[32m成功: ${completed}\x1b[0m`);
  console.log(`  \x1b[31m失败: ${failed}\x1b[0m`);
  console.log(`  \x1b[90m跳过: ${skipped}\x1b[0m`);
  console.log(`  耗时: ${totalElapsed}s`);
  console.log(`  输出目录: ${path.relative(PROJECT_ROOT, totalOutputDir)}`);

  if (failed > 0) {
    console.log(`\n\x1b[33m提示: 重新运行脚本将自动跳过已完成的任务。\x1b[0m`);
  }
}

function printSummary(tasks) {
  const cropIds = [...new Set(tasks.map((t) => t.id))].sort((a, b) => a - b);
  const basicCount = cropIds.filter((id) => id >= 1 && id <= 15).length;
  const economicCount = cropIds.filter((id) => id >= 16 && id <= 34).length;
  const stageCount = tasks.filter(t => t.type === 'growth_stage').length;
  const productCount = tasks.filter(t => t.type === 'product').length;

  console.log(`  作物: ${cropIds.length} 种 (基础 ${basicCount} + 经济 ${economicCount})`);
  if (stageCount > 0) {
    console.log(`  生长阶段: ${stageCount} 张`);
  }
  if (productCount > 0) {
    console.log(`  成品图标: ${productCount} 张`);
  }

  if (tasks.length <= 10) {
    tasks.forEach(t => {
      if (t.type === 'growth_stage') {
        console.log(`    [${t.data.name} ${t.data.stageLabel} ${t.data.category}] ${t.filename}`);
      } else {
        console.log(`    [${t.data.name} 成品 ${t.data.category}] ${t.filename}`);
      }
    });
  }
  console.log();
}

async function main() {
  const config = loadEnvConfig();
  const args = parseArgs();

  if (!config.apiKey && !args.dryRun) {
    console.error(
      "\x1b[31m[错误]\x1b[0m 未设置 SILICONFLOW_API_KEY。\n" +
        "  请复制 .env.example 为 .env 并填入API密钥。\n" +
        "  获取密钥: https://cloud.siliconflow.cn/account/ak\n"
    );
    process.exit(1);
  }

  console.log("\x1b[36m╔══════════════════════════════════════════╗\x1b[0m");
  console.log("\x1b[36m║  Kolors 开心农场基础作物生成工具 v1.1 ║\x1b[0m");
  console.log("\x1b[36m╚══════════════════════════════════════════╝\x1b[0m");
  console.log(`  模型: ${config.model}`);
  console.log(`  尺寸: ${config.imageSize}`);
  console.log(`  推理步数: ${config.numInferenceSteps}`);
  console.log(`  引导系数: ${config.guidanceScale}`);
  console.log(`  输出: ${config.outputDir}`);

  const allTasks = getAllKolorsTasks();
  const tasks = filterTasks(allTasks, args);

  if (tasks.length === 0) {
    console.error(
      "\x1b[31m[错误]\x1b[0m 没有匹配的任务。请检查 --type/--id/--stage 参数。"
    );
    process.exit(1);
  }

  printSummary(tasks);

  await processTasks(tasks, config, args);
}

main().catch((error) => {
  console.error(`\x1b[31m[致命错误]\x1b[0m ${error.message}`);
  process.exit(1);
});