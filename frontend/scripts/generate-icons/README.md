/**
 * 文件名：README.md
 * 作者：TraeAI、xuanyukk
 * 日期：2026-06-01
 * 版本：v4.71.6
 * 功能描述：开心农场UI图标生成工具——完整使用指南（火山引擎方舟版）
 * 更新记录：
 *   2026-05-28 - v1.0.0 - 初始创建
 *   2026-05-28 - v1.1.0 - 新增 FLUX 特效工具文档（第九章）
 *   2026-05-28 - v1.2.0 - 新增 Kolors 基础工具文档（第十章）
 *   2026-05-29 - v1.3.0 - 更新 Kolors 工具支持成品图标生成
 *   2026-05-29 - v2.0.0 - ✨ 重大升级：三个 prompt builder 全部升级
 *   2026-05-29 - v2.1.0 - 模型切换：Kolors→Qwen/Qwen-Image（游戏图标专用），
 *                         尺寸 128x128→256x256，新增 KOLORS_IMAGE_SIZE 环境变量
 *   2026-05-29 - v2.2.0 - 提示词格式重大优化：去除精确坐标/CSS参数/rgba值，
 *                         改为简洁自然语言视觉描述。实验验证Qwen模型对复杂
 *                         技术参数处理能力弱，简化后生成质量显著提升。
 *                         推理步数 30→40，引导系数全面提升至 12。
 *                         备份归档 11 个脚本文件 + 5 个文档文件至 archive/。
 *   2026-05-29 - v3.0.0 - ✨ 平台迁移：火山引擎方舟(Ark)，从硅基流动全面迁移，
 *                         新增 ark-api.cjs API封装、ModelManager类、
 *                         model-status.cjs状态工具、convert_images.py格式转换。
 *   2026-05-30 - v3.1.0 - 新增 rename_images_by_mtime.py 批量重命名工具，
 *                         用于将 AI 生成的随机命名图片重命名为项目规范文件名。🎉
 *   2026-05-30 - v3.2.0 - 更新 rename_images_by_mtime.py 使用说明：新增
 *                         --list 子目录列表功能和 --subdir 子目录筛选重命名功能，
 *                         支持按子目录单独处理，解决命名错位问题。
 *   2026-05-30 - v3.3.0 - rename_images_by_mtime.py 和 convert_images.py 同步
 *                         新增交互式菜单模式：无参数运行进入交互式菜单，提供
 *                         逐步引导式操作。两种途径（命令行/交互式菜单）功能一致。🎉
 */

# 开心农场 UI 图标生成工具

基于火山引擎方舟(Ark) `doubao-seedream-4-5-251128` 模型的批量图标生成工具，严格遵循[图标设计规范文档](file:///g:/youxi/ceshi/happy-farm/docs/图标设计规范_作物种子道具土地UI.md)，一键生成全部 640 张游戏图标。

---

## 一、概述

### 1.1 能生成什么

| 图标类型 | 数量 | 输出目录(相对于 `frontend/public/assets/`) |
|----------|------|---------------------------------------------|
| 作物成品图标 | 84 张 | `icons/crops/crop_1.jpg ~ crop_84.jpg` |
| 作物种子图标 | 84 张 | `icons/seeds/seed_1.jpg ~ seed_84.jpg` |
| 道具图标 | 20 张 | `icons/items/item_1.jpg ~ item_20.jpg` |
| 土地品质图标 | 8 张 | `icons/land/land_1.jpg ~ land_8.jpg` |
| UI 按钮图标 | 7 张 | `ui/buttons/ui_button_plant.jpg ...` |
| UI 面板背景 | 4 张 | `ui/panels/ui_panel_main_bg.jpg ...` |
| UI 通用元素 | 13 张 | `ui/common/ui_icon_gold.jpg ...` |
| **合计** | **220 张** | |

### 1.2 设计依据

所有图标的视觉元素、配色、特效均来源于以下设计规范文档：

- [图标设计规范_作物种子道具土地UI.md](file:///g:/youxi/ceshi/happy-farm/docs/图标设计规范_作物种子道具土地UI.md)
- [RESOURCES_GUIDE.md](file:///g:/youxi/ceshi/happy-farm/frontend/src/assets/RESOURCES_GUIDE.md)

### 1.3 统一风格参数

所有图标自动应用以下规范：

- **画布**: 256x256px，透明背景
- **风格**: 扁平化 + 轻渐变光泽
- **描边**: 2px 深色外轮廓
- **光源**: 顶部偏左
- **阴影**: 柔和投影
- **底衬**: 按品质自动匹配颜色和形状

---

## 二、环境准备

### 2.1 获取 API 密钥

1. 访问 [火山引擎方舟控制台](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey)
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
# 必填：火山引擎方舟 API 密钥
ARK_API_KEY=ark-xxxxxxxxxxxxxxxxxxxx

# 模型配置
ARK_CROP_MODEL=doubao-seedream-4-5-251128
ARK_UI_MODEL=doubao-seedream-4-5-251128

# 可选：以下参数都有默认值，可按需调整
ARK_CROP_MAX_CONCURRENT=1
ARK_CROP_REQUEST_DELAY_MS=1000
ARK_UI_MAX_CONCURRENT=1
ARK_UI_REQUEST_DELAY_MS=1000

NUM_INFERENCE_STEPS=40
GUIDANCE_SCALE=12
FLUX_NUM_INFERENCE_STEPS=40
FLUX_GUIDANCE_SCALE=10.0
KOLORS_NUM_INFERENCE_STEPS=40
KOLORS_GUIDANCE_SCALE=12

OUTPUT_DIR=../../public/assets
```

---

## 三、快速开始

### 3.1 查看模型状态

```bash
node model-status.cjs
```

### 3.2 完整生成所有图标

```bash
# 基础/经济作物（1-34）
node kolors-generate-crops.cjs --type all

# 稀有/顶级特效作物（35-84）
node flux-generate-effects.cjs --type all

# UI 图标
node generateIcons.cjs --type seed
node generateIcons.cjs --type item
node generateIcons.cjs --type land
node generateIcons.cjs --type ui
```

### 3.3 测试单种作物（小麦）

```bash
node test-wheat.cjs
```

---

## 四、工具说明

### 4.1 工具脚本概览

| 工具 | 说明 |
|------|------|
| `ark-api.cjs` | 火山引擎方舟 API 核心封装库（v1.1.0）|
| `generateIcons.cjs` | UI 图标生成工具（v2.0）|
| `kolors-generate-crops.cjs` | 基础/经济作物生成工具（v2.0）|
| `flux-generate-effects.cjs` | 特效作物生成工具（v2.0）|
| `model-status.cjs` | 模型状态查看工具 |
| `test-wheat.cjs` | 小麦测试生成工具（v2.0）|
| `convert_images.py` | Python 批量格式转换工具 |
| `rename_images_by_mtime.py` | Python 按修改时间批量重命名工具 |

---

## 五、使用说明

### 5.1 UI 图标生成工具 (`generateIcons.cjs`)

**功能**：生成种子、道具、土地、UI 元素图标

```bash
# 生成所有类型
node generateIcons.cjs --type seed,item,land,ui

# 逐个类型生成
node generateIcons.cjs --type seed
node generateIcons.cjs --type item
node generateIcons.cjs --type land
node generateIcons.cjs --type ui
```

### 5.2 基础作物生成工具 (`kolors-generate-crops.cjs`)

**功能**：生成 1-34 基础/经济作物的生长阶段图和成品图标

```bash
# 生成所有基础作物
node kolors-generate-crops.cjs --type all

# 生成前10种
node kolors-generate-crops.cjs --type all --start 1 --end 10

# 生成指定ID
node kolors-generate-crops.cjs --type 1,2,3
```

### 5.3 特效作物生成工具 (`flux-generate-effects.cjs`)

**功能**：生成 35-84 稀有/顶级作物的生长阶段图和成品图标（含特效）

```bash
# 生成所有特效作物
node flux-generate-effects.cjs --type all

# 生成前10种
node flux-generate-effects.cjs --type all --start 35 --end 44

# 生成指定ID
node flux-generate-effects.cjs --type 35,36,37
```

---

## 六、质量保障

### 6.1 断点续传

所有工具支持断点续传，生成过程被中断后，重新运行会从上次中断的位置继续。

### 6.2 质量校验

- 自动检测并跳过已存在图片
- 根据图片实际内容智能选择保存为 .jpg 或 .png

### 6.3 进度管理

生成进度会保存为 `*.progress.json` 文件，便于恢复和查看。

---

## 七、模型管理

### 7.1 查看模型状态

```bash
node model-status.cjs
```

### 7.2 当前可用模型

| 模型 | 状态 | 额度 |
|------|------|------|
| doubao-seedream-4-5-251128 | 活跃 | 182 次 |
| doubao-seedream-5-lite-251128 | 活跃 | 50 次 |

---

## 八、故障排查

### 8.1 常见问题

| 问题 | 排查方法 |
|------|---------|
| API 调用失败 | 检查 ARK_API_KEY 配置是否正确 |
| 图片不生成 | 查看输出目录，确认是否已存在同名文件 |
| 生成质量差 | 调整推理步数或引导系数参数 |

---

## 九、后期处理工具

### 9.1 图片按修改时间批量重命名 (`rename_images_by_mtime.py`)

**功能**：将 AI 生成后存放在 `图片/` 文件夹中的 640 张随机命名图片，按修改时间递增顺序重命名为项目规范文件名。

**适用场景**：
- AI 图片生成工具输出的图片使用随机哈希命名，需要批量重命名为 `crop_1.jpg`、`1_stage_1.jpg` 等规范名称
- 图片按生成顺序（修改时间）与项目文档中定义的命名顺序一一对应
- 支持按子目录单独处理，解决各子目录间命名错位问题

**位置**：`frontend/scripts/rename_images_by_mtime.py`（与 `convert_images.py` 同级目录）

**两种使用途径**：

| 途径 | 方式 | 适用场景 |
|------|------|----------|
| **交互式菜单** | 无参数运行 `python rename_images_by_mtime.py` | 新手友好，逐步引导 |
| **命令行参数** | 带参数运行 `--preview` / `--execute` / `--auto` 等 | 脚本自动化，快速执行 |

#### 方式一：交互式菜单（推荐新手使用）

```bash
cd frontend/scripts/
python rename_images_by_mtime.py
```

进入后显示主菜单：
```
========================================================
  开心农场图片批量重命名工具  v2.2.0
  模式: 按子目录匹配 (修复跨目录命名错位)
========================================================

  主菜单：
  1. 列出子目录 (--list)        查看所有子目录及文件统计
  2. 选择子目录 (--subdir)      按子目录名称筛选处理范围
  3. 预览重命名 (--preview)      安全，仅显示映射关系
  4. 预览并确认执行 (--execute)  预览后输入 y 确认执行
  5. 直接执行 (--auto)          跳过确认，谨慎使用！
  0. 退出
```

> 💡 **推荐交互流程**：`1.列出子目录` → `2.选择子目录` → `3.预览重命名` → 确认无误 → `4.执行`

#### 方式二：命令行参数（推荐熟练用户和脚本化使用）

```bash
# 进入脚本目录
cd frontend/scripts/

# 列出所有子目录及文件统计
python rename_images_by_mtime.py --list

# 仅预览（默认模式，安全不修改文件）
python rename_images_by_mtime.py --preview

# 预览后确认执行
python rename_images_by_mtime.py --execute

# 跳过确认直接执行（谨慎使用！）
python rename_images_by_mtime.py --auto

# 指定其他图片目录
python rename_images_by_mtime.py -d ./其他图片目录 --preview

# 详细日志模式
python rename_images_by_mtime.py --preview -v
```

**子目录筛选功能**（v2.1.0 新增）：

```bash
# 仅预览指定子目录（如基础作物）
python rename_images_by_mtime.py --subdir "基础作物" --preview

# 同时处理多个子目录
python rename_images_by_mtime.py --subdir "UI按钮" "UI面板" --execute

# 配合 --list 查看可用子目录名称后筛选
python rename_images_by_mtime.py --list    # 先查看可用子目录
python rename_images_by_mtime.py --subdir "基础作物" --preview   # 再筛选预览
```

> 💡 **使用建议**：推荐每次只处理一个子目录，预览确认无误后再执行，避免跨子目录命名错位。例如先 `--subdir "基础作物" --preview` 确认 → `--subdir "基础作物" --execute` 执行 → 再处理下一个子目录。

**命名顺序**（共 640 张）：

| 顺序范围 | 数量 | 目标命名格式 | 来源文档 |
|----------|------|-------------|----------|
| 1-420 | 420 | `{id}_stage_{n}.jpg` (ID 1→84, stage 1→5) | 图标设计规范_作物生长阶段.md |
| 421-504 | 84 | `crop_{id}.jpg` (ID 1→84) | 图标设计规范_作物种子道具土地UI.md |
| 505-588 | 84 | `seed_{id}.jpg` (ID 1→84) | 同上 |
| 589-608 | 20 | `item_{id}.jpg` (ID 1→20) | 同上 |
| 609-616 | 8 | `land_{id}.jpg` (ID 1→8) | 同上 |
| 617-623 | 7 | `ui_button_{name}.jpg` | 同上 |
| 624-627 | 4 | `ui_panel_{name}.jpg` | 同上 |
| 628-640 | 13 | `ui_{name}.jpg` | 同上 |

> ⚠️ **重要前提**：该工具假定图片文件夹中的文件修改时间顺序与项目文档定义的命名顺序一致。如果生成过程中断了或生成顺序有变化，需要先手动调整。

**工作流程**：

1. **扫描**：递归扫描 `图片/` 文件夹下所有子目录，识别 `.jpg/.png/.svg` 等格式图片
2. **排序**：按文件修改时间递增排序，时间相同则按文件名排序
3. **匹配**：将排序后的文件与文档规范的 640 个目标文件名一一对应
4. **校验**：图片数量必须恰好为 640 张，否则报错并提示
5. **预览**：显示原文件名→目标文件名对应关系，按子目录统计数量
6. **确认**：`--execute` 模式等待用户输入 `y` 确认后执行
7. **执行**：逐文件重命名，保留原扩展名（如 `.jpg` 保持 `.jpg`）
8. **日志**：所有操作写入 `rename_log.txt`，结果报告写入 `rename_report.txt`

**注意事项**：

- ⚠️ **不可逆操作**：重命名后无法自动恢复，建议先备份或使用 `--preview` 确认无误
- ⚠️ **数量必须匹配**：全量模式必须恰好包含 640 张图片，多或少都会报错；使用 `--subdir` 时仅校验所选子目录
- ⚠️ **目标文件冲突**：如果目标文件名已存在，该文件会被跳过并记录错误
- ⚠️ **修改时间依赖**：依赖文件的修改时间顺序，不要手动修改文件时间戳
- 💡 **建议流程**：先用 `--list` 查看子目录统计 → `--subdir` 筛选子目录 → `--preview` 确认映射 → `--execute` 执行
- 💡 **保留扩展名**：原文件是 `.jpg` 则重命名后仍是 `.jpg`，不会改变格式
- 💡 **子目录不变**：文件保留在原子目录中，仅修改文件名
- 💡 **日志追溯**：操作日志和报告会保留在脚本同目录，便于事后核查
- 💡 **逐子目录处理**：推荐使用 `--subdir` 逐个处理子目录，避免跨子目录的命名错位问题

**错误处理**：

| 错误类型 | 处理方式 |
|----------|----------|
| 图片目录不存在 | 抛出错误并退出 |
| 数量不匹配(非640张) | 显示实际数量，提示检查 |
| 子目录名不存在 | 提示可用子目录列表，建议使用 --list 查看 |
| 源文件被删除 | 跳过该文件，记录错误继续执行 |
| 目标文件名冲突 | 跳过该文件，记录错误继续执行 |
| 文件权限不足 | 捕获异常，记录错误继续执行 |

**与格式转换工具配合使用**：参见下方 [§9.2 图片格式批量转换](#92-图片格式批量转换-convertimagespy)。

### 9.2 图片格式批量转换 (`convert_images.py`)

**功能**：将图片在不同格式（jpg/png/webp/bmp/tiff）之间批量转换，支持质量评估。

**适用场景**：
- 将 AI 生成的图片统一转换为特定格式（如全部转为 png 符合 PNG-24 规范）
- 在格式转换过程中评估图片质量损失，确保转换后的图片符合使用标准
- 支持递归处理子目录，保持原目录结构输出

**位置**：`frontend/scripts/convert_images.py`

**两种使用途径**：

| 途径 | 方式 | 适用场景 |
|------|------|----------|
| **交互式菜单** | 无参数运行 `python convert_images.py` | 新手友好，逐步引导配置 |
| **命令行参数** | 带参数运行 `-i` `-o` `-f` 等 | 脚本自动化，快速执行 |

#### 方式一：交互式菜单（推荐新手使用）

```bash
cd frontend/scripts/
python convert_images.py
```

进入后显示主菜单，可配置输入目录、输出目录、目标格式、质量参数，最后执行转换。

> 💡 **推荐交互流程**：`1.设置输入目录` → `3.选择目标格式(png)` → `5.预览配置` → `6.执行转换`

#### 方式二：命令行参数（推荐熟练用户和脚本化使用）

```bash
cd frontend/scripts/

# 将 stages 目录下所有图片转为 jpg
python convert_images.py -i ../public/assets/crops/stages -o ./converted -f jpg

# 指定质量和递归处理
python convert_images.py -i ./assets -o ./output -f jpg -q 90 --recursive

# 转为 png 格式（项目规范要求 PNG-24）
python convert_images.py -i ./crops -f png

# 跳过质量评估（加快速度）
python convert_images.py -i ./icons -f jpg --no-quality

# 设置质量阈值
python convert_images.py -i ./icons -f jpg -q 85 --threshold 0.90

# 生成详细日志
python convert_images.py -i ./stages -o ./converted -f jpg -v
```

**参数说明**：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-i, --input` | 输入目录路径（必填） | - |
| `-o, --output` | 输出目录路径 | `{input}_converted` |
| `-f, --format` | 目标格式：jpg/jpeg/png/webp/bmp/tiff | jpg |
| `-q, --quality` | JPEG/WEBP 质量参数 1-100 | 95 |
| `--threshold` | 质量阈值 0-1（SSIM 低于此值标记警告） | 0.85 |
| `--recursive` | 递归处理子目录 | 开启（默认） |
| `--no-recursive` | 禁止递归处理 | - |
| `--no-quality` | 跳过质量评估（加快速度） | - |
| `--report` | 转换报告输出路径 | output 目录下 |
| `-v, --verbose` | 详细输出 | - |

**支持格式对照**：

| 格式 | 扩展名 | 颜色模式 | 特点 |
|------|--------|----------|------|
| jpg/jpeg | `.jpg` | RGB | 有损压缩，体积小，推荐 |
| png | `.png` | RGBA | 无损压缩，支持透明通道 |
| webp | `.webp` | RGB | 新一代格式，兼顾体积和质量 |
| bmp | `.bmp` | RGB | 原始位图，体积大 |
| tiff | `.tiff` | RGB | 专业印刷格式 |

**质量评估体系**：

| 等级 | SSIM 范围 | 含义 |
|------|-----------|------|
| 优秀 | ≥ 0.95 | 转换质量极好，与原图几乎无差异 |
| 良好 | ≥ 0.85 | 转换质量良好，肉眼难以分辨差异 |
| 警告 | < 0.85 | 质量损失较大，建议调高质量参数 |

**注意事项**：

- ⚠️ **透明度丢失**：RGBA 图片转 jpg 会自动添加白色背景，透明通道会丢失
- ⚠️ **PNG 优化**：PNG 格式转换会自动启用无损优化压缩
- 💡 **推荐质量**：jpg 格式建议 quality ≥ 90 以保证游戏图标质量
- 💡 **体积优化**：如需减小体积，可降低 quality 到 85，配合质量阈值监控
- 💡 **报告生成**：转换完成后自动生成 `conversion_report.txt`，包含质量评估详情

**与重命名工具配合使用**：

```bash
cd frontend/scripts/

# 第一步：重命名为规范文件名
python rename_images_by_mtime.py --execute

# 第二步：批量转换格式
python convert_images.py -i ../public/assets/crops/stages -o ../public/assets/crops/stages -f jpg -q 95

# 第三步：查看转换报告
type conversion_report.txt  # Windows
# cat conversion_report.txt  # Mac/Linux
```

### 9.3 图片格式说明

生成的图片默认保存为 .jpg 格式，工具会根据实际内容智能选择合适的格式。

---

## 十、附录

### 10.1 与 v2.x 版本主要差异

- ✨ 平台从硅基流动迁移到火山引擎方舟
- 新增 ModelManager 类支持模型管理
- 新增 model-status.cjs 状态查看工具
- 新增 convert_images.py 格式转换工具
- 优化图片格式保存逻辑
