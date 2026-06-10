# -*- coding: utf-8 -*-
# 文件名：format_vue_headers.py
# 作者：Trae AI
# 日期：2026-06-09
# 版本：v1.0.0
# 功能描述：批量格式化 .vue 文件的压缩文件头注释为标准多行格式

import os
import re
import glob

VUE_DIR = r'g:\youxi\ceshi\happy-farm\frontend\src'

# 已经是标准多行格式的文件，跳过
SKIP_FILES = {
    'Home.vue',
    'LoginPage.vue',
    'ErrorBoundary.vue',
    'ProfileModal.vue',
    'OfflineRewardsModal.vue',
}


def find_vue_files(base_dir):
    """递归查找所有 .vue 文件"""
    pattern = os.path.join(base_dir, '**', '*.vue')
    return glob.glob(pattern, recursive=True)


def format_comment_block(old_block):
    """
    将压缩格式的注释块转换为标准多行格式
    压缩格式: /** * A * B * C\n * D * E */
    标准格式: /**\n * A\n * B\n * C\n * D\n * E\n */
    """
    # 提取 /** 和 */ 之间的内容
    match = re.match(r'/\*\*\s*\*?\s*(.*?)\s*\*/', old_block, re.DOTALL)
    if not match:
        return old_block

    inner = match.group(1).strip()

    # 将所有换行替换为空格（折叠多行）
    inner = re.sub(r'\s+', ' ', inner).strip()

    # 按 " * " 分割所有条目
    # 先处理开头的 "* "
    if inner.startswith('* '):
        inner = inner[2:]

    items = inner.split(' * ')

    # 清理空项
    items = [item.strip() for item in items if item.strip()]

    if len(items) < 3:
        return old_block  # 字段太少，不处理

    # 构建标准多行格式
    lines = ['/**']
    for item in items:
        lines.append(f' * {item}')
    lines.append(' */')

    return '\n'.join(lines)


def format_single_vue(filepath):
    """格式化单个 .vue 文件的文件头注释"""
    filename = os.path.basename(filepath)

    if filename in SKIP_FILES:
        return None

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 匹配文件开头的 /** ... */ 注释块
    match = re.match(r'(/\*\*.*?\*/)', content, re.DOTALL)
    if not match:
        return None

    old_block = match.group(1)

    # 如果已经是标准多行格式（每行一个 *），跳过
    lines = old_block.split('\n')
    if len(lines) > 6:
        return None

    new_block = format_comment_block(old_block)

    # 如果格式化后和原来一样，跳过
    if new_block == old_block:
        return None

    # 替换并保留后续内容
    new_content = new_block + content[len(old_block):]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    return filepath


def main():
    """主函数"""
    vue_files = find_vue_files(VUE_DIR)
    print(f'找到 {len(vue_files)} 个 .vue 文件\n')

    formatted = []
    skipped = []
    no_change = []
    for filepath in sorted(vue_files):
        filename = os.path.basename(filepath)
        if filename in SKIP_FILES:
            skipped.append(filename)
            continue

        result = format_single_vue(filepath)
        if result:
            relpath = os.path.relpath(filepath, VUE_DIR)
            formatted.append(relpath)
            print(f'  ✓ {relpath}')
        else:
            no_change.append(os.path.relpath(filepath, VUE_DIR))

    print(f'\n--- 统计 ---')
    print(f'跳过（已是标准格式）: {len(skipped)} 个')
    for s in skipped:
        print(f'  - {s}')
    print(f'格式化: {len(formatted)} 个')
    print(f'无需处理: {len(no_change)} 个')

    return formatted


if __name__ == '__main__':
    formatted_files = main()
    print(f'\n总计格式化 {len(formatted_files)} 个文件')