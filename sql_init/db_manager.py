#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文件名: db_manager.py
作者: Trae AI
日期: 2026-05-23
版本: v4.60.1
功能描述: 交互式数据库管理脚本 - Python版本
更新记录:
  2026-05-25 - v4.60.1 - 同步项目版本号，统一内部版本号，表总数更新为69张
  2026-05-23 - v4.53.0 - 移除旧版system_config表，统一使用game_config，更新表总数为69张
  2026-05-22 - v4.50.0 - 添加缺失的3个数据文件，统一版本号，修复数据完整性问题
  2026-05-14 - v1.0.0 - 初始版本创建，完整功能
"""

import os
import sys
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Any

try:
    import psycopg2
    from psycopg2 import OperationalError
except ImportError:
    print("❌ 找不到psycopg2库，请先安装依赖")
    print("请运行：pip install psycopg2-binary")
    sys.exit(1)

# 尝试加载环境变量
try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    DOTENV_AVAILABLE = False


class DatabaseManager:
    """数据库管理器基类"""
    
    def __init__(self):
        self.config = self._load_config()
        self.log_file = Path(__file__).parent / "db_operations.log"
        self.backup_dir = Path(self.config.get('BACKUP_DIR', Path(__file__).parent / "backups"))
        self.backup_dir.mkdir(exist_ok=True)
        self.force = False
        self.verbose = False
        
        # SQL文件执行顺序
        self.sql_files = {
            'database': ['01_database/01_create_database.sql'],
            'extensions': ['04_extensions/01_enable_pgcrypto.sql'],
            'schema': [
                '02_schema/01_functions.sql',
                '02_schema/03_world_level.sql',
                '02_schema/04_farm_level.sql',
                '02_schema/05_land_quality.sql',
                '02_schema/06_farm_land.sql',
                '02_schema/07_crop.sql',
                '02_schema/08_currency_config.sql',
                '02_schema/09_item_config.sql',
                '02_schema/10_shop_goods.sql',
                '02_schema/11_player_base.sql',
                '02_schema/12_player_currency.sql',
                '02_schema/13_player_currency_log.sql',
                '02_schema/14_player_inventory.sql',
                '02_schema/15_player_land_status.sql',
                '02_schema/16_player_crop_unlock.sql',
                '02_schema/17_sys_login.sql',
                '02_schema/18_refresh_tokens.sql',
                '02_schema/19_password_reset_tokens.sql',
                '02_schema/20_user_devices.sql',
                '02_schema/21_two_factor_auth.sql',
                '02_schema/22_audit_logs.sql',
                '02_schema/23_game_activity_log.sql',
                '02_schema/24_monitoring_tables.sql',
                '02_schema/25_monitoring_procedures.sql',
                '02_schema/26_emergency_procedures.sql',
                '02_schema/27_optimization.sql',
                '02_schema/28_achievement_system.sql',
                '02_schema/29_admin_system.sql',
                '02_schema/30_announcement_system.sql',
                '02_schema/31_game_config_system.sql',
                '02_schema/32_data_warehouse.sql',
                '02_schema/33_game_event_system.sql'
            ],
            'data': [
                '03_data/01_world_level_data.sql',
                '03_data/02_farm_level_data.sql',
                '03_data/03_land_quality_data.sql',
                '03_data/04_farm_land_data.sql',
                '03_data/05_crop_data.sql',
                '03_data/06_currency_config_data.sql',
                '03_data/07_item_config_data.sql',
                '03_data/08_shop_goods_data.sql',
                '03_data/09_sys_login_data.sql',
                '03_data/10_achievement_data.sql',
                '03_data/11_announcement_data.sql',
                '03_data/12_game_config_data.sql',
                '03_data/14_admin_system_data.sql',
                '03_data/15_game_event_data.sql'
            ]
        }
        
        # 核心配置表（保留数据用）
        self.core_tables = [
            'world_level', 'farm_level', 'land_quality', 'farm_land', 'crop',
            'currency_config', 'item_config', 'shop_goods',
            'sys_user', 'sys_role', 'sys_permission',
            'achievement_definition', 'announcement_category', 'game_config'
        ]
        
        # 删除表顺序
        self.drop_tables_order = [
            'v_retention_analysis', 'v_revenue_stats', 'v_crop_stats', 'v_dau_stats',
            'game_event_rewards', 'player_event_progress', 'game_event_tasks', 'game_events', 'game_event_templates',
            'fact_daily_revenue', 'fact_crop_planting', 'fact_daily_transactions', 'fact_daily_active_players',
            'dim_crop', 'dim_player', 'dim_date',
            'config_change_log', 'config_approval', 'config_version', 'game_config',
            'announcement_draft', 'announcement_read', 'announcement', 'announcement_category',
            'admin_login_log', 'admin_session', 'admins',
            'achievement_unlock_log', 'player_achievement', 'achievement_definition',
            'game_activity_log',
            'audit_logs',
            'two_factor_verification_codes', 'two_factor_auth',
            'user_devices',
            'password_reset_tokens',
            'refresh_tokens',
            'sys_user_role', 'sys_role_permission', 'sys_permission', 'sys_role', 'sys_user',
            'player_crop_unlock',
            'player_land_status',
            'player_inventory',
            'player_currency_log',
            'player_currency',
            'player_base',
            'shop_goods',
            'item_config',
            'currency_config',
            'crop',
            'farm_land',
            'land_quality',
            'farm_level',
            'world_level',
            'system_alert', 'system_monitoring_log'
        ]
        
        # 函数列表
        self.functions = [
            'update_updated_at_column()', 'gen_uuid_v7()', 'sp_daily_currency_reconciliation()',
            'sp_check_production_consumption_ratio()', 'sp_check_player_abnormal_behavior()',
            'sp_reset_daily_stats()', 'sp_emergency_inflation_control(VARCHAR)',
            'sp_emergency_deflation_control(VARCHAR)', 'sp_enable_circuit_breaker(VARCHAR)',
            'sp_disable_circuit_breaker(VARCHAR)', 'sp_fix_player_data()',
            'sp_get_player_summary(VARCHAR)', 'sp_get_system_summary()'
        ]
    
    def _load_config(self) -> Dict[str, Any]:
        """加载配置"""
        config = {
            'DB_HOST': os.getenv('DB_HOST', 'localhost'),
            'DB_PORT': int(os.getenv('DB_PORT', 5432)),
            'DB_USER': os.getenv('DB_USER', 'postgres'),
            'DB_PASSWORD': os.getenv('DB_PASSWORD', ''),
            'DB_NAME': os.getenv('DB_NAME', 'happy_farm'),
            'BACKUP_DIR': os.getenv('BACKUP_DIR', '')
        }
        
        # 尝试从.env文件加载
        if DOTENV_AVAILABLE:
            env_paths = [
                Path(__file__).parent.parent / 'backend' / '.env',
                Path(__file__).parent / '.env',
            ]
            
            for env_path in env_paths:
                if env_path.exists():
                    load_dotenv(env_path)
                    config['DB_HOST'] = os.getenv('DB_HOST', config['DB_HOST'])
                    config['DB_PORT'] = int(os.getenv('DB_PORT', config['DB_PORT']))
                    config['DB_USER'] = os.getenv('DB_USER', config['DB_USER'])
                    config['DB_PASSWORD'] = os.getenv('DB_PASSWORD', config['DB_PASSWORD'])
                    config['DB_NAME'] = os.getenv('DB_NAME', config['DB_NAME'])
                    config['BACKUP_DIR'] = os.getenv('BACKUP_DIR', config['BACKUP_DIR'])
                    break
        
        return config
    
    def log(self, message: str, level: str = "INFO"):
        """记录日志"""
        timestamp = datetime.now().isoformat()
        log_message = f"[{timestamp}] [{level}] {message}"
        print(log_message)
        
        try:
            with open(self.log_file, 'a', encoding='utf-8') as f:
                f.write(log_message + '\n')
        except Exception:
            pass
    
    def debug(self, message: str):
        """调试日志"""
        if self.verbose:
            self.log(message, "DEBUG")
    
    def ask(self, question: str) -> str:
        """询问用户"""
        return input(question).strip()
    
    def confirm(self, message: str) -> bool:
        """确认操作"""
        if self.force:
            return True
        while True:
            choice = self.ask(f"\n⚠️  {message} (yes/no): ").lower()
            if choice in ['yes', 'y']:
                return True
            elif choice in ['no', 'n']:
                return False
            print("请输入 yes 或 no")
    
    def create_connection(self, dbname: Optional[str] = None):
        """创建数据库连接"""
        conn_params = {
            'host': self.config['DB_HOST'],
            'port': self.config['DB_PORT'],
            'user': self.config['DB_USER'],
            'password': self.config['DB_PASSWORD'],
            'dbname': dbname or self.config['DB_NAME']
        }
        return psycopg2.connect(**conn_params)
    
    def execute_sql_file(self, cursor, relative_path: str) -> bool:
        """执行SQL文件"""
        full_path = Path(__file__).parent / relative_path
        if not full_path.exists():
            self.log(f"文件不存在: {relative_path}", "WARN")
            return False
        
        self.debug(f"执行: {relative_path}")
        
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                sql_content = f.read()
            
            # 过滤psql命令
            lines = sql_content.split('\n')
            filtered_lines = [line for line in lines if not line.strip().startswith('\\')]
            filtered_sql = '\n'.join(filtered_lines)
            
            # 执行SQL
            cursor.execute(filtered_sql)
            self.debug(f"完成: {relative_path}")
            return True
            
        except Exception as e:
            self.log(f"执行失败: {relative_path} - {str(e)}", "ERROR")
            return False
    
    def generate_backup_filename(self) -> Path:
        """生成备份文件名"""
        now = datetime.now()
        timestamp = now.strftime("%Y%m%d_%H%M%S")
        return self.backup_dir / f"backup_{timestamp}.sql"
    
    def list_backup_files(self) -> List[Path]:
        """列出可用的备份文件"""
        if not self.backup_dir.exists():
            return []
        
        files = list(self.backup_dir.glob("*.sql"))
        files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        return files
    
    def backup_database(self) -> Optional[Path]:
        """备份数据库"""
        self.log("开始备份数据库...")
        
        backup_path = self.generate_backup_filename()
        self.log(f"备份文件: {backup_path}")
        
        try:
            env = os.environ.copy()
            env['PGPASSWORD'] = self.config['DB_PASSWORD']
            
            cmd = [
                'pg_dump',
                '-h', self.config['DB_HOST'],
                '-p', str(self.config['DB_PORT']),
                '-U', self.config['DB_USER'],
                self.config['DB_NAME']
            ]
            
            self.debug(f"执行命令: {' '.join(cmd)}")
            
            result = subprocess.run(cmd, env=env, capture_output=True, text=True, check=True)
            
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(result.stdout)
            
            size_kb = backup_path.stat().st_size / 1024
            self.log(f"✅ 备份完成！文件大小: {size_kb:.2f} KB", "SUCCESS")
            
            return backup_path
            
        except Exception as e:
            self.log(f"❌ 备份失败: {str(e)}", "ERROR")
            if self.verbose:
                import traceback
                traceback.print_exc()
            return None
    
    def restore_database(self, backup_path: Path) -> bool:
        """从备份恢复数据库"""
        self.log(f"开始从备份恢复: {backup_path}")
        
        if not backup_path.exists():
            self.log(f"❌ 备份文件不存在: {backup_path}", "ERROR")
            return False
        
        # 恢复前先备份
        self.log("恢复前自动备份当前数据库...")
        pre_backup = self.backup_database()
        if pre_backup:
            self.log(f"✅ 已保存恢复前备份: {pre_backup}")
        
        try:
            env = os.environ.copy()
            env['PGPASSWORD'] = self.config['DB_PASSWORD']
            
            cmd = [
                'psql',
                '-h', self.config['DB_HOST'],
                '-p', str(self.config['DB_PORT']),
                '-U', self.config['DB_USER'],
                '-d', self.config['DB_NAME'],
                '-f', str(backup_path)
            ]
            
            self.debug(f"执行命令: {' '.join(cmd)}")
            
            subprocess.run(cmd, env=env, check=True, capture_output=True)
            
            self.log("✅ 恢复完成！", "SUCCESS")
            return True
            
        except Exception as e:
            self.log(f"❌ 恢复失败: {str(e)}", "ERROR")
            if self.verbose:
                import traceback
                traceback.print_exc()
            return False
    
    def full_reset(self):
        """完全重置数据库"""
        self.log("开始完全重置...", "WARN")
        
        conn = self.create_connection()
        conn.autocommit = True
        
        try:
            cursor = conn.cursor()
            
            # 删除所有表
            self.log("删除旧表...")
            for table in self.drop_tables_order:
                try:
                    cursor.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
                    self.debug(f"已删除表: {table}")
                except Exception:
                    pass
            
            # 删除所有函数
            self.log("删除旧函数...")
            for func in self.functions:
                try:
                    cursor.execute(f"DROP FUNCTION IF EXISTS {func} CASCADE")
                    self.debug(f"已删除函数: {func}")
                except Exception:
                    pass
            
            # 重新创建
            self.log("启用扩展...")
            for file in self.sql_files['extensions']:
                self.execute_sql_file(cursor, file)
            
            self.log("创建表结构...")
            for file in self.sql_files['schema']:
                self.execute_sql_file(cursor, file)
            
            self.log("插入初始数据...")
            for file in self.sql_files['data']:
                self.execute_sql_file(cursor, file)
            
            self.log("✅ 完全重置完成！", "SUCCESS")
            
        finally:
            conn.close()
    
    def create_database_only(self) -> bool:
        """仅创建数据库"""
        self.log("仅创建数据库...")
        
        # 连接到默认数据库
        conn = self.create_connection(dbname='postgres')
        conn.autocommit = True
        
        try:
            cursor = conn.cursor()
            
            # 检查数据库是否存在
            cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{self.config['DB_NAME']}'")
            
            if cursor.fetchone():
                self.log(f"数据库 \"{self.config['DB_NAME']}\" 已存在，跳过创建", "WARN")
            else:
                self.log(f"创建数据库 \"{self.config['DB_NAME']}\"...")
                cursor.execute(f"CREATE DATABASE {self.config['DB_NAME']}")
                self.log("✅ 数据库创建成功！", "SUCCESS")
            
            return True
            
        except Exception as e:
            self.log(f"❌ 创建数据库失败: {str(e)}", "ERROR")
            return False
        finally:
            conn.close()
    
    def create_tables_only(self):
        """仅创建表结构"""
        self.log("仅创建表结构...")
        
        conn = self.create_connection()
        conn.autocommit = True
        
        try:
            cursor = conn.cursor()
            
            self.log("启用扩展...")
            for file in self.sql_files['extensions']:
                self.execute_sql_file(cursor, file)
            
            self.log("创建表结构...")
            success_count = 0
            fail_count = 0
            
            for file in self.sql_files['schema']:
                if self.execute_sql_file(cursor, file):
                    success_count += 1
                else:
                    fail_count += 1
            
            self.log(f"✅ 表结构创建完成！成功: {success_count}, 失败: {fail_count}", "SUCCESS")
            
        finally:
            conn.close()
    
    def import_data_only(self):
        """仅导入初始数据"""
        self.log("仅导入初始数据...")
        
        conn = self.create_connection()
        conn.autocommit = True
        
        try:
            cursor = conn.cursor()
            
            success_count = 0
            fail_count = 0
            
            for file in self.sql_files['data']:
                if self.execute_sql_file(cursor, file):
                    success_count += 1
                else:
                    fail_count += 1
            
            self.log(f"✅ 数据导入完成！成功: {success_count}, 失败: {fail_count}", "SUCCESS")
            
        finally:
            conn.close()
    
    def clear_data_keep_schema(self):
        """清空所有表数据，保留结构"""
        self.log("开始清除数据（保留结构）...")
        
        conn = self.create_connection()
        conn.autocommit = True
        
        try:
            cursor = conn.cursor()
            
            # 获取所有表
            cursor.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
            tables = [row[0] for row in cursor.fetchall()]
            
            # 按依赖反序删除数据
            success_count = 0
            fail_count = 0
            
            for table in self.drop_tables_order:
                if table in tables:
                    try:
                        cursor.execute(f"TRUNCATE TABLE {table} CASCADE")
                        self.debug(f"已清除数据: {table}")
                        success_count += 1
                    except Exception as e:
                        self.log(f"清除失败: {table} - {str(e)}", "WARN")
                        fail_count += 1
            
            # 重新插入数据
            self.log("重新插入初始数据...")
            for file in self.sql_files['data']:
                self.execute_sql_file(cursor, file)
            
            self.log(f"✅ 数据清除完成！清除表数: {success_count}", "SUCCESS")
            
        finally:
            conn.close()
    
    def show_status(self):
        """查看当前状态"""
        print("\n" + "=" * 70)
        print("📊 数据库状态检查")
        print("=" * 70)
        
        conn = self.create_connection()
        
        try:
            cursor = conn.cursor()
            
            # 检查连接
            print(f"\n🗄️  数据库信息:")
            print(f"   主机: {self.config['DB_HOST']}:{self.config['DB_PORT']}")
            print(f"   数据库: {self.config['DB_NAME']}")
            print(f"   用户: {self.config['DB_USER']}")
            
            # 检查表
            cursor.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")
            tables = [row[0] for row in cursor.fetchall()]
            print(f"\n📋 表数量: {len(tables)}")
            
            # 检查数据量
            print("\n📈 核心表数据量:")
            for table in self.core_tables:
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                    print(f"   {table}: {count} 条")
                except Exception:
                    print(f"   {table}: (表不存在)")
            
            # 检查备份文件
            backup_files = self.list_backup_files()
            print(f"\n📦 备份文件: {len(backup_files)} 个")
            if backup_files:
                print("   最新备份:")
                for i, f in enumerate(backup_files[:5]):
                    size_kb = f.stat().st_size / 1024
                    mtime = datetime.fromtimestamp(f.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')
                    print(f"      - {f.name} ({size_kb:.2f} KB, {mtime})")
            
            print("\n" + "=" * 70)
            
        finally:
            conn.close()
    
    def show_menu(self) -> str:
        """显示菜单"""
        print("\n" + "=" * 70)
        print("          🎮 开心农场 数据库管理系统 v4.60.1")
        print("=" * 70)
        print("\n请选择操作：")
        print("\n[1] 完整重置数据库")
        print("    ⚠️  危险：删除现有数据库 → 创建新数据库 → 创建表结构 → 导入初始数据")
        print("\n[2] 仅创建数据库")
        print("    ℹ️  不删除现有数据库，不存在则创建")
        print("\n[3] 仅创建表结构")
        print("    ℹ️  数据库已存在时使用")
        print("\n[4] 仅导入初始数据")
        print("    ℹ️  表结构已存在时使用")
        print("\n[5] 清空所有表数据")
        print("    ⚠️  保留表结构，只清空数据")
        print("\n[6] 备份现有数据库")
        print("    📦 生成带时间戳的SQL备份文件")
        print("\n[7] 从指定备份文件恢复")
        print("    🔄 从备份文件恢复数据库")
        print("\n[8] 查看当前状态")
        print("    📊 显示数据库表和数据量")
        print("\n[0] 退出脚本")
        print("")
        
        return self.ask("请输入选项 (0-8): ")
    
    def execute_mode(self, mode: str, backup_file: Optional[Path] = None):
        """执行指定模式"""
        if mode == 'reset':
            if self.confirm("确定要完全重置吗？这将删除所有内容！"):
                self.full_reset()
        
        elif mode == 'create-db':
            self.create_database_only()
        
        elif mode == 'create-tables':
            self.create_tables_only()
        
        elif mode == 'init-data':
            self.import_data_only()
        
        elif mode == 'clear-data':
            if self.confirm("确定要清除所有数据吗？"):
                self.clear_data_keep_schema()
        
        elif mode == 'backup':
            self.backup_database()
        
        elif mode == 'restore':
            if not backup_file:
                # 显示备份文件列表让用户选择
                files = self.list_backup_files()
                if not files:
                    self.log("没有找到备份文件", "ERROR")
                    return
                
                print("\n可用的备份文件:")
                for i, f in enumerate(files):
                    size_kb = f.stat().st_size / 1024
                    print(f"  [{i + 1}] {f.name} ({size_kb:.2f} KB)")
                
                choice = self.ask("\n请选择要恢复的备份文件编号: ")
                try:
                    index = int(choice) - 1
                    if 0 <= index < len(files):
                        backup_file = files[index]
                    else:
                        self.log("无效选择", "ERROR")
                        return
                except ValueError:
                    self.log("无效选择", "ERROR")
                    return
            
            if self.confirm(f"确定要从 \"{backup_file.name}\" 恢复吗？"):
                self.restore_database(backup_file)
        
        elif mode == 'status':
            self.show_status()
        
        else:
            self.log(f"未知模式: {mode}", "ERROR")
    
    def run_interactive(self):
        """运行交互式模式"""
        while True:
            choice = self.show_menu()
            
            if choice == '1':
                if self.confirm("确定要完全重置吗？这将删除所有内容！"):
                    self.full_reset()
            
            elif choice == '2':
                self.create_database_only()
            
            elif choice == '3':
                self.create_tables_only()
            
            elif choice == '4':
                self.import_data_only()
            
            elif choice == '5':
                if self.confirm("确定要清除所有数据吗？"):
                    self.clear_data_keep_schema()
            
            elif choice == '6':
                self.backup_database()
            
            elif choice == '7':
                files = self.list_backup_files()
                if not files:
                    self.log("没有找到备份文件", "ERROR")
                    continue
                
                print("\n可用的备份文件:")
                for i, f in enumerate(files):
                    size_kb = f.stat().st_size / 1024
                    print(f"  [{i + 1}] {f.name} ({size_kb:.2f} KB)")
                
                file_choice = self.ask("\n请选择要恢复的备份文件编号: ")
                try:
                    index = int(file_choice) - 1
                    if 0 <= index < len(files):
                        if self.confirm(f"确定要从 \"{files[index].name}\" 恢复吗？"):
                            self.restore_database(files[index])
                    else:
                        self.log("无效选择", "ERROR")
                except ValueError:
                    self.log("无效选择", "ERROR")
            
            elif choice == '8':
                self.show_status()
            
            elif choice == '0':
                self.log("👋 再见！")
                break
            
            else:
                self.log("无效选项，请重试", "ERROR")


def show_help():
    """显示帮助信息"""
    print("""
🎮 开心农场 数据库管理工具 v4.50.0

使用方式:
  python db_manager.py [选项]

选项:
  --mode <mode>        直接执行指定模式，不进入交互菜单
                       可选值: reset, create-db, create-tables, init-data,
                              clear-data, backup, restore, status
  --file <path>        指定恢复用的备份文件（仅用于restore模式）
  --force              跳过确认提示
  --verbose            显示详细执行日志
  --help               显示此帮助信息

示例:
  python db_manager.py                           # 进入交互菜单
  python db_manager.py --mode reset --force      # 强制重置数据库
  python db_manager.py --mode backup             # 备份数据库
  python db_manager.py --mode restore --file backup_20260514_210000.sql
""")


def main():
    """主函数"""
    # 解析命令行参数
    mode = None
    backup_file = None
    force = False
    verbose = False
    
    i = 1
    while i < len(sys.argv):
        arg = sys.argv[i]
        
        if arg == '--help':
            show_help()
            return
        elif arg == '--force':
            force = True
        elif arg == '--verbose':
            verbose = True
        elif arg == '--mode' and i + 1 < len(sys.argv):
            mode = sys.argv[i + 1]
            i += 1
        elif arg == '--file' and i + 1 < len(sys.argv):
            backup_file = Path(sys.argv[i + 1])
            i += 1
        i += 1
    
    # 创建管理器
    manager = DatabaseManager()
    manager.force = force
    manager.verbose = verbose
    
    manager.log("=" * 70)
    manager.log("🎮 开心农场 数据库管理系统 v4.60.1 启动")
    manager.log("=" * 70)
    
    try:
        # 测试连接
        test_conn = manager.create_connection()
        test_conn.close()
        manager.log("✅ 数据库连接成功")
        
        if mode:
            # 命令行模式
            manager.debug(f"执行模式: {mode}")
            manager.execute_mode(mode, backup_file)
        else:
            # 交互模式
            manager.run_interactive()
            
    except Exception as e:
        manager.log(f"错误: {str(e)}", "ERROR")
        if verbose:
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    main()
