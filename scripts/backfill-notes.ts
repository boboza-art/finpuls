#!/usr/bin/env tsx
// ============================================================
// 为已有条目批量生成推荐理由
// 用于回填种子数据中 note 为空的条目
// ============================================================

import { getDb, saveDb, queryAll, execute } from "../lib/db";
import { generateNote } from "../lib/note-generator";
import type { NewsItem } from "../lib/types";

async function backfillNotes() {
  const db = await getDb();

  // 查找 note 为空的条目
  const rows = queryAll<{ id: string; title: string; summary: string; source_id: string; source_name: string; source_url: string; heat_score: number; is_featured: number; tags: string; published_at: number; created_at: number; additional_sources: string; related_stocks: string; related_cryptos: string }>(
    db,
    `SELECT id, title, summary, source_id, source_name, source_url, heat_score, is_featured, tags, published_at, created_at, additional_sources, related_stocks, related_cryptos
     FROM items WHERE note IS NULL OR note = ''`
  );

  console.log(`找到 ${rows.length} 条需要回填推荐理由的条目`);

  let updated = 0;
  for (const row of rows) {
    const item: NewsItem = {
      id: row.id,
      title: row.title,
      summary: row.summary || "",
      sourceId: row.source_id || "",
      sourceName: row.source_name || "",
      sourceUrl: row.source_url || "",
      heatScore: row.heat_score || 50,
      isFeatured: row.is_featured === 1,
      isCompleted: false,
      tags: JSON.parse(row.tags || "[]"),
      publishedAt: row.published_at || 0,
      createdAt: row.created_at || Date.now(),
      additionalSources: JSON.parse(row.additional_sources || "[]"),
      relatedStocks: JSON.parse(row.related_stocks || "[]"),
      relatedCryptos: JSON.parse(row.related_cryptos || "[]"),
    };

    const note = generateNote(item);
    execute(db, `UPDATE items SET note = ? WHERE id = ?`, [note, row.id]);
    updated++;
  }

  saveDb(db);
  console.log(`✓ 已回填 ${updated} 条推荐理由`);
}

backfillNotes().then(() => process.exit(0));
