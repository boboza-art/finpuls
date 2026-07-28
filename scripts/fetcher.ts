#!/usr/bin/env tsx
// ============================================================
// 定时采集脚本
// 用法:
//   npx tsx scripts/fetcher.ts          # 单次执行
//   npx tsx scripts/fetcher.ts --watch  # 持续模式（每 15 分钟）
// ============================================================

import { runFetcher } from "../lib/rss";
import { aggregateSources, initSourceWeights } from "../lib/aggregator";
import { updatePriceCache } from "../lib/prices";
import { fetchAndStoreWhales } from "../lib/whale";

async function runOnce(): Promise<void> {
  console.log("========================================");
  console.log(`[${new Date().toLocaleString("zh-CN")}] FinPulse 采集器启动`);
  console.log("========================================");

  // 0. 初始化信源权重缓存
  await initSourceWeights();

  // 1. 抓取 RSS 新闻
  try {
    const stats = await runFetcher();
    if (stats.newItems > 0) {
      console.log(`📰 新闻: 新增 ${stats.newItems} 条`);
    }
  } catch (e) {
    console.error("❌ RSS 抓取失败:", e);
  }

  // 2. 多信源聚合（合并同一事件的多个信源报道）
  try {
    const aggStats = await aggregateSources();
    if (aggStats.merged > 0) {
      console.log(`🔗 多信源聚合: 合并 ${aggStats.merged} 条，更新 ${aggStats.updatedHeat} 条热度`);
    }
  } catch (e) {
    console.error("❌ 多信源聚合失败:", e);
  }

  // 3. 更新价格缓存
  try {
    await updatePriceCache();
    console.log("💰 价格缓存已更新");
  } catch (e) {
    console.error("❌ 价格更新失败:", e);
  }

  // 4. 抓取巨鲸转账
  try {
    const whaleStats = await fetchAndStoreWhales();
    if (whaleStats.inserted > 0) {
      console.log(`🐋 巨鲸监控: 新增 ${whaleStats.inserted} 条大额转账`);
    }
  } catch (e) {
    console.error("❌ 巨鲸监控失败:", e);
  }

  console.log("----------------------------------------");
  console.log("采集周期完成\n");
}

// 持续模式
async function runWatch(intervalMs = 15 * 60 * 1000): Promise<void> {
  console.log(`🔄 持续模式启动，每 ${intervalMs / 60000} 分钟采集一次`);

  // 立即执行一次
  await runOnce();

  // 定时执行
  setInterval(async () => {
    try {
      await runOnce();
    } catch (e) {
      console.error("采集周期出错:", e);
    }
  }, intervalMs);

  // 保持进程运行
  console.log("按 Ctrl+C 退出...");
}

// CLI 入口
const args = process.argv.slice(2);
if (args.includes("--watch")) {
  // 解析间隔参数
  const intervalArg = args.find((a) => a.startsWith("--interval="));
  const interval = intervalArg ? parseInt(intervalArg.split("=")[1]) * 60000 : 15 * 60 * 1000;
  runWatch(interval);
} else {
  runOnce().then(() => process.exit(0));
}
