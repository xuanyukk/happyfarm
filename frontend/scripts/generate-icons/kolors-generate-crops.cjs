/**
 * 文件名：kolors-generate-crops.cjs
 * 作者：开发者
 * 日期：2026-05-29
 * 版本：v2.0.0
 * 功能描述：开心农场基础/经济作物图标生成工具——调用火山引擎方舟 Seedream API
 *          生成34种基础/经济作物的五阶段生长图和成品图标。
 * 更新记录：
 *   2026-05-28 - v1.0.0 - 初始创建
 *   2026-05-29 - v1.1.0 - 添加成品图标(product)生成功能
 *   2026-05-29 - v1.2.0 - 模型从Kolors切换至Qwen/Qwen-Image
 *   2026-05-29 - v2.0.0 - 平台从硅基流动迁移至火山引擎方舟(Ark)，
 *                         模型切换至doubao-seedream-4.5
 *
 * 使用方法：
 *   1. 复制 .env.example 为 .env，填入 ARK_API_KEY
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

const {
  PROJECT_ROOT,
  loadEnvConfig,
  generateArkImage,
  saveImage,
  ensureDir,
  sleep
} = require("./ark-api.cjs");

const { getAllKolorsTasks } = require("./kolors-crops.cjs");
const { buildKolorsPrompt } = require("./kolors-prompt-builder.cjs");

const IMAGE_SIZE = "1920x1920";

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
\x1b[36m开心农场基础作物生成工具 (火山引擎方舟)\x1b[0m
===========================================
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
  node kolors-generate-crops.cjs --type basic
  node kolors-generate-crops.cjs --type economic --id 16
  node kolors-generate-crops.cjs --id 1 --stage 5
  node kolors-generate-crops.cjs --type products
  node kolors-generate-crops.cjs --type single
  node kolors-generate-crops.cjs --dry-run

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
      tasks = tasks.filter((t) => t.type === "growth_stage");
      break;
    case "products":
      tasks = tasks.filter((t) => t.type === "product");
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

async function processTasks(tasks, config, args) {
  const totalOutputDir = path.resolve(PROJECT_ROOT, config.outputDir);
  ensureDir(totalOutputDir);

  const total = tasks.length;
  let completed = 0;
  let failed = 0;
  let skipped = 0;
  const startTime = Date.now();

  console.log(
    `\n\x1b[36m开始生成 ${total} 张作物图片...\x1b[0m\n`
  );

  if (args.dryRun) {
    console.log(
      "\x1b[33m[DRY-RUN 模式] 仅预览prompt，不实际生成\x1b[0m\n"
    );
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

      const imageData = await generateArkImage(
        config,
        prompt,
        config.cropModel,
        IMAGE_SIZE
      );
      saveImage(imageData, filePath);

      progress[taskKey] = true;
      fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));

      completed++;
      const sizeKB = (Buffer.byteLength(imageData, "base64") / 1024).toFixed(1);
      console.log(
        `[\x1b[90m${elapsed}s\x1b[0m] [\x1b[90m${pct}%\x1b[0m] \x1b[32m完成\x1b[0m  ${taskKey} (${sizeKB} KB)`
      );
    } catch (error) {
      failed++;
      console.error(
        `[\x1b[90m${elapsed}s\x1b[0m] [\x1b[90m${pct}%\x1b[0m] \x1b[31m失败\x1b[0m  ${taskKey}: ${error.message}`
      );
    }

    if (i < tasks.length - 1) {
      await sleep(config.cropRequestDelayMs);
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\n\x1b[36m═══════════════════════════════════\x1b[0m`);
  console.log(`\x1b[36m作物生成完成!\x1b[0m`);
  console.log(`  总任务: ${total}`);
  console.log(`  \x1b[32m成功: ${completed}\x1b[0m`);
  console.log(`  \x1b[31m失败: ${failed}\x1b[0m`);
  console.log(`  \x1b[90m跳过: ${skipped}\x1b[0m`);
  console.log(`  耗时: ${totalElapsed}s`);
  console.log(
    `  输出目录: ${path.relative(PROJECT_ROOT, totalOutputDir)}`
  );

  if (failed > 0) {
    console.log(
      `\n\x1b[33m提示: 重新运行脚本将自动跳过已完成的任务。\x1b[0m`
    );
  }
}

function printSummary(tasks) {
  const cropIds = [...new Set(tasks.map((t) => t.id))].sort(
    (a, b) => a - b
  );
  const basicCount = cropIds.filter((id) => id >= 1 && id <= 15).length;
  const economicCount = cropIds.filter(
    (id) => id >= 16 && id <= 34
  ).length;
  const stageCount = tasks.filter(
    (t) => t.type === "growth_stage"
  ).length;
  const productCount = tasks.filter(
    (t) => t.type === "product"
  ).length;

  console.log(
    `  作物: ${cropIds.length} 种 (基础 ${basicCount} + 经济 ${economicCount})`
  );
  if (stageCount > 0) {
    console.log(`  生长阶段: ${stageCount} 张`);
  }
  if (productCount > 0) {
    console.log(`  成品图标: ${productCount} 张`);
  }

  if (tasks.length <= 10) {
    tasks.forEach((t) => {
      if (t.type === "growth_stage") {
        console.log(
          `    [${t.data.name} ${t.data.stageLabel} ${t.data.category}] ${t.filename}`
        );
      } else {
        console.log(
          `    [${t.data.name} 成品 ${t.data.category}] ${t.filename}`
        );
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
      "\x1b[31m[错误]\x1b[0m 未设置 ARK_API_KEY。\n" +
        "  请在 .env 文件中填入火山引擎方舟 API Key。\n"
    );
    process.exit(1);
  }

  console.log(
    "\x1b[36m╔══════════════════════════════════════════╗\x1b[0m"
  );
  console.log(
    "\x1b[36m║  开心农场基础作物生成工具 v2.0 (Ark)  ║\x1b[0m"
  );
  console.log(
    "\x1b[36m╚══════════════════════════════════════════╝\x1b[0m"
  );
  console.log(`  模型: ${config.cropModel}`);
  console.log(`  尺寸: ${IMAGE_SIZE}`);
  console.log(`  平台: 火山引擎方舟(Ark)`);
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