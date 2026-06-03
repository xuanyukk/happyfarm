#!/usr/bin/env node
/**
 * 文件名: model-status.cjs
 * 作者: 开发者
 * 日期: 2026-05-29
 * 版本: v1.0.0
 * 功能描述: 快速查看模型使用状态与额度情况
 */

const path = require('path');
const { loadEnvConfig, ModelManager } = require('./ark-api.cjs');

const config = loadEnvConfig();
const manager = new ModelManager(config);

console.log("\n" + "=".repeat(60));
console.log("Happy Farm Model Usage Status");
console.log("=".repeat(60));
console.log("");

const tracker = manager.tracker;
const primaryKey = config.cropModel;

console.log("[Primary Model]");
console.log("  Name: Seedream 4.5");
console.log("  Usage: " + tracker.getUsage(primaryKey) + "/200 张");
console.log("  Remaining: " + tracker.getRemainingQuota(primaryKey) + " 张");
console.log("  Usage Ratio: " + ((tracker.getUsage(primaryKey) / 200) * 100).toFixed(1) + "%");
console.log("");

console.log("[Backup Model]");
console.log("  Name: Seedream 5.0 Lite");
console.log("  Usage: 0/50 张");
console.log("  Remaining: 50 张");
console.log("");

console.log("[Total Available]");
console.log("  Remaining: " + (tracker.getRemainingQuota(primaryKey) + 50) + " 张");
console.log("");

console.log("[Project Requirements]");
console.log("  Total need: 640 images");
console.log("  Current coverage: " + (tracker.getRemainingQuota(primaryKey) + 50) + " images");
const gap = 640 - (tracker.getRemainingQuota(primaryKey) + 50);
if (gap > 0) {
  console.log("  Shortage: " + gap + " images");
} else {
  console.log("  OK: sufficient quota");
}
console.log("");

console.log("=".repeat(60));
console.log("Suggested Generation Order");
console.log("=".repeat(60));
console.log("");
console.log("  1. Basic crops (1-15)     -> 90 images (can complete)");
console.log("  2. Economic crops (16-34) -> 114 images (partial)");
console.log("  3. UI/Seeds/Items/Land   -> 220 images (need more quota)");
console.log("  4. Rare/Top crops        -> 300 images (need more quota)");
console.log("");
console.log("Quick commands:");
console.log("  node kolors-generate-crops.cjs --type basic");
console.log("  node kolors-generate-crops.cjs --type economic");
console.log("  node generateIcons.cjs --type ui");
console.log("");

if (tracker.getRemainingQuota(primaryKey) > 100) {
  console.log("[OK] Suggest start generating remaining content now");
} else if (tracker.getRemainingQuota(primaryKey) > 30) {
  console.log("[Warning] Quota will be exhausted soon");
} else {
  console.log("[Critical] Quota too low, consider backup plan");
}
console.log("");
