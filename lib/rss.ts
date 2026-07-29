// ============================================================
// RSS 聚合器
// 从多个 RSS 信源拉取最新条目，解析、去重、评分、打标签
// ============================================================

import Parser from "rss-parser";
import type { NewsItem } from "./types";
import { RSS_SOURCES, type RssSource } from "./rss-sources";
import { findDuplicate } from "./dedup";
import { calculateHeatScore } from "./heat";
import { autoTag, isBreakingNews, isEarningsNews, isSECNews } from "./tags";
import { generateNote } from "./note-generator";
import { translateText } from "./translate";
import { recordFetch } from "./health";
import { getDb, saveDb, queryAll, execute } from "./db";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "FinPulseBot/1.0 (news aggregator; +https://finpulse.app)",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
});

// ============================================================
// CUID 生成器
// ============================================================

function cuid(prefix = "c"): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 12);
  return `${prefix}${time}${rand}`;
}

// ============================================================
// 单个信源抓取
// ============================================================

interface FetchResult {
  source: RssSource;
  items: ParsedItem[];
  error?: string;
}

interface ParsedItem {
  title: string;
  link: string;
  content: string;
  pubDate: number;
  author?: string;
}

/**
 * 抓取单个 RSS 信源
 */
export async function fetchSource(source: RssSource): Promise<FetchResult> {
  const startTime = Date.now();
  try {
    const feed = await parser.parseURL(source.url);
    const items: ParsedItem[] = (feed.items || [])
      .slice(0, 20) // 每个信源最多取 20 条
      .map((item) => {
        const pubDate = item.isoDate
          ? new Date(item.isoDate).getTime()
          : item.pubDate
          ? new Date(item.pubDate).getTime()
          : Date.now();
        return {
          title: item.title || "",
          link: item.link || "",
          content: item.contentSnippet || item.content || item.summary || "",
          pubDate,
          author: item.creator || item.author,
        };
      })
      .filter((item) => item.title && item.pubDate > 0);

    // 记录健康数据
    const latency = Date.now() - startTime;
    await recordFetch(source.id, source.name, true, items.length, latency);

    return { source, items };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // 记录错误
    const latency = Date.now() - startTime;
    await recordFetch(source.id, source.name, false, 0, latency, msg);
    return { source, items: [], error: msg };
  }
}

// ============================================================
// 多信源并发抓取
// ============================================================

/**
 * 并发抓取所有信源
 * @param batchSize 并发批次大小
 */
export async function fetchAllSources(batchSize = 5): Promise<FetchResult[]> {
  const results: FetchResult[] = [];
  // 分批并发
  for (let i = 0; i < RSS_SOURCES.length; i += batchSize) {
    const batch = RSS_SOURCES.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((source) => fetchSource(source))
    );
    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
    }
  }
  return results;
}

// ============================================================
// 条目处理流水线：去重 → 评分 → 打标签 → 存库
// ============================================================

export interface ProcessStats {
  totalFetched: number;
  newItems: number;
  duplicates: number;
  errors: number;
  sourcesOk: number;
  sourcesFailed: number;
}

/**
 * 处理所有抓取结果，写入数据库
 */
export async function processAndStore(fetchResults: FetchResult[]): Promise<ProcessStats> {
  const db = await getDb();
  const stats: ProcessStats = {
    totalFetched: 0,
    newItems: 0,
    duplicates: 0,
    errors: 0,
    sourcesOk: fetchResults.filter((r) => !r.error).length,
    sourcesFailed: fetchResults.filter((r) => r.error).length,
  };

  // 获取最近 72 小时的已有条目，用于去重
  const recentRows = queryAll<{ id: string; title: string; published_at: number }>(
    db,
    `SELECT id, title, published_at FROM items WHERE published_at > ? ORDER BY published_at DESC LIMIT 200`,
    [Date.now() - 72 * 60 * 60 * 1000]
  );
  const recentItems = recentRows.map((r) => ({
    id: r.id,
    title: r.title,
    publishedAt: r.published_at,
  }));

  // 收集所有新条目（跨信源去重前先收集）
  const allNewItems: { source: RssSource; item: ParsedItem }[] = [];
  for (const result of fetchResults) {
    if (result.error) {
      stats.errors++;
      continue;
    }
    for (const item of result.items) {
      allNewItems.push({ source: result.source, item });
      stats.totalFetched++;
    }
  }

  // 按发布时间倒序排列（新的优先）
  allNewItems.sort((a, b) => b.item.pubDate - a.item.pubDate);

  // 已插入的标题集合（跨信源去重）
  const insertedTitles: { title: string; pubDate: number }[] = [];

  for (const { source, item } of allNewItems) {
    // 1. 与已有库内条目去重
    const dupId = findDuplicate(item.title, item.pubDate, recentItems);
    if (dupId) {
      stats.duplicates++;
      // 如果是重复，把该信源添加到 additionalSources
      execute(
        db,
        `INSERT OR IGNORE INTO item_sources (item_id, source_name, source_url) VALUES (?, ?, ?)`,
        [dupId, source.name, item.link]
      );
      continue;
    }

    // 2. 跨信源去重（同批次内）
    const batchItems = insertedTitles.map((t, i) => ({ id: String(i), title: t.title, publishedAt: t.pubDate }));
    const batchDup = findDuplicate(item.title, item.pubDate, batchItems);
    if (batchDup) {
      stats.duplicates++;
      continue;
    }

    // 3. 自动标签
    const tags = autoTag(item.title, item.content);

    // 4. 判断事件类型
    const breaking = isBreakingNews(item.title, item.content);
    const earnings = isEarningsNews(item.title, item.content);
    const sec = isSECNews(source.name);

    // 5. 热度评分
    const heatScore = calculateHeatScore({
      sourceWeight: source.weight,
      sourceCount: 1, // 初始为 1，后续聚合会更新
      publishedAt: item.pubDate,
      isBreaking: breaking,
      isEarnings: earnings,
      isSEC: sec,
    });

    // 6. 生成 ID
    const id = cuid();
    const summary = item.content.length > 500 ? item.content.slice(0, 500) + "..." : item.content;

    // 6.5 翻译标题和摘要（英 → 中）
    const [titleCnResult, summaryCnResult] = await Promise.all([
      translateText(item.title),
      translateText(summary),
    ]);
    const titleCn = titleCnResult.translatedText;
    const summaryCn = summaryCnResult.translatedText;

    // 构建临时 NewsItem 对象用于生成推荐理由
    const tempItem: NewsItem = {
      id,
      title: item.title,
      titleCn,
      summary,
      summaryCn,
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: item.link,
      heatScore,
      isFeatured: heatScore >= 85,
      isCompleted: false,
      tags,
      publishedAt: item.pubDate,
      createdAt: Date.now(),
      additionalSources: [],
      relatedStocks: tags.filter((t) => ["Apple", "Microsoft", "Google", "Amazon", "Meta", "Tesla", "NVIDIA", "SpaceX"].includes(t)),
      relatedCryptos: tags.filter((t) => ["BTC", "ETH", "BNB", "SOL", "XRP"].includes(t)),
    };

    // 7. 自动生成推荐理由
    const note = generateNote(tempItem);

    execute(
      db,
      `INSERT OR REPLACE INTO items
        (id, title, title_cn, summary, summary_cn, source_id, source_name, source_url, source_avatar,
         heat_score, is_featured, is_completed, tags, published_at, created_at,
         note, additional_sources, related_stocks, related_cryptos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        item.title,
        titleCn,
        summary,
        summaryCn,
        source.id,
        source.name,
        item.link,
        "",
        heatScore,
        heatScore >= 85 ? 1 : 0, // 热度 >= 85 自动精选
        0,
        JSON.stringify(tags),
        item.pubDate,
        Date.now(),
        note,
        JSON.stringify([]),
        JSON.stringify(tempItem.relatedStocks),
        JSON.stringify(tempItem.relatedCryptos),
      ]
    );

    // 插入标签关联
    for (const tag of tags) {
      execute(db, `INSERT OR IGNORE INTO item_tags (item_id, tag) VALUES (?, ?)`, [id, tag]);
    }

    // 记录已插入
    insertedTitles.push({ title: item.title, pubDate: item.pubDate });
    stats.newItems++;
  }

  saveDb(db);
  return stats;
}

// ============================================================
// 主入口：抓取 + 处理
// ============================================================

export async function runFetcher(): Promise<ProcessStats> {
  console.log(`[${new Date().toISOString()}] 开始抓取 RSS 信源...`);
  console.log(`共 ${RSS_SOURCES.length} 个信源`);

  const fetchResults = await fetchAllSources();
  const stats = await processAndStore(fetchResults);

  console.log(`✓ 抓取完成: ${stats.totalFetched} 条`);
  console.log(`  新增: ${stats.newItems} 条`);
  console.log(`  重复: ${stats.duplicates} 条`);
  console.log(`  错误: ${stats.errors} 个信源`);
  console.log(`  成功: ${stats.sourcesOk}/${RSS_SOURCES.length} 个信源`);

  return stats;
}
