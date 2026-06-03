#!/bin/bash

# 文件名：build.sh
# 作者：DevOps团队
# 日期：2026-05-21
# 版本：v1.0.0
# 功能描述：前端构建优化脚本

set -e

echo "=========================================="
echo "  开心农场前端构建优化脚本"
echo "=========================================="
echo ""

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 清理旧构建
echo -e "${YELLOW}[1/5] 清理旧构建...${NC}"
npm run clean
echo -e "${GREEN}✓ 清理完成${NC}"
echo ""

# 2. 优化依赖
echo -e "${YELLOW}[2/5] 优化依赖...${NC}"
npm run optimize:deps
echo -e "${GREEN}✓ 依赖优化完成${NC}"
echo ""

# 3. 代码检查
echo -e "${YELLOW}[3/5] 代码检查...${NC}"
npm run lint
echo -e "${GREEN}✓ 代码检查完成${NC}"
echo ""

# 4. 执行构建
echo -e "${YELLOW}[4/5] 执行生产构建...${NC}"
npm run build
echo -e "${GREEN}✓ 构建完成${NC}"
echo ""

# 5. 显示构建结果
echo -e "${YELLOW}[5/5] 构建统计...${NC}"
if [ -d "dist" ]; then
    echo ""
    echo "构建输出目录："
    ls -lh dist/
    echo ""
    
    echo "JS文件大小统计（Gzip）："
    if command -v gzip &> /dev/null; then
        for file in dist/assets/*.js; do
            if [ -f "$file" ]; then
                original=$(ls -lh "$file" | awk '{print $5}')
                gzipped=$(gzip -c "$file" | wc -c | numfmt --to=iec)
                echo "  $(basename $file): $original (gzipped: ~${gzipped}B)"
            fi
        done
    else
        ls -lh dist/assets/ | grep ".js"
    fi
    echo ""
fi

echo ""
echo -e "${GREEN}=========================================="
echo "  ✓ 构建成功完成！"
echo -e "==========================================${NC}"
echo ""
echo "下一步："
echo "  - 运行 'npm run build:analyze' 分析Bundle"
echo "  - 运行 'npm run preview' 预览构建结果"
echo "  - 部署到生产环境"
echo ""

