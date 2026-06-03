/**
 * 文件名：generateIcons.cjs
 * 作者：开发者
 * 日期：2026-05-28
 * 版本：v1.1.0
 * 功能描述：开心农场UI图标批量生成工具——调用硅基流动API生成全部220张图标
 * 更新记录：
 *   2026-05-28 - v1.0.0 - 初始创建
 *   2026-05-29 - v1.1.0 - 模型名从Qwen-Image-2512更新至Qwen/Qwen-Image，
 *                         httpRequest改用Buffer处理二进制响应，兼容raw PNG和JSON
 *
 * 使用方法：
 *   1. 复制 .env.example 为 .env，填入 SILICONFLOW_API_KEY
 *   2. 运行: node frontend/scripts/generate-icons/generateIcons.cjs
 *   3. 选项:
 *      --type crop     仅生成作物图标(84张)
 *      --type seed     仅生成种子图标(84张)
 *      --type item     仅生成道具图标(20张)
 *      --type land     仅生成土地图标(8张)
 *      --type ui       仅生成UI图标(24张)
 *      --type single   生成单张测试图标
 *      --dry-run       预览所有prompt但不生成
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const { getAllTasks } = require("./iconData.cjs");
const { buildPrompt, getDefaultParams } = require("./promptBuilder.cjs");

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
    model: process.env.IMAGE_MODEL || "Qwen/Qwen-Image",
    imageSize: process.env.IMAGE_SIZE || "128x128",
    numInferenceSteps:
      parseInt(process.env.NUM_INFERENCE_STEPS) || 30,
    guidanceScale: parseFloat(process.env.GUIDANCE_SCALE) || 7.5,
    outputDir:
      process.env.OUTPUT_DIR || "frontend/public/assets",
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT) || 3,
    requestDelayMs: parseInt(process.env.REQUEST_DELAY_MS) || 2000
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { type: "all", dryRun: false, id: null };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--type" && i + 1 < args.length) {
      result.type = args[i + 1];
      i++;
    } else if (args[i] === "--dry-run") {
      result.dryRun = true;
    } else if (args[i] === "--id" && i + 1 < args.length) {
      result.id = parseInt(args[i + 1]);
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
开心农场UI图标生成工具
======================
用法: node generateIcons.js [选项]

选项:
  --type <类型>    生成指定类型图标
                   crop    - 作物成品图标 (84张)
                   seed    - 作物种子图标 (84张)
                   item    - 道具图标 (20张)
                   land    - 土地品质图标 (8张)
                   ui      - UI元素图标 (24张)
                   single  - 生成单张测试图标
                   all     - 全部图标 (默认, 220张)
  --id <数字>      仅生成指定ID的图标 (配合--type使用)
  --dry-run        预览所有prompt但不实际生成
  --help           显示此帮助信息

示例:
  node generateIcons.js --type crop --id 1    # 生成小麦图标
  node generateIcons.js --type item            # 生成全部道具图标
  node generateIcons.js --dry-run              # 预览全部prompt
`);
}

function filterTasks(allTasks, args) {
  let tasks = [...allTasks];

  switch (args.type) {
    case "crop":
      tasks = tasks.filter((t) => t.type === "crop");
      break;
    case "seed":
      tasks = tasks.filter((t) => t.type === "seed");
      break;
    case "item":
      tasks = tasks.filter((t) => t.type === "item");
      break;
    case "land":
      tasks = tasks.filter((t) => t.type === "land");
      break;
    case "ui":
      tasks = tasks.filter((t) =>
        t.type.startsWith("ui_")
      );
      break;
    case "single":
      tasks = [tasks[0]];
      break;
  }

  if (args.id !== null) {
    tasks = tasks.filter((t) => t.id === args.id);
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
      timeout: 120000
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
                `API错误 ${res.statusCode}: ${rawBuf.toString("utf-8").substring(
                  0,
                  200
                )}`
              )
            );
          }
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("请求超时"));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function generateIcon(config, prompt, task, retries = 3) {
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
      throw new Error("API响应中未找到图片数据");
    } catch (error) {
      if (attempt < retries) {
        const waitMs = 3000 * attempt;
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

  console.log(`\n\x1b[36m开始生成 ${total} 张图标...\x1b[0m\n`);

  if (args.dryRun) {
    console.log("\x1b[33m[DRY-RUN 模式] 仅预览prompt，不实际生成\x1b[0m\n");
  }

  const progressFile = path.join(__dirname, ".progress.json");
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
    const prompt = buildPrompt(task);
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
      console.log(`     Prompt: ${prompt.substring(0, 120)}...\n`);
      continue;
    }

    try {
      console.log(
        `[\x1b[90m${elapsed}s\x1b[0m] [\x1b[90m${pct}%\x1b[0m] \x1b[33m生成中\x1b[0m ${taskKey}`
      );

      const imageData = await generateIcon(config, prompt, task);
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
  console.log(`\x1b[36m生成完成!\x1b[0m`);
  console.log(`  总任务: ${total}`);
  console.log(`  \x1b[32m成功: ${completed}\x1b[0m`);
  console.log(`  \x1b[31m失败: ${failed}\x1b[0m`);
  console.log(`  \x1b[90m跳过: ${skipped}\x1b[0m`);
  console.log(`  耗时: ${totalElapsed}s`);
  console.log(
    `  输出目录: ${path.relative(PROJECT_ROOT, totalOutputDir)}`
  );

  if (failed > 0) {
    console.log(`\n\x1b[33m提示: 重新运行脚本将自动跳过已完成的任务。\x1b[0m`);
  }
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

  console.log("\x1b[36m╔═══════════════════════════════════╗\x1b[0m");
  console.log("\x1b[36m║   开心农场 UI 图标生成工具 v1.0  ║\x1b[0m");
  console.log("\x1b[36m╚═══════════════════════════════════╝\x1b[0m");
  console.log(`  模型: ${config.model}`);
  console.log(`  尺寸: ${config.imageSize}`);
  console.log(`  输出: ${config.outputDir}`);

  const allTasks = getAllTasks();
  const tasks = filterTasks(allTasks, args);

  if (tasks.length === 0) {
    console.error(
      "\x1b[31m[错误]\x1b[0m 没有匹配的图标任务。请检查 --type 和 --id 参数。"
    );
    process.exit(1);
  }

  console.log(
    `  任务: ${tasks.length} 张 (${args.type}${
      args.id !== null ? ` #${args.id}` : ""
    })\n`
  );

  await processTasks(tasks, config, args);
}

main().catch((error) => {
  console.error(`\x1b[31m[致命错误]\x1b[0m ${error.message}`);
  process.exit(1);
});