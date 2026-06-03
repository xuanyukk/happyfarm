/**
 * 文件名：README.md
 * 作者：开发者
 * 日期：2026-05-29
 * 版本：v2.1.0
 * 功能描述：开心农场UI图标生成工具——完整使用指南
 * 更新记录：
 *   2026-05-28 - v1.0.0 - 初始创建
 *   2026-05-28 - v1.1.0 - 新增 FLUX 特效工具文档（第九章）
 *   2026-05-28 - v1.2.0 - 新增 Kolors 基础工具文档（第十章）
 *   2026-05-29 - v1.3.0 - 更新 Kolors 工具支持成品图标生成
 *   2026-05-29 - v2.0.0 - ✨ 重大升级：三个 prompt builder 全部升级
 *   2026-05-29 - v2.1.0 - 模型切换：Kolors→Qwen/Qwen-Image（游戏图标专用），
 *                         尺寸 128x128→256x256，新增 KOLORS_IMAGE_SIZE 环境变量
 */

# 开心农场 UI 图标生成工具

基于硅基流动(SiliconFlow) `Qwen/Qwen-Image` 模型的批量图标生成工具，严格遵循[图标设计规范文档](file:///g:/youxi/ceshi/happy-farm/docs/图标设计规范_作物种子道具土地UI.md)，一键生成全部 640 张游戏图标。

---

## 一、概述

### 1.1 能生成什么

| 图标类型 | 数量 | 输出目录(相对于 `frontend/public/assets/`) |
|----------|------|---------------------------------------------|
| 作物成品图标 | 84 张 | `icons/crops/crop_1.png ~ crop_84.png` |
| 作物种子图标 | 84 张 | `icons/seeds/seed_1.png ~ seed_84.png` |
| 道具图标 | 20 张 | `icons/items/item_1.png ~ item_20.png` |
| 土地品质图标 | 8 张 | `icons/land/land_1.png ~ land_8.png` |
| UI 按钮图标 | 7 张 | `ui/buttons/ui_button_plant.png ...` |
| UI 面板背景 | 4 张 | `ui/panels/ui_panel_main_bg.png ...` |
| UI 通用元素 | 13 张 | `ui/common/ui_icon_gold.png ...` |
| **合计** | **220 张** | |

### 1.2 设计依据

所有图标的视觉元素、配色、特效均来源于以下设计规范文档：

- [图标设计规范_作物种子道具土地UI.md](file:///g:/youxi/ceshi/happy-farm/docs/图标设计规范_作物种子道具土地UI.md)
- [RESOURCES_GUIDE.md](file:///g:/youxi/ceshi/happy-farm/frontend/src/assets/RESOURCES_GUIDE.md)

### 1.3 统一风格参数

所有图标自动应用以下规范：

- **画布**: 128x128px，透明背景
- **风格**: 扁平化 + 轻渐变光泽
- **描边**: 2px 深色外轮廓
- **光源**: 顶部偏左
- **阴影**: 柔和投影
- **底衬**: 按品质自动匹配颜色和形状

---

## 二、环境准备

### 2.1 获取 API 密钥

1. 访问 [硅基流动控制台](https://cloud.siliconflow.cn/account/ak)
2. 注册/登录后创建 API Key
3. 复制密钥备用

### 2.2 配置项目

```bash
# 进入工具目录
cd frontend/scripts/generate-icons/

# 复制配置模板
copy .env.example .env    # Windows
# cp .env.example .env    # Mac/Linux
```

### 2.3 编辑 `.env` 文件

```ini
# 必填：硅基流动 API 密钥
SILICONFLOW_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# 可选：以下参数都有默认值，可按需调整
IMAGE_MODEL=Qwen/Qwen-Image
IMAGE_SIZE=128x128
NUM_INFERENCE_STEPS=30
GUIDANCE_SCALE=7.5
OUTPUT_DIR=frontend/public/assets
MAX_CONCURRENT=3
REQUEST_DELAY_MS=2000
```

---

## 三、快速开始

### 3.1 NPM 脚本（推荐）

在 `frontend/` 目录下执行：

```bash
# 生成全部 220 张图标
npm run icons:generate

# 分类生成
npm run icons:crop     # 仅作物(84张)
npm run icons:seed     # 仅种子(84张)
npm run icons:item     # 仅道具(20张)
npm run icons:land     # 仅土地(8张)
npm run icons:ui       # 仅UI元素(24张)

# 预览模式（不调用API，仅查看prompt）
npm run icons:dry-run
```

### 3.2 直接运行脚本

```bash
cd frontend/
node scripts/generate-icons/generateIcons.cjs [选项]
```

### 3.3 生成单张测试

```bash
# 先预览 prompt
node scripts/generate-icons/generateIcons.cjs --type crop --id 1 --dry-run

# 确认无误后实际生成
node scripts/generate-icons/generateIcons.cjs --type crop --id 1

# 生成指定道具
node scripts/generate-icons/generateIcons.cjs --type item --id 7
```

### 3.4 命令行参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `--type <类型>` | 指定图标类型 | `--type crop` `--type item` |
| `--id <数字>` | 指定对应ID（配合 `--type` 使用） | `--id 1` |
| `--dry-run` | 预览模式，不调用 API | — |
| `--help` | 显示帮助信息 | — |

**`--type` 支持的值**:

| 值 | 含义 | 数量 |
|----|------|------|
| `all` | 全部图标（默认） | 220 张 |
| `crop` | 作物成品图标 | 84 张 |
| `seed` | 作物种子图标 | 84 张 |
| `item` | 道具图标 | 20 张 |
| `land` | 土地品质图标 | 8 张 |
| `ui` | UI 元素图标 | 24 张 |
| `single` | 单张测试（第一张作物图） | 1 张 |

---

## 四、工具特性

### 4.1 断点续传

生成过程中自动维护 `.progress.json` 文件记录已完成任务。
- 脚本中断后重新运行，自动跳过已生成的图片
- 无需手动管理进度

### 4.2 自动重试

单张图片生成失败时自动重试 3 次，带指数退避（3s → 6s → 9s）。

### 4.3 并发控制

- 默认同时生成 3 张（可通过 `.env` 调整 `MAX_CONCURRENT`）
- 每张之间间隔 2 秒（可通过 `REQUEST_DELAY_MS` 调整）
- 避免触发 API 限流

### 4.4 进度显示

运行时实时显示：
```
[15s] [12.3%] 生成中 icons/crops/crop_28.png
[15s] [12.3%] 完成   icons/crops/crop_28.png
[20s] [12.8%] 跳过   icons/crops/crop_29.png (已完成)
```

---

## 五、文件结构

```
frontend/scripts/generate-icons/
├── .env.example         # API 密钥配置模板（需复制为 .env）
├── .env                 # 实际配置文件（不提交到 Git）
├── .progress.json       # 断点续传进度文件（自动生成）
├── iconData.cjs         # 图标数据库（220条结构化设计数据）
├── promptBuilder.cjs    # Prompt 构建引擎
├── generateIcons.cjs    # 主生成脚本
└── README.md            # 本文件
```

### 各模块职责

| 文件 | 职责 | 关键函数 |
|------|------|----------|
| `iconData.cjs` | 存储 84 作物 + 20 道具 + 8 土地 + 27 UI 的视觉描述、配色方案、特效参数 | `getAllTasks()` |
| `promptBuilder.cjs` | 将结构数据转换为精确的英文绘图 prompt，每种类型有独立构建策略 | `buildPrompt(task)` |
| `generateIcons.cjs` | HTTP 调用 SiliconFlow API → 下载图片 → 保存文件 → 进度追踪 | `generateIcon()`, `processTasks()` |

---

## 六、输出目录

默认为 `frontend/public/assets/`，在 Vite 项目中可通过 `/assets/icons/crops/crop_1.png` 直接访问。

```
frontend/public/assets/
├── icons/
│   ├── crops/          (84 张作物成品图标)
│   ├── seeds/          (84 张作物种子图标)
│   ├── items/          (20 张道具图标)
│   └── land/           (8 张土地品质图标)
└── ui/
    ├── buttons/        (7 张按钮图标)
    ├── panels/         (4 张面板背景)
    └── common/         (13 张通用元素)
```

如需修改输出目录，编辑 `.env` 中的 `OUTPUT_DIR`。

---

## 七、成本估算

使用 SiliconFlow 平台 `Qwen/Qwen-Image` 模型：

| 项目 | 估算 |
|------|------|
| 单张图片消耗 | 约 6-8 积分 |
| 全部 220 张 | 约 1,500-1,800 积分 |
| 参考时间 | 约 15-25 分钟（3并发/2秒间隔） |

> 实际消耗视 prompt 复杂度略有浮动。建议先用 `--type single --dry-run` 预览 prompt 质量，再用小批量（如 `--type ui`）测试效果，最后全量生成。

---

## 八、常见问题

### Q: 生成失败怎么办？

A: 脚本会自动重试 3 次。如果仍然失败：
1. 检查 API 密钥是否正确、余额是否充足
2. 检查网络连接是否稳定
3. 直接重新运行脚本，已完成的会自动跳过

### Q: 如何重置进度？

A: 删除 `frontend/scripts/generate-icons/.progress.json` 文件即可重新开始。

### Q: 生成的图标不满意？

A: 可以修改 `iconData.cjs` 中的 `visual` 和 `color` 字段来调整视觉描述，然后重新运行。

### Q: 如何增加并发数？

A: 编辑 `.env`，调整 `MAX_CONCURRENT=5`（注意不要设太高，避免触发 API 限流）。

---

## 九、FLUX 特效作物生成工具 (新增)

基于 `black-forest-labs/FLUX.1-Kontext-dev` 模型，**专为稀有/顶级作物生成生长阶段图和成品图标**，准确还原发光、光晕、粒子、旋转光环等高级特效。

### 9.1 与 UI 图标工具的区别

| 特性 | UI 图标工具 (generateIcons.cjs) | FLUX 特效工具 (flux-generate-effects.cjs) |
|------|--------------------------------|-------------------------------------------|
| 模型 | Qwen/Qwen-Image | FLUX.1-Kontext-dev |
| 目标 | 全部 220 张 UI 图标 | 50 种稀有/顶级作物（300 张） |
| 内容 | 作物/种子/道具/土地/UI 图标 | 生长阶段图 (stage1-5) + 成品图标 |
| 特效 | 基础渐变+描边+阴影 | 光晕/粒子/旋转光环/彩虹渐变/全息 |
| 覆盖范围 | 全部 84 作物 + UI 元素 | 稀有 35-74 + 顶级 75-84 |

### 9.2 特效分级

| 品质 | ID 范围 | 数量 | 特效 |
|------|---------|------|------|
| 稀有 | 35-44 | 10 种 | 紫色光晕 + 紫色星星粒子 |
| 稀有+ | 45-54 | 10 种 | 蓝色光晕 + 蓝色光点 |
| 极稀有 | 55-74 | 20 种 | 金色光晕 + 金色流光粒子 |
| 顶级 | 75-84 | 10 种 | 彩虹渐变光晕 + 旋转光环 + 全息粒子 |

### 9.3 快速开始

```bash
cd frontend/

# 预览所有 prompt（先检查质量）
node scripts/generate-icons/flux-generate-effects.cjs --dry-run

# 生成单张测试
node scripts/generate-icons/flux-generate-effects.cjs --type single

# 生成全部顶级作物（60张，推荐先跑这个测试效果）
node scripts/generate-icons/flux-generate-effects.cjs --type top

# 生成全部稀有作物（240张）
node scripts/generate-icons/flux-generate-effects.cjs --type rare

# 生成指定作物的全部图片
node scripts/generate-icons/flux-generate-effects.cjs --type top --id 75

# 生成指定作物的指定生长阶段
node scripts/generate-icons/flux-generate-effects.cjs --type stages --id 75 --stage 5

# 生成全部特效作物（300张）
node scripts/generate-icons/flux-generate-effects.cjs --type all
```

### 9.4 FLUX 配置参数

编辑 `.env` 文件：

```ini
# FLUX 模型配置
FLUX_MODEL=black-forest-labs/FLUX.1-Kontext-dev
FLUX_NUM_INFERENCE_STEPS=35
FLUX_GUIDANCE_SCALE=8.0

# FLUX 并发控制（推理较慢，建议更低并发）
FLUX_MAX_CONCURRENT=2
FLUX_REQUEST_DELAY_MS=3000
```

### 9.5 输出目录

```
frontend/public/assets/
├── crops/stages/    (250 张生长阶段图: {id}_stage_{n}.png)
└── icons/crops/     (50 张成品图标: crop_{id}.png, 仅稀有/顶级)
```

### 9.6 成本估算

FLUX.1-Kontext-dev 模型定价约 0.015$ / 张图片：

| 任务 | 数量 | 预估成本 |
|------|------|----------|
| 顶级作物 | 60 张 | ~$0.90 |
| 稀有作物 | 240 张 | ~$3.60 |
| 全部特效 | 300 张 | ~$4.50 |

> 建议先用 `--type top` 测试 60 张效果，确认满意后再批量生成。

### 9.7 文件结构

```
frontend/scripts/generate-icons/
├── .env.example                  # API 密钥配置模板（含 FLUX 配置）
├── .env                          # 实际配置文件（不提交到 Git）
├── .progress.json                # UI图标断点续传进度
├── .flux-progress.json           # FLUX特效断点续传进度
├── iconData.cjs                  # UI图标结构化数据（220条）
├── promptBuilder.cjs             # UI图标 Prompt 构建引擎
├── generateIcons.cjs             # UI图标主生成脚本
├── flux-effect-crops.cjs         # FLUX特效作物数据（50种）
├── flux-prompt-builder.cjs       # FLUX特效 Prompt 构建引擎
├── flux-generate-effects.cjs     # FLUX特效主生成脚本
└── README.md                     # 本文件
```

### 9.8 常见问题

**Q: FLUX 工具和 UI 图标工具有什么关系？**

A: 它们是互补的。UI 图标工具（generateIcons.cjs）生成全部 84 种作物的成品图标和 UI 元素。FLUX 特效工具（flux-generate-effects.cjs）专注于稀有/顶级作物的生长阶段图和高品质成品图标，覆盖 UI 工具难以生成的特效（彩虹光晕、旋转光环、全息粒子等）。

**Q: 生成的生长阶段图是否需要替换 UI 工具生成的成品图标？**

A: 是的。对于稀有/顶级作物（ID 35-84），建议使用 FLUX 工具生成的 `crop_{id}.png` 替换 UI 工具生成的版本，因为 FLUX 能更准确地还原设计规范中的特效。

**Q: FLUX 模型支持中文 prompt 吗？**

A: FLUX.1-Kontext-dev 对英文 prompt 的响应更好。本工具已将所有 prompt 优化为英文，但在 negative_prompt 中保留了中英双语约束以确保质量。

**Q: 如何重置 FLUX 进度？**

A: 删除 `frontend/scripts/generate-icons/.flux-progress.json` 文件即可。

---

## 十、基础作物生成工具 (v1.2)

基于 `Qwen/Qwen-Image` 模型，**专为基础/经济作物（ID 1-34）的生长阶段图和成品图标生成**，准确还原45度俯视等距视角、土壤横截面表现和五阶段变化过程。

> ⚠️ **v1.2 重要变更**: 因原 `Kwai-Kolors/Kolors` 模型不支持游戏像素风格，已切换至 `Qwen/Qwen-Image`（游戏图标专用模型）。尺寸由 128x128 升级至 256x256（Qwen 最小要求），新增双语负向提示词和透明背景参数。如需回退使用 Kolors，设 `KOLORS_MODEL=Kwai-Kolors/Kolors` + `KOLORS_IMAGE_SIZE=128x128`。

### 10.1 三大工具对比

| 特性 | 基础作物工具 | FLUX特效工具 | UI图标工具 |
|------|-------------|-------------|-----------|
| 脚本 | kolors-generate-crops.cjs | flux-generate-effects.cjs | generateIcons.cjs |
| 模型 | Qwen/Qwen-Image | FLUX.1-Kontext-dev | Qwen/Qwen-Image |
| 目标 | 基础/经济生长+成品 | 稀有/顶级特效 | UI+种子+道具+土地 |
| 数量 | **204张** (170阶段+34成品) | 300张 | 136张 |
| 覆盖ID | 1-34 | 35-84 | 1-84 + UI |
| 内容 | 生长阶段图 + 成品图标 | 阶段图+成品图标 | 种子/道具/土地/UI |
| 尺寸 | **256x256** | 128x128 | 128x128 |
| 视角 | 45度俯视(阶段)+正面平视(成品) | 正面/等距混合 | 正面平视(图标化) |
| 土壤表现 | 土壤横截面(阶段图) | 简化土壤 | 无 |
| 特效 | 无(纯游戏美术) | 光晕/粒子/光环/彩虹 | 基础渐变描边 |
| 语言 | 中文为主 | 英文 | 英文 |

### 10.2 作物分类

| 分类 | ID | 说明 |
|------|-----|------|
| 叶菜类 | 3,4,6,8,10 | 无花阶段，叶片层层展开（青菜/白菜/生菜/菠菜/韭菜） |
| 根茎类 | 5,7,11 | 地上茎叶+地下根部膨大（土豆/胡萝卜/大豆） |
| 果实类 | 1,2,9,12,14,15,16 | 先开花后结果（小麦/玉米/芹菜/番茄/辣椒/茄子/草莓） |
| 藤蔓瓜果类 | 13,19,23 | 藤蔓沿支架攀爬（黄瓜/西瓜/葡萄） |
| 果树类 | 21-22,24-34 | 木本植物有树干（柚子/柠檬/荔枝/龙眼/桃子/李子等11种） |
| 灌木果实类 | 17,18,20 | 灌木/草本果实（树莓/红莓/菠萝） |

### 10.3 五阶段变化

| 阶段 | 中文名 | 画面占比 | 通用特征 | 根茎类特殊 | 藤蔓类特殊 | 果树类特殊 |
|------|--------|----------|----------|-----------|-----------|-----------|
| stage_1 | 幼苗期 | 10%-20% | 嫩芽破土 | 小叶+根部初生 | 幼苗+小支架 | 细长树干+2-3叶 |
| stage_2 | 生长期 | 30%-50% | 茎叶展开 | 地上下同步生长 | 开始攀爬支架 | 树干增粗+小树冠 |
| stage_3 | 开花期 | 50%-70% | 开花/叶丛茂盛 | 开花+根部膨大 | 藤蔓布满支架 | 树冠满花 |
| stage_4 | 结果期 | 60%-80% | 幼果/可食部分初现 | 根部明显膨大 | 幼果悬挂变大 | 小果点缀枝头 |
| stage_5 | 成熟期 | 80%-95% | 完全成熟+金色星标 | 地上枯萎+根部露出 | 藤蔓满架+果熟 | 硕果累累 |

### 10.4 快速开始

```bash
cd frontend/

# 预览所有prompt（先检查质量）
node scripts/generate-icons/kolors-generate-crops.cjs --dry-run

# 生成单张测试图
node scripts/generate-icons/kolors-generate-crops.cjs --type single

# 仅生成生长阶段图（170张）
node scripts/generate-icons/kolors-generate-crops.cjs --type stages

# 仅生成成品图标（34张）
node scripts/generate-icons/kolors-generate-crops.cjs --type products

# 生成全部基础作物（90张：75阶段+15成品，推荐先跑这个测试）
node scripts/generate-icons/kolors-generate-crops.cjs --type basic

# 生成全部经济作物（114张：95阶段+19成品）
node scripts/generate-icons/kolors-generate-crops.cjs --type economic

# 生成指定作物的全5阶段+成品
node scripts/generate-icons/kolors-generate-crops.cjs --id 1

# 生成指定作物的单个阶段
node scripts/generate-icons/kolors-generate-crops.cjs --id 1 --stage 5

# 生成全部204张（170阶段+34成品）
node scripts/generate-icons/kolors-generate-crops.cjs --type all
```

### 10.5 配置参数

编辑 `.env` 文件：

```ini
# 基础作物工具配置 (v1.2+)
KOLORS_MODEL=Qwen/Qwen-Image
KOLORS_IMAGE_SIZE=256x256
KOLORS_NUM_INFERENCE_STEPS=30
KOLORS_GUIDANCE_SCALE=10

# 基础作物并发控制
KOLORS_MAX_CONCURRENT=3
KOLORS_REQUEST_DELAY_MS=1500
```

> 如需回退 Kolors 模型：`KOLORS_MODEL=Kwai-Kolors/Kolors` + `KOLORS_IMAGE_SIZE=128x128`

### 10.6 输出目录

```
frontend/public/assets/
├── crops/stages/    (170 张生长阶段图: {id}_stage_{n}.png)
│                    覆盖 ID 1-34, 每个5阶段
└── icons/crops/     (34 张成品图标: crop_{id}.png)
                     覆盖 ID 1-34, 与生长阶段配套
```

### 10.7 成本

Qwen/Qwen-Image 模型为付费模型，204张基础作物素材约需 1,200-1,600 积分。

### 10.8 文件结构

```
frontend/scripts/generate-icons/
├── .env.example                  # API 密钥配置模板
├── .env                          # 实际配置文件
├── .progress.json                # UI图标断点续传进度
├── .flux-progress.json           # FLUX特效断点续传进度
├── .kolors-progress.json         # Kolors基础作物断点续传进度
├── iconData.cjs                  # UI图标结构化数据 (220条)
├── promptBuilder.cjs             # UI图标 Prompt 构建引擎
├── generateIcons.cjs             # UI图标主生成脚本
├── flux-effect-crops.cjs         # FLUX特效作物数据 (50种)
├── flux-prompt-builder.cjs       # FLUX特效 Prompt 构建引擎
├── flux-generate-effects.cjs     # FLUX特效主生成脚本
├── kolors-crops.cjs              # Kolors基础作物数据 (34种)
├── kolors-prompt-builder.cjs     # Kolors基础 Prompt 构建引擎
├── kolors-generate-crops.cjs     # Kolors基础主生成脚本
└── README.md                     # 本文件
```

### 10.9 常见问题

**Q: 基础作物工具和FLUX工具的区别？**

A: 基础作物工具生成基础/经济作物的生长阶段图和成品图标（ID 1-34），用 Qwen/Qwen-Image 模型（256x256）。FLUX 生成稀有/顶级作物的生长图和成品图标（ID 35-84）。两者互补，三工具联合使用可覆盖全部84种作物。

**Q: 为什么使用Qwen而不是Kolors？**

A: v1.2 起已切换至 Qwen/Qwen-Image。Kwai-Kolors/Kolors 不支持游戏像素风格（2D vector game art），生成图片不符合设计规范。Qwen 原生支持游戏图标生成、透明背景和描边效果。

**Q: Qwen 模型收费吗？**

A: 是的，Qwen/Qwen-Image 为付费模型，约 6-8 积分/张。如需使用免费模型，可回退至 Kolors：设置 `KOLORS_MODEL=Kwai-Kolors/Kolors` + `KOLORS_IMAGE_SIZE=128x128`，但图像质量不保证符合设计规范。

**Q: 基础作物工具和UI图标工具有什么区别？**

A: 区别在于：
- **基础作物工具 (kolors-generate-crops.cjs)**: 生成生长阶段图(170张) + 基础成品图标(34张)，256x256
- **UI图标工具 (generateIcons.cjs)**: 生成种子/道具/土地/UI图标，128x128
成品图标(crop_*.png)由基础作物工具生成。

**Q: 生成后如何与FLUX工具的图片合并？**

A: 两者输出到相同目录：
- 生长阶段图: `frontend/public/assets/crops/stages/`
  - 基础作物工具生成: `1_stage_1.png` ~ `34_stage_5.png`
  - FLUX生成: `35_stage_1.png` ~ `84_stage_5.png`
- 成品图标: `frontend/public/assets/icons/crops/`
  - 基础作物工具生成: `crop_1.png` ~ `crop_34.png`
  - FLUX生成: `crop_35.png` ~ `crop_84.png`
合并后即覆盖全部84种作物的420张生长阶段图和84张成品图标。
- 基础作物工具生成的是 256x256，如需统一为 128x128 请后期缩放。

---

## 十一、推荐使用流程 & 重要注意事项

### 11.1 推荐的完整生成流程

为了获得最佳质量和成本效益，建议按以下顺序执行：

```bash
cd frontend/scripts/generate-icons

# 1️⃣ 第一步：生成基础/经济作物（基础作物工具，Qwen模型256x256）
node kolors-generate-crops.cjs --type all  # 204张，付费

# 2️⃣ 第二步：生成稀有/顶级特效作物（FLUX 工具）
node flux-generate-effects.cjs --type all   # 300张，付费

# 3️⃣ 第三步：生成种子/道具/土地/UI（UI 工具）
node generateIcons.cjs --type seed  # 种子图标84张
node generateIcons.cjs --type item  # 道具图标20张
node generateIcons.cjs --type land  # 土地图标8张
node generateIcons.cjs --type ui    # UI元素24张
```

✅ 完成后：
- 🟢 基础作物 1-34：由基础作物工具生成（Qwen/Qwen-Image，256x256）
- 🔵 稀有/顶级作物 35-84：由 FLUX 生成（特效）
- 🟡 种子/道具/土地/UI：由 UI 工具生成（统一风格）

### 11.2 重要注意事项

#### ⚠️ **千万不要这样做**

| ❌ 错误做法 | ✅ 正确做法 |
|-------------|-------------|
| 先用 UI 工具生成全部 84 种成品图标，再用 FLUX/基础工具覆盖 | 按推荐顺序：先基础作物工具，再 FLUX，最后 UI 工具 |
| 混淆三个工具的执行顺序 | 顺序很重要：基础作物 → 稀有特效 → UI 其他 |
| 同时运行多个生成工具 | 逐个工具运行，避免文件冲突 |

#### 🔑 **关键要点**

1. **输出文件冲突**：三个工具都会写 `crop_*.png` 到 `icons/crops/`，后执行的会覆盖先执行的
2. **成本最优策略**：
   - 基础/经济（1-34）→ 基础作物工具（Qwen，256x256）
   - 稀有/顶级（35-84）→ FLUX（特效付费）
   - 种子/道具/土地/UI → UI 工具（Qwen，128x128）
3. **断点续传**：每个工具有独立的进度文件，互不干扰
4. **预览测试**：首次使用建议先 `--dry-run` 或小批量测试
5. **尺寸差异**：基础作物工具生成 256x256，UI 工具生成 128x128，如需统一请后期缩放

### 11.3 三种工具的定位 & 输出对比

| 特性 | UI图标工具 | FLUX特效工具 | 基础作物工具 |
|------|-----------|-------------|---------------|
| **主要用途** | 完整 UI 资源包 | 高级特效素材 | 基础/经济作物素材 |
| **推荐用于** | 种子/道具/土地/UI | 稀有/顶级成品 + 生长阶段 | 基础/经济生长 + 成品 |
| **是否推荐用于 crop_*.png** | ❌ **不推荐** | ✅ **推荐**（35-84） | ✅ **推荐**（1-34） |
| **输出尺寸** | 128x128 | 128x128 | **256x256** |
| **输出 crop_*.png 数量** | 84张 | 50张 | 34张 |
| **成本** | 付费 | 付费 | 付费 |

---

## 附录：提示词文档

本项目提供了详细的专用提示词文档，方便参考和使用：

- [提示词-Kolors开心农场基础作物生成工具](../../docs/提示词-Kolors开心农场基础作物生成工具.md)
- [提示词-FLUX开心农场特效作物生成工具](../../docs/提示词-FLUX开心农场特效作物生成工具.md)
- [提示词-Qwen开心农场UI图标生成工具](../../docs/提示词-Qwen开心农场UI图标生成工具.md)

这些文档包含了完整的提示词模板和所有作物/道具的详细描述，可以直接使用或作为参考。

---

## 附录二：v2.0.0 重大升级说明（2026-05-29）

### 升级内容摘要

三个工具的 **prompt 构建引擎全部升级**，从原来的简单拼接格式升级为和 `提示词.txt` 一致的**逐项详细描述模板**。

| 文件名 | 旧版本 | 新版本 | 主要变化 |
|--------|-------|--------|---------|
| [kolors-prompt-builder.cjs](file:///g:/youxi/ceshi/happy-farm/frontend/scripts/generate-icons/kolors-prompt-builder.cjs) | v1.1.0 | v2.0.0 | 新增 `getStageFramework()`、`getStageRatio()`、`getBackingColor()` 函数，prompt 逐项列出画布/视角/土壤/风格/描边/光源/投影/阶段描述/画面占比 |
| [flux-prompt-builder.cjs](file:///g:/youxi/ceshi/happy-farm/frontend/scripts/generate-icons/flux-prompt-builder.cjs) | v1.0.0 | v2.0.0 | 新增 `getRareStageFramework()`、`getTopStageFramework()`、`getQualityBackingAndEffect()` 函数，精确描述光柱/光环/粒子/彩虹渐变等特效 |
| [promptBuilder.cjs](file:///g:/youxi/ceshi/happy-farm/frontend/scripts/generate-icons/promptBuilder.cjs) | v1.0.0 | v2.0.0 | 重构为 7 个独立构建函数：`buildCropPrompt()`/`buildSeedPrompt()`/`buildItemPrompt()`/`buildLandPrompt()`/`buildUIButtonPrompt()`/`buildUIPanelPrompt()`/`buildUICommonPrompt()`，每种类型有独立详细模板 |

### Prompt 格式对比

**v1.x (旧格式)**:
```
开心农场手机游戏128x128像素精灵图，45度俯视等距视角。{visual}。作物：{name}，ID {id}，分类{category}，{stageLabel}。画面中作物为主体，植株根部位于画布中心偏下位置(64,80)。风格：{style}。单张精灵图，透明背景。
```

**v2.0 (新格式)**:
```
生成开心农场{name}的{stageLabel}图标。画布尺寸：128x128px，内容区域96x96px居中，四周16px安全边距。视角：俯视45度角，植株根部位于画布坐标(64,80)位置。底部20px显示棕色土壤横截面。风格：{style}。描边：1.5px深色外轮廓描边（比填充色深40%）。光源：左上方打光，高光在左上角，阴影在右下角。底部添加半透明椭圆形投影(rgba(0,0,0,0.2)，8px模糊)。阶段描述：{stageFramework}，具体画面呈现为{visual}。{stageRatio}。作物编号ID {id}，分类{category}，{stageLabel}。单张128x128像素游戏精灵图，透明背景。
```

### 验证方式

使用 `--dry-run` 参数可以预览 v2.0 生成的完整 prompt：

```bash
# 预览 Kolors 工具生成的新格式
node kolors-generate-crops.cjs --dry-run --id 1 --stage 1

# 预览 FLUX 工具生成的新格式
node flux-generate-effects.cjs --dry-run --id 35 --stage 1

# 预览 UI 工具生成的新格式
node generateIcons.cjs --dry-run --type seed --id 1
```

### 升级内容摘要 (v2.1.0)

因 Kwai-Kolors/Kolors 模型不支持游戏像素风格，基础作物生成工具全面切换至 Qwen/Qwen-Image。

| 文件名 | 旧版本 | 新版本 | 主要变化 |
|--------|-------|--------|---------|
| [kolors-prompt-builder.cjs](file:///g:/youxi/ceshi/happy-farm/frontend/scripts/generate-icons/kolors-prompt-builder.cjs) | v2.0.0 | v2.1.0 | 模型 Kolors→Qwen，尺寸 128→256，新增 transparent_background/response_format |
| [kolors-generate-crops.cjs](file:///g:/youxi/ceshi/happy-farm/frontend/scripts/generate-icons/kolors-generate-crops.cjs) | v1.1.0 | v1.2.0 | 默认模型→Qwen，新增 KOLORS_IMAGE_SIZE 环境变量 |
| [promptBuilder.cjs](file:///g:/youxi/ceshi/happy-farm/frontend/scripts/generate-icons/promptBuilder.cjs) | v2.0.0 | v2.1.0 | 模型名 Qwen-Image-2512→Qwen/Qwen-Image |
| [generateIcons.cjs](file:///g:/youxi/ceshi/happy-farm/frontend/scripts/generate-icons/generateIcons.cjs) | v1.0.0 | v1.1.0 | 模型名更新，httpRequest 兼容二进制响应 |
| [.env.example](file:///g:/youxi/ceshi/happy-farm/frontend/scripts/generate-icons/.env.example) | v2.0.0 | v2.1.0 | 模型名/尺寸/文档全面更新 |

### Prompt 格式对比 (v2.0 → v2.1)

**v2.0 (128x128，Kolors模型)**:
```
画布尺寸：128x128px，内容区域96x96px居中，四周16px安全边距。
底部20px显示棕色土壤横截面。
单张128x128像素游戏精灵图，透明背景。
```

**v2.1 (256x256，Qwen模型)**:
```
画布尺寸：256x256px，内容区域192x192px居中，四周32px安全边距。
底部40px显示棕色土壤横截面。
单张256x256像素游戏精灵图，透明背景。
```

> 包含 `transparent_background: true` 和双语负向提示词。
> guidance_scale 从 7.5 提升至 10。

---

**文档版本**: v2.1.0
**最后更新**: 2026-05-29
**更新内容**: 模型从 Kolors 切换至 Qwen/Qwen-Image，尺寸升级 256x256，新增 KOLORS_IMAGE_SIZE 环境变量