#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文件名：convert_images.py
作者：开发者
日期：2026-05-29
版本：v1.2.0
功能描述：开心农场图片格式批量转换工具
          - 交互式菜单模式：无参数运行进入菜单，引导用户逐步操作
          - 命令行模式：通过参数直接执行
          - 支持文件夹级别递归处理
          - 命令行参数配置
          - 集成图片质量评估算法
          - 生成详细转换日志
          - 错误捕获与报告机制
          - 默认输出 PNG 格式（项目规范要求 PNG-24 透明背景）

更新记录：
  2026-05-29 - v1.0.0 - 初始创建
  2026-05-30 - v1.1.0 - 默认格式改为 PNG（匹配项目 PNG-24 规范要求），
                        清理 compute_psnr 重复代码
  2026-05-30 - v1.2.0 - 新增交互式菜单模式：无参数运行进入交互式菜单，
                        提供输入目录→输出目录→格式选择→质量配置→执行的逐步引导，
                        两种途径（命令行参数 / 交互式菜单）功能一致

依赖：Pillow>=10.0.0 (pip install Pillow)

用法：
  交互式模式（无参数运行）：
    python convert_images.py                     # 进入交互式菜单

  命令行模式：
    python convert_images.py -i ./stages -o ./converted           # 基本转换
    python convert_images.py -i ./stages -o ./converted -f png    # 指定输出为 PNG-24 格式
    python convert_images.py -i ./assets -o ./output -f jpg -q 95 --recursive  # 递归+高质量JPEG
    python convert_images.py -i ./crops --no-quality              # 跳过质量评估，加快速度
"""

import argparse
import logging
import os
import sys
import time
from datetime import datetime
from io import BytesIO
from pathlib import Path

# ============================================================================
# 质量评估模块
# ============================================================================


class ImageQualityAnalyzer:
    """图片质量分析器：评估转换前后质量损失"""

    @staticmethod
    def compute_psnr(img_a, img_b):
        """
        计算峰值信噪比(PSNR)
        返回值 >= 40: 优秀, >= 30: 良好, >= 20: 可接受, < 20: 较差
        """
        import math

        try:
            if img_a.size != img_b.size:
                return 0.0

            if img_a.mode == "RGBA":
                img_a = img_a.convert("RGB")
            if img_b.mode == "RGBA":
                img_b = img_b.convert("RGB")

            pixels_a = list(img_a.getdata())
            pixels_b = list(img_b.getdata())

            mse = 0.0
            for pa, pb in zip(pixels_a, pixels_b):
                for ca, cb in zip(pa, pb):
                    mse += (float(ca) - float(cb)) ** 2

            total_pixels = len(pixels_a) * len(pixels_a[0])
            mse = mse / total_pixels

            if mse == 0:
                return float("inf")

            return 10.0 * math.log10(255.0 ** 2 / mse)

        except Exception:
            return -1.0

    @staticmethod
    def compute_ssim(img_a, img_b):
        """
        计算结构相似性指数(SSIM)的简化版
        返回值 0.0-1.0, >= 0.95: 优秀, >= 0.85: 良好
        """
        try:
            if img_a.size != img_b.size:
                return 0.0

            if img_a.mode != "RGB":
                img_a = img_a.convert("RGB")
            if img_b.mode != "RGB":
                img_b = img_b.convert("RGB")

            pixels_a = list(img_a.getdata())
            pixels_b = list(img_b.getdata())
            total = len(pixels_a)

            diff_sum = 0.0
            for pa, pb in zip(pixels_a, pixels_b):
                diff = (
                    abs(pa[0] - pb[0])
                    + abs(pa[1] - pb[1])
                    + abs(pa[2] - pb[2])
                ) / (3.0 * 255.0)
                diff_sum += diff

            avg_diff = diff_sum / total
            return max(0.0, 1.0 - avg_diff)

        except Exception:
            return -1.0

    @staticmethod
    def compute_sharpness(img):
        """计算图片清晰度（拉普拉斯方差）"""
        import statistics

        try:
            if img.mode == "RGBA":
                img = img.convert("RGB")
            elif img.mode != "RGB":
                img = img.convert("RGB")

            width, height = img.size
            pixels = img.load()
            laplacian = []

            for y in range(1, height - 1):
                for x in range(1, width - 1):
                    center = sum(pixels[x, y]) / 3.0
                    up = sum(pixels[x, y - 1]) / 3.0
                    down = sum(pixels[x, y + 1]) / 3.0
                    left = sum(pixels[x - 1, y]) / 3.0
                    right = sum(pixels[x + 1, y]) / 3.0
                    lap = abs(4.0 * center - up - down - left - right)
                    laplacian.append(lap)

            if not laplacian:
                return 0.0

            return statistics.variance(laplacian)

        except Exception:
            return -1.0

    @staticmethod
    def evaluate(input_bytes, output_bytes):
        """综合质量评估"""
        from PIL import Image

        try:
            img_in = Image.open(BytesIO(input_bytes))
            img_out = Image.open(BytesIO(output_bytes))

            ssim = ImageQualityAnalyzer.compute_ssim(img_in, img_out)
            sharpness = ImageQualityAnalyzer.compute_sharpness(img_out)
            size_ratio = (
                len(output_bytes) / len(input_bytes) if len(input_bytes) > 0 else 1.0
            )

            grade = "优秀"
            issues = []

            if ssim >= 0.95:
                pass
            elif ssim >= 0.85:
                grade = "良好"
                issues.append("SSIM略低于优秀")
            else:
                grade = "警告"
                issues.append("SSIM偏低(>{})".format(round(ssim, 2)))

            if sharpness < 20:
                grade = "警告" if grade == "优秀" else grade
                issues.append("清晰度偏低")

            return {
                "ssim": round(ssim, 4),
                "sharpness": round(sharpness, 1),
                "size_ratio": round(size_ratio, 2),
                "grade": grade,
                "issues": issues,
            }

        except Exception as e:
            return {
                "ssim": -1,
                "sharpness": -1,
                "size_ratio": -1,
                "grade": "错误",
                "issues": [str(e)],
            }


# ============================================================================
# 格式转换核心
# ============================================================================


class ImageConverter:
    """图片格式转换器"""

    SUPPORTED_FORMATS = {
        "jpg": {"ext": ".jpg", "format": "JPEG", "mode": "RGB"},
        "jpeg": {"ext": ".jpg", "format": "JPEG", "mode": "RGB"},
        "png": {"ext": ".png", "format": "PNG", "mode": "RGBA"},
        "webp": {"ext": ".webp", "format": "WEBP", "mode": "RGB"},
        "bmp": {"ext": ".bmp", "format": "BMP", "mode": "RGB"},
        "tiff": {"ext": ".tiff", "format": "TIFF", "mode": "RGB"},
    }

    def __init__(self, target_format="png", quality=95, quality_threshold=0.85):
        """
        初始化转换器
        :param target_format: 目标格式 (png/jpg/webp/bmp/tiff, 默认 png)
        :param quality: 质量参数 (1-100, 仅对 JPEG/WEBP 有效)
        :param quality_threshold: 质量阈值 (0-1, SSIM 低于此值标记警告)
        """
        if target_format not in self.SUPPORTED_FORMATS:
            raise ValueError(
                "不支持的格式: {}. 支持: {}".format(
                    target_format, list(self.SUPPORTED_FORMATS.keys())
                )
            )

        self.target_format = target_format
        self.quality = quality
        self.quality_threshold = quality_threshold
        self.fmt_info = self.SUPPORTED_FORMATS[target_format]

    def convert_file(self, input_path, output_path, assess_quality=True):
        """
        转换单个文件
        :param input_path: 输入文件路径
        :param output_path: 输出文件路径
        :param assess_quality: 是否评估质量
        :return: (success, result_dict)
        """
        from PIL import Image

        result = {
            "input": str(input_path),
            "output": str(output_path),
            "input_size": 0,
            "output_size": 0,
            "dimensions": "",
            "quality": None,
            "success": False,
            "error": None,
        }

        try:
            with open(input_path, "rb") as f:
                input_bytes = f.read()
            result["input_size"] = len(input_bytes)

            img = Image.open(BytesIO(input_bytes))
            result["dimensions"] = "{}x{}".format(*img.size)

            if img.mode in ("RGBA", "LA", "P") and self.fmt_info["format"] == "JPEG":
                bg = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                bg.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
                img = bg
            elif img.mode != self.fmt_info["mode"]:
                img = img.convert(self.fmt_info["mode"])

            save_kwargs = {}
            if self.fmt_info["format"] == "JPEG":
                save_kwargs["quality"] = self.quality
                save_kwargs["optimize"] = True
                save_kwargs["progressive"] = True
            elif self.fmt_info["format"] == "PNG":
                save_kwargs["optimize"] = True
            elif self.fmt_info["format"] == "WEBP":
                save_kwargs["quality"] = self.quality

            output_buffer = BytesIO()
            img.save(output_buffer, format=self.fmt_info["format"], **save_kwargs)
            output_bytes = output_buffer.getvalue()

            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(output_bytes)

            result["output_size"] = len(output_bytes)
            result["success"] = True

            if assess_quality:
                result["quality"] = ImageQualityAnalyzer.evaluate(
                    input_bytes, output_bytes
                )

            return True, result

        except Exception as e:
            result["error"] = str(e)
            return False, result


# ============================================================================
# 批量处理器
# ============================================================================


class BatchProcessor:
    """批量图片处理器"""

    IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".gif"}

    def __init__(self, converter, recursive=True):
        self.converter = converter
        self.recursive = recursive
        self.logger = logging.getLogger(__name__)
        self.stats = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "skipped": 0,
            "start_time": None,
            "end_time": None,
            "total_input_size": 0,
            "total_output_size": 0,
        }
        self.results = []

    def _find_images(self, input_dir):
        """递归查找所有图片文件"""
        input_path = Path(input_dir)
        images = []

        if not input_path.exists():
            raise FileNotFoundError("输入目录不存在: {}".format(input_dir))

        pattern = "**/*" if self.recursive else "*"
        for file_path in input_path.glob(pattern):
            if file_path.is_file() and file_path.suffix.lower() in self.IMAGE_EXTENSIONS:
                images.append(file_path)

        return sorted(images)

    def _get_output_path(self, input_file, output_dir, input_dir):
        """计算输出文件路径"""
        input_path = Path(input_file)
        input_root = Path(input_dir)
        output_root = Path(output_dir)

        rel_path = input_path.relative_to(
            Path(os.path.abspath(input_dir))
        )

        new_name = input_path.stem + self.converter.fmt_info["ext"]
        output_path = output_root / rel_path.parent / new_name

        return str(output_path)

    def process(self, input_dir, output_dir):
        """
        批量处理目录中的图片
        :param input_dir: 输入目录
        :param output_dir: 输出目录
        :return: (success_count, fail_count, stats)
        """
        input_dir = os.path.abspath(input_dir)
        output_dir = os.path.abspath(output_dir)

        self.stats["start_time"] = time.time()

        try:
            images = self._find_images(input_dir)
        except FileNotFoundError as e:
            self.logger.error(str(e))
            return 0, 0, self.stats

        self.stats["total"] = len(images)
        self.logger.info("找到 {} 张图片".format(len(images)))

        for i, img_path in enumerate(images, 1):
            output_path = self._get_output_path(img_path, output_dir, input_dir)

            if os.path.exists(output_path):
                self.logger.debug(
                    "[{}/{}] 跳过(已存在): {}".format(i, len(images), img_path.name)
                )
                self.stats["skipped"] += 1
                continue

            self.logger.info(
                "[{}/{}] 转换: {} -> {}".format(
                    i, len(images), img_path.name, self.converter.target_format.upper()
                )
            )

            success, result = self.converter.convert_file(
                str(img_path), output_path
            )

            self.results.append(result)

            if success:
                self.stats["success"] += 1
                self.stats["total_input_size"] += result["input_size"]
                self.stats["total_output_size"] += result["output_size"]
            else:
                self.stats["failed"] += 1
                self.logger.error("  失败: {}".format(result["error"]))

        self.stats["end_time"] = time.time()
        return self.stats["success"], self.stats["failed"], self.stats

    def generate_report(self, report_path=None):
        """生成转换报告"""
        duration = self.stats["end_time"] - self.stats["start_time"]
        total_mb_in = self.stats["total_input_size"] / (1024 * 1024)
        total_mb_out = self.stats["total_output_size"] / (1024 * 1024)
        savings = (
            (1 - total_mb_out / total_mb_in) * 100 if total_mb_in > 0 else 0
        )

        quality_summary = {"优秀": 0, "良好": 0, "警告": 0, "错误": 0}
        for r in self.results:
            if r.get("quality") and r["quality"].get("grade"):
                grade = r["quality"]["grade"]
                quality_summary[grade] = quality_summary.get(grade, 0) + 1

        lines = [
            "=" * 60,
            "图片格式转换报告",
            "=" * 60,
            "生成时间: {}".format(datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
            "耗时: {:.1f} 秒".format(duration),
            "目标格式: {}".format(self.converter.target_format.upper()),
            "",
            "--- 转换统计 ---",
            "总文件数: {}".format(self.stats["total"]),
            "成功: {}".format(self.stats["success"]),
            "失败: {}".format(self.stats["failed"]),
            "跳过: {}".format(self.stats["skipped"]),
            "",
            "--- 存储统计 ---",
            "输入总大小: {:.2f} MB".format(total_mb_in),
            "输出总大小: {:.2f} MB".format(total_mb_out),
            "空间节省: {:.1f}%".format(savings),
            "",
            "--- 质量评估 ---",
            "优秀: {} 张".format(quality_summary.get("优秀", 0)),
            "良好: {} 张".format(quality_summary.get("良好", 0)),
            "警告: {} 张".format(quality_summary.get("警告", 0)),
            "错误: {} 张".format(quality_summary.get("错误", 0)),
            "",
        ]

        if self.stats["failed"] > 0:
            lines.append("--- 失败详情 ---")
            for r in self.results:
                if not r["success"]:
                    lines.append(
                        "  {}: {}".format(r["input"], r["error"])
                    )
            lines.append("")

        lines.append("--- 质量警告详情 ---")
        warning_count = 0
        for r in self.results:
            if (
                r.get("quality")
                and r["quality"].get("grade") in ("警告", "错误")
            ):
                warning_count += 1
                q = r["quality"]
                issues = ", ".join(q.get("issues", []))
                lines.append(
                    "  {}: SSIM={}, 清晰度={}, 问题=[{}]".format(
                        r["input"], q["ssim"], q["sharpness"], issues
                    )
                )

        if warning_count == 0:
            lines.append("  无质量警告")

        lines.append("")
        lines.append("=" * 60)

        report = "\n".join(lines)

        if report_path:
            os.makedirs(os.path.dirname(report_path), exist_ok=True)
            with open(report_path, "w", encoding="utf-8") as f:
                f.write(report)

        return report


# ============================================================================
# 命令行入口
# ============================================================================


def _print_convert_banner():
    """打印转换工具横幅"""
    print("")
    print("=" * 56)
    print("  开心农场图片格式批量转换工具  v1.2.0")
    print("  默认输出 PNG-24 格式（项目规范要求）")
    print("=" * 56)


def _prompt_convert_input(prompt, default=None):
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


def _run_convert_flow(input_dir, output_dir, target_format, quality,
                      threshold, recursive, assess_quality, report_path,
                      logger):
    """
    执行转换流程（命令行和交互式菜单共用）

    :param input_dir: 输入目录
    :param output_dir: 输出目录
    :param target_format: 目标格式
    :param quality: 质量参数
    :param threshold: 质量阈值
    :param recursive: 是否递归
    :param assess_quality: 是否评估质量
    :param report_path: 报告路径
    :param logger: logger 实例
    :return: True 成功, False 失败
    """
    logger.info("=" * 50)
    logger.info("开心农场图片格式批量转换工具 v1.2.0")
    logger.info("=" * 50)
    logger.info("输入目录: {}".format(input_dir))
    logger.info("输出目录: {}".format(output_dir))
    logger.info("目标格式: {}".format(target_format.upper()))
    logger.info("质量参数: {}".format(quality))
    logger.info("质量阈值: {}".format(threshold))
    logger.info("递归处理: {}".format("是" if recursive else "否"))
    logger.info("质量评估: {}".format("否" if not assess_quality else "是"))
    logger.info("")

    try:
        converter = ImageConverter(
            target_format=target_format,
            quality=quality,
            quality_threshold=threshold,
        )

        processor = BatchProcessor(converter, recursive=recursive)
        success, failed, stats = processor.process(input_dir, output_dir)

        report = processor.generate_report(report_path)
        print("\n" + report)

        if failed > 0:
            logger.warning(
                "{} 张图片转换失败，详情见报告: {}".format(failed, report_path)
            )
            return False
        else:
            logger.info("所有图片转换完成!")
            return True

    except KeyboardInterrupt:
        logger.warning("用户中断操作")
        return False
    except Exception as e:
        logger.error("转换过程异常: {}".format(e))
        return False


def interactive_menu():
    """
    交互式菜单模式：无参数运行进入，引导用户逐步操作

    菜单结构：
      主菜单 → 设置输入目录/输出目录/格式/质量 → 执行转换 → 退出
    """
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )
    logger = logging.getLogger(__name__)

    default_input = r"g:\youxi\ceshi\happy-farm\图片"
    input_dir = default_input
    output_dir = ""
    target_format = "png"
    quality = 95
    threshold = 0.85
    recursive = True
    assess_quality = True

    valid_formats = list(ImageConverter.SUPPORTED_FORMATS.keys())

    while True:
        _print_convert_banner()
        print("")
        print("  当前配置：")
        print("    输入目录: {0}".format(input_dir))
        print("    输出目录: {0}".format(
            output_dir if output_dir else "{0}_converted".format(input_dir)
        ))
        print("    目标格式: {0}".format(target_format.upper()))
        print("    质量参数: {0}".format(quality))
        print("    质量阈值: {0}".format(threshold))
        print("    递归处理: {0}".format("是" if recursive else "否"))
        print("    质量评估: {0}".format("是" if assess_quality else "否"))
        print("-" * 56)
        print("")
        print("  主菜单：")
        print("  1. 设置输入目录   (-i)")
        print("  2. 设置输出目录   (-o)")
        print("  3. 选择目标格式  (-f)")
        print("  4. 质量参数配置   (-q / --threshold / --no-quality)")
        print("  5. 预览配置")
        print("  6. 执行转换")
        print("  0. 退出")
        print("-" * 56)

        choice = _prompt_convert_input("请输入选项编号", "0").strip()

        if choice == "1":
            new_input = _prompt_convert_input(
                "输入图片目录路径", input_dir
            )
            if os.path.isdir(new_input):
                input_dir = new_input
                print("已设置输入目录: {0}".format(input_dir))
            else:
                print("⚠️  目录不存在: {0}".format(new_input))
            input("\n按 Enter 返回主菜单...")

        elif choice == "2":
            new_output = _prompt_convert_input(
                "输出目录路径（留空则自动设为 input_converted）",
                output_dir if output_dir else ""
            )
            output_dir = new_output if new_output else ""
            print("已设置输出目录: {0}".format(
                output_dir if output_dir else "自动 ({0}_converted)".format(input_dir)
            ))
            input("\n按 Enter 返回主菜单...")

        elif choice == "3":
            print("")
            print("可选格式:")
            for i, fmt in enumerate(valid_formats, 1):
                info = ImageConverter.SUPPORTED_FORMATS[fmt]
                print("  {0}. {1:<6s} ({2})".format(
                    i, fmt.upper(), info["mode"]
                ))
            print("")
            fmt_choice = _prompt_convert_input(
                "选择格式编号（默认 png）", "png"
            )
            if fmt_choice.isdigit():
                idx = int(fmt_choice) - 1
                if 0 <= idx < len(valid_formats):
                    target_format = valid_formats[idx]
            elif fmt_choice.lower() in valid_formats:
                target_format = fmt_choice.lower()
            else:
                target_format = "png"
            print("已选择格式: {0}".format(target_format.upper()))
            input("\n按 Enter 返回主菜单...")

        elif choice == "4":
            print("")
            print("质量配置:")
            print("  当前质量参数: {0}".format(quality))
            print("  当前质量阈值: {0}".format(threshold))
            print("  当前质量评估: {0}".format("开启" if assess_quality else "关闭"))
            print("")
            q = _prompt_convert_input(
                "质量参数 1-100 (仅JPEG/WEBP有效)", str(quality)
            )
            try:
                quality = max(1, min(100, int(q)))
            except ValueError:
                pass
            t = _prompt_convert_input(
                "质量阈值 0-1 (SSIM低于此值警告)", str(threshold)
            )
            try:
                threshold = max(0.0, min(1.0, float(t)))
            except ValueError:
                pass
            aq = _prompt_convert_input(
                "开启质量评估？(y/n)", "y"
            )
            assess_quality = aq.lower() in ("y", "yes", "是")
            r = _prompt_convert_input(
                "递归处理子目录？(y/n)", "y"
            )
            recursive = r.lower() in ("y", "yes", "是")
            print("配置已更新")
            input("\n按 Enter 返回主菜单...")

        elif choice == "5":
            print("")
            print("=" * 56)
            print("  当前转换配置预览")
            print("=" * 56)
            print("  输入目录: {0}".format(input_dir))
            print("  输出目录: {0}".format(
                output_dir if output_dir else "{0}_converted".format(input_dir)
            ))
            print("  目标格式: {0}".format(target_format.upper()))
            print("  质量参数: {0}".format(quality))
            print("  质量阈值: {0}".format(threshold))
            print("  递归处理: {0}".format("是" if recursive else "否"))
            print("  质量评估: {0}".format("是" if assess_quality else "否"))
            print("=" * 56)
            if target_format == "png":
                print("  💡 PNG 格式符合项目 PNG-24 规范要求")
            input("\n按 Enter 返回主菜单...")

        elif choice == "6":
            if not os.path.isdir(input_dir):
                print("⚠️  输入目录不存在: {0}".format(input_dir))
                input("\n按 Enter 返回主菜单...")
                continue

            resolved_output = output_dir if output_dir else "{}_converted".format(input_dir)
            script_dir = os.path.dirname(os.path.abspath(__file__))
            report_path = os.path.join(
                script_dir, "conversion_report.txt"
            )

            print("")
            print("即将执行转换：")
            print("  {0} → {1}".format(input_dir, resolved_output))
            print("  格式: {0}".format(target_format.upper()))
            confirm = _prompt_convert_input(
                "确认执行转换？(y/n)", "y"
            )
            if confirm.lower() in ("y", "yes", "是"):
                _run_convert_flow(
                    input_dir, resolved_output, target_format,
                    quality, threshold, recursive, assess_quality,
                    report_path, logger
                )
            else:
                print("已取消")
            input("\n按 Enter 返回主菜单...")

        elif choice == "0":
            print("已退出，再见！")
            break

        else:
            print("无效选项，请重新选择")
            input("按 Enter 继续...")


def main():
    """主函数：命令行入口 / 交互式菜单入口"""
    parser = argparse.ArgumentParser(
        description="开心农场图片格式批量转换工具 v1.2",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python convert_images.py                          # 交互式菜单模式
  python convert_images.py -i ./stages -o ./converted
  python convert_images.py -i ./stages -o ./converted -f png
  python convert_images.py -i ./assets -o ./output -f jpg -q 95 --recursive
  python convert_images.py -i ./crops --no-quality

项目规范：所有游戏图标使用 PNG-24 格式（透明背景），默认输出 PNG。
如需转为 jpg（减小体积），使用 -f jpg 指定。
        """,
    )

    parser.add_argument(
        "-i", "--input", default=None, help="输入目录路径"
    )
    parser.add_argument(
        "-o", "--output", help="输出目录路径 (默认: input_converted)"
    )
    parser.add_argument(
        "-f",
        "--format",
        default="png",
        choices=list(ImageConverter.SUPPORTED_FORMATS.keys()),
        help="目标格式 (默认: png, 项目规范 PNG-24)",
    )
    parser.add_argument(
        "-q",
        "--quality",
        type=int,
        default=95,
        help="JPEG/WEBP 质量参数 1-100 (PNG 格式下忽略, 默认: 95)",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.85,
        help="质量阈值 (默认: 0.85)",
    )
    parser.add_argument(
        "--recursive",
        action="store_true",
        default=True,
        help="递归处理子目录 (默认: 开启)",
    )
    parser.add_argument(
        "--no-recursive", action="store_true", help="禁止递归"
    )
    parser.add_argument(
        "--no-quality",
        action="store_true",
        help="跳过质量评估 (加快速度)",
    )
    parser.add_argument(
        "--report",
        help="转换报告输出路径 (默认: output目录下的conversion_report.txt)",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="详细输出",
    )

    args = parser.parse_args()

    # 无输入目录 → 进入交互式菜单模式
    if not args.input:
        interactive_menu()
        return

    output_dir = args.output or "{}_converted".format(args.input)
    recursive = not args.no_recursive
    assess_quality = not args.no_quality

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )

    logger = logging.getLogger(__name__)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    report_path = args.report or os.path.join(
        script_dir, "conversion_report.txt"
    )

    success = _run_convert_flow(
        args.input, output_dir, args.format, args.quality,
        args.threshold, recursive, assess_quality, report_path, logger
    )
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()