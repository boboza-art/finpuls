#!/usr/bin/env tsx
// ============================================================
// 重新处理所有条目的标签和推荐理由
// 在标签规则更新后运行，确保历史数据一致
// ============================================================

import { getDb, saveDb, queryAll, execute } from "../lib/db";
import { autoTag } from "../lib/tags";
import { generateNote } from "../lib/note-generator";
import type { NewsItem } from "../lib/types";
import { aggregateSources } from "../lib/aggregator";

async function reprocessAllItems() {
  const db = await getDb();

  const rows = queryAll<{ id: string; title: string; summary: string; source_id: string; source_name: string; source_url: string; heat_score: number; is_featured: number; tags: string; published_at: number; created_at: number; additional_sources: string; related_stocks: string; related_cryptos: string }>(
    db,
    `SELECT id, title, summary, source_id, source_name, source_url, heat_score, is_featured, tags, published_at, created_at, additional_sources, related_stocks, related_cryptos FROM items`
  );

  console.log(`找到 ${rows.length} 条需要重新处理的条目`);

  for (const row of rows) {
    const tags = autoTag(row.title, row.summary || "");
    const relatedStocks = tags.filter((t) => ["Apple", "Microsoft", "Google", "Amazon", "Meta", "Tesla", "NVIDIA", "SpaceX"].includes(t));
    const relatedCryptos = tags.filter((t) => ["BTC", "ETH", "BNB", "SOL", "XRP"].includes(t));

    const item: NewsItem = {
      id: row.id,
      title: row.title,
      titleCn: "",
      summary: row.summary || "",
      summaryCn: "",
      sourceId: row.source_id || "",
      sourceName: row.source_name || "",
      sourceUrl: row.source_url || "",
      heatScore: row.heat_score || 50,
      isFeatured: row.is_featured === 1,
      isCompleted: false,
      tags,
      publishedAt: row.published_at || 0,
      createdAt: row.created_at || Date.now(),
      additionalSources: JSON.parse(row.additional_sources || "[]"),
      relatedStocks,
      relatedCryptos,
    };

    const note = generateNote(item);

    execute(
      db,
      `UPDATE items SET tags = ?, related_stocks = ?, related_cryptos = ?, note = ? WHERE id = ?`,
      [JSON.stringify(tags), JSON.stringify(relatedStocks), JSON.stringify(relatedCryptos), note, row.id]
    );

    // 清空并重建标签关联
    execute(db, `DELETE FROM item_tags WHERE item_id = ?`, [row.id]);
    for (const tag of tags) {
      execute(db, `INSERT OR IGNORE INTO item_tags (item_id, tag) VALUES (?, ?)`, [row.id, tag]);
    }
  }

  saveDb(db);

  // 重新聚合多信源
  const aggStats = await aggregateSources();
  console.log(`多信源聚合: 合并 ${aggStats.merged} 条，更新 ${aggStats.updatedHeat} 条热度`);

  console.log(`✓ 已重新处理 ${rows.length} 条条目`);
}

reprocessAllItems().then(() => process.exit(0));
