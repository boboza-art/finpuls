import { type Source } from "./types";
import { getDb, saveDb, execute } from "./db";

// ============================================================
// 信源定义
// ============================================================

const SOURCES: Source[] = [
  // 财经媒体 RSS
  { id: "cnbc", name: "CNBC", type: "rss", url: "https://www.cnbc.com", weight: 75, category: "财经媒体" },
  { id: "reuters", name: "Reuters", type: "rss", url: "https://www.reuters.com", weight: 80, category: "财经媒体" },
  { id: "bloomberg", name: "Bloomberg", type: "rss", url: "https://www.bloomberg.com", weight: 85, category: "财经媒体" },
  { id: "wsj-markets", name: "WSJ MarketWatch", type: "rss", url: "https://www.marketwatch.com", weight: 78, category: "财经媒体" },
  // 官方博客
  { id: "tesla-blog", name: "Tesla 股东信", type: "blog", url: "https://www.tesla.com/blog", weight: 90, category: "官方博客" },
  { id: "nvidia-blog", name: "NVIDIA Blog", type: "blog", url: "https://blogs.nvidia.com", weight: 88, category: "官方博客" },
  { id: "apple-newsroom", name: "Apple Newsroom", type: "blog", url: "https://www.apple.com/newsroom", weight: 87, category: "官方博客" },
  { id: "meta-newsroom", name: "Meta Newsroom", type: "blog", url: "https://about.meta.com", weight: 85, category: "官方博客" },
  // 公司高管
  { id: "timcook", name: "Tim Cook (@tim_cook)", type: "twitter", url: "https://twitter.com/tim_cook", weight: 82, category: "公司高管" },
  { id: "satyanadella", name: "Satya Nadella (@satyanadella)", type: "twitter", url: "https://twitter.com/satyanadella", weight: 80, category: "公司高管" },
  // 中文财经
  { id: "wallstreetcn-live", name: "华尔街见闻", type: "rss", url: "https://wallstreetcn.com", weight: 76, category: "中文财经" },
  // SEC 公告
  { id: "sec-edgar", name: "SEC EDGAR", type: "api", url: "https://www.sec.gov/edgar", weight: 95, category: "监管公告" },
];

// ============================================================
// 种子函数 —— 仅初始化信源和价格缓存
// 新闻数据全部来自 RSS 实时抓取（lib/fetch-rss.ts）
// ============================================================

/** 初始化信源表 */
export async function seedDatabase(): Promise<void> {
  const db = await getDb();

  for (const source of SOURCES) {
    execute(
      db,
      `INSERT OR REPLACE INTO sources (id, name, type, url, avatar, weight, category)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [source.id, source.name, source.type, source.url, source.avatar || "", source.weight, source.category]
    );
  }

  saveDb(db);
  console.log(`✓ 种子信源已写入: ${SOURCES.length} 个`);
}

/** 插入价格缓存（仅作 fallback，运行时由 CoinGecko 实时覆盖） */
export async function seedPrices(): Promise<void> {
  const db = await getDb();
  const prices = [
    { symbol: "BTC", name: "Bitcoin", price: 0, change24h: 0, changeAmount: 0, volume24h: 0, marketCap: 0 },
    { symbol: "ETH", name: "Ethereum", price: 0, change24h: 0, changeAmount: 0, volume24h: 0, marketCap: 0 },
    { symbol: "BNB", name: "BNB", price: 0, change24h: 0, changeAmount: 0, volume24h: 0, marketCap: 0 },
    { symbol: "SOL", name: "Solana", price: 0, change24h: 0, changeAmount: 0, volume24h: 0, marketCap: 0 },
    { symbol: "XRP", name: "Ripple", price: 0, change24h: 0, changeAmount: 0, volume24h: 0, marketCap: 0 },
  ];

  for (const p of prices) {
    execute(
      db,
      `INSERT OR REPLACE INTO price_cache
        (symbol, name, price, change_24h, change_amount, volume_24h, market_cap, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.symbol, p.name, p.price, p.change24h, p.changeAmount, p.volume24h, p.marketCap, Date.now()]
    );
  }
  saveDb(db);
  console.log(`✓ 价格缓存已初始化: ${prices.length} 个币种`);
}

// CLI 入口
if (require.main === module) {
  (async () => {
    await seedDatabase();
    await seedPrices();
    process.exit(0);
  })();
}
