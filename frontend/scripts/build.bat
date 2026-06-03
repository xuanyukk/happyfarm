@echo off
REM 文件名：build.bat
REM 作者：DevOps团队
REM 日期：2026-05-21
REM 版本：v1.0.0
REM 功能描述：Windows平台前端构建优化脚本

echo ==========================================
echo   开心农场前端构建优化脚本
echo ==========================================
echo.

REM 设置错误检查
setlocal enabledelayedexpansion

REM 1. 清理旧构建
echo [1/5] 清理旧构建...
call npm run clean
if %errorlevel% neq 0 (
    echo 清理失败
    exit /b 1
)
echo 清理完成
echo.

REM 2. 优化依赖
echo [2/5] 优化依赖...
call npm run optimize:deps
if %errorlevel% neq 0 (
    echo 依赖优化失败
    exit /b 1
)
echo 依赖优化完成
echo.

REM 3. 代码检查
echo [3/5] 代码检查...
call npm run lint
if %errorlevel% neq 0 (
    echo 代码检查失败，请修复问题
    exit /b 1
)
echo 代码检查完成
echo.

REM 4. 执行构建
echo [4/5] 执行生产构建...
call npm run build
if %errorlevel% neq 0 (
    echo 构建失败
    exit /b 1
)
echo 构建完成
echo.

REM 5. 显示构建结果
echo [5/5] 构建统计...
if exist dist (
    echo.
    echo 构建输出目录：
    dir /s /b dist\assets\*.js 2>nul || echo 未找到JS文件
    echo.
)

echo.
echo ==========================================
echo   构建成功完成！
echo ==========================================
echo.
echo 下一步：
echo   - 运行 'npm run build:analyze' 分析Bundle
echo   - 运行 'npm run preview' 预览构建结果
echo   - 部署到生产环境
echo.

endlocal

