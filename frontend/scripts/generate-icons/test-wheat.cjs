/**
 * 文件名: test-wheat.cjs
 * 作者: 开发者
 * 日期: 2026-05-29
 * 版本: v2.0.0
 * 功能描述: 使用34种作物完整Prompt模板与批量生成指南中的模板，
 *           测试生成小麦(ID 1)的全部6张图片（火山引擎方舟API）
 * 更新记录:
 *   2026-05-29 - v1.0.0 - 初始版本，使用硅基流动API
 *   2026-05-29 - v2.0.0 - 迁移至火山引擎方舟(Ark) API
 */
const fs = require("fs");
const path = require("path");
const {
  loadEnvConfig,
  generateArkImage,
  saveImage,
  ensureDir,
  sleep
} = require("./ark-api.cjs");

const STAGES_OUTPUT_DIR = path.resolve(__dirname, "..", "..", "public", "assets", "crops", "stages");
const ICONS_OUTPUT_DIR = path.resolve(__dirname, "..", "..", "public", "assets", "icons", "crops");
const IMAGE_SIZE = "1920x1920";
const REQUEST_DELAY_MS = 3000;

const WHEAT_PROMPTS = [
  {
    name: "1_stage_1",
    description: "幼苗期",
    prompt: "小麦(Wheat)幼苗期图标，俯视45度视角，根部在画面中下方棕色土壤横截面上，游戏图标，2D矢量艺术风格，简约设计，深色轮廓描边，左上方光源，柔和阴影，透明背景，土壤中出现3根细小的金黄色嫩芽，芽尖微绿，刚从深棕色土壤中破土而出，画面占比10%-20%，底部有柔和椭圆形投影投射在土壤上，单张游戏精灵图"
  },
  {
    name: "1_stage_2",
    description: "生长期",
    prompt: "小麦(Wheat)生长期图标，俯视45度视角，根部在画面中下方棕色土壤横截面上，游戏图标，2D矢量艺术风格，简约设计，深色轮廓描边，左上方光源，柔和阴影，透明背景，麦苗长高至画面中部，茎秆细长呈浅绿色，叶片窄长披针形，3-4片叶展开，画面占比30%-50%，底部有柔和椭圆形投影投射在土壤上，单张游戏精灵图"
  },
  {
    name: "1_stage_3",
    description: "开花期",
    prompt: "小麦(Wheat)开花期图标，俯视45度视角，根部在画面中下方棕色土壤横截面上，游戏图标，2D矢量艺术风格，简约设计，深色轮廓描边，左上方光源，柔和阴影，透明背景，茎秆顶部开始抽出麦穗雏形，呈淡绿色纺锤状，植株高度达到画面的60%，画面占比50%-70%，底部有柔和椭圆形投影投射在土壤上，单张游戏精灵图"
  },
  {
    name: "1_stage_4",
    description: "结果期",
    prompt: "小麦(Wheat)结果期图标，俯视45度视角，根部在画面中下方棕色土壤横截面上，游戏图标，2D矢量艺术风格，简约设计，深色轮廓描边，左上方光源，柔和阴影，透明背景，麦穗膨大变黄，金黄色麦粒隐约可见，茎秆由绿转黄，植株微弯，画面占比60%-80%，底部有柔和椭圆形投影投射在土壤上，单张游戏精灵图"
  },
  {
    name: "1_stage_5",
    description: "成熟期",
    prompt: "小麦(Wheat)成熟期图标，俯视45度视角，根部在画面中下方棕色土壤横截面上，游戏图标，2D矢量艺术风格，简约设计，深色轮廓描边，左上方光源，柔和阴影，透明背景，3根金黄色麦穗完全成熟，穗头因重量微微弯曲，茎秆呈黄褐色，顶点反射太阳光，右上角金色星标，画面占比80%-95%，底部有柔和椭圆形投影投射在土壤上，单张游戏精灵图"
  },
  {
    name: "crop_1",
    description: "成品图标",
    prompt: "小麦(Wheat)成品图标，正面平视视角，成熟小麦占据画面70%-80%，3根金黄色麦穗捆扎成一小束，麦穗饱满呈金黄色，麦芒清晰，茎秆黄褐色，整体呈紧凑的束状，左侧上方光源，底部有柔和投影，深色外轮廓描边，透明背景加浅绿色(#E8F5E9)圆角矩形底衬，单张游戏道具图标"
  }
];

async function main() {
  const config = loadEnvConfig();

  if (!config.apiKey) {
    console.error(
      "\x1b[31m[错误]\x1b[0m 未设置 ARK_API_KEY。\n" +
        "  请在 .env 文件中填入火山引擎方舟 API Key。\n"
    );
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("小麦(Wheat)图片测试生成 (火山引擎方舟)");
  console.log(`模型: ${config.cropModel}`);
  console.log(`尺寸: ${IMAGE_SIZE}`);
  console.log(`阶段图输出: ${STAGES_OUTPUT_DIR}`);
  console.log(`成品图输出: ${ICONS_OUTPUT_DIR}`);
  console.log("=".repeat(60));
  console.log("");

  ensureDir(STAGES_OUTPUT_DIR);
  ensureDir(ICONS_OUTPUT_DIR);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < WHEAT_PROMPTS.length; i++) {
    const item = WHEAT_PROMPTS[i];
    const outputDir = item.name.startsWith("crop_")
      ? ICONS_OUTPUT_DIR
      : STAGES_OUTPUT_DIR;
    const outputPath = path.join(outputDir, `${item.name}.jpg`);

    console.log(
      `[${i + 1}/${WHEAT_PROMPTS.length}] ${item.description} (${item.name})`
    );
    console.log(`  Prompt: ${item.prompt.substring(0, 80)}...`);

    try {
      const imageData = await generateArkImage(
        config,
        item.prompt,
        config.cropModel,
        IMAGE_SIZE
      );
      const savedPath = saveImage(imageData, outputPath);
      const stats = fs.statSync(savedPath);
      console.log(
        `  \x1b[32m✓ 已保存\x1b[0m: ${savedPath} (${(stats.size / 1024).toFixed(1)} KB)`
      );
      successCount++;
    } catch (err) {
      console.error(`  \x1b[31m✗ 失败\x1b[0m ${item.name}: ${err.message}`);
      failCount++;
    }

    if (i < WHEAT_PROMPTS.length - 1) {
      console.log(`  ⏳ 等待 ${REQUEST_DELAY_MS}ms...`);
      await sleep(REQUEST_DELAY_MS);
    }
  }

  console.log("");
  console.log("=".repeat(60));
  console.log(
    `生成完成! 成功: ${successCount}/${WHEAT_PROMPTS.length}  失败: ${failCount}/${WHEAT_PROMPTS.length}`
  );
  console.log("=".repeat(60));

  if (successCount > 0) {
    console.log("");
    console.log("已生成的文件:");
    for (const item of WHEAT_PROMPTS) {
      const outputDir = item.name.startsWith("crop_")
        ? ICONS_OUTPUT_DIR
        : STAGES_OUTPUT_DIR;
      const outputPath = path.join(outputDir, `${item.name}.jpg`);
      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        console.log(
          `  ✓ ${outputPath} (${(stats.size / 1024).toFixed(1)} KB)`
        );
      } else {
        console.log(`  ✗ ${outputPath} (未生成)`);
      }
    }
  }
}

main().catch((err) => {
  console.error("测试脚本执行失败:", err.message);
  process.exit(1);
});