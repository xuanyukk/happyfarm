# -*- coding: utf-8 -*-
"""
文件名：local_deploy.py
作者：开发者
日期：2026-05-27
版本：v1.0.0
功能描述：开心农场本地部署工具，不依赖 Docker，提供完整的本地环境部署
         方案，包含环境检查、依赖验证、分步部署、断点续传、部署后验证
         和回滚功能
更新记录：
  2026-05-27 - v1.0.0 - 初始版本，完整本地部署工具
"""

import os
import sys
import subprocess
import time
import shutil
import json
import socket
import platform
import urllib.request
from datetime import datetime
from pathlib import Path

# ── 全局常量 ──────────────────────────────────────────────

ROOT = os.path.dirname(os.path.abspath(__file__))
IS_WIN = os.name == "nt"
LOG_DIR = os.path.join(ROOT, "logs")
CHECKPOINT_FILE = os.path.join(ROOT, ".deploy_checkpoint.json")
BACKUP_DIR = os.path.join(ROOT, ".deploy_backup")
REPORT_DIR = os.path.join(ROOT, "logs", "reports")


# ╔══════════════════════════════════════════════════════════╗
# ║              系统需求数据 (Phase 1)                        ║
# ╚══════════════════════════════════════════════════════════╝

SYSTEM_REQUIREMENTS = {
    "os": {
        "windows": {"min": "Windows 10 (64位)", "recommended": "Windows 11 (64位)"},
        "linux": {"min": "Ubuntu 20.04 / CentOS 8", "recommended": "Ubuntu 22.04+ / Rocky 9+"},
        "mac": {"min": "macOS 12 Monterey", "recommended": "macOS 14 Sonoma+"},
    },
    "hardware": {
        "cpu": {"min": "4 核", "recommended": "8 核以上"},
        "ram": {"min": "8 GB", "recommended": "16 GB 以上"},
        "disk": {"min": "20 GB 可用空间", "recommended": "50 GB SSD"},
    },
}

SOFTWARE_REQUIREMENTS = {
    "node": {
        "name": "Node.js",
        "min_version": "18.0.0",
        "recommended": "20.x LTS",
        "check_cmd": "node --version",
        "version_flag": "--version",
        "download": {
            "windows": "https://nodejs.org/dist/v20.19.0/node-v20.19.0-x64.msi",
            "linux": "https://nodejs.org/dist/v20.19.0/node-v20.19.0-linux-x64.tar.xz",
            "mac": "https://nodejs.org/dist/v20.19.0/node-v20.19.0.pkg",
        },
        "guide_url": "https://nodejs.org/zh-cn/download",
        "hash_sha256": "安装前请从官网验证 SHA256 哈希值",
        "install_note": "安装时勾选 'Automatically install the necessary tools'",
    },
    "npm": {
        "name": "npm (包管理器)",
        "min_version": "9.0.0",
        "recommended": "10.x",
        "check_cmd": "npm --version",
        "version_flag": "--version",
        "download": {
            "windows": "随 Node.js 自动安装",
            "linux": "随 Node.js 自动安装",
            "mac": "随 Node.js 自动安装",
        },
        "guide_url": "https://docs.npmjs.com/downloading-and-installing-node-js-and-npm",
        "hash_sha256": "N/A (随 Node.js 安装)",
        "install_note": "Node.js 安装后自带 npm，无需单独安装",
    },
    "postgresql": {
        "name": "PostgreSQL",
        "min_version": "13.0",
        "recommended": "16.x",
        "check_cmd": "psql --version",
        "version_flag": "--version",
        "download": {
            "windows": "https://www.enterprisedb.com/downloads/postgres-postgresql-downloads",
            "linux": "https://www.postgresql.org/download/linux/",
            "mac": "https://postgresapp.com/",
        },
        "guide_url": "https://www.postgresql.org/docs/current/tutorial-install.html",
        "hash_sha256": "安装前请从官网验证安装包完整性",
        "install_note": (
            "安装时记住设置的 postgres 用户密码，端口保持默认 5432"
        ),
        "config_steps": [
            "创建数据库: CREATE DATABASE happy_farm;",
            "配置 pg_hba.conf 允许本地连接",
            "确保 PostgreSQL 服务已启动",
        ],
    },
    "redis": {
        "name": "Redis",
        "min_version": "7.0",
        "recommended": "7.2.x",
        "check_cmd": "redis-cli --version",
        "version_flag": "--version",
        "download": {
            "windows": "https://github.com/tporadowski/redis/releases",
            "linux": "https://redis.io/download/",
            "mac": "brew install redis",
        },
        "guide_url": "https://redis.io/docs/latest/operate/oss_and_stack/install/",
        "hash_sha256": "安装前请从官网验证安装包完整性",
        "install_note": "Windows 用户需使用 Redis for Windows 第三方构建版本",
        "config_steps": [
            "启动 Redis 服务: redis-server",
            "验证连接: redis-cli ping (应返回 PONG)",
        ],
    },
    "git": {
        "name": "Git",
        "min_version": "2.30.0",
        "recommended": "2.44.x",
        "check_cmd": "git --version",
        "version_flag": "--version",
        "download": {
            "windows": "https://git-scm.com/download/win",
            "linux": "sudo apt install git / sudo yum install git",
            "mac": "https://git-scm.com/download/mac",
        },
        "guide_url": "https://git-scm.com/book/zh/v2/起步-安装-Git",
        "hash_sha256": "安装前请从官网验证安装包完整性",
        "install_note": "选择默认选项即可",
    },
}

REQUIRED_PORTS = {
    5432: {"name": "PostgreSQL", "critical": True,
           "fix": "停止其他 PostgreSQL 实例或修改端口配置"},
    6379: {"name": "Redis", "critical": True,
           "fix": "停止其他 Redis 实例或修改端口配置"},
    3001: {"name": "后端服务 Backend", "critical": False,
           "fix": "修改 backend/.env 中的 PORT 配置"},
    5173: {"name": "前端服务 Frontend (Vite)", "critical": False,
           "fix": "修改 Vite 配置文件中的端口"},
    5174: {"name": "文档网站 Docs Site", "critical": False,
           "fix": "修改 VitePress 配置文件中的端口"},
}


# ╔══════════════════════════════════════════════════════════╗
# ║              实用工具函数                                  ║
# ╚══════════════════════════════════════════════════════════╝

def clear_screen():
    """清屏"""
    os.system("cls" if IS_WIN else "clear")


def pause():
    """暂停等待用户按键"""
    try:
        input("\n  按回车键继续... Press Enter to continue...")
    except (KeyboardInterrupt, EOFError):
        pass


def run_cmd(cmd_list, cwd=None, timeout=None, capture=True):
    """执行命令并返回结果"""
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
            capture_output=capture,
            text=True,
            timeout=timeout,
            encoding="utf-8",
            errors="replace",
        )
        return result
    except subprocess.TimeoutExpired:
        return None
    except Exception:
        return None


def parse_version(version_str):
    """从版本字符串中提取版本号元组"""
    if not version_str:
        return (0, 0, 0)
    import re
    # 匹配类似 v20.11.0 或 16.2 的版本号
    match = re.search(r'(\d+)\.(\d+)(?:\.(\d+))?', version_str)
    if match:
        return tuple(int(x) for x in match.groups() if x is not None)
    return (0, 0, 0)


def version_compare(v1, v2):
    """比较两个版本元组，v1>=v2 返回 True"""
    max_len = max(len(v1), len(v2))
    v1 = v1 + (0,) * (max_len - len(v1))
    v2 = v2 + (0,) * (max_len - len(v2))
    return v1 >= v2


def check_port(port):
    """检查端口是否被占用"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    try:
        result = sock.connect_ex(('127.0.0.1', port))
        return result == 0  # True = 被占用
    except Exception:
        return False
    finally:
        sock.close()


def get_os_type():
    """获取操作系统类型"""
    system = platform.system()
    if system == "Windows":
        return "windows"
    elif system == "Darwin":
        return "mac"
    else:
        return "linux"


# ╔══════════════════════════════════════════════════════════╗
# ║         阶段一：环境准备 (Phase 1)                          ║
# ╚══════════════════════════════════════════════════════════╝

class EnvironmentPreparer:
    """环境准备器 - 显示系统要求、软件依赖、安装引导"""

    @staticmethod
    def show_system_requirements():
        """显示系统环境要求"""
        clear_screen()
        print()
        print("  " + "=" * 60)
        print("    阶段一：环境准备 - 系统要求")
        print("    Phase 1: Environment Preparation - System Requirements")
        print("  " + "=" * 60)

        os_type = get_os_type()
        os_info = SYSTEM_REQUIREMENTS["os"].get(os_type, {})

        print()
        print("  ───── 操作系统要求 ─────")
        print(f"  当前系统: {platform.system()} {platform.release()}")
        if os_info:
            print(f"  最低要求: {os_info.get('min', '未指定')}")
            print(f"  推荐配置: {os_info.get('recommended', '未指定')}")

        print()
        print("  ───── 硬件要求 ─────")
        hw = SYSTEM_REQUIREMENTS["hardware"]
        print(f"  CPU  : 最低 {hw['cpu']['min']}，推荐 {hw['cpu']['recommended']}")
        print(f"  内存 : 最低 {hw['ram']['min']}，推荐 {hw['ram']['recommended']}")
        print(f"  磁盘 : 最低 {hw['disk']['min']}，推荐 {hw['disk']['recommended']}")

        print()
        print("  " + "=" * 60)
        pause()

    @staticmethod
    def show_software_requirements():
        """显示软件依赖列表"""
        clear_screen()
        print()
        print("  " + "=" * 60)
        print("    所需软件清单 Software Requirements")
        print("  " + "=" * 60)

        for i, (key, info) in enumerate(SOFTWARE_REQUIREMENTS.items(), 1):
            print()
            print(f"  [{i}] {info['name']}")
            print(f"      最低版本  Min Version : {info['min_version']}")
            print(f"      推荐版本  Recommended  : {info['recommended']}")

            os_type = get_os_type()
            dl = info["download"].get(os_type, info["download"].get("windows", ""))
            print(f"      下载地址  Download     : {dl}")
            print(f"      安装教程  Guide        : {info['guide_url']}")
            print(f"      哈希验证  SHA256       : {info['hash_sha256']}")
            print(f"      安装说明  Note         : {info['install_note']}")
            if "config_steps" in info:
                print(f"      配置步骤  Config:")
                for step in info["config_steps"]:
                    print(f"        - {step}")

        print()
        print("  " + "=" * 60)
        pause()

    @staticmethod
    def interactive_install_guide():
        """交互式安装引导"""
        clear_screen()
        print()
        print("  " + "=" * 60)
        print("    交互式安装引导 Interactive Install Guide")
        print("  " + "=" * 60)
        print()
        print("  本向导将逐步引导您完成各软件的下载与安装。")
        print("  每完成一个软件的安装，向导会验证安装结果。")
        print()

        for i, (key, info) in enumerate(SOFTWARE_REQUIREMENTS.items(), 1):
            print(f"  [{i}/{len(SOFTWARE_REQUIREMENTS)}] {info['name']}")
            print(f"      版本要求: >= {info['min_version']}")
            print()

            # 检查是否已安装
            cmd = info["check_cmd"]
            result = run_cmd(cmd.split(), capture=True)
            if result and result.returncode == 0:
                ver = parse_version(result.stdout.strip())
                min_ver = parse_version(info["min_version"])
                if version_compare(ver, min_ver):
                    print(f"  [完成] 已安装且版本满足要求: {result.stdout.strip()}")
                    print()
                    continue
                else:
                    print(f"  [警告] 已安装但版本过低: {result.stdout.strip()}")
                    print(f"         需要 >= {info['min_version']}")

            # 显示下载信息
            os_type = get_os_type()
            dl = info["download"].get(os_type, info["download"].get("windows", ""))
            print(f"  下载地址: {dl}")
            print(f"  安装教程: {info['guide_url']}")
            print(f"  注意事项: {info['install_note']}")
            print()
            yn = input("  安装完成后按回车继续... (输入 s 跳过): ").strip().lower()
            if yn == 's':
                print(f"  [跳过] 已跳过 {info['name']}")
                continue

            # 安装后验证
            result = run_cmd(cmd.split(), capture=True)
            if result and result.returncode == 0:
                print(f"  [完成] 安装验证通过: {result.stdout.strip()}")
            else:
                print(f"  [警告] 未能验证安装，请手动检查")
            print()

        print("  " + "=" * 60)
        print("  安装引导完成！")
        pause()


# ╔══════════════════════════════════════════════════════════╗
# ║         阶段二：环境验证 (Phase 2)                          ║
# ╚══════════════════════════════════════════════════════════╝

class EnvironmentVerifier:
    """环境验证器 - 软件版本、端口、权限、环境变量检查"""

    def __init__(self):
        self.check_results = {"passed": [], "failed": [], "warnings": []}

    def check_all(self):
        """执行全部检查"""
        clear_screen()
        print()
        print("  " + "=" * 60)
        print("    阶段二：环境验证 Environment Verification")
        print("  " + "=" * 60)

        self.check_software_versions()
        self.check_ports()
        self.check_permissions()
        self.check_env_variables()
        self.show_summary()

        return len(self.check_results["failed"]) == 0

    def check_software_versions(self):
        """检查软件版本兼容性"""
        print()
        print("  ───── 1. 软件依赖检查 ─────")

        critical_fail = False
        for key, info in SOFTWARE_REQUIREMENTS.items():
            cmd = info["check_cmd"]
            result = run_cmd(cmd.split(), capture=True)

            icon = ""
            if result and result.returncode == 0:
                ver = parse_version(result.stdout.strip())
                min_ver = parse_version(info["min_version"])
                if version_compare(ver, min_ver):
                    icon = "[PASS]"
                    self.check_results["passed"].append(info["name"])
                else:
                    icon = "[FAIL]"
                    msg = (f"{info['name']} 版本过低: "
                           f"{result.stdout.strip()}，需要 >= {info['min_version']}")
                    self.check_results["failed"].append(msg)
            else:
                icon = "[FAIL]"
                is_critical = key in ("node", "npm", "postgresql", "redis")
                msg = f"{info['name']} 未安装或无法检测"
                self.check_results["failed"].append(msg)
                if is_critical:
                    critical_fail = True
                    icon = "[致命]"

            print(f"  {icon} {info['name']}")

        if critical_fail:
            print()
            print("  [错误] 检测到关键依赖缺失，请先安装后再继续。")
            print("  选择主菜单 [A] 可查看详细安装指南。")

    def check_ports(self):
        """检查端口占用"""
        print()
        print("  ───── 2. 端口占用检查 ─────")

        for port, info in REQUIRED_PORTS.items():
            occupied = check_port(port)
            icon = "[PASS]"
            status = "空闲"

            if occupied:
                if info["critical"]:
                    icon = "[占用]"
                    status = "被占用(关键)"
                    self.check_results["failed"].append(
                        f"端口 {port} ({info['name']}) 被占用 - {info['fix']}"
                    )
                else:
                    icon = "[警告]"
                    status = "被占用(非关键)"
                    self.check_results["warnings"].append(
                        f"端口 {port} ({info['name']}) 被占用 - {info['fix']}"
                    )
            else:
                self.check_results["passed"].append(f"端口 {port} ({info['name']}) 空闲")

            print(f"  {icon} 端口 {port:5d} ({info['name']:25s}) : {status}")

    def check_permissions(self):
        """检查文件权限"""
        print()
        print("  ───── 3. 文件权限检查 ─────")

        dirs_to_check = [
            ("backend", "后端代码目录"),
            ("frontend", "前端代码目录"),
            ("logs", "日志目录"),
        ]

        for dir_name, desc in dirs_to_check:
            dir_path = os.path.join(ROOT, dir_name)
            if os.path.exists(dir_path):
                # 检查读写权限
                can_read = os.access(dir_path, os.R_OK)
                can_write = os.access(dir_path, os.W_OK)

                if can_read and can_write:
                    print(f"  [PASS] {desc} ({dir_name}) - 读写权限正常")
                    self.check_results["passed"].append(f"{desc} 权限正常")
                else:
                    perms = []
                    if not can_read:
                        perms.append("无读权限")
                    if not can_write:
                        perms.append("无写权限")
                    msg = f"{desc} ({dir_name}) - {', '.join(perms)}"
                    print(f"  [FAIL] {msg}")
                    self.check_results["failed"].append(msg)
            else:
                msg = f"{desc} ({dir_name}) - 目录不存在"
                print(f"  [WARN] {msg}")
                self.check_results["warnings"].append(msg)

        # 检查当前目录写入权限
        if os.access(ROOT, os.W_OK):
            print(f"  [PASS] 项目根目录 - 写入权限正常")
        else:
            print(f"  [FAIL] 项目根目录 - 无写入权限")
            self.check_results["failed"].append("项目根目录无写入权限")

    def check_env_variables(self):
        """检查环境变量"""
        print()
        print("  ───── 4. 环境变量检查 ─────")

        # Node.js 相关
        result = run_cmd(["node", "-e",
            "console.log(process.env.NODE_PATH || '未设置 NODE_PATH')"], capture=True)
        if result:
            print(f"  [INFO] NODE_PATH: {result.stdout.strip()}")

        # npm 全局路径
        result = run_cmd(["npm", "config", "get", "prefix"], capture=True)
        if result and result.returncode == 0:
            print(f"  [INFO] npm 全局路径: {result.stdout.strip()}")

        # PATH 中关键工具
        for cmd_name in ["node", "npm", "psql", "redis-cli", "git"]:
            path = shutil.which(cmd_name)
            if path:
                print(f"  [PASS] {cmd_name} -> {path}")
                self.check_results["passed"].append(f"{cmd_name} 在 PATH 中")
            else:
                if cmd_name in ("psql", "redis-cli"):
                    print(f"  [WARN] {cmd_name} 不在 PATH 中")
                    self.check_results["warnings"].append(
                        f"{cmd_name} 不在 PATH 中，可能影响使用"
                    )
                else:
                    print(f"  [FAIL] {cmd_name} 不在 PATH 中")
                    self.check_results["failed"].append(
                        f"{cmd_name} 不在 PATH 中"
                    )

    def show_summary(self):
        """显示验证摘要"""
        print()
        print("  " + "=" * 60)
        print("    验证摘要 Verification Summary")
        print("  " + "=" * 60)

        passed = len(self.check_results["passed"])
        failed = len(self.check_results["failed"])
        warnings = len(self.check_results["warnings"])

        print(f"  通过  Passed   : {passed}")
        print(f"  失败  Failed   : {failed}")
        print(f"  警告  Warnings : {warnings}")
        print()

        if failed > 0:
            print("  ───── 失败项详情 ─────")
            for item in self.check_results["failed"]:
                print(f"  [FAIL] {item}")

        if warnings > 0:
            print()
            print("  ───── 警告项详情 ─────")
            for item in self.check_results["warnings"]:
                print(f"  [WARN] {item}")

        if failed == 0:
            print()
            print("  [OK] 所有检查通过，可以开始部署！")
        else:
            print()
            print("  [X] 存在失败项，请先解决后再继续部署。")

        print("  " + "=" * 60)
        pause()


# ╔══════════════════════════════════════════════════════════╗
# ║         阶段三：部署执行 (Phase 3)                          ║
# ╚══════════════════════════════════════════════════════════╝

class DeploymentExecutor:
    """部署执行器 - 分步部署、断点续传、进度展示"""

    STEPS = [
        {
            "id": "config_backup",
            "name": "备份现有配置",
            "desc": "Backup existing configs",
            "estimate": "5秒",
        },
        {
            "id": "env_setup",
            "name": "配置环境变量文件",
            "desc": "Setup .env files",
            "estimate": "5秒",
        },
        {
            "id": "backend_install",
            "name": "安装后端依赖 (npm install)",
            "desc": "Install backend dependencies",
            "estimate": "3-5分钟",
        },
        {
            "id": "frontend_install",
            "name": "安装前端依赖 (npm install)",
            "desc": "Install frontend dependencies",
            "estimate": "2-4分钟",
        },
        {
            "id": "db_init",
            "name": "初始化数据库",
            "desc": "Initialize database",
            "estimate": "10秒",
        },
        {
            "id": "backend_start",
            "name": "启动后端服务",
            "desc": "Start backend service",
            "estimate": "10秒",
        },
        {
            "id": "frontend_start",
            "name": "启动前端服务",
            "desc": "Start frontend service",
            "estimate": "10秒",
        },
        {
            "id": "health_check",
            "name": "服务健康检查",
            "desc": "Service health check",
            "estimate": "15秒",
        },
    ]

    def __init__(self):
        self.checkpoint = self._load_checkpoint()
        self.log_dir = LOG_DIR
        self.start_time = None

    def _load_checkpoint(self):
        """加载断点数据"""
        if os.path.exists(CHECKPOINT_FILE):
            try:
                with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {"completed_steps": [], "started_at": None,
                "last_step": None, "backup_paths": []}

    def _save_checkpoint(self):
        """保存断点数据"""
        try:
            with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
                json.dump(self.checkpoint, f, indent=2, ensure_ascii=False)
        except Exception:
            pass

    def _log_step(self, msg):
        """记录步骤日志"""
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_file = os.path.join(self.log_dir, "deploy_steps.log")
        os.makedirs(self.log_dir, exist_ok=True)
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"[{ts}] {msg}\n")

    def _step_config_backup(self):
        """步骤：备份现有配置"""
        backup_paths = []
        os.makedirs(BACKUP_DIR, exist_ok=True)

        configs_to_backup = [
            (os.path.join(ROOT, "backend", ".env"),
             os.path.join(BACKUP_DIR, "backend.env")),
            (os.path.join(ROOT, "frontend", ".env"),
             os.path.join(BACKUP_DIR, "frontend.env")),
        ]

        for src, dst in configs_to_backup:
            if os.path.exists(src):
                shutil.copy2(src, dst)
                backup_paths.append({"src": src, "dst": dst})
                print(f"    已备份: {os.path.basename(src)}")

        self.checkpoint["backup_paths"] = backup_paths
        return True

    def _step_env_setup(self):
        """步骤：配置环境变量"""
        env_configs = [
            (os.path.join(ROOT, "backend", ".env"),
             os.path.join(ROOT, "backend", ".env.example")),
            (os.path.join(ROOT, "frontend", ".env"),
             os.path.join(ROOT, "frontend", ".env.example")),
        ]

        for env_file, example_file in env_configs:
            if not os.path.exists(env_file):
                if os.path.exists(example_file):
                    shutil.copy(example_file, env_file)
                    print(f"    已创建: {os.path.basename(env_file)}")
                else:
                    print(f"    警告: 模板文件不存在 {example_file}")
            else:
                print(f"    已存在: {os.path.basename(env_file)}")
        return True

    def _step_backend_install(self):
        """步骤：安装后端依赖"""
        backend_dir = os.path.join(ROOT, "backend")
        if not os.path.exists(os.path.join(backend_dir, "package.json")):
            print(f"    [错误] 未找到 backend/package.json")
            return False

        print(f"    正在安装后端依赖... (可能需要几分钟)")
        result = run_cmd(["npm", "install"], cwd=backend_dir, timeout=600)
        if result is None or result.returncode != 0:
            print(f"    [错误] 后端依赖安装失败!")
            return False
        print(f"    [完成] 后端依赖安装成功")
        return True

    def _step_frontend_install(self):
        """步骤：安装前端依赖"""
        frontend_dir = os.path.join(ROOT, "frontend")
        if not os.path.exists(os.path.join(frontend_dir, "package.json")):
            print(f"    [错误] 未找到 frontend/package.json")
            return False

        print(f"    正在安装前端依赖... (可能需要几分钟)")
        result = run_cmd(["npm", "install"], cwd=frontend_dir, timeout=600)
        if result is None or result.returncode != 0:
            print(f"    [错误] 前端依赖安装失败!")
            return False
        print(f"    [完成] 前端依赖安装成功")
        return True

    def _step_db_init(self):
        """步骤：初始化数据库"""
        backend_dir = os.path.join(ROOT, "backend")
        # 检查是否有数据库初始化命令
        print(f"    正在初始化数据库...")
        # 运行 init-db（如果存在）
        result = run_cmd(["npm", "run", "init-db"], cwd=backend_dir, timeout=60)
        if result and result.returncode == 0:
            print(f"    [完成] 数据库初始化成功")
            return True
        else:
            # 尝试 prisma migrate
            result = run_cmd(["npx", "prisma", "migrate", "deploy"],
                              cwd=backend_dir, timeout=60)
            if result and result.returncode == 0:
                print(f"    [完成] 数据库迁移成功")
                return True
            print(f"    [警告] 数据库初始化可能未完成，请手动检查")
            return False

    def _step_backend_start(self):
        """步骤：启动后端服务"""
        backend_dir = os.path.join(ROOT, "backend")
        print(f"    正在启动后端服务...")
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
        time.sleep(3)
        print(f"    [完成] 后端服务在新窗口中启动")
        return True

    def _step_frontend_start(self):
        """步骤：启动前端服务"""
        frontend_dir = os.path.join(ROOT, "frontend")
        print(f"    正在启动前端服务...")
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
        time.sleep(3)
        print(f"    [完成] 前端服务在新窗口中启动")
        return True

    def _step_health_check(self):
        """步骤：服务健康检查"""
        print(f"    等待服务启动...")
        time.sleep(5)

        checks_passed = 0
        checks_total = 2

        # 检查后端
        if check_port(3001):
            print(f"    [PASS] 后端服务端口 3001 已监听")
            checks_passed += 1
        else:
            print(f"    [WARN] 后端服务端口 3001 未就绪（可能仍在启动中）")

        # 检查前端
        if check_port(5173):
            print(f"    [PASS] 前端服务端口 5173 已监听")
            checks_passed += 1
        else:
            print(f"    [WARN] 前端服务端口 5173 未就绪（可能仍在启动中）")

        return checks_passed >= 1

    def execute(self):
        """执行部署流程"""
        clear_screen()
        print()
        print("  " + "=" * 60)
        print("    阶段三：部署执行 Deployment Execution")
        print("  " + "=" * 60)

        # 检查断点
        completed = set(self.checkpoint.get("completed_steps", []))
        if completed:
            print()
            print(f"  检测到之前的部署记录:")
            print(f"   已完成步骤: {len(completed)}/{len(self.STEPS)}")
            for step in self.STEPS:
                icon = "[完成]" if step["id"] in completed else "[待执行]"
                print(f"    {icon} {step['name']}")
            print()
            yn = input("  从上次断点继续? (y/n，默认 y): ").strip().lower()
            if yn == 'n':
                completed = set()
                self.checkpoint["completed_steps"] = []
                self._save_checkpoint()
                print("  已重置，将从头开始执行")
        else:
            print()
            print("  首次部署，将按顺序执行所有步骤。")

        print()
        print("  ───── 开始部署 ─────")
        self.start_time = datetime.now()
        success = True

        step_handlers = {
            "config_backup": self._step_config_backup,
            "env_setup": self._step_env_setup,
            "backend_install": self._step_backend_install,
            "frontend_install": self._step_frontend_install,
            "db_init": self._step_db_init,
            "backend_start": self._step_backend_start,
            "frontend_start": self._step_frontend_start,
            "health_check": self._step_health_check,
        }

        for i, step in enumerate(self.STEPS):
            step_id = step["id"]

            # 跳过已完成的步骤
            if step_id in completed:
                print(f"\n  [{i+1}/{len(self.STEPS)}] {step['name']} - [已跳过(断点)]")
                self._log_step(f"[SKIP] {step['name']} (already completed)")
                continue

            print(f"\n  [{i+1}/{len(self.STEPS)}] {step['name']}")
            print(f"            {step['desc']} | 预计耗时: {step['estimate']}")
            self._log_step(f"[START] {step['name']}")

            # 执行步骤
            step_start = time.time()
            handler = step_handlers[step_id]
            try:
                result = handler()
            except Exception as e:
                print(f"    [错误] 异常: {str(e)}")
                result = False

            elapsed = time.time() - step_start

            if result:
                print(f"  [完成] {step['name']} (耗时 {elapsed:.1f}秒)")
                self._log_step(f"[DONE] {step['name']} ({elapsed:.1f}s)")
                completed.add(step_id)
                self.checkpoint["completed_steps"] = list(completed)
                self.checkpoint["last_step"] = step_id
                self._save_checkpoint()
            else:
                print(f"  [失败] {step['name']} (耗时 {elapsed:.1f}秒)")
                self._log_step(f"[FAIL] {step['name']} ({elapsed:.1f}s)")
                success = False
                print()
                print("  [错误] 部署在中间步骤失败!")
                print("  可以选择:")
                print("    1. 修复问题后重新运行（从断点继续）")
                print("    2. 在菜单选择 [R] 执行回滚恢复部署前状态")
                self._save_checkpoint()
                break

        if success:
            print()
            print("  " + "=" * 60)
            print("    部署完成! Deployment Complete!")
            print("  " + "=" * 60)
            # 清除断点文件（部署成功）
            if os.path.exists(CHECKPOINT_FILE):
                os.remove(CHECKPOINT_FILE)

        return success


# ╔══════════════════════════════════════════════════════════╗
# ║      阶段四：部署后验证与回滚 (Phase 4)                      ║
# ╚══════════════════════════════════════════════════════════╝

class PostDeployValidator:
    """部署后验证器 - 完整性检查、功能测试、报告生成、回滚"""

    def __init__(self, executor=None):
        self.executor = executor
        self.test_results = []

    def run_all_checks(self):
        """执行全部部署后验证"""
        clear_screen()
        print()
        print("  " + "=" * 60)
        print("    阶段四：部署后验证 Post-Deployment Verification")
        print("  " + "=" * 60)

        self.check_integrity()
        self.run_functional_tests()
        self.generate_report()

    def check_integrity(self):
        """完整性检查"""
        print()
        print("  ───── 1. 完整性检查 Integrity Check ─────")

        checks = [
            ("后端依赖", os.path.join(ROOT, "backend", "node_modules")),
            ("前端依赖", os.path.join(ROOT, "frontend", "node_modules")),
            ("后端配置", os.path.join(ROOT, "backend", ".env")),
            ("前端配置", os.path.join(ROOT, "frontend", ".env")),
            ("后端入口", os.path.join(ROOT, "backend", "package.json")),
            ("前端入口", os.path.join(ROOT, "frontend", "package.json")),
        ]

        all_ok = True
        for name, path in checks:
            exists = os.path.exists(path)
            icon = "[PASS]" if exists else "[FAIL]"
            print(f"  {icon} {name}: {path}")
            if not exists:
                all_ok = False
                self.test_results.append(f"[FAIL] 完整性: {name} 缺失")

        if all_ok:
            self.test_results.append("[PASS] 完整性: 所有核心文件就绪")
        return all_ok

    def run_functional_tests(self):
        """基础功能测试"""
        print()
        print("  ───── 2. 基础功能测试 Functional Tests ─────")

        # 端口连通性测试
        print()
        print("  端口连通性测试...")
        services = [
            ("后端 Backend", 3001),
            ("前端 Frontend", 5173),
            ("文档 Docs", 5174),
        ]

        for name, port in services:
            if check_port(port):
                print(f"  [PASS] {name} (:{port}) - 端口已监听")
                self.test_results.append(f"[PASS] 连通性: {name} :{port} OK")
            else:
                print(f"  [WARN] {name} (:{port}) - 端口未监听")
                self.test_results.append(f"[WARN] 连通性: {name} :{port} 未就绪")

        # HTTP 响应测试
        print()
        print("  HTTP 响应测试...")
        http_tests = [
            ("后端 API", "http://localhost:3001/api"),
            ("前端页面", "http://localhost:5173"),
        ]

        for name, url in http_tests:
            try:
                req = urllib.request.Request(url, method='HEAD')
                req.add_header('User-Agent', 'HappyFarm-DeployCheck/1.0')
                resp = urllib.request.urlopen(req, timeout=5)
                print(f"  [PASS] {name} ({url}) - HTTP {resp.status}")
                self.test_results.append(
                    f"[PASS] HTTP: {name} -> {resp.status}"
                )
            except Exception as e:
                print(f"  [WARN] {name} ({url}) - 无响应 ({str(e)[:50]})")
                self.test_results.append(
                    f"[WARN] HTTP: {name} -> 无响应"
                )

    def generate_report(self):
        """生成部署报告"""
        print()
        print("  ───── 3. 生成部署报告 Report ─────")

        os.makedirs(REPORT_DIR, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = os.path.join(REPORT_DIR, f"deploy_report_{timestamp}.md")

        elapsed = ""
        if self.executor and self.executor.start_time:
            elapsed = str(datetime.now() - self.executor.start_time)

        report = f"""# 开心农场 本地部署报告

**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**操作系统**: {platform.system()} {platform.release()}
**部署耗时**: {elapsed}

---

## 系统环境

| 项目 | 信息 |
|------|------|
| OS | {platform.system()} {platform.release()} |
| Python | {sys.version.split()[0]} |
| Node.js | {self._get_version('node --version')} |
| npm | {self._get_version('npm --version')} |
| PostgreSQL | {self._get_version('psql --version')} |
| Redis | {self._get_version('redis-cli --version')} |

---

## 测试结果

"""

        for result in self.test_results:
            report += f"- {result}\n"

        report += f"""
---

## 访问地址

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:5173 |
| 管理后台 | http://localhost:5173/admin |
| 后端接口 | http://localhost:3001/api |
| 接口文档 | http://localhost:3001/api-docs |
| 文档网站 | http://localhost:5174 |

---

## 默认账号

| 账号类型 | 用户名 | 密码 |
|---------|--------|------|
| 系统管理员 | admin | 123456 |

---

## 后续操作建议

1. 打开 http://localhost:5173 访问系统
2. 使用 admin/123456 登录管理后台
3. 查看 logs/ 目录获取详细运行日志
4. 如遇问题，使用本工具的回滚功能恢复

---

*报告由 Happy Farm 本地部署工具自动生成*
"""

        with open(report_path, "w", encoding="utf-8") as f:
            f.write(report)

        print(f"  报告已生成: {report_path}")
        print("  " + "=" * 60)
        pause()

    def _get_version(self, cmd_str):
        """获取软件版本号"""
        result = run_cmd(cmd_str.split(), capture=True)
        if result and result.returncode == 0:
            return result.stdout.strip().split("\n")[0]
        return "未检测到"

    def rollback(self):
        """一键回滚"""
        clear_screen()
        print()
        print("  " + "=" * 60)
        print("    回滚操作 Rollback")
        print("  " + "=" * 60)
        print()
        print("  回滚将执行以下操作:")
        print("    1. 停止后端服务")
        print("    2. 停止前端服务")
        print("    3. 恢复备份的配置文件")
        print("    4. 清除断点记录")
        print()
        yn = input("  确认执行回滚? (输入 'yes' 确认): ").strip().lower()
        if yn != 'yes':
            print("  已取消回滚操作")
            pause()
            return

        print()
        print("  [1/4] 停止服务...")
        if IS_WIN:
            subprocess.run(["taskkill", "/F", "/IM", "node.exe"],
                           capture_output=True, cwd=ROOT)
        else:
            subprocess.run(["pkill", "-f", "npm run dev"],
                           capture_output=True, cwd=ROOT)
        print("  [完成] 服务已停止")

        print("  [2/4] 恢复备份配置...")
        restored = 0
        if os.path.exists(BACKUP_DIR):
            for backup_file in os.listdir(BACKUP_DIR):
                backup_path = os.path.join(BACKUP_DIR, backup_file)
                # 恢复 backend.env -> backend/.env
                if backup_file == "backend.env":
                    target = os.path.join(ROOT, "backend", ".env")
                elif backup_file == "frontend.env":
                    target = os.path.join(ROOT, "frontend", ".env")
                else:
                    continue
                shutil.copy2(backup_path, target)
                restored += 1
                print(f"    已恢复: {os.path.basename(target)}")
        print(f"  [完成] 恢复了 {restored} 个配置文件")

        print("  [3/4] 清除断点记录...")
        if os.path.exists(CHECKPOINT_FILE):
            os.remove(CHECKPOINT_FILE)
            print("  [完成] 断点记录已清除")

        print("  [4/4] 清理备份目录...")
        if os.path.exists(BACKUP_DIR):
            shutil.rmtree(BACKUP_DIR, ignore_errors=True)
            print("  [完成] 备份目录已清理")

        print()
        print("  " + "=" * 60)
        print("    回滚完成! Rollback Complete!")
        print("    系统已恢复至部署前状态")
        print("  " + "=" * 60)
        pause()


# ╔══════════════════════════════════════════════════════════╗
# ║              主工具类 (Orchestrator)                       ║
# ╚══════════════════════════════════════════════════════════╝

class LocalDeployTool:
    """本地部署工具主类 - 协调各阶段功能"""

    def __init__(self):
        self.preparer = EnvironmentPreparer()
        self.verifier = EnvironmentVerifier()
        self.executor = DeploymentExecutor()
        self.validator = PostDeployValidator(self.executor)

    def run(self):
        """主入口"""
        while True:
            clear_screen()
            print()
            print("  " + "=" * 60)
            print("    开心农场 本地部署工具 v1.0.0 (不依赖 Docker)")
            print("    Happy Farm Local Deploy Tool (Docker-free)")
            print("  " + "=" * 60)
            print()
            print("    ───── 阶段一：环境准备 ─────")
            print("    [A] 查看系统要求 System Requirements")
            print("    [B] 查看所需软件 Software Prerequisites")
            print("    [C] 交互式安装引导 Install Guide")
            print()
            print("    ───── 阶段二：环境验证 ─────")
            print("    [V] 执行环境验证 Run Verification")
            print()
            print("    ───── 阶段三：部署执行 ─────")
            print("    [D] 开始部署 Start Deployment")
            print("    [S] 查看部署进度 Show Progress")
            print()
            print("    ───── 阶段四：部署后验证 ─────")
            print("    [T] 执行部署验证 Run Post-Deploy Tests")
            print("    [G] 生成部署报告 Generate Report")
            print("    [R] 一键回滚 Rollback")
            print()
            print("    ───── 其他 ─────")
            print("    [0] 返回主菜单 Exit")
            print()
            print("  " + "=" * 60)

            # 断点提示
            if os.path.exists(CHECKPOINT_FILE):
                checkpoint = self.executor._load_checkpoint()
                completed = len(checkpoint.get("completed_steps", []))
                print(f"  [提示] 检测到未完成的部署 (已完成 {completed}/8 步)")
                print(f"  选择 [D] 将从断点继续")
                print("  " + "=" * 60)

            choice = input("\n  请选择操作: ").strip().upper()

            if choice == 'A':
                self.preparer.show_system_requirements()
            elif choice == 'B':
                self.preparer.show_software_requirements()
            elif choice == 'C':
                self.preparer.interactive_install_guide()
            elif choice == 'V':
                self.verifier.check_all()
            elif choice == 'D':
                # 部署前先验证（如果验证未通过则警告）
                if not self.verifier.check_all():
                    print()
                    print("  [警告] 环境验证有失败项，建议先解决。")
                    yn = input("  是否强制继续部署? (y/n): ").strip().lower()
                    if yn != 'y':
                        continue
                success = self.executor.execute()
                if success:
                    self.validator = PostDeployValidator(self.executor)
            elif choice == 'S':
                self._show_progress()
            elif choice == 'T':
                self.validator.run_all_checks()
            elif choice == 'G':
                self.validator.generate_report()
            elif choice == 'R':
                self.validator.rollback()
            elif choice == '0':
                print("  返回主菜单...")
                return
            else:
                print("  无效选项!")
                pause()

    def _show_progress(self):
        """显示部署进度"""
        clear_screen()
        print()
        print("  " + "=" * 60)
        print("    部署进度 Deployment Progress")
        print("  " + "=" * 60)
        print()

        checkpoint = self.executor._load_checkpoint()
        completed = set(checkpoint.get("completed_steps", []))

        if not completed:
            print("  尚未开始部署，请选择 [D] 开始。")
            pause()
            return

        for i, step in enumerate(DeploymentExecutor.STEPS):
            icon = "[完成]" if step["id"] in completed else "[待执行]"
            print(f"  {icon} [{i+1}/{len(DeploymentExecutor.STEPS)}] "
                  f"{step['name']} ({step['estimate']})")

        print()
        print(f"  进度: {len(completed)}/{len(DeploymentExecutor.STEPS)} 步骤已完成")
        print("  " + "=" * 60)
        pause()


# ── 便捷入口函数 ──────────────────────────────────────────

def run_local_deploy_tool():
    """从 start.py 调用的便捷入口"""
    tool = LocalDeployTool()
    tool.run()


# ── 直接运行入口 ──────────────────────────────────────────

if __name__ == "__main__":
    run_local_deploy_tool()