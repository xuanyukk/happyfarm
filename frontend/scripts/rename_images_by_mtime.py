#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文件名：rename_images_by_mtime.py
作者：开发者
日期：2026-05-30
版本：v2.3.0
功能描述：开心农场图片按子目录+修改时间顺序批量重命名工具
         - 交互式菜单模式：无参数运行进入菜单，引导用户逐步操作
         - 命令行模式：通过参数直接执行（--preview/--execute/--auto）
         - 按定义的子目录顺序处理，每个子目录内按 mtime 排序
         - 每个子目录匹配对应类别的目标命名（解决跨目录命名错位问题）
         - 支持 --list 列出所有子目录及文件统计
         - 支持 --subdir 单独选择子目录进行处理
         - 预览模式显示新旧文件名对应关系
         - 确认后执行重命名操作
         - 保留原文件扩展名（AI 生成通常为 .jpg，新增图片为 .png）
         - 生成完整的操作日志
         - 完善的错误处理和冲突检测

更新记录：
  2026-05-30 - v1.0.0 - 初始创建（全局 mtime 排序）
  2026-05-30 - v1.0.1 - 新增 PNG 格式转换提醒和工作流说明
  2026-05-30 - v2.0.0 - 重写为按子目录匹配模式，修复跨目录命名错位问题
                        - 新增 SUBDIR_ORDER 定义子目录处理顺序和目标命名映射
                        - 每个子目录独立扫描、独立排序、独立匹配目标命名
                        - 全局 640 文件检查 + 逐目录文件数校验
  2026-05-30 - v2.1.0 - 新增 --list 列出所有子目录、--subdir 按名称筛选子目录
  2026-05-30 - v2.2.0 - 新增交互式菜单模式：无参数运行进入交互式菜单，
                        提供子目录列表→选择→预览→执行的逐步引导流程，
                        两种途径（命令行参数 / 交互式菜单）功能一致
  2026-05-31 - v2.3.0 - 适配设计规范 v2.4.0 更新：
                        - 道具图标从 20 张扩展为 30 张（新增 item_21~item_30）
                        - 新增"空状态占位图"子目录（6 张：ui_empty_*）
                        - 期望总文件数从 640 更新为 656
                        - 新增图片为 PNG 格式，无需格式转换

依赖：Python 3.8+ 标准库（无外部依赖）

注意事项：
  - ⚠️ 重命名是不可逆操作，建议先使用 --preview 模式预览确认
  - ⚠️ 图片文件夹必须恰好包含 656 张图片，各子目录数量需与定义一致
  - ⚠️ 子目录名称必须与 SUBDIR_ORDER 中定义完全一致
  - ⚠️ 重命名后文件扩展名保持不变，非 PNG 文件需用 convert_images.py 转换
  - ⚠️ 道具图标 item_21~30 和空状态占位图为 PNG 格式，无需格式转换
  - 💡 两种使用途径：命令行参数直接执行 / 交互式菜单逐步操作（功能完全一致）
  - 💡 建议工作流：先用 --preview 预览 → 确认无误 → --execute 执行
  - 💡 与 convert_images.py 配合：先重命名再将非 PNG 文件转为 PNG-24 格式

项目格式要求：
  根据 RESOURCES_GUIDE.md 规范，所有游戏图标必须为 PNG-24 格式（透明背景）。
  AI 生成工具默认输出 .jpg 格式，因此完整工作流为：
    第一步：本工具重命名 → 1_stage_1.jpg, crop_1.jpg 等
    第二步：convert_images.py → 转为 1_stage_1.png, crop_1.png 等
  ⚠️ v2.3.0 新增的道具图标(item_21~30)和空状态占位图(6张)直接为 PNG 格式，
     跳过格式转换步骤。

设计文档参考：
  - docs/图标设计规范_作物生长阶段.md (420个阶段图命名)
  - docs/图标设计规范_作物种子道具土地UI.md (236个图标命名)
  - docs/提示词-Kolors开心农场基础作物生成工具.md
  - docs/提示词-FLUX开心农场特效作物生成工具.md
  - docs/提示词-Qwen开心农场UI图标生成工具.md

用法：
  交互式模式（无参数运行）：
    python rename_images_by_mtime.py            # 进入交互式菜单

  命令行模式：
    python rename_images_by_mtime.py --preview   # 仅预览，不执行
    python rename_images_by_mtime.py --execute   # 预览并确认后执行
    python rename_images_by_mtime.py --auto      # 跳过确认直接执行
    python rename_images_by_mtime.py --list      # 列出所有子目录
    python rename_images_by_mtime.py --subdir "基础作物" --preview
"""

import os
import sys
import logging
from datetime import datetime
from pathlib import Path
from collections import OrderedDict


# ============================================================================
# 配置常量
# ============================================================================

IMAGE_DIR = r"g:\youxi\ceshi\happy-farm\图片"

IMAGE_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".svg",
    ".webp", ".bmp", ".gif", ".tiff", ".ico",
}

LOG_FORMAT = "%(asctime)s [%(levelname)s] %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

EXPECTED_TOTAL_COUNT = 656


# ============================================================================
# 子目录映射：定义处理顺序、目标命名生成器、期望文件数
# ============================================================================

def _growth_names(start_id, end_id):
    """生成指定范围作物的生长阶段命名 (start_id_stage_1 ~ end_id_stage_5)"""
    names = []
    for crop_id in range(start_id, end_id + 1):
        for stage in range(1, 6):
            names.append("{0}_stage_{1}".format(crop_id, stage))
    return names


def _crop_icon_names(start_id, end_id):
    """生成指定范围的作物成品图标命名 (crop_start_id ~ crop_end_id)"""
    return ["crop_{0}".format(i) for i in range(start_id, end_id + 1)]


def _num_names(prefix, start_id, end_id):
    """生成数字后缀命名 (prefix_start_id ~ prefix_end_id)"""
    return ["{0}_{1}".format(prefix, i) for i in range(start_id, end_id + 1)]


# 子目录处理顺序（按设计文档规定的类别顺序）
# 每个元组: (子目录名, 目标命名生成函数, 期望文件数)
SUBDIR_ORDER = [
    # ===== 生长阶段图 (420张) =====
    # 来源：图标设计规范_作物生长阶段.md
    # 基础作物: 作物ID 1-15, 75张
    ("基础作物", lambda: _growth_names(1, 15), 75),
    # 经济作物: 作物ID 16-34, 95张
    ("经济作物", lambda: _growth_names(16, 34), 95),
    # 稀有紫色作物: 作物ID 35-44, 50张
    ("稀有紫色作物", lambda: _growth_names(35, 44), 50),
    # 稀有蓝色作物: 作物ID 45-54, 50张
    ("稀有蓝色作物", lambda: _growth_names(45, 54), 50),
    # 极稀有金色作物: 作物ID 55-74, 100张
    ("极稀有金色作物", lambda: _growth_names(55, 74), 100),
    # 顶级作物: 作物ID 75-84, 50张
    ("顶级作物", lambda: _growth_names(75, 84), 50),

    # ===== 作物成品图标 (84张) =====
    # 来源：图标设计规范_作物种子道具土地UI.md 第二章
    ("基础作物成品图标", lambda: _crop_icon_names(1, 15), 15),
    ("经济作物成品图标", lambda: _crop_icon_names(16, 34), 19),
    ("紫色稀有作物成品图标", lambda: _crop_icon_names(35, 44), 10),
    ("稀有蓝色作物成品图标", lambda: _crop_icon_names(45, 54), 10),
    ("极稀有金色作物成品图标", lambda: _crop_icon_names(55, 74), 20),
    ("顶级作物成品图标", lambda: _crop_icon_names(75, 84), 10),

    # ===== 种子图标 (84张) =====
    # 来源：图标设计规范_作物种子道具土地UI.md 第三章
    ("种子图标", lambda: _num_names("seed", 1, 84), 84),

    # ===== 道具图标 (30张) =====
    # 来源：图标设计规范_作物种子道具土地UI.md 第四章
    ("道具图标", lambda: _num_names("item", 1, 30), 30),

    # ===== 土地图标 (8张) =====
    # 来源：图标设计规范_作物种子道具土地UI.md 第五章
    ("土地图标", lambda: _num_names("land", 1, 8), 8),

    # ===== UI按钮 (7张) =====
    # 来源：图标设计规范_作物种子道具土地UI.md 第六章第1节
    ("UI按钮", lambda: [
        "ui_button_plant", "ui_button_harvest", "ui_button_water",
        "ui_button_fertilize", "ui_button_shop", "ui_button_bag",
        "ui_button_upgrade",
    ], 7),

    # ===== UI面板 (4张) =====
    # 来源：图标设计规范_作物种子道具土地UI.md 第六章第2节
    ("UI面板", lambda: [
        "ui_panel_main_bg", "ui_panel_crop_detail",
        "ui_panel_item_detail", "ui_panel_shop_bg",
    ], 4),

    # ===== UI通用元素 (12张) =====
    # 来源：图标设计规范_作物种子道具土地UI.md 第六章第3-4节
    ("UI通用元素", lambda: [
        "ui_icon_gold", "ui_icon_exp", "ui_icon_energy",
        "ui_icon_seed", "ui_bar_green", "ui_bar_yellow",
        "ui_frame_slot", "ui_frame_slot_selected",
        "ui_frame_land_empty", "ui_particle_sparkle",
        "ui_particle_leaf", "ui_overlay_locked",
    ], 12),

    # ===== UI徽章 (1张) =====
    ("UI徽章", lambda: ["ui_badge_quality"], 1),

    # ===== 空状态占位图 (6张) =====
    # 来源：图标设计规范_作物种子道具土地UI.md 第七章
    ("空状态占位图", lambda: [
        "ui_empty_seeds", "ui_empty_crops", "ui_empty_items",
        "ui_empty_events", "ui_empty_logs", "ui_empty_default",
    ], 6),
]


# ============================================================================
# 图片文件扫描器
# ============================================================================


def scan_subdir_files(subdir_path):
    """
    扫描单个子目录，获取所有图片文件并按修改时间排序

    :param subdir_path: 子目录完整路径
    :return: 按 mtime 递增排序的 (完整路径, 扩展名) 列表
    :raises FileNotFoundError: 子目录不存在
    :raises NotADirectoryError: 路径不是目录
    """
    path = Path(subdir_path)
    if not path.exists():
        raise FileNotFoundError("子目录不存在: {0}".format(subdir_path))
    if not path.is_dir():
        raise NotADirectoryError("路径不是目录: {0}".format(subdir_path))

    files = []
    for entry in path.iterdir():
        if entry.is_file():
            ext = entry.suffix.lower()
            if ext in IMAGE_EXTENSIONS:
                mtime = os.path.getmtime(str(entry))
                files.append((str(entry), mtime, ext))

    files.sort(key=lambda x: (x[1], x[0]))
    return [(f[0], f[2]) for f in files]


def scan_all_subdirs(image_dir, subdir_filter=None):
    """
    按 SUBDIR_ORDER 顺序扫描子目录，可选按名称过滤

    :param image_dir: 图片根目录路径
    :param subdir_filter: 要处理的子目录名列表，None 表示全部
    :return: {子目录名: [(文件路径, 扩展名), ...]} 的 OrderedDict
    """
    result = OrderedDict()

    # 过滤出需要处理的子目录
    if subdir_filter:
        selected = [
            (name, func, exp) for (name, func, exp) in SUBDIR_ORDER
            if name in subdir_filter
        ]
        not_found = [s for s in subdir_filter
                     if s not in [n for n, _, _ in SUBDIR_ORDER]]
        if not_found:
            raise ValueError(
                "未找到子目录: {0}".format(", ".join(not_found))
            )
    else:
        selected = SUBDIR_ORDER

    for subdir_name, _target_func, expected_count in selected:
        subdir_path = os.path.join(image_dir, subdir_name)
        files = scan_subdir_files(subdir_path)
        actual_count = len(files)

        if actual_count != expected_count:
            raise ValueError(
                "子目录 '{0}' 文件数({1})与期望({2})不匹配".format(
                    subdir_name, actual_count, expected_count
                )
            )

        result[subdir_name] = files

    return result


def count_total(all_files_by_subdir):
    """计算所有子目录的文件总数"""
    total = 0
    for files in all_files_by_subdir.values():
        total += len(files)
    return total


def list_subdirs(image_dir):
    """
    列出所有子目录名称、期望文件数、实际文件数

    :param image_dir: 图片根目录路径
    :return: 格式化的列表文本
    """
    lines = []
    lines.append("=" * 65)
    lines.append("  可用子目录列表")
    lines.append("=" * 65)
    lines.append(
        "{0:<3s} {1:<20s} {2:>8s} {3:>8s} {4:>6s}".format(
            "", "子目录名", "期望", "实际", "状态"
        )
    )
    lines.append("-" * 65)

    total_expected = 0
    total_actual = 0

    for i, (subdir_name, _target_func, expected_count) in enumerate(SUBDIR_ORDER):
        subdir_path = os.path.join(image_dir, subdir_name)
        path = Path(subdir_path)
        if path.exists() and path.is_dir():
            actual_count = len([
                f for f in path.iterdir()
                if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS
            ])
        else:
            actual_count = 0

        total_expected += expected_count
        total_actual += actual_count

        if actual_count == expected_count:
            status = "OK"
        elif actual_count == 0:
            status = "空"
        else:
            status = "差异"

        lines.append(
            "{0:>2d}. {1:<20s} {2:>6d}   {3:>6d}   {4:>4s}".format(
                i + 1, subdir_name, expected_count, actual_count, status
            )
        )

    lines.append("-" * 65)
    lines.append(
        "{0:<23s} {1:>6d}   {2:>6d}".format(
            "合计", total_expected, total_actual
        )
    )
    lines.append("=" * 65)
    lines.append("")
    lines.append("使用方式：")
    lines.append(
        "  python rename_images_by_mtime.py --subdir \"基础作物\" --preview"
    )
    lines.append(
        "  python rename_images_by_mtime.py --subdir \"UI按钮\" \"UI面板\" --execute"
    )
    return "\n".join(lines)


# ============================================================================
# 重命名引擎（v2.0：按子目录匹配）
# ============================================================================


class RenameEngine:
    """图片重命名引擎：按子目录分别处理，每个子目录内按 mtime 排序"""

    def __init__(self, image_dir, subdir_filter=None, logger=None):
        self.image_dir = image_dir
        self.subdir_filter = subdir_filter
        self.logger = logger or logging.getLogger(__name__)
        self.rename_plan = []
        self.selected_subdirs = []

    def prepare(self):
        """
        准备重命名计划：按子目录顺序扫描，生成新旧文件名映射

        :return: rename_plan 列表
        :raises ValueError: 文件总数或子目录文件数不匹配
        """
        self.logger.info("图片根目录: {0}".format(self.image_dir))

        # 扫描子目录（可选过滤）
        all_files = scan_all_subdirs(self.image_dir, self.subdir_filter)
        self.selected_subdirs = list(all_files.keys())
        total = count_total(all_files)

        # 计算期望文件数
        if self.subdir_filter:
            expected_total = sum(
                exp for name, _, exp in SUBDIR_ORDER
                if name in self.subdir_filter
            )
            self.logger.info(
                "已选择子目录: {0}".format(", ".join(self.selected_subdirs))
            )
        else:
            expected_total = EXPECTED_TOTAL_COUNT
            self.logger.info("子目录数量: {0}".format(len(SUBDIR_ORDER)))

        self.logger.info("实际图片总数: {0}".format(total))
        self.logger.info("期望图片总数: {0}".format(expected_total))

        if total != expected_total:
            raise ValueError(
                "图片总数({0})与期望({1})不匹配".format(
                    total, expected_total
                )
            )

        # 构建重命名计划
        self.rename_plan = []
        global_idx = 0

        selected_entries = [
            (n, f, e) for (n, f, e) in SUBDIR_ORDER
            if n in self.selected_subdirs
        ]

        for subdir_name, target_func, expected_count in selected_entries:
            target_names = target_func()
            files = all_files[subdir_name]

            self.logger.debug(
                "处理子目录: {0} ({1} 文件)".format(subdir_name, len(files))
            )

            for i, (src_path, ext) in enumerate(files):
                target_name = target_names[i]
                target_path = os.path.join(
                    os.path.dirname(src_path),
                    target_name + ext
                )
                global_idx += 1
                self.rename_plan.append((
                    src_path, target_path, ext, subdir_name
                ))

                self.logger.debug(
                    "  #{0} [{1}] {2} -> {3}".format(
                        global_idx,
                        subdir_name,
                        os.path.basename(src_path),
                        os.path.basename(target_path),
                    )
                )

        return self.rename_plan

    def preview(self):
        """
        显示重命名预览

        :return: 预览文本
        """
        if not self.rename_plan:
            raise RuntimeError("请先调用 prepare() 方法")

        lines = []
        lines.append("=" * 70)
        if self.subdir_filter:
            lines.append(
                "重命名预览 - {0} 个文件 ({1} 个子目录 已筛选)".format(
                    len(self.rename_plan), len(self.selected_subdirs)
                )
            )
            lines.append("已选择: {0}".format(", ".join(self.selected_subdirs)))
        else:
            lines.append(
                "重命名预览 - {0} 个文件 ({1} 个子目录)".format(
                    len(self.rename_plan), len(SUBDIR_ORDER)
                )
            )
        lines.append("=" * 70)

        current_subdir = None

        for i, (src_path, target_path, ext, subdir) in enumerate(self.rename_plan):
            # 子目录切换时打印分隔标题
            if subdir != current_subdir:
                current_subdir = subdir
                lines.append("")
                lines.append("--- {0} ---".format(subdir))
                lines.append(
                    "{0:<6s} {1:<40s} -> {2:s}".format(
                        "序号", "原文件名", "目标文件名"
                    )
                )
                lines.append("-" * 70)

            src_name = os.path.basename(src_path)
            target_name = os.path.basename(target_path)

            src_display = src_name if len(src_name) <= 38 else src_name[:35] + "..."
            target_display = (
                target_name if len(target_name) <= 38 else target_name[:35] + "..."
            )

            lines.append(
                "{0:<6d} {1:<40s} -> {2:s}".format(
                    i + 1, src_display, target_display
                )
            )

        lines.append("-" * 70)
        lines.append("")
        lines.append("--- 子目录统计 ---")
        dir_counts = OrderedDict()
        for _, _, _, subdir in self.rename_plan:
            dir_counts[subdir] = dir_counts.get(subdir, 0) + 1
        for dname, dcount in dir_counts.items():
            expected = None
            for sname, _, exp in SUBDIR_ORDER:
                if sname == dname:
                    expected = exp
                    break
            status = "ok" if dcount == expected else "MISMATCH"
            lines.append(
                "  {0}: {1} 张 (期望 {2}) [{3}]".format(
                    dname, dcount, expected, status
                )
            )

        if self.subdir_filter:
            lines.append("  筛选范围: {0}".format(", ".join(self.selected_subdirs)))

        lines.append("=" * 70)
        return "\n".join(lines)

    def execute(self):
        """
        执行实际的重命名操作

        :return: (成功数, 失败列表)
        """
        if not self.rename_plan:
            raise RuntimeError("请先调用 prepare() 方法")

        success_count = 0
        failures = []

        self.logger.info("开始执行重命名操作...")

        for i, (src_path, target_path, ext, subdir) in enumerate(self.rename_plan):
            try:
                if not os.path.exists(src_path):
                    raise FileNotFoundError(
                        "源文件不存在: {0}".format(src_path)
                    )

                if os.path.exists(target_path):
                    raise FileExistsError(
                        "目标文件已存在: {0}".format(target_path)
                    )

                os.rename(src_path, target_path)
                success_count += 1

                self.logger.info(
                    "[{0}/{1}] [{2}] {3} -> {4}".format(
                        i + 1,
                        len(self.rename_plan),
                        subdir,
                        os.path.basename(src_path),
                        os.path.basename(target_path),
                    )
                )

            except Exception as e:
                error_msg = (
                    "[{0}/{1}] [{2}] 失败: {3} -> {4}, 错误: {5}".format(
                        i + 1,
                        len(self.rename_plan),
                        subdir,
                        os.path.basename(src_path),
                        os.path.basename(target_path),
                        str(e),
                    )
                )
                failures.append(error_msg)
                self.logger.error(error_msg)

        return success_count, failures

    def generate_report(self, success_count, failures, report_path=None):
        """
        生成重命名操作报告

        :param success_count: 成功数
        :param failures: 失败列表
        :param report_path: 报告输出路径（可选）
        :return: 报告文本
        """
        total = len(self.rename_plan)
        failed_count = len(failures)

        lines = []
        lines.append("=" * 60)
        lines.append("图片重命名操作报告")
        lines.append("=" * 60)
        lines.append(
            "生成时间: {0}".format(
                datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )
        )
        lines.append("图片目录: {0}".format(self.image_dir))
        lines.append("脚本版本: v2.3.0 (按子目录匹配 + 交互式菜单)")
        lines.append("")
        lines.append("--- 操作统计 ---")
        lines.append("总文件数: {0}".format(total))
        lines.append("成功: {0}".format(success_count))
        lines.append("失败: {0}".format(failed_count))
        lines.append(
            "成功率: {0:.2f}%".format(
                success_count / total * 100 if total > 0 else 0
            )
        )

        # 按子目录统计
        dir_stats = OrderedDict()
        for _, _, _, subdir in self.rename_plan:
            dir_stats[subdir] = dir_stats.get(subdir, 0) + 1
        lines.append("")
        lines.append("--- 子目录分布 ---")
        for dname, dcount in dir_stats.items():
            expected = None
            for sname, _, exp in SUBDIR_ORDER:
                if sname == dname:
                    expected = exp
                    break
            lines.append(
                "  {0}: {1}/{2} 张".format(dname, dcount, expected)
            )

        if failures:
            lines.append("")
            lines.append("--- 失败详情 ---")
            for failure in failures:
                lines.append("  " + failure)

        # PNG 格式转换提醒
        non_png_files = []
        for src_path, target_path, ext, _ in self.rename_plan:
            if os.path.exists(target_path):
                actual_ext = os.path.splitext(target_path)[1].lower()
            else:
                actual_ext = ext
            if actual_ext != ".png":
                non_png_files.append(os.path.basename(target_path))

        if non_png_files:
            lines.append("")
            lines.append("--- PNG 格式转换提醒 ---")
            lines.append(
                "检测到 {0} 个文件非 PNG 格式，项目规范要求 PNG-24 格式。".format(
                    len(non_png_files)
                )
            )
            lines.append(
                "请使用 convert_images.py 批量转换："
            )
            lines.append(
                "  python convert_images.py -i {0} -o {0} -f png".format(
                    self.image_dir
                )
            )

        lines.append("")
        lines.append("=" * 60)

        report = "\n".join(lines)

        if report_path:
            try:
                os.makedirs(os.path.dirname(report_path), exist_ok=True)
                with open(report_path, "w", encoding="utf-8") as f:
                    f.write(report)
                self.logger.info("操作报告已保存至: {0}".format(report_path))
            except Exception as e:
                self.logger.warning("保存报告失败: {0}".format(e))

        return report


# ============================================================================
# 交互式菜单
# ============================================================================

def _print_banner():
    """打印工具横幅"""
    print("")
    print("=" * 56)
    print("  开心农场图片批量重命名工具  v2.3.0")
    print("  模式: 按子目录匹配 (修复跨目录命名错位)")
    print("=" * 56)


def _prompt_input(prompt, default=None):
    """
    获取用户输入，支持默认值

    :param prompt: 提示文本
    :param default: 默认值（可选）
    :return: 用户输入的字符串
    """
    if default is not None:
        result = input("{0} [{1}]: ".format(prompt, default)).strip()
        return result if result else str(default)
    return input("{0}: ".format(prompt)).strip()


def _menu_list_subdirs(image_dir):
    """菜单项：列出所有子目录"""
    print(list_subdirs(image_dir))
    input("按 Enter 返回主菜单...")


def _menu_select_subdir():
    """菜单项：选择要处理的子目录"""
    print("")
    valid_names = [name for name, _, _ in SUBDIR_ORDER]
    print("可选子目录:")
    for i, name in enumerate(valid_names, 1):
        print("  {0:>2d}. {1}".format(i, name))
    print("  0. 返回主菜单")
    print("")
    choice = _prompt_input("请输入编号（多个用逗号分隔，如 1,2,3，或输入 a 全选）", "a")
    if choice.strip() in ("0", ""):
        return None
    if choice.strip().lower() == "a":
        return None  # None 表示全选
    try:
        indices = [int(x.strip()) - 1 for x in choice.split(",")]
        selected = [valid_names[i] for i in indices
                    if 0 <= i < len(valid_names)]
        if not selected:
            print("未选择有效子目录，返回主菜单")
            return None
        return selected
    except (ValueError, IndexError):
        print("输入格式无效，返回主菜单")
        return None


def _menu_select_action():
    """菜单项：选择操作（预览/执行/自动）"""
    print("")
    print("可选操作:")
    print("  1. 仅预览 (--preview)    - 安全，不修改文件")
    print("  2. 预览并确认执行 (--execute) - 预览后输入 y 确认")
    print("  3. 直接执行 (--auto)     - 跳过确认，谨慎使用！")
    print("  0. 返回主菜单")
    print("")
    choice = _prompt_input("请选择操作", "1")
    if choice == "1":
        return "preview"
    elif choice == "2":
        return "execute"
    elif choice == "3":
        return "auto"
    else:
        return None


def _run_rename_flow(image_dir, subdir_filter, action, logger,
                     log_file, report_file):
    """
    执行重命名流程（命令行和交互式菜单共用）

    :param image_dir: 图片根目录
    :param subdir_filter: 子目录过滤器（None=全部）
    :param action: "preview" / "execute" / "auto"
    :param logger: logger 实例
    :param log_file: 日志文件路径
    :param report_file: 报告文件路径
    """
    logger.info("=" * 50)
    logger.info("开心农场图片批量重命名工具 v2.3.0")
    logger.info("模式: 按子目录匹配")
    if subdir_filter:
        logger.info("筛选: {0}".format(", ".join(subdir_filter)))
    logger.info("=" * 50)
    logger.info("图片目录: {0}".format(image_dir))

    engine = RenameEngine(image_dir, subdir_filter=subdir_filter,
                          logger=logger)

    try:
        engine.prepare()
    except ValueError as e:
        logger.error(str(e))
        logger.info("提示: 请确认图片目录结构与 SUBDIR_ORDER 定义一致")
        return False
    except FileNotFoundError as e:
        logger.error(str(e))
        return False
    except Exception as e:
        logger.error("准备重命名计划时异常: {0}".format(e))
        return False

    preview_text = engine.preview()
    print("\n" + preview_text + "\n")

    if action == "preview":
        logger.info("预览模式完成，未执行实际重命名")
        logger.info("使用 --execute 或交互式菜单执行重命名")
        logger.info("重命名完成后，非 PNG 文件请用 convert_images.py 转换格式：")
        logger.info(
            "  python convert_images.py -i {0} -o {0} -f png".format(
                image_dir
            )
        )
        logger.info(
            "  注意: 道具图标 item_21~30 和空状态占位图为 PNG 格式，无需转换"
        )
        return True

    if action == "execute":
        if not confirm_action("\n确认执行重命名操作？(y/n): "):
            logger.info("用户取消操作")
            return True

    logger.warning("自动模式：跳过确认直接执行")
    success_count, failures = engine.execute()
    report = engine.generate_report(success_count, failures, report_file)
    print("\n" + report)

    if failures:
        logger.warning(
            "重命名完成，{0} 个失败，详情: {1}".format(
                len(failures), report_file
            )
        )
        return False
    else:
        logger.info("全部 {0} 个文件重命名成功！".format(success_count))
        logger.info("报告已保存: {0}".format(report_file))
        logger.info("")
        logger.info("下一步：非 PNG 文件的格式转换")
        logger.info(
            "  python convert_images.py -i {0} -o {0} -f png".format(
                image_dir
            )
        )
        logger.info(
            "  注意: 道具图标 item_21~30 和空状态占位图为 PNG 格式，无需转换"
        )
        return True


def interactive_menu():
    """
    交互式菜单模式：无参数运行进入，引导用户逐步操作

    菜单结构：
      主菜单 → 1.列出子目录 / 2.选择子目录 / 3.预览 / 4.执行 / 5.直接执行 / 0.退出
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    log_file = os.path.join(script_dir, "rename_log.txt")
    report_file = os.path.join(script_dir, "rename_report.txt")
    logger = setup_logging(log_file)

    image_dir = IMAGE_DIR
    selected_subdirs = None  # None=全选

    while True:
        _print_banner()
        print("")
        print("  主菜单：")
        print("  {0:<2s}. {1:<28s} {2:s}".format(
            "1", "列出子目录 (--list)", "查看所有子目录及文件统计"
        ))
        print("  {0:<2s}. {1:<28s} {2:s}".format(
            "2", "选择子目录 (--subdir)", "按子目录名称筛选处理范围"
        ))
        filter_display = ", ".join(selected_subdirs) if selected_subdirs else "全部"
        print("  {0:<2s}. {1:<28s} {2:s}".format(
            "3", "预览重命名 (--preview)", "安全，仅显示映射关系"
        ))
        print("  {0:<2s}. {1:<28s} {2:s}".format(
            "4", "预览并确认执行 (--execute)", "预览后输入 y 确认执行"
        ))
        print("  {0:<2s}. {1:<28s} {2:s}".format(
            "5", "直接执行 (--auto)", "跳过确认，谨慎使用！"
        ))
        print("  {0:<2s}. {1:<28s} {2:s}".format(
            "0", "退出", ""
        ))
        print("-" * 56)
        print("  当前图片目录: {0}".format(image_dir))
        print("  当前子目录筛选: {0}".format(filter_display))
        print("-" * 56)

        choice = _prompt_input("请输入选项编号", "0").strip()

        if choice == "1":
            _menu_list_subdirs(image_dir)
        elif choice == "2":
            result = _menu_select_subdir()
            if result is not None:
                selected_subdirs = result
                if selected_subdirs:
                    print(
                        "已选择: {0} ({1} 个子目录)".format(
                            ", ".join(selected_subdirs),
                            len(selected_subdirs)
                        )
                    )
                else:
                    print("已选择: 全部子目录")
            input("按 Enter 继续...")
        elif choice == "3":
            _run_rename_flow(image_dir, selected_subdirs, "preview",
                             logger, log_file, report_file)
            input("\n按 Enter 返回主菜单...")
        elif choice == "4":
            _run_rename_flow(image_dir, selected_subdirs, "execute",
                             logger, log_file, report_file)
            input("\n按 Enter 返回主菜单...")
        elif choice == "5":
            confirm = input(
                "\n⚠️  警告: 将跳过预览直接执行重命名！\n"
                "确认直接执行？(y/n): "
            ).strip().lower()
            if confirm in ("y", "yes", "是"):
                _run_rename_flow(image_dir, selected_subdirs, "auto",
                                 logger, log_file, report_file)
            else:
                print("已取消")
            input("\n按 Enter 返回主菜单...")
        elif choice == "0":
            print("已退出，再见！")
            break
        else:
            print("无效选项，请重新选择")
            input("按 Enter 继续...")


def confirm_action(prompt="确认执行重命名操作？(y/n): "):
    """
    获取用户确认

    :param prompt: 确认提示文本
    :return: True 确认，False 取消
    """
    try:
        response = input(prompt).strip().lower()
        return response in ("y", "yes", "是")
    except (EOFError, KeyboardInterrupt):
        return False


def setup_logging(log_file=None):
    """
    配置日志系统

    :param log_file: 日志文件路径（可选）
    :return: logger 实例
    """
    logger = logging.getLogger("RenameEngine")
    logger.setLevel(logging.DEBUG)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(
        logging.Formatter(LOG_FORMAT, datefmt=LOG_DATE_FORMAT)
    )
    logger.addHandler(console_handler)

    if log_file:
        try:
            os.makedirs(os.path.dirname(log_file), exist_ok=True)
            file_handler = logging.FileHandler(log_file, encoding="utf-8")
            file_handler.setLevel(logging.DEBUG)
            file_handler.setFormatter(
                logging.Formatter(LOG_FORMAT, datefmt=LOG_DATE_FORMAT)
            )
            logger.addHandler(file_handler)
        except Exception as e:
            logger.warning("无法创建日志文件 {0}: {1}".format(log_file, e))

    return logger


# ============================================================================
# 主入口
# ============================================================================


def main():
    """主函数：命令行入口 / 交互式菜单入口"""
    import argparse

    parser = argparse.ArgumentParser(
        description="开心农场图片批量重命名工具 v2.3",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python rename_images_by_mtime.py                         # 交互式菜单模式
  python rename_images_by_mtime.py --list                  # 列出所有子目录
  python rename_images_by_mtime.py --preview               # 预览全部
  python rename_images_by_mtime.py --subdir "基础作物" --preview   # 仅预览基础作物
  python rename_images_by_mtime.py --subdir "UI按钮" "UI面板" --execute
  python rename_images_by_mtime.py --auto                  # 全部直接执行
        """,
    )

    parser.add_argument(
        "-d", "--dir",
        default=IMAGE_DIR,
        help="图片目录路径 (默认: {0})".format(IMAGE_DIR),
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="列出所有可用子目录及其文件统计信息",
    )
    parser.add_argument(
        "-s", "--subdir",
        nargs="+",
        default=None,
        metavar="名称",
        help="指定要处理的子目录名称（可多个，用空格分隔）",
    )
    parser.add_argument(
        "--preview",
        action="store_true",
        help="仅显示预览，不执行重命名",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="预览后等待确认再执行",
    )
    parser.add_argument(
        "--auto",
        action="store_true",
        help="跳过确认直接执行",
    )
    parser.add_argument(
        "--log",
        default=None,
        help="日志文件路径",
    )
    parser.add_argument(
        "--report",
        default=None,
        help="报告输出路径",
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="显示详细日志",
    )

    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    log_file = args.log or os.path.join(script_dir, "rename_log.txt")
    report_file = args.report or os.path.join(script_dir, "rename_report.txt")

    logger = setup_logging(log_file)
    if args.verbose:
        for handler in logger.handlers:
            if isinstance(handler, logging.StreamHandler):
                handler.setLevel(logging.DEBUG)

    action_count = sum([args.preview, args.execute, args.auto])

    # 无任何操作参数 → 进入交互式菜单模式
    if not args.list and action_count == 0:
        interactive_menu()
        return

    # --list 模式：列出所有子目录
    if args.list:
        print(list_subdirs(args.dir))
        if action_count == 0:
            return

    # 验证 --subdir 和 --list 可共存（list仅显示信息）
    if args.subdir and args.list and action_count == 0:
        return

    # 确定操作模式
    if action_count == 0:
        args.preview = True
    elif action_count > 1:
        logger.error("--preview, --execute, --auto 只能选择其中一个")
        sys.exit(1)

    # 校验 --subdir 参数
    if args.subdir:
        valid_names = {name for name, _, _ in SUBDIR_ORDER}
        invalid = [s for s in args.subdir if s not in valid_names]
        if invalid:
            logger.error(
                "无效的子目录名称: {0}".format(", ".join(invalid))
            )
            logger.info("使用 --list 查看所有可用子目录")
            sys.exit(1)

    # 确定操作类型
    if args.preview:
        action = "preview"
    elif args.execute:
        action = "execute"
    else:
        action = "auto"

    success = _run_rename_flow(
        args.dir, args.subdir, action, logger, log_file, report_file
    )
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()