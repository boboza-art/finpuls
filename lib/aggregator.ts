// ============================================================
// 多信源自动聚合引擎
// 扫描最近条目，将同一事件的多信源报道合并到主条目
// ============================================================

import { getDb, saveDb, queryAll, execute } from "./db";
import { jaccardSimilarity } from "./dedup";
import { calculateHeatScore } from "./heat";
import type { NewsItem } from "./types";

interface AggregationStats {
  scanned: number;
  merged: number;
  updatedHeat: number;
}

/**
 * 聚合主流程：
 * 1. 获取最近 72 小时的所有条目
 * 2. 按相似度分组
 * 3. 将相似条目的信源合并到主条目
 * 4. 重新计算热度评分
 */
export async function aggregateSources(): Promise<AggregationStats> {
  const db = await getDb();
  const stats: AggregationStats = { scanned: 0, merged: 0, updatedHeat: 0 };

  // 获取最近 72 小时的条目，按时间倒序（新的优先作为主条目）
  const items = queryAll<{
    id: string;
    title: string;
    source_name: string;
    source_url: string;
    source_id: string;
    heat_score: number;
    published_at: number;
    tags: string;
  }>(
    db,
    `SELECT id, title, source_name, source_url, source_id, heat_score, published_at, tags
     FROM items
     WHERE is_completed = 0 AND published_at > ?
     ORDER BY published_at DESC`,
    [Date.now() - 72 * 60 * 60 * 1000]
  );

  stats.scanned = items.length;

  // 标记已处理的条目（已被合并的不再作为主条目）
  const processed = new Set<string>();

  // 用于更新信源数和热度的批量操作
  const updates: {
    mainId: string;
    sources: { name: string; url: string; sourceId: string; weight: number; publishedAt: number }[];
  }[] = [];

  for (let i = 0; i < items.length; i++) {
    const main = items[i];
    if (processed.has(main.id)) continue;

    const similar: typeof items = [];
    for (let j = i + 1; j < items.length; j++) {
      const candidate = items[j];
      if (processed.has(candidate.id)) continue;

      const sim = jaccardSimilarity(main.title, candidate.title);
      const timeDiff = Math.abs(main.published_at - candidate.published_at);

      // 相似度 > 0.4 且时间差 < 24h
      if (sim >= 0.4 && timeDiff < 24 * 60 * 60 * 1000) {
        similar.push(candidate);
        processed.add(candidate.id);
      }
    }

    if (similar.length > 0) {
      const sources = similar.map((s) => ({
        name: s.source_name,
        url: s.source_url,
        sourceId: s.source_id,
        weight: 50, // 默认权重
        publishedAt: s.published_at,
      }));

      updates.push({ mainId: main.id, sources });

      // 标记被合并的条目为已完成（从时间线隐藏，保留数据）
      for (const s of similar) {
        execute(
          db,
          `UPDATE items SET is_completed = 1 WHERE id = ?`,
          [s.id]
        );
      }

      stats.merged += similar.length;
    }
  }

  // 执行信源合并和热度更新
  for (const { mainId, sources } of updates) {
    // 插入多信源记录
    for (const s of sources) {
      execute(
        db,
        `INSERT OR IGNORE INTO item_sources (item_id, source_name, source_url) VALUES (?, ?, ?)`,
        [mainId, s.name, s.url]
      );
    }

    // 重新计算热度评分
    const mainItem = items.find((i) => i.id === mainId);
    if (mainItem) {
      const totalSources = sources.length + 1;
      const mainWeight = getSourceWeight(mainItem.source_id);
      const newHeat = calculateHeatScore({
        sourceWeight: mainWeight,
        sourceCount: totalSources,
        publishedAt: mainItem.published_at,
      });

      execute(
        db,
        `UPDATE items SET heat_score = ?, is_featured = ? WHERE id = ?`,
        [newHeat, newHeat >= 85 ? 1 : 0, mainId]
      );
      stats.updatedHeat++;
    }
  }

  saveDb(db);
  return stats;
}

// 信源权重查询缓存
const SOURCE_WEIGHTS: Record<string, number> = {};
function getSourceWeight(sourceId: string): number {
  if (SOURCE_WEIGHTS[sourceId] !== undefined) return SOURCE_WEIGHTS[sourceId];
  return 50;
}

/**
 * 初始化信源权重缓存
 */
export async function initSourceWeights(): Promise<void> {
  const db = await getDb();
  const sources = queryAll<{ id: string; weight: number }>(
    db,
    `SELECT id, weight FROM sources`
  );
  for (const s of sources) {
    SOURCE_WEIGHTS[s.id] = s.weight;
  }
}
