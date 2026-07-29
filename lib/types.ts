// ============================================================
// 数据类型定义
// ============================================================

/** 资讯条目 */
export interface NewsItem {
  id: string;
  title: string;
  titleCn: string;
  summary: string;
  summaryCn: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  sourceAvatar?: string;
  heatScore: number; // 0-100
  isFeatured: boolean;
  isCompleted: boolean;
  tags: string[];
  publishedAt: number; // Unix timestamp (ms)
  createdAt: number;
  note?: string; // 编辑推荐理由
  // 多信源聚合
  additionalSources?: { name: string; url: string }[];
  // 关联的公司/币种
  relatedStocks?: string[];
  relatedCryptos?: string[];
}

/** 信源 */
export interface Source {
  id: string;
  name: string;
  type: "rss" | "twitter" | "blog" | "chain" | "api";
  url: string;
  avatar?: string;
  weight: number; // 0-100，影响热度评分
  category: string; // 分类标签
}

/** 标签 */
export interface Tag {
  name: string;
  category: "company" | "crypto" | "event" | "topic" | "sentiment" | "type";
  count: number;
}

/** 价格数据 */
export interface PriceData {
  symbol: string; // BTC, ETH, BNB, SOL, XRP
  name: string;
  price: number;
  change24h: number; // 百分比
  changeAmount: number;
  volume24h: number;
  marketCap: number;
  sparkline?: number[];
  updatedAt: number;
}

/** 美股公司 */
export interface StockCompany {
  ticker: string;
  name: string;
  logo?: string;
  color: string;
}

/** 数字货币 */
export interface CryptoAsset {
  symbol: string;
  name: string;
  color: string;
  logo?: string;
}

/** 定义关注的资产 */
export const STOCKS: StockCompany[] = [
  { ticker: "AAPL", name: "Apple", color: "#A2AAAD" },
  { ticker: "MSFT", name: "Microsoft", color: "#00A4EF" },
  { ticker: "GOOGL", name: "Google", color: "#4285F4" },
  { ticker: "AMZN", name: "Amazon", color: "#FF9900" },
  { ticker: "META", name: "Meta", color: "#0668E1" },
  { ticker: "TSLA", name: "Tesla", color: "#E82127" },
  { ticker: "NVDA", name: "NVIDIA", color: "#76B900" },
  { ticker: "SPACE", name: "SpaceX", color: "#000000" },
];

export const CRYPTOS: CryptoAsset[] = [
  { symbol: "BTC", name: "Bitcoin", color: "#F7931A" },
  { symbol: "ETH", name: "Ethereum", color: "#627EEA" },
  { symbol: "BNB", name: "BNB", color: "#F3BA2F" },
  { symbol: "SOL", name: "Solana", color: "#14F195" },
  { symbol: "XRP", name: "Ripple", color: "#23292F" },
];

/** 标签分类定义 */
export const TAG_CATEGORIES = {
  company: { label: "公司", color: "#3b82f6" },
  crypto: { label: "币种", color: "#8b5cf6" },
  event: { label: "事件", color: "#f97316" },
  topic: { label: "主题", color: "#10b981" },
  sentiment: { label: "情绪", color: "#ef4444" },
  type: { label: "类型", color: "#6b7280" },
} as const;

/** 所有标签定义 */
export const ALL_TAGS: Record<string, Tag> = {
  // 公司
  Apple: { name: "Apple", category: "company", count: 0 },
  Microsoft: { name: "Microsoft", category: "company", count: 0 },
  Google: { name: "Google", category: "company", count: 0 },
  Amazon: { name: "Amazon", category: "company", count: 0 },
  Meta: { name: "Meta", category: "company", count: 0 },
  Tesla: { name: "Tesla", category: "company", count: 0 },
  NVIDIA: { name: "NVIDIA", category: "company", count: 0 },
  SpaceX: { name: "SpaceX", category: "company", count: 0 },
  // 币种
  BTC: { name: "BTC", category: "crypto", count: 0 },
  ETH: { name: "ETH", category: "crypto", count: 0 },
  BNB: { name: "BNB", category: "crypto", count: 0 },
  SOL: { name: "SOL", category: "crypto", count: 0 },
  XRP: { name: "XRP", category: "crypto", count: 0 },
  // 事件
  "财报": { name: "财报", category: "event", count: 0 },
  "产品发布": { name: "产品发布", category: "event", count: 0 },
  "收购": { name: "收购", category: "event", count: 0 },
  "监管": { name: "监管", category: "event", count: 0 },
  "ETF": { name: "ETF", category: "event", count: 0 },
  "拆股": { name: "拆股", category: "event", count: 0 },
  // 主题
  "AI": { name: "AI", category: "topic", count: 0 },
  "电动车": { name: "电动车", category: "topic", count: 0 },
  "DeFi": { name: "DeFi", category: "topic", count: 0 },
  "L2": { name: "L2", category: "topic", count: 0 },
  "稳定币": { name: "稳定币", category: "topic", count: 0 },
  "星链": { name: "星链", category: "topic", count: 0 },
  // 情绪
  "看多": { name: "看多", category: "sentiment", count: 0 },
  "看空": { name: "看空", category: "sentiment", count: 0 },
  "巨鲸异动": { name: "巨鲸异动", category: "sentiment", count: 0 },
  "爆仓": { name: "爆仓", category: "sentiment", count: 0 },
  // 类型
  "日报": { name: "日报", category: "type", count: 0 },
  "快讯": { name: "快讯", category: "type", count: 0 },
  "深度": { name: "深度", category: "type", count: 0 },
  "价格提醒": { name: "价格提醒", category: "type", count: 0 },
};
