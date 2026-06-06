# 访问地址

本文档提供开心农场项目的所有访问地址信息。

## 基础服务

| 部署方式 | 前端应用 | 后端 API | API 文档 | Grafana | 文档网站 |
|---------|---------|---------|---------|---------|---------|
| Docker 生产 | http://localhost | http://localhost:3001/api | http://localhost:3001/api-docs | http://localhost:3001 | http://localhost:8080 |
| Docker 开发 | http://localhost:5173 | http://localhost:3001/api | http://localhost:3001/api-docs | - | http://localhost:5174 |
| 本地部署 | http://localhost:5173 | http://localhost:3001/api | http://localhost:3001/api-docs | - | http://localhost:5174 |

## 前端页面

### 核心页面（需登录）
| 页面 | 路径 | 说明 |
|------|------|------|
| 首页/农场 | / | 农场主页面，显示地块和作物 |
| 商店 | /shop | 购买种子和道具 |
| 背包 | /inventory | 管理种子、作物、道具库存 |
| 货币流水 | /currency-log | 查看收支记录和统计 |
| 队列管理 | /queue-manager | 管理后台任务队列 |

### 认证页面
| 页面 | 路径 | 说明 |
|------|------|------|
| 登录 | /login | 用户登录页面 |
| 注册 | /register | 新用户注册 |
| 忘记密码 | /forgot-password | 密码重置流程 |
| 重置密码 | /reset-password | 完成密码重置 |

## 管理员后台（需管理员权限）

### 核心管理
| 页面 | 路径 | 说明 |
|------|------|------|
| 管理员入口 | /admin | 自动重定向到仪表板 |
| 仪表板 | /admin/dashboard | 管理后台首页，数据概览 |
| 玩家管理 | /admin/players | 玩家列表和管理 |
| 审批管理 | /admin/approvals | 待审批事项处理 |

### 监控与日志
| 页面 | 路径 | 说明 |
|------|------|------|
| 日志管理 | /admin/logs | 系统日志查询和分析 |
| 系统监控 | /admin/monitoring | 系统性能监控 |
| 告警管理 | /admin/alerts | 告警配置和历史 |
| 日志分析 | /admin/log-analysis | 高级日志分析 |

### 数据与统计
| 页面 | 路径 | 说明 |
|------|------|------|
| 货币管理 | /admin/currency | 货币系统管理 |
| 统计分析 | /admin/statistics | 数据统计和报表 |
| 备份管理 | /admin/backup | 数据备份和恢复 |
| 数据库管理 | /admin/database | 数据库性能管理 |

### 配置与权限
| 页面 | 路径 | 说明 |
|------|------|------|
| 角色管理 | /admin/roles | 角色和权限配置 |
| 审计日志 | /admin/audit-logs | 操作审计日志 |
| 公告管理 | /admin/announcements | 游戏公告发布 |
| 配置管理 | /admin/configs | 游戏参数配置 |
| 配置热更新 | /admin/config-hot-update | 配置在线更新 |

### 其他功能
| 页面 | 路径 | 说明 |
|------|------|------|
| 批量操作 | /admin/batch-operations | 批量处理任务 |
| 告警推送 | /admin/alerts-push | 实时预警推送管理 |
| 性能管理 | /admin/performance | 性能优化配置 |
| 健康检查 | /admin/health-check | 系统健康状态检查 |
| 系统状态 | /admin/system-state | 系统状态概览 |
| 文档中心 | /admin/docs | 管理文档查看 |
| 游戏活动 | /admin/game-events | 活动管理和配置 |
