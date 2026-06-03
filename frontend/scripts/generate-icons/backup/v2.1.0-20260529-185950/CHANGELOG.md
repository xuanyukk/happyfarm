# 开心农场 提示词系统更新日志
# 更新日期: 2026-05-29
# 更新版本: v2.2.0
# 负责人: 开发者
# ==============================================================================

## 更新概览

本次更新基于实验验证结果：Qwen/Qwen-Image 模型对包含精确坐标、
CSS参数（rgba值）和像素级技术规范的复杂提示词处理能力有限，
生成的图片模糊不清。通过简化提示词为简洁自然语言视觉描述，
生成质量得到显著提升。

## 变更详情

### 1. kolors-prompt-builder.cjs (v2.1.0 → v2.2.0)
- 去除所有精确坐标参数: (128,160), 32px, 40px 等
- 去除CSS技术参数: rgba(0,0,0,0.2), rgba(0,0,0,0.15) 等
- 去除像素级约束: 256x256px, 192x192px, 224x224px 等
- COMMON_STYLE 从英文技术术语改为中文自然语言
- 负向提示词大幅扩充，增加更多排除项
- 默认推理步数: 30 → 40
- 默认引导系数: 10 → 12
- 提示词长度缩减约50%

### 2. promptBuilder.cjs (v2.1.0 → v2.2.0)
- 去除所有精确坐标和像素参数
- 去除CSS参数: rgba(0,0,0,0.15), offset(0,4,8) 等
- 提示词从英文改为中文自然语言
- 六类图标模板全部简化
- 负向提示词大幅扩充
- 默认推理步数: 30 → 40
- 默认引导系数: 7.5 → 12

### 3. flux-prompt-builder.cjs (v2.0.0 → v2.1.0)
- 去除过度精度像素坐标: (64,80), 8px, 16px 等
- 去除CSS参数: rgba(0,0,0,0.15), rgba(0,0,0,0.2) 等
- 保留核心特效描述和视觉风格
- 默认推理步数: 35 → 40
- 默认引导系数: 8.0 → 10.0

### 4. .env.example (v2.0.0 → v2.2.0)
- NUM_INFERENCE_STEPS: 30 → 40
- GUIDANCE_SCALE: 7.5 → 12
- FLUX_NUM_INFERENCE_STEPS: 35 → 40
- FLUX_GUIDANCE_SCALE: 8.0 → 10.0
- KOLORS_NUM_INFERENCE_STEPS: 30 → 40
- KOLORS_GUIDANCE_SCALE: 10 → 12

## 备份信息
- 备份路径: backup/v2.1.0-20260529-185950/
- 备份文件数: 11
- 校验状态: 全部通过 SHA256 验证
- 校验报告: backup/v2.1.0-20260529-185950/CHECKSUM-REPORT.txt

## 回滚指南
如需回滚至 v2.1.0 版本:
1. 从 backup/v2.1.0-20260529-185950/ 恢复以下文件:
   - kolors-prompt-builder.cjs
   - promptBuilder.cjs
   - flux-prompt-builder.cjs
   - .env.example
2. 恢复 .env 中的参数配置

## 验证状态
- [x] kolors-prompt-builder.cjs 通过语法检查
- [x] promptBuilder.cjs 通过语法检查
- [x] flux-prompt-builder.cjs 通过语法检查
- [x] 测试生成小麦幼苗图标(1_stage_1.png)成功
- [x] 备份完整性校验通过