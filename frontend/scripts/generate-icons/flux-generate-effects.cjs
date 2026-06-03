/**
 * 文件名：flux-generate-effects.cjs
 * 作者：开发者
 * 日期：2026-05-29
 * 版本：v2.0.0
 * 功能描述：开心农场稀有/顶级特效作物图标生成工具——
 *          调用火山引擎方舟 Seedream API 生成50种特效作物图片
 * 更新记录：
 *   2026-05-29 - v1.0.0 - 初始创建，使用FLUX.1-Kontext-dev模型
 *   2026-05-29 - v2.0.0 - 平台从硅基流动迁移至火山引擎方舟(Ark)，
 *                         模型切换至doubao-seedream-4.5
 *
 * 使用方法：
 *   1. 复制 .env.example 为 .env，填入 ARK_API_KEY
 *   2. 运行: node flux-generate-effects.cjs [选项]
 *   3. 选项：
 *      --type all      生成全部特效作物 (默认, 300张)
 *      --type rare     仅稀有作物 35-74 (240张)
 *      --type top      仅顶级作物 75-84 (60张)
 *      --type stages   仅生长阶段图 (250张)
 *      --type products 仅成品图标 (50张)
 *      --type single   生成单张测试图
 *      --id <数字>      指定作物ID
 *      --stage <1-5>   指定生长阶段 (配合--id使用)
 *      --dry-run       预览所有prompt但不生成
 *
 * 总计：50种特效作物 × 5阶段 + 50成品 = 300张图片
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

const { getAllEffectTasks } = require("./flux-effect-crops.cjs");
const { buildFluxPrompt } = require("./flux-prompt-builder.cjs");

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
\x1b[36m开心农场特效作物生成工具 (火山引擎方舟)\x1b[0m
=========================================
用法: node flux-generate-effects.cjs [选项]

选项:
  --type <类型>    生成指定类型图片
                   all      - 全部特效作物 (默认, 300张)
                   rare     - 稀有作物 35-74 (240张)
                   top      - 顶级作物 75-84 (60张)
                   stages   - 仅生长阶段图 (250张)
                   products - 仅成品图标 (50张)
                   single   - 生成单张测试图
  --id <数字>      仅生成指定作物ID (配合--type使用)
  --stage <1-5>    指定生长阶段 (配合--type stages和--id使用)
  --dry-run        预览所有prompt但不实际生成
  --help           显示此帮助信息

示例:
  node flux-generate-effects.cjs --type top
  node flux-generate-effects.cjs --type rare --id 55
  node flux-generate-effects.cjs --type stages --id 75 --stage 5
  node flux-generate-effects.cjs --type products --id 84
  node flux-generate-effects.cjs --dry-run

特效作物覆盖: 50种 (稀有40种 + 顶级10种), 每种6张(5阶段+1成品) = 300张
`);
}

function filterTasks(allTasks, args) {
  let tasks = [...allTasks];

  switch (args.type) {
    case "rare":
      tasks = tasks.filter((t) => t.id >= 35 && t.id <= 74);
      break;
    case "top":
      tasks = tasks.filter((t) => t.id >= 75 && t.id <= 84);
      break;
    case "stages":
      tasks = tasks.filter((t) => t.type === "growth_stage");
      break;
    case "products":
      tasks = tasks.filter((t) => t.type === "product_icon");
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

function getTaskLabel(task) {
  if (task.type === "growth_stage") {
    return `阶段${task.stage}`;
  }
  return "成品";
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
    `\n\x1b[36m开始生成 ${total} 张特效作物图片...\x1b[0m\n`
  );

  if (args.dryRun) {
    console.log(
      "\x1b[33m[DRY-RUN 模式] 仅预览prompt，不实际生成\x1b[0m\n"
    );
  }

  const progressFile = path.join(__dirname, ".flux-progress.json");
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
    const prompt = buildFluxPrompt(task);
    const outputDir = path.resolve(totalOutputDir, task.outputDir);
    ensureDir(outputDir);
    const filePath = path.join(outputDir, task.filename);

    const taskKey = `${task.outputDir}/${task.filename}`;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const pct = ((i / total) * 100).toFixed(1);
    const label = getTaskLabel(task);

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
        `     [${task.data.name} ${label}] ${prompt.substring(0, 150)}...\n`
      );
      continue;
    }

    try {
      console.log(
        `[\x1b[90m${elapsed}s\x1b[0m] [\x1b[90m${pct}%\x1b[0m] \x1b[33m生成中\x1b[0m ${taskKey} \x1b[35m[${task.data.name} ${label} ${task.data.quality}]\x1b[0m`
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
      await sleep(config.cropRequestDelayMs);
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\n\x1b[36m═══════════════════════════════════\x1b[0m`);
  console.log(`\x1b[36m特效作物生成完成!\x1b[0m`);
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
  const stageTasks = tasks.filter(
    (t) => t.type === "growth_stage"
  );
  const productTasks = tasks.filter(
    (t) => t.type === "product_icon"
  );

  const cropIds = [...new Set(tasks.map((t) => t.id))].sort(
    (a, b) => a - b
  );
  const rareCount = cropIds.filter(
    (id) => id >= 35 && id <= 74
  ).length;
  const topCount = cropIds.filter(
    (id) => id >= 75 && id <= 84
  ).length;

  console.log(
    `  特效作物: ${cropIds.length} 种 (稀有 ${rareCount} + 顶级 ${topCount})`
  );
  console.log(
    `  生长阶段: ${stageTasks.length} 张 (5阶段 × ${cropIds.length}种)`
  );
  console.log(
    `  成品图标: ${productTasks.length} 张 (1张 × ${cropIds.length}种)`
  );
  console.log(`  总计: ${tasks.length} 张\n`);
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
    "\x1b[36m║  特效作物生成工具 v2.0 (Ark)          ║\x1b[0m"
  );
  console.log(
    "\x1b[36m╚══════════════════════════════════════════╝\x1b[0m"
  );
  console.log(`  模型: ${config.cropModel}`);
  console.log(`  尺寸: ${IMAGE_SIZE}`);
  console.log(`  平台: 火山引擎方舟(Ark)`);
  console.log(`  输出: ${config.outputDir}`);

  const allTasks = getAllEffectTasks();
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