# RBAC 权限控制

本文档介绍开心农场项目的 RBAC（基于角色的访问控制）系统。

## 概述

RBAC 系统提供灵活的权限控制机制，支持用户-角色-权限三层架构。

## 核心概念

### 用户 (User
- 系统用户（管理员）
- 拥有角色分配

### 角色 (Role)
- 权限集合
- 可继承
- 可自定义

### 权限 (Permission)
- 功能级权限
- 操作级权限
- 数据级权限

## 主要功能

### 角色管理
- 创建角色
- 编辑角色
- 删除角色
- 角色权限分配

### 权限管理
- 权限定义
- 权限分组
- 权限检查

### 用户管理
- 用户创建
- 角色分配
- 权限检查

## 权限检查流程

1. 用户发起请求
2. 检查用户认证
3. 获取用户角色
4. 检查角色权限
5. 允许或拒绝访问

## API 接口

### 角色相关
- `GET /api/admin/roles` - 获取角色列表
- `POST /api/admin/roles` - 创建角色
- `PUT /api/admin/roles/:id` - 更新角色
- `DELETE /api/admin/roles/:id` - 删除角色

### 权限相关
- `GET /api/admin/permissions` - 获取权限列表
- `POST /api/admin/roles/:id/permissions` - 分配角色权限

### 用户相关
- `GET /api/admin/users` - 获取用户列表
- `POST /api/admin/users/:id/roles` - 分配用户角色

## 相关文档

- [系统架构](../architecture/system)
