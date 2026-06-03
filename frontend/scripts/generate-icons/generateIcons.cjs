/**
 * 文件名：generateIcons.cjs
 * 作者：开发者
 * 日期：2026-05-29
 * 版本：v2.0.0
 * 功能描述：开心农场UI图标批量生成工具——调用火山引擎方舟API
 *          生成种子/道具/土地/UI等全部图标
 * 更新记录：
 *   2026-05-28 - v1.0.0 - 初始创建
 *   2026-05-29 - v1.1.0 - 模型名从Qwen-Image-2512更新至Qwen/Qwen-Image
 *   2026-05-29 - v2.0.0 - 平台从硅基流动迁移至火山引擎方舟(Ark)，
 *                         模型切换至doubao-seedream-4.5
 *
 * 使用方法：
 *   1. 复制 .env.example 为 .env，填入 ARK_API_KEY
 *   2. 运行: node generateIcons.cjs [选项]
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

const {
  PROJECT_ROOT,
  loadEnvConfig,
  generateArkImage,
  saveImage,
  ensureDir,
  sleep
} = require("./ark-api.cjs");

const { getAllTasks } = require("./iconData.cjs");
const { buildPrompt } = require("./promptBuilder.cjs");

const IMAGE_SIZE = "1920x1920";

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

      const imageData = await generateArkImage(
        config,
        prompt,
        config.uiModel,
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
      await sleep(config.uiRequestDelayMs);
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
      "\x1b[31m[错误]\x1b[0m 未设置 ARK_API_KEY。\n" +
        "  请在 .env 文件中填入火山引擎方舟 API Key。\n"
    );
    process.exit(1);
  }

  console.log("\x1b[36m╔═══════════════════════════════════╗\x1b[0m");
  console.log("\x1b[36m║  UI 图标生成工具 v2.0 (Ark)    ║\x1b[0m");
  console.log("\x1b[36m╚═══════════════════════════════════╝\x1b[0m");
  console.log(`  模型: ${config.uiModel}`);
  console.log(`  尺寸: ${IMAGE_SIZE}`);
  console.log(`  平台: 火山引擎方舟(Ark)`);
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