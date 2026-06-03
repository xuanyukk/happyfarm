# -*- coding: utf-8 -*-
"""
文件名：start.py
作者：开发者
日期：2026-05-23
版本：v4.63.1
功能描述：开心农场统一部署管理工具，支持 Docker 和生产环境部署
         与本地开发环境部署，提供交互式菜单和完善的日志记录功能
更新记录：
  2026-05-23 - v4.63.0 - 初始版本，整合 Docker/本地部署功能
  2026-05-27 - v4.63.0 - 添加日志系统、进度提示、命令输出捕获
  2026-05-27 - v4.63.0 - 日志消息中英双语化，部署信息中文提示
  2026-05-28 - v4.63.0 - 修复日志文件名秒级冲突问题（微秒+PID确保唯一）
  2026-05-28 - v4.63.1 - 日志系统全面升级：日志轮转清理、JSON结构化输出、级别分离
"""

import os
import sys
import subprocess
import time
import shutil
import json
import glob
from datetime import datetime

# 导入本地部署工具模块
try:
    from local_deploy import run_local_deploy_tool
    _has_local_deploy = True
except ImportError:
    _has_local_deploy = False

# ── 全局常量 ──────────────────────────────────────────────

ROOT = os.path.dirname(os.path.abspath(__file__))
IS_WIN = os.name == "nt"
LOG_DIR = os.path.join(ROOT, "logs")

# ── 日志保留策略 ──────────────────────────────────────────
LOG_RETENTION_DAYS = 30        # 部署日志保留 30 天
LOG_JSON_ENABLED = True        # 是否生成 JSON 结构化日志
LOG_MAX_SIZE_MB = 10           # 单日志文件最大大小（MB），超过则触发轮转


def cleanup_old_logs(retention_days=LOG_RETENTION_DAYS):
    """清理超过 retention_days 天的旧日志文件"""
    if not os.path.isdir(LOG_DIR):
        return 0, 0
    cutoff = time.time() - retention_days * 86400
    deleted_count = 0
    deleted_size = 0
    for fpath in glob.glob(os.path.join(LOG_DIR, "deployment_*")):
        try:
            if os.path.getmtime(fpath) < cutoff:
                fsize = os.path.getsize(fpath)
                os.remove(fpath)
                deleted_count += 1
                deleted_size += fsize
        except OSError:
            pass
    return deleted_count, deleted_size


def format_log_size(bytes_val):
    """将字节数格式化为人类可读的大小"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_val < 1024:
            return f"{bytes_val:.1f} {unit}"
        bytes_val /= 1024
    return f"{bytes_val:.1f} TB"


# ╔══════════════════════════════════════════════════════════╗
# ║                    日志系统 (Logger)                      ║
# ╚══════════════════════════════════════════════════════════╝

class DeployLogger:
    """
    部署日志管理器（v2.0）
    功能：同时输出到控制台和日志文件（纯文本 + JSON 结构化），
          按时间戳/级别记录各阶段操作，自动轮转清理旧日志
    """

    def __init__(self, session_type):
        """
        初始化日志管理器

        参数:
            session_type: str - 会话类型标识
        """
        os.makedirs(LOG_DIR, exist_ok=True)

        # 启动时自动清理过期日志
        self._auto_cleanup()

        self.session_type = session_type
        self.start_time = datetime.now()
        self.stage_count = 0
        self.error_count = 0
        self.warn_count = 0
        self._header_written = False
        self._f = None
        self._json_f = None  # JSON 结构化日志句柄
        self._error_f = None  # 错误日志单独文件句柄
        self._json_entries = []  # JSON 条目缓冲

        # 微秒级时间戳 + 进程PID，确保唯一性
        ts_us = self.start_time.strftime("%Y%m%d_%H%M%S_%f")
        pid = os.getpid()
        base_name = f"deployment_{ts_us}_{pid}"
        self.log_filename = f"{base_name}.log"
        self.json_filename = f"{base_name}.json"
        self.error_filename = f"{base_name}_error.log"
        self.log_path = os.path.join(LOG_DIR, self.log_filename)
        self.json_path = os.path.join(LOG_DIR, self.json_filename)
        self.error_path = os.path.join(LOG_DIR, self.error_filename)

        # 打开文件句柄
        self._f = open(self.log_path, "w", encoding="utf-8")
        if LOG_JSON_ENABLED:
            self._json_f = open(self.json_path, "w", encoding="utf-8")
        self._error_f = open(self.error_path, "w", encoding="utf-8")
        self._write_header()

    def _auto_cleanup(self):
        """启动时自动清理过期日志"""
        deleted_count, deleted_size = cleanup_old_logs()
        if deleted_count > 0:
            print(f"  [日志清理] 已清理 {deleted_count} 个过期日志文件，"
                  f"释放 {format_log_size(deleted_size)} 空间")

    def _check_rotation(self):
        """检查日志文件大小，超过阈值则截断轮转"""
        try:
            if self._f and os.path.getsize(self.log_path) > LOG_MAX_SIZE_MB * 1024 * 1024:
                self._f.close()
                rotated = f"{self.log_path}.rotated"
                if os.path.exists(rotated):
                    os.remove(rotated)
                os.rename(self.log_path, rotated)
                self._f = open(self.log_path, "w", encoding="utf-8")
                self.info("日志文件达到轮转阈值，已创建新文件")
        except OSError:
            pass

    def _write_header(self):
        """写入日志文件头部信息（仅写入一次，幂等安全）"""
        if self._header_written:
            return
        self._header_written = True

        sep = "=" * 72 + "\n"
        header = sep
        header += "  Happy Farm Deploy Log / 开心农场部署日志\n"
        header += sep
        header += f"  Session     : {self.session_type}\n"
        header += f"  Start Time  : {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}\n"
        header += f"  Log File    : {self.log_filename}\n"
        header += f"  JSON File   : {self.json_filename}\n"
        header += f"  Error File  : {self.error_filename}\n"
        header += f"  Platform    : {'Windows' if IS_WIN else 'Linux/Mac'}\n"
        header += f"  Work Dir    : {ROOT}\n"
        header += sep

        self._f.write(header)
        self._f.flush()
        # 错误文件也写一份头部
        self._error_f.write(header)
        self._error_f.flush()
        print()
        print(header.rstrip())

    def _format_msg(self, level, msg):
        """格式化日志消息"""
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return f"[{ts}] [{level:5s}] {msg}"

    def _make_json_entry(self, level, msg):
        """创建 JSON 结构化日志条目"""
        return {
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "message": msg,
            "stage": self.stage_count,
        }

    def _write(self, level, msg):
        """写入日志（文件 + 控制台 + 错误文件）"""
        line = self._format_msg(level, msg)
        self._f.write(line + "\n")
        self._f.flush()

        # 错误/警告级别同时写入错误专属文件
        if level in ("ERROR", "WARN"):
            self._error_f.write(line + "\n")
            self._error_f.flush()

        # JSON 结构化输出
        if LOG_JSON_ENABLED and self._json_f:
            entry = self._make_json_entry(level, msg)
            self._json_entries.append(entry)
            self._json_f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            self._json_f.flush()

        # 控制台输出（带中文标识）
        console_map = {
            "ERROR": ("[错误]", ""),
            "WARN": ("[警告]", ""),
            "STEP": (">>", ""),
            "DONE": ("[完成]", ""),
            "SKIP": ("[跳过]", ""),
            "CMD": ("$", ""),
        }
        prefix, suffix = console_map.get(level, ("", ""))
        if prefix:
            print(f"  {prefix} {msg}")
        else:
            print(f"  {msg}")

        # 轮转检查
        self._check_rotation()

    # ── 便捷日志方法 ──────────────────────────────────────

    def info(self, msg):
        self._write("INFO", msg)

    def warn(self, msg):
        self.warn_count += 1
        self._write("WARN", msg)

    def error(self, msg):
        self.error_count += 1
        self._write("ERROR", msg)

    def step(self, msg):
        self.stage_count += 1
        self._write("STEP", f"[阶段 {self.stage_count}] {msg}")

    def done(self, msg):
        self._write("DONE", msg)

    def skip(self, msg):
        self._write("SKIP", msg)

    def section(self, title):
        sep_str = "-" * 60
        self._write("INFO", sep_str)
        self._write("INFO", f"  {title}")
        self._write("INFO", sep_str)

    def command(self, cmd_str):
        self._write("CMD", cmd_str)

    def command_output(self, text):
        """记录命令输出（缩进格式）"""
        if not text:
            return
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for line in text.strip().split("\n"):
            out_line = f"[{ts}] [OUT  ]   | {line}\n"
            self._f.write(out_line)
        self._f.flush()

    def finish(self, success=True):
        """
        结束日志，写入摘要，关闭所有文件句柄

        参数:
            success: bool - 部署是否成功
        """
        end_time = datetime.now()
        elapsed = end_time - self.start_time
        status_text = "成功 SUCCESS" if success else "失败 FAILED"

        sep = "=" * 72 + "\n"
        footer = "\n"
        footer += sep
        footer += "  Deployment Summary / 部署摘要\n"
        footer += sep
        footer += f"  End Time    : {end_time.strftime('%Y-%m-%d %H:%M:%S')}\n"
        footer += f"  Elapsed     : {elapsed}\n"
        footer += f"  Stages      : {self.stage_count}\n"
        footer += f"  Errors      : {self.error_count}\n"
        footer += f"  Warnings    : {self.warn_count}\n"
        footer += f"  Status      : {status_text}\n"
        footer += sep

        self._f.write(footer)
        self._f.flush()
        self._error_f.write(footer)
        self._error_f.flush()
        print(footer.rstrip())

        # JSON 摘要
        if LOG_JSON_ENABLED and self._json_f:
            summary = {
                "type": "summary",
                "session_type": self.session_type,
                "start_time": self.start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "elapsed_seconds": elapsed.total_seconds(),
                "stages": self.stage_count,
                "errors": self.error_count,
                "warnings": self.warn_count,
                "status": "success" if success else "failed",
                "total_entries": len(self._json_entries),
            }
            self._json_f.write(json.dumps(summary, ensure_ascii=False) + "\n")
            self._json_f.flush()

        # 追加保存路径信息并关闭所有文件句柄
        saved_msg = self._format_msg("INFO", f"日志已保存至: {self.log_path}")
        self._f.write(saved_msg + "\n")
        self._f.flush()
        self._f.close()
        self._f = None

        if self._error_f:
            self._error_f.write(saved_msg + "\n")
            self._error_f.flush()
            self._error_f.close()
            self._error_f = None

        if self._json_f:
            self._json_f.close()
            self._json_f = None

        print(f"  [INFO] 主日志   : {self.log_path}")
        print(f"  [INFO] 错误日志 : {self.error_path}")
        if LOG_JSON_ENABLED:
            print(f"  [INFO] JSON日志 : {self.json_path}")


# ── 全局日志实例 ──────────────────────────────────────────
_logger = None


def set_logger(logger):
    global _logger
    _logger = logger


def log():
    return _logger


# ╔══════════════════════════════════════════════════════════╗
# ║                    工具函数                               ║
# ╚══════════════════════════════════════════════════════════╝

def clear():
    """清屏"""
    os.system("cls" if IS_WIN else "clear")


def pause():
    """暂停等待用户按键"""
    try:
        input("\n  按回车键继续... Press Enter to continue...")
    except (KeyboardInterrupt, EOFError):
        pass


def check_cmd(name):
    """
    检查命令是否可用

    参数:
        name: str - 命令名称
    返回:
        bool - 命令是否可用
    """
    path = shutil.which(name)
    if path:
        log().done(f"已找到 {name} -> {path}")
        return True
    else:
        log().error(f"未找到 {name}，请先安装")
        return False


def run_with_log(cmd_list, cwd=None, timeout=None):
    """
    执行命令并记录完整输出到日志

    参数:
        cmd_list: list[str] - 命令列表
        cwd: str | None - 工作目录
        timeout: int | None - 超时时间（秒）

    返回:
        subprocess.CompletedProcess - 命令执行结果
    """
    cmd_str = " ".join(cmd_list)
    log().command(cmd_str)

    # 解析 Windows 下 .cmd/.bat 文件的完整路径
    resolved = list(cmd_list)
    if IS_WIN:
        exe_path = shutil.which(cmd_list[0])
        if exe_path:
            resolved[0] = exe_path

    try:
        result = subprocess.run(
            resolved,
            cwd=cwd or ROOT,
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding="utf-8",
            errors="replace",
        )

        if result.stdout:
            log().command_output(result.stdout)
        if result.stderr:
            log().command_output(result.stderr)

        if result.returncode == 0:
            log().info(f"命令执行成功 (退出码: 0)")
        else:
            log().warn(f"命令执行完成 (退出码: {result.returncode})")

        return result

    except subprocess.TimeoutExpired:
        log().error(f"命令超时 ({timeout}秒): {cmd_str}")
        raise
    except Exception as e:
        log().error(f"命令执行异常: {cmd_str} | {str(e)}")
        raise


def run_simple(cmd_list, cwd=None):
    """执行命令（输出直接到控制台）"""
    log().command(" ".join(cmd_list))
    # Windows: resolve .cmd/.bat full path
    resolved = list(cmd_list)
    if IS_WIN:
        exe_path = shutil.which(cmd_list[0])
        if exe_path:
            resolved[0] = exe_path
    subprocess.run(resolved, cwd=cwd or ROOT)


# ╔══════════════════════════════════════════════════════════╗
# ║                 Docker 部署函数                            ║
# ╚══════════════════════════════════════════════════════════╝

def docker_deploy_production():
    """Docker 生产环境部署"""
    clear()
    logger = DeployLogger("Docker 生产环境部署")
    set_logger(logger)

    # ── 阶段一：环境检查 ───────────────────────────────────
    logger.section("阶段一：环境检查 Phase 1: Environment Check")
    logger.step("检查 Docker 安装...")
    if not check_cmd("docker"):
        logger.error(
            "未找到 Docker，请安装: https://www.docker.com/"
        )
        logger.finish(success=False)
        pause()
        return

    logger.step("检查 Docker Compose 安装...")
    if not check_cmd("docker-compose"):
        logger.error("未找到 Docker Compose，请先安装")
        logger.finish(success=False)
        pause()
        return

    logger.step("检查 Docker 守护进程状态...")
    result = run_with_log(["docker", "info"], timeout=15)
    if result.returncode != 0:
        logger.error("Docker 守护进程未运行，请先启动 Docker")
        logger.finish(success=False)
        pause()
        return
    logger.done("Docker 守护进程运行中")

    # ── 阶段二：配置文件准备 ───────────────────────────────
    logger.section("阶段二：配置准备 Phase 2: Configuration")
    logger.step("检查 .env 配置文件...")
    env_path = os.path.join(ROOT, ".env")
    env_example = os.path.join(ROOT, ".env.docker.example")

    if not os.path.exists(env_path):
        logger.warn("未找到 .env 文件")
        if os.path.exists(env_example):
            logger.step("从模板创建 .env 文件...")
            shutil.copy(env_example, env_path)
            logger.done(".env 已从模板创建")
            logger.info("默认凭据: PostgreSQL 用户=happy_farm, 密码=happy_farm_password")
        else:
            logger.error("模板文件 .env.docker.example 未找到!")
            logger.finish(success=False)
            pause()
            return
    else:
        logger.done(".env 文件已存在，使用当前配置")

    # ── 阶段三：构建与启动 ─────────────────────────────────
    logger.section("阶段三：构建与启动 Phase 3: Build & Start")
    logger.step("构建 Docker 镜像... (可能需要几分钟)")
    result = run_with_log(
        ["docker-compose", "build", "--no-cache"],
        timeout=600,
    )
    if result.returncode != 0:
        logger.error("Docker 镜像构建失败!")
        logger.finish(success=False)
        pause()
        return
    logger.done("Docker 镜像构建成功")

    logger.step("后台启动所有服务...")
    result = run_with_log(
        ["docker-compose", "up", "-d"],
        timeout=120,
    )
    if result.returncode != 0:
        logger.error("服务启动失败!")
        logger.finish(success=False)
        pause()
        return
    logger.done("所有服务已在后台启动")

    # ── 阶段四：健康检查 ───────────────────────────────────
    logger.section("阶段四：健康检查 Phase 4: Health Check")
    logger.step("等待 30 秒让服务初始化...")
    for i in range(30, 0, -1):
        print(f"  ... 剩余 {i:2d} 秒", end="\r")
        time.sleep(1)
    print("  " + " " * 25, end="\r")
    logger.done("等待完成")

    logger.step("检查容器运行状态...")
    result = run_with_log(["docker-compose", "ps"], timeout=30)
    if result.returncode != 0:
        logger.warn("无法获取容器状态")
    else:
        logger.done("容器状态已获取")

    show_deploy_info()


def docker_deploy_dev():
    """Docker 开发环境部署"""
    clear()
    logger = DeployLogger("Docker 开发环境部署")
    set_logger(logger)

    # ── 阶段一：环境检查 ───────────────────────────────────
    logger.section("阶段一：环境检查 Phase 1: Environment Check")
    logger.step("检查 Docker 安装...")
    if not check_cmd("docker"):
        logger.error("未找到 Docker")
        logger.finish(success=False)
        pause()
        return

    logger.step("检查 Docker Compose 安装...")
    if not check_cmd("docker-compose"):
        logger.error("未找到 Docker Compose")
        logger.finish(success=False)
        pause()
        return

    logger.step("检查开发环境 compose 文件...")
    dev_file = os.path.join(ROOT, "docker-compose.dev.yml")
    if not os.path.exists(dev_file):
        logger.warn("未找到 docker-compose.dev.yml，将使用默认配置")
    else:
        logger.done("已找到 docker-compose.dev.yml")

    # ── 阶段二：构建与启动 ─────────────────────────────────
    logger.section("阶段二：构建与启动 Phase 2: Build & Start")
    logger.step("构建开发环境 Docker 镜像...")
    cmd = (
        ["docker-compose", "-f", "docker-compose.dev.yml", "build"]
        if os.path.exists(dev_file)
        else ["docker-compose", "build"]
    )
    result = run_with_log(cmd, timeout=600)
    if result.returncode != 0:
        logger.error("开发镜像构建失败!")
        logger.finish(success=False)
        pause()
        return
    logger.done("开发镜像构建完成")

    logger.step("启动开发服务...")
    cmd = (
        ["docker-compose", "-f", "docker-compose.dev.yml",
         "up", "-d"]
        if os.path.exists(dev_file)
        else ["docker-compose", "up", "-d"]
    )
    result = run_with_log(cmd, timeout=120)
    if result.returncode != 0:
        logger.error("开发服务启动失败!")
        logger.finish(success=False)
        pause()
        return

    # ── 阶段三：等待就绪 ───────────────────────────────────
    logger.section("阶段三：等待就绪 Phase 3: Wait for Ready")
    logger.step("等待 15 秒让开发服务就绪...")
    time.sleep(15)
    logger.done("开发服务应已就绪")

    # ── 输出信息 ──────────────────────────────────────────
    clear()
    logger.section("开发环境已就绪 Dev Environment Ready")
    print()
    print("  ============================================================")
    print("  开发环境已启动! Dev Environment Started!")
    print("  ============================================================")
    print()
    print("  前端页面(热重载)  Frontend  : http://localhost:5173")
    print("  管理后台          Admin     : http://localhost:5173/admin")
    print("  后端接口          Backend   : http://localhost:3000")
    print("  接口文档          API Docs  : http://localhost:3000/api-docs")
    print()
    print("  默认账号  Account : admin / 123456")
    print("  PostgreSQL  DB      : happy_farm / happy_farm_password (端口 5433)")
    print("  ============================================================")

    logger.info("Dev 前端 : http://localhost:5173")
    logger.info("Dev 后端 : http://localhost:3000")
    logger.info("账号     : admin / 123456")
    logger.info("PostgreSQL  : happy_farm / happy_farm_password (端口 5433)")
    logger.finish(success=True)
    pause()


def show_deploy_info():
    """显示并记录部署完成信息"""
    logger = log()
    logger.section("部署完成 - 访问信息 Deployment Complete")

    print()
    print("  ============================================================")
    print("     部署完成! Deploy Complete!")
    print("  ============================================================")
    print()
    print("  ───── 访问地址 Access URLs ─────")
    print("  前端页面  Frontend   : http://localhost")
    print("  管理后台  Admin      : http://localhost/admin")
    print("  后端接口  Backend    : http://localhost:3000")
    print("  接口文档  API Docs   : http://localhost:3000/api-docs")
    print("  监控面板  Grafana    : http://localhost:3001")
    print("  文档网站  Docs Site  : http://localhost:8080")
    logger.info("前端    : http://localhost")
    logger.info("管理后台: http://localhost/admin")
    logger.info("后端    : http://localhost:3000")
    logger.info("接口文档: http://localhost:3000/api-docs")
    logger.info("Grafana : http://localhost:3001")
    logger.info("文档网站: http://localhost:8080")

    print()
    print("  ───── 功能页面 Pages ─────")
    print("  农场主页  Farm       : http://localhost")
    print("  商店      Shop       : http://localhost/shop")
    print("  背包      Inventory  : http://localhost/inventory")
    print("  货币日志  Currency   : http://localhost/currency-log")
    print("  队列管理  Queue      : http://localhost/queue-manager")
    logger.info("农场    : http://localhost")
    logger.info("商店    : http://localhost/shop")
    logger.info("背包    : http://localhost/inventory")
    logger.info("货币日志: http://localhost/currency-log")
    logger.info("队列管理: http://localhost/queue-manager")

    print()
    print("  ───── 默认账号 Accounts ─────")
    print("  系统管理员  Admin    : admin / 123456")
    print("  监控面板    Grafana   : admin / your_grafana_password")
    print("  PostgreSQL  DB      : happy_farm / happy_farm_password (端口 5433)")
    logger.info("系统管理员: admin / 123456")
    logger.info("Grafana   : admin / your_grafana_password")
    logger.info("PostgreSQL: happy_farm / happy_farm_password (端口 5433)")

    print()
    print("  ───── 项目信息 Project Info ─────")
    print("  数据库    Database   : PostgreSQL 16+")
    print("  缓存      Cache      : Redis")
    print("  监控      Monitoring : Loki + Grafana")
    print("  测试      Tests      : 前端 49 / 后端 255")
    logger.info("数据库: PostgreSQL 16+")
    logger.info("缓存: Redis, 监控: Loki + Grafana")

    print()
    print("  查看运行日志: python start.py -> [1] -> [4]")
    print("  ============================================================")

    logger.finish(success=True)
    pause()


# ── Docker 管理子菜单 ─────────────────────────────────────

def docker_menu():
    """Docker 部署管理子菜单"""
    while True:
        clear()
        print()
        print("  ============================================================")
        print("         Docker 部署管理 v4.63.0")
        print("  ============================================================")
        print()
        print("    [1] 部署生产环境 Deploy Production (含完整监控)")
        print()
        print("    [2] 启动开发环境 Start Dev Environment (热重载)")
        print()
        print("    [3] 查看服务状态 Check Status")
        print()
        print("    [4] 查看运行日志 View Logs (最近50行)")
        print()
        print("    [5] 重启所有服务 Restart All")
        print()
        print("    [6] 停止所有服务 Stop All")
        print()
        print("    [0] 返回 Back")
        print()
        print("  ============================================================")
        choice = input("  请输入选项 [0-6]: ").strip()

        if choice == "1":
            docker_deploy_production()
        elif choice == "2":
            docker_deploy_dev()
        elif choice == "3":
            run_simple(["docker-compose", "ps"])
            pause()
        elif choice == "4":
            run_simple(["docker-compose", "logs", "--tail=50"])
            pause()
        elif choice == "5":
            print("  正在重启所有服务...")
            subprocess.run(["docker-compose", "restart"], cwd=ROOT)
            print("  完成")
            pause()
        elif choice == "6":
            print("  正在停止所有服务...")
            subprocess.run(["docker-compose", "stop"], cwd=ROOT)
            print("  完成")
            pause()
        elif choice == "0":
            return
        else:
            print("  无效选项!")
            pause()


# ╔══════════════════════════════════════════════════════════╗
# ║                 本地部署函数                               ║
# ╚══════════════════════════════════════════════════════════╝

def local_check_deps():
    """检查本地开发依赖"""
    clear()
    logger = DeployLogger("本地部署 - 依赖检查")
    set_logger(logger)

    logger.section("阶段一：核心运行时 Phase 1: Core Runtime")
    logger.step("检查 Node.js 运行时...")
    node_ok = check_cmd("node")
    if node_ok:
        result = run_with_log(["node", "--version"])
        if result.stdout:
            logger.info(f"Node.js 版本: {result.stdout.strip()}")

    logger.step("检查 npm 包管理器...")
    npm_ok = check_cmd("npm")
    if npm_ok:
        result = run_with_log(["npm", "--version"])
        if result.stdout:
            logger.info(f"npm 版本: {result.stdout.strip()}")

    logger.section("阶段二：数据库与缓存 Phase 2: DB & Cache")
    logger.step("检查 PostgreSQL...")
    if check_cmd("psql"):
        result = run_with_log(["psql", "--version"], timeout=10)
        if result.stdout:
            logger.info(f"PostgreSQL: {result.stdout.strip()}")
    else:
        logger.warn("未找到 psql - PostgreSQL 可能未安装")

    logger.step("检查 Redis...")
    if check_cmd("redis-cli"):
        result = run_with_log(["redis-cli", "--version"], timeout=10)
        if result.stdout:
            logger.info(f"Redis: {result.stdout.strip()}")
    else:
        logger.warn("未找到 redis-cli - Redis 可能未安装")

    logger.section("检查摘要 Summary")
    if node_ok and npm_ok:
        logger.done("核心依赖就绪 (Node.js + npm)")
    else:
        logger.error("核心依赖缺失!")
    if not check_cmd("psql"):
        logger.warn("PostgreSQL: 请从 https://www.postgresql.org/ 安装")
    if not check_cmd("redis-cli"):
        logger.warn("Redis: 请从 https://redis.io/ 安装")

    logger.finish(success=node_ok and npm_ok)
    pause()


def local_init():
    """初始化本地项目"""
    clear()
    logger = DeployLogger("本地部署 - 项目初始化")
    set_logger(logger)

    # ── 阶段一：环境检查 ───────────────────────────────────
    logger.section("阶段一：环境检查 Phase 1: Environment Check")
    logger.step("检查 Node.js...")
    if not check_cmd("node"):
        logger.error("未找到 Node.js，请从 https://nodejs.org/ 安装")
        logger.finish(success=False)
        pause()
        return

    logger.step("检查 npm...")
    if not check_cmd("npm"):
        logger.error("未找到 npm")
        logger.finish(success=False)
        pause()
        return
    logger.done("环境检查通过")

    # ── 阶段二：配置文件准备 ───────────────────────────────
    logger.section("阶段二：配置准备 Phase 2: Configuration")
    logger.step("配置 backend/.env...")
    backend_env = os.path.join(ROOT, "backend", ".env")
    backend_example = os.path.join(ROOT, "backend", ".env.example")
    if not os.path.exists(backend_env):
        if os.path.exists(backend_example):
            shutil.copy(backend_example, backend_env)
            logger.done("backend/.env 已从模板创建")
        else:
            logger.warn("backend/.env.example 未找到，已跳过")
    else:
        logger.skip("backend/.env 已存在")

    logger.step("配置 frontend/.env...")
    frontend_env = os.path.join(ROOT, "frontend", ".env")
    frontend_example = os.path.join(ROOT, "frontend", ".env.example")
    if not os.path.exists(frontend_env):
        if os.path.exists(frontend_example):
            shutil.copy(frontend_example, frontend_env)
            logger.done("frontend/.env 已从模板创建")
        else:
            logger.warn("frontend/.env.example 未找到，已跳过")
    else:
        logger.skip("frontend/.env 已存在")

    # ── 阶段三：依赖安装 ───────────────────────────────────
    logger.section("阶段三：安装依赖 Phase 3: Install Dependencies")
    logger.step("安装后端依赖 (npm install)... (可能需要几分钟)")
    result = run_with_log(
        ["npm", "install"],
        cwd=os.path.join(ROOT, "backend"),
        timeout=300,
    )
    if result.returncode != 0:
        logger.error("后端依赖安装失败!")
        logger.finish(success=False)
        pause()
        return
    logger.done("后端依赖安装完成")

    logger.step("安装前端依赖 (npm install)... (可能需要几分钟)")
    result = run_with_log(
        ["npm", "install"],
        cwd=os.path.join(ROOT, "frontend"),
        timeout=300,
    )
    if result.returncode != 0:
        logger.error("前端依赖安装失败!")
        logger.finish(success=False)
        pause()
        return
    logger.done("前端依赖安装完成")

    # ── 完成 ──────────────────────────────────────────────
    logger.section("初始化完成 Init Complete")
    logger.info("下一步:")
    logger.info("  1. 启动 PostgreSQL 和 Redis 服务")
    logger.info("  2. 在本地菜单选择 [3] 启动服务")
    logger.info("  3. 或运行: python start.py -> [2] -> [3]")
    logger.finish(success=True)

    print("\n  初始化完成! Init complete!")
    print("  下一步: 启动 PostgreSQL 和 Redis，然后选择 [3] 启动服务")
    pause()


def local_start():
    """启动本地开发服务"""
    clear()
    logger = DeployLogger("本地部署 - 启动服务")
    set_logger(logger)

    backend_dir = os.path.join(ROOT, "backend")
    frontend_dir = os.path.join(ROOT, "frontend")

    # ── 阶段一：前置检查 ───────────────────────────────────
    logger.section("阶段一：前置检查 Phase 1: Pre-flight Checks")
    logger.step("检查后端依赖...")
    if not os.path.exists(os.path.join(backend_dir, "node_modules")):
        logger.error(
            "后端 node_modules 未找到，请先运行 [2] 初始化项目"
        )
        logger.finish(success=False)
        pause()
        return
    logger.done("后端依赖就绪")

    logger.step("检查前端依赖...")
    if not os.path.exists(os.path.join(frontend_dir, "node_modules")):
        logger.error(
            "前端 node_modules 未找到，请先运行 [2] 初始化项目"
        )
        logger.finish(success=False)
        pause()
        return
    logger.done("前端依赖就绪")

    logger.step("检查 PostgreSQL...")
    if check_cmd("psql"):
        logger.done("PostgreSQL 客户端可用")
    else:
        logger.warn("未找到 psql，请确保 PostgreSQL 已启动")

    logger.step("检查 Redis...")
    if check_cmd("redis-cli"):
        logger.done("Redis 客户端可用")
    else:
        logger.warn("未找到 redis-cli，请确保 Redis 已启动")

    # ── 阶段二：启动服务 ───────────────────────────────────
    logger.section("阶段二：启动服务 Phase 2: Start Services")
    logger.step("启动后端服务...")
    if IS_WIN:
        subprocess.Popen(
            ["cmd", "/c", "start", "cmd", "/k",
             f"cd /d {backend_dir} && npm run dev"],
            cwd=backend_dir,
        )
    else:
        subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=backend_dir,
            start_new_session=True,
        )
    logger.done("后端在新窗口中启动")
    logger.info("等待 3 秒后启动前端...")
    time.sleep(3)

    logger.step("启动前端服务...")
    if IS_WIN:
        subprocess.Popen(
            ["cmd", "/c", "start", "cmd", "/k",
             f"cd /d {frontend_dir} && npm run dev"],
            cwd=frontend_dir,
        )
    else:
        subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=frontend_dir,
            start_new_session=True,
        )
    logger.done("前端在新窗口中启动")

    # ── 输出信息 ──────────────────────────────────────────
    logger.section("本地服务已启动 Local Services Started")
    print()
    print("  ============================================================")
    print("  本地服务启动中... Services starting...")
    print("  ============================================================")
    print("  前端页面(热重载)  Frontend   : http://localhost:5173")
    print("  管理后台          Admin      : http://localhost:5173/admin")
    print("  后端接口          Backend    : http://localhost:3001/api")
    print("  接口文档          API Docs   : http://localhost:3001/api-docs")
    print("  文档网站          Docs Site  : http://localhost:5174")
    print()
    print("  默认账号  Account : admin / 123456")
    print("  ============================================================")

    logger.info("前端  : http://localhost:5173")
    logger.info("后端  : http://localhost:3001")
    logger.info("账号  : admin / 123456")
    logger.finish(success=True)
    pause()


def local_stop():
    """停止本地服务"""
    clear()
    logger = DeployLogger("本地部署 - 停止服务")
    set_logger(logger)

    logger.section("停止本地服务 Stop Local Services")
    logger.step("终止 Node.js 进程...")

    if IS_WIN:
        result = subprocess.run(
            ["taskkill", "/F", "/IM", "node.exe"],
            capture_output=True,
            text=True,
            cwd=ROOT,
        )
        if result.returncode == 0:
            logger.done("所有 Node.js 进程已终止")
        else:
            logger.info("未找到 Node.js 进程 (可能已停止)")
    else:
        result = subprocess.run(
            ["pkill", "-f", "npm run dev"],
            capture_output=True,
            text=True,
            cwd=ROOT,
        )
        logger.done("npm dev 进程已终止")

    logger.finish(success=True)
    pause()


def local_status():
    """检查本地服务状态"""
    clear()
    logger = DeployLogger("本地部署 - 状态检查")
    set_logger(logger)

    logger.section("端口状态检查 Port Status Check")

    ports = [
        ("3001", "后端 Backend"),
        ("5173", "前端 Frontend"),
        ("5174", "文档 Docs"),
        ("5432", "PostgreSQL"),
        ("6379", "Redis"),
    ]

    for port, name in ports:
        logger.step(f"检查 {name} 端口 :{port}...")
        if IS_WIN:
            result = subprocess.run(
                ["netstat", "-ano"],
                capture_output=True,
                text=True,
                cwd=ROOT,
            )
            if f":{port}" in result.stdout:
                logger.done(f"{name} (:{port}) 运行中 RUNNING")
            else:
                logger.warn(f"{name} (:{port}) 未运行 NOT running")
        else:
            result = subprocess.run(
                ["lsof", "-i", f":{port}"],
                capture_output=True,
                text=True,
                cwd=ROOT,
            )
            if result.stdout.strip():
                logger.done(f"{name} (:{port}) 运行中 RUNNING")
            else:
                logger.warn(f"{name} (:{port}) 未运行 NOT running")

    logger.section("状态检查完成 Status Check Complete")
    logger.finish(success=True)
    pause()


def local_menu():
    """本地部署管理子菜单"""
    while True:
        clear()
        print()
        print("  ============================================================")
        print("         本地部署管理 v4.63.0")
        print("  ============================================================")
        print()
        print("    ───── 快速操作 ─────")
        print("    [1] 检查依赖 Check Dependencies")
        print("    [2] 初始化项目 Init Project (首次使用)")
        print("    [3] 启动所有服务 Start All Services")
        print("    [4] 停止所有服务 Stop All Services")
        print("    [5] 查看服务状态 Check Status")
        print()
        if _has_local_deploy:
            print("    ───── 高级部署工具 ─────")
            print("    [F] 完整本地部署工具 (环境准备+验证+部署+报告+回滚)")
            print("        Comprehensive Local Deploy Tool")
        print()
        print("    [0] 返回 Back")
        print()
        print("  ============================================================")
        choice = input("  请输入选项 [0-5]: ").strip()

        if choice == "1":
            local_check_deps()
        elif choice == "2":
            local_init()
        elif choice == "3":
            local_start()
        elif choice == "4":
            local_stop()
        elif choice == "5":
            local_status()
        elif choice.upper() == "F" and _has_local_deploy:
            run_local_deploy_tool()
        elif choice == "0":
            return
        else:
            print("  无效选项!")
            pause()


# ╔══════════════════════════════════════════════════════════╗
# ║                    主菜单                                  ║
# ╚══════════════════════════════════════════════════════════╝

def main():
    """主入口"""
    while True:
        clear()
        print()
        print("  ============================================================")
        print("         开心农场 部署管理器 v4.63.0")
        print("         Happy Farm Deploy Manager")
        print("  ============================================================")
        print()
        print("    [1] Docker 部署 (推荐，含完整监控平台)")
        print("        Docker Deploy (Recommended: includes monitoring)")
        print()
        print("    [2] 本地部署 (需安装 Node/PG/Redis)")
        print("        Local Deploy (needs Node.js/PostgreSQL/Redis)")
        print()
        print("    [L] 查看部署日志 View Deployment Logs")
        print()
        print("    [0] 退出 Exit")
        print()
        print("  ============================================================")
        print(f"  日志目录: {LOG_DIR}")
        choice = input("  请输入选项 [0-2, L]: ").strip()

        if choice == "1":
            docker_menu()
        elif choice == "2":
            local_menu()
        elif choice.upper() == "L":
            view_logs()
        elif choice == "0":
            print("  再见! Goodbye!")
            sys.exit(0)
        else:
            print("  无效选项!")
            pause()


def view_logs():
    """查看部署日志文件列表（含主日志/错误日志/JSON日志）"""
    clear()
    print()
    print("  ============================================================")
    print("         部署日志 Deployment Logs")
    print("  ============================================================")
    print()

    if not os.path.exists(LOG_DIR):
        print("  日志目录不存在，请先执行一次部署")
        pause()
        return

    all_files = sorted(
        [f for f in os.listdir(LOG_DIR)
         if f.endswith((".log", ".json")) and f.startswith("deployment_")],
        reverse=True,
    )
    if not all_files:
        print("  没有找到日志文件，请先执行一次部署")
        pause()
        return

    # 按基础名分组（同一会话的 .log / .json / _error.log 归为一组）
    total_size = 0
    groups = {}
    for f in all_files:
        fpath = os.path.join(LOG_DIR, f)
        fsize = os.path.getsize(fpath)
        total_size += fsize
        # 提取基础名
        base = f.replace("_error.log", "").replace(".log", "").replace(".json", "")
        if base not in groups:
            groups[base] = {}
        if f.endswith("_error.log"):
            groups[base]["error"] = (f, fsize)
        elif f.endswith(".json"):
            groups[base]["json"] = (f, fsize)
        else:
            groups[base]["main"] = (f, fsize)

    print(f"  找到 {len(groups)} 个日志会话 (共 {format_log_size(total_size)}):\n")

    count = 0
    for base, files in list(groups.items())[:15]:
        count += 1
        main = files.get("main")
        error = files.get("error")
        json_f = files.get("json")
        if main:
            print(f"    [{count}] {main[0]} ({format_log_size(main[1])})")
            if error:
                print(f"         └─ 错误日志: {error[0]}")
            if json_f:
                print(f"         └─ JSON日志: {json_f[0]}")

    if len(groups) > 15:
        print(f"    ... 还有 {len(groups) - 15} 个会话")

    print()
    print(f"  日志目录: {LOG_DIR}")
    print(f"  保留期限: {LOG_RETENTION_DAYS} 天（启动时自动清理过期日志）")
    print("  ============================================================")
    pause()


if __name__ == "__main__":
    main()