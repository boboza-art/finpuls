import type { PriceData } from "./types";
import { getPricesFromCache } from "./queries";
import { getDb, saveDb, execute } from "./db";

const COINGECKO_API = "https://api.coingecko.com/api/v3";

const COIN_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
};

/** 从 CoinGecko 实时获取价格 */
export async function fetchLivePrices(): Promise<PriceData[]> {
  const ids = Object.values(COIN_IDS).join(",");
  const url = `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&include_last_updated_at=true`;

  const res = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: 60 }, // 1 分钟缓存
  });

  if (!res.ok) {
    // 回退到本地缓存
    return getPricesFromCache();
  }

  const data = await res.json();
  const prices: PriceData[] = [];

  for (const [symbol, coinId] of Object.entries(COIN_IDS)) {
    const d = data[coinId];
    if (d) {
      prices.push({
        symbol,
        name: symbol,
        price: d.usd,
        change24h: d.usd_24h_change,
        changeAmount: (d.usd * d.usd_24h_change) / 100,
        volume24h: d.usd_24h_vol,
        marketCap: d.usd_market_cap,
        updatedAt: d.last_updated_at ? d.last_updated_at * 1000 : Date.now(),
      });
    }
  }

  return prices;
}

/** 获取价格（优先实时，回退缓存） */
export async function getPrices(): Promise<PriceData[]> {
  try {
    return await fetchLivePrices();
  } catch {
    return getPricesFromCache();
  }
}

/** 更新价格缓存到数据库 */
export async function updatePriceCache(): Promise<void> {
  const prices = await fetchLivePrices();
  if (prices.length === 0) return;

  const db = await getDb();
  for (const p of prices) {
    execute(
      db,
      `INSERT OR REPLACE INTO price_cache
        (symbol, name, price, change_24h, change_amount, volume_24h, market_cap, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.symbol, p.name, p.price, p.change24h, p.changeAmount, p.volume24h, p.marketCap, p.updatedAt]
    );
  }
  saveDb(db);
}
