import { getDb, queryAll, queryOne } from "./db";
import type { NewsItem, Source, PriceData } from "./types";

/** 将数据库行映射为 NewsItem 对象 */
function rowToItem(row: Record<string, unknown>): NewsItem {
  return {
    id: row.id as string,
    title: row.title as string,
    summary: (row.summary as string) || "",
    sourceId: (row.source_id as string) || "",
    sourceName: (row.source_name as string) || "",
    sourceUrl: (row.source_url as string) || "",
    sourceAvatar: (row.source_avatar as string) || "",
    heatScore: (row.heat_score as number) || 50,
    isFeatured: row.is_featured === 1,
    isCompleted: row.is_completed === 1,
    tags: JSON.parse((row.tags as string) || "[]"),
    publishedAt: (row.published_at as number) || 0,
    createdAt: (row.created_at as number) || 0,
    note: (row.note as string) || "",
    additionalSources: JSON.parse((row.additional_sources as string) || "[]"),
    relatedStocks: JSON.parse((row.related_stocks as string) || "[]"),
    relatedCryptos: JSON.parse((row.related_cryptos as string) || "[]"),
  };
}

/** 获取头条精选（当日 Top 2 热度） */
export async function getFeaturedItems(): Promise<NewsItem[]> {
  const db = await getDb();
  const rows = queryAll(
    db,
    `SELECT * FROM items WHERE is_completed = 0 AND is_featured = 1 ORDER BY heat_score DESC, published_at DESC LIMIT 2`
  );
  return rows.map(rowToItem);
}

/** 获取按日期分组的时间线 */
export async function getTimeline(limit = 50, tag?: string): Promise<{ date: string; items: NewsItem[] }[]> {
  const db = await getDb();

  let sql = `SELECT * FROM items WHERE is_completed = 0`;
  const params: unknown[] = [];
  if (tag) {
    sql += ` AND id IN (SELECT item_id FROM item_tags WHERE tag = ?)`;
    params.push(tag);
  }
  sql += ` ORDER BY published_at DESC LIMIT ?`;
  params.push(limit);

  const rows = queryAll(db, sql, params);
  const items = rows.map(rowToItem);

  // 按日期分组（东八区）
  const groups: Record<string, NewsItem[]> = {};
  for (const item of items) {
    const date = new Date(item.publishedAt + 8 * 60 * 60 * 1000).toISOString().split("T")[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
  }

  return Object.entries(groups)
    .map(([date, items]) => ({ date, items }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** 获取单条资讯详情 */
export async function getItemById(id: string): Promise<NewsItem | null> {
  const db = await getDb();
  const row = queryOne(db, `SELECT * FROM items WHERE id = ?`, [id]);
  return row ? rowToItem(row) : null;
}

/** 获取所有信源 */
export async function getSources(): Promise<Source[]> {
  const db = await getDb();
  const rows = queryAll(db, `SELECT * FROM sources ORDER BY weight DESC`);
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    type: r.type as Source["type"],
    url: r.url as string,
    avatar: (r.avatar as string) || "",
    weight: (r.weight as number) || 50,
    category: (r.category as string) || "",
  }));
}

/** 获取所有标签及使用次数 */
export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const db = await getDb();
  const rows = queryAll<{ tag: string; count: number }>(
    db,
    `SELECT tag, COUNT(*) as count FROM item_tags GROUP BY tag ORDER BY count DESC, tag ASC`
  );
  return rows;
}

/** 获取价格缓存 */
export async function getPricesFromCache(): Promise<PriceData[]> {
  const db = await getDb();
  const rows = queryAll(db, `SELECT * FROM price_cache`);
  return rows.map((r) => ({
    symbol: r.symbol as string,
    name: r.name as string,
    price: r.price as number,
    change24h: r.change_24h as number,
    changeAmount: r.change_amount as number,
    volume24h: r.volume_24h as number,
    marketCap: r.market_cap as number,
    updatedAt: r.updated_at as number,
  }));
}
