// ============================================================
// 信源健康监控
// 记录每次抓取的结果，提供信源健康查询
// ============================================================

import { getDb, saveDb, queryAll, execute } from "./db";

export interface SourceHealth {
  sourceId: string;
  sourceName: string;
  lastFetchAt: number;
  lastSuccessAt: number;
  lastError: string | null;
  totalFetches: number;
  totalSuccess: number;
  totalErrors: number;
  itemsFetched: number;
  avgLatencyMs: number;
  updatedAt: number;
}

/**
 * 记录一次信源抓取结果
 */
export async function recordFetch(
  sourceId: string,
  sourceName: string,
  success: boolean,
  itemsCount: number,
  latencyMs: number,
  error?: string
): Promise<void> {
  const db = await getDb();
  const now = Date.now();

  // 读取现有记录
  const existing = queryAll<{ total_fetches: number; total_success: number; total_errors: number; items_fetched: number; avg_latency_ms: number; last_success_at: number }>(
    db,
    `SELECT total_fetches, total_success, total_errors, items_fetched, avg_latency_ms, last_success_at FROM source_health WHERE source_id = ?`,
    [sourceId]
  );

  const prev = existing[0] || { total_fetches: 0, total_success: 0, total_errors: 0, items_fetched: 0, avg_latency_ms: 0 };

  const newTotal = prev.total_fetches + 1;
  const newSuccess = prev.total_success + (success ? 1 : 0);
  const newErrors = prev.total_errors + (success ? 0 : 1);
  const newItems = prev.items_fetched + itemsCount;
  const newAvgLatency = Math.round((prev.avg_latency_ms * prev.total_fetches + latencyMs) / newTotal);

  execute(
    db,
    `INSERT OR REPLACE INTO source_health
      (source_id, source_name, last_fetch_at, last_success_at, last_error,
       total_fetches, total_success, total_errors, items_fetched, avg_latency_ms, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sourceId,
      sourceName,
      now,
      success ? now : (existing[0]?.last_success_at ?? 0),
      success ? null : (error || "Unknown error"),
      newTotal,
      newSuccess,
      newErrors,
      newItems,
      newAvgLatency,
      now,
    ]
  );
  saveDb(db);
}

/**
 * 获取所有信源健康状态
 */
export async function getSourceHealths(): Promise<SourceHealth[]> {
  const db = await getDb();
  const rows = queryAll(db, `SELECT * FROM source_health ORDER BY last_fetch_at DESC`);
  return rows.map((r) => ({
    sourceId: r.source_id as string,
    sourceName: r.source_name as string,
    lastFetchAt: r.last_fetch_at as number,
    lastSuccessAt: r.last_success_at as number,
    lastError: (r.last_error as string) || null,
    totalFetches: r.total_fetches as number,
    totalSuccess: r.total_success as number,
    totalErrors: r.total_errors as number,
    itemsFetched: r.items_fetched as number,
    avgLatencyMs: r.avg_latency_ms as number,
    updatedAt: r.updated_at as number,
  }));
}

/**
 * 计算信源健康状态
 */
export function healthStatus(h: SourceHealth): "healthy" | "degraded" | "down" {
  if (h.totalFetches === 0) return "down";
  const successRate = h.totalSuccess / h.totalFetches;
  if (successRate >= 0.8) return "healthy";
  if (successRate >= 0.3) return "degraded";
  return "down";
}
