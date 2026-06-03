# 图标工具链

**文档版本：** v1.2.0
**最后更新：** 2026-05-30
**适用版本：** 开心农场 v4.71.7+

---

## 📋 总览

开心农场项目使用 AI 图像生成工具批量产出游戏图标，共 **640 张**。本页面介绍图标生成后的两个后期处理 Python 工具，以及它们与生成工具的配合流程。

| 工具 | 语言 | 功能 | 位置 |
|------|------|------|------|
| **rename_images_by_mtime.py** | Python 3.8+ | 按修改时间批量重命名为项目规范文件名 | `frontend/scripts/` |
| **convert_images.py** | Python 3.8+ | 批量格式转换 + 质量评估 | `frontend/scripts/` |
| **generate-icons/\*.cjs** | Node.js | AI 图像生成（批量调 API） | `frontend/scripts/generate-icons/` |

> 📖 生成工具完整文档：[generate-icons/README.md](../../frontend/scripts/generate-icons/README.md)

---

## 🔄 完整工作流

```
┌─────────────────────────────────────────────────────────────────┐
│  1. AI 生成 (generate-icons/*.cjs)                              │
│     └→ 640 张图片输出到 图片/ 文件夹（随机哈希文件名）              │
│                                                                 │
│  2. 重命名 (rename_images_by_mtime.py)                          │
│     └→ 按修改时间顺序重命名为规范文件名（如 1_stage_1.jpg）         │
│                                                                 │
│  3. 格式转换 (convert_images.py)                                │
│     └→ 统一转为目标格式（如 jpg），评估质量                       │
│                                                                 │
│  4. 部署 (复制到 frontend/public/assets/)                       │
│     └→ 图片就位，前端可引用                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏷️ 图片批量重命名工具

### 功能

将 AI 生成后存放在 `图片/` 文件夹中的 640 张随机命名图片，按**修改时间递增顺序**重命名为项目规范文件名。

### 核心原理

1. **扫描**：递归扫描 `图片/` 下所有子目录，识别 `.jpg/.png/.svg` 等格式
2. **排序**：按文件修改时间递增排序（时间相同按文件名排序）
3. **匹配**：排序后的文件与设计文档定义的 640 个目标文件名一一对应
4. **执行**：逐文件重命名，保留原扩展名和原子目录位置

### 命名顺序（640 张）

| 序号 | 数量 | 目标命名格式 | 来源 |
|------|------|-------------|------|
| 1-420 | 420 | `{id}_stage_{n}`（ID 1→84, stage 1→5） | 作物生长阶段设计规范 |
| 421-504 | 84 | `crop_{id}` | 作物成品图标 |
| 505-588 | 84 | `seed_{id}` | 种子图标 |
| 589-608 | 20 | `item_{id}` | 道具图标 |
| 609-616 | 8 | `land_{id}` | 土地图标 |
| 617-623 | 7 | `ui_button_{name}` | UI 按钮 |
| 624-627 | 4 | `ui_panel_{name}` | UI 面板 |
| 628-640 | 13 | `ui_{name}` | UI 通用元素 |

### 使用方法

两种使用途径，功能完全一致：

| 途径 | 方式 | 适用场景 |
|------|------|----------|
| **交互式菜单** | 无参数运行 `python rename_images_by_mtime.py` | 新手友好，逐步引导 |
| **命令行参数** | 带参数运行 `--preview` `--execute` 等 | 脚本自动化，快速执行 |

#### 交互式菜单

```bash
cd frontend/scripts/
python rename_images_by_mtime.py
```

进入后显示主菜单，通过编号选择功能：列出子目录→选择子目录→预览→执行。

#### 命令行参数

```bash
cd frontend/scripts/

# 列出所有子目录及文件统计
python rename_images_by_mtime.py --list

# 仅预览（安全，不修改文件）
python rename_images_by_mtime.py --preview

# 预览后确认执行
python rename_images_by_mtime.py --execute

# 跳过确认直接执行（谨慎！）
python rename_images_by_mtime.py --auto

# 指定图片目录 + 详细日志
python rename_images_by_mtime.py -d ./图片 --preview -v
```

### 子目录筛选（v2.1.0 新增）

```bash
# 仅处理指定子目录，避免跨子目录命名错位
python rename_images_by_mtime.py --subdir "基础作物" --preview

# 同时处理多个子目录
python rename_images_by_mtime.py --subdir "UI按钮" "UI面板" --execute
```

> 💡 **推荐流程**：`--list` 查看子目录 → `--subdir` 筛选单个子目录 → `--preview` 确认 → `--execute` 执行。逐个子目录处理，避免跨子目录命名错位。

### 生成的文件

| 文件 | 说明 |
|------|------|
| `rename_log.txt` | 详细操作日志（每条操作记录） |
| `rename_report.txt` | 操作汇总报告（成功/失败统计） |

### 注意事项

- ⚠️ 全量模式必须恰好包含 640 张图片，使用 `--subdir` 时仅校验所选子目录
- ⚠️ 依赖文件修改时间顺序，请勿手动修改时间戳
- ⚠️ 重命名为不可逆操作，建议先用 `--preview` 预览
- 💡 推荐逐个子目录处理：`--list` → `--subdir` → `--preview` → `--execute`
- 💡 文件保留在原子目录中，仅修改文件名

---

## 🔄 图片格式转换工具

### 功能

将图片在不同格式（jpg/png/webp/bmp/tiff）之间批量转换，支持 SSIM 质量评估。

### 支持格式

| 格式 | 扩展名 | 颜色模式 | 特点 |
|------|--------|----------|------|
| jpg/jpeg | `.jpg` | RGB | 有损压缩，体积小，推荐 |
| png | `.png` | RGBA | 无损压缩，支持透明通道 |
| webp | `.webp` | RGB | 新一代格式，兼顾体积和质量 |
| bmp | `.bmp` | RGB | 原始位图，体积大 |
| tiff | `.tiff` | RGB | 专业印刷格式 |

### 使用方法

两种使用途径，功能完全一致：

| 途径 | 方式 | 适用场景 |
|------|------|----------|
| **交互式菜单** | 无参数运行 `python convert_images.py` | 新手友好，逐步引导配置 |
| **命令行参数** | 带参数运行 `-i` `-o` `-f` 等 | 脚本自动化，快速执行 |

#### 交互式菜单

```bash
cd frontend/scripts/
python convert_images.py
```

进入后显示主菜单，可配置输入目录、输出目录、目标格式、质量参数，最后执行转换。

#### 命令行参数

```bash
cd frontend/scripts/

# 将 stages 目录下所有图片转为 jpg（质量 95）
python convert_images.py -i ../public/assets/crops/stages -o ../public/assets/crops/stages -f jpg -q 95

# 递归处理 + 生成详细报告
python convert_images.py -i ./icons -o ./output -f png -q 90 -v

# 跳过质量评估（加快速度）
python convert_images.py -i ./images -f jpg --no-quality
```

### 质量评估等级

| 等级 | SSIM 范围 | 含义 |
|------|-----------|------|
| 优秀 | ≥ 0.95 | 与原图几乎无差异 |
| 良好 | ≥ 0.85 | 肉眼难以分辨差异 |
| 警告 | < 0.85 | 质量损失较大，建议调高参数 |

### 注意事项

- ⚠️ RGBA(透明)图片转 jpg 会丢失透明通道，自动添加白色背景
- 💡 jpg 格式建议 `quality ≥ 90` 以保证游戏图标质量
- 💡 转换完成后自动生成 `conversion_report.txt`

---

## 🐍 环境要求

两个 Python 工具均使用 **Python 3.8+** 标准库，无需安装第三方依赖。

```bash
# 验证 Python 版本
python --version

# Windows 上如未安装 Python，访问：
# https://www.python.org/downloads/
```

---

## 📁 目标输出目录

重命名和格式转换完成后，将图片复制/移动到前端静态资源目录：

```
frontend/public/assets/
├── icons/
│   ├── crops/         # crop_1.jpg ~ crop_84.jpg
│   ├── seeds/         # seed_1.jpg ~ seed_84.jpg
│   ├── items/         # item_1.jpg ~ item_20.jpg
│   └── land/          # land_1.jpg ~ land_8.jpg
├── crops/stages/      # 1_stage_1.jpg ~ 84_stage_5.jpg
└── ui/                # ui_button_*.jpg, ui_panel_*.jpg, ui_*.jpg
```

---

## 📚 相关文档

- [图标生成工具完整指南](../../frontend/scripts/generate-icons/README.md)
