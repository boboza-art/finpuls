// ============================================================
// RSS 信源配置
// 每个信源定义: id, name, url(RSS), type, weight, category, keywords
// keywords 用于标签自动分类
// ============================================================

export interface RssSource {
  id: string;
  name: string;
  url: string; // RSS feed URL
  type: "rss" | "atom";
  weight: number; // 0-100，信源权威度权重
  category: string;
  // 标签映射：标题/摘要中匹配到关键词时自动打标签
  tagKeywords?: { tag: string; keywords: string[] }[];
}

// ============================================================
// 标签关键词映射表
// ============================================================

const STOCK_KEYWORDS: { tag: string; keywords: string[] }[] = [
  { tag: "Apple", keywords: ["apple", "iphone", "ipad", "mac", "tim cook", "库克", "苹果", "ios"] },
  { tag: "Microsoft", keywords: ["microsoft", "satya nadella", "纳德拉", "azure", "copilot", "微软", "windows", "office"] },
  { tag: "Google", keywords: ["google", "alphabet", "sundar pichai", "gemini", "谷歌", "deepmind", "youtube", "android"] },
  { tag: "Amazon", keywords: ["amazon", "aws", "jeff bezos", "贝索斯", "andy jassy", "亚马逊", "prime"] },
  { tag: "Meta", keywords: ["meta", "facebook", "zuckerberg", "扎克伯格", "llama", "instagram", "whatsapp", "quest"] },
  { tag: "Tesla", keywords: ["tesla", "elon musk", "马斯克", "model", "cybertruck", "fsd", "autopilot", "特斯"] },
  { tag: "NVIDIA", keywords: ["nvidia", "黄仁勋", "jensen huang", "gpu", "h100", "hopper", "blackwell", "geforce", "英伟达"] },
  { tag: "SpaceX", keywords: ["spacex", "starship", "星舰", "falcon", "猎鹰", "starlink", "星链", "dragon"] },
];

const CRYPTO_KEYWORDS: { tag: string; keywords: string[] }[] = [
  { tag: "BTC", keywords: ["bitcoin", "btc", "比特币", "satoshi", "中本聪"] },
  { tag: "ETH", keywords: ["ethereum", "eth", "以太坊", "vitalik", "但林"] },
  { tag: "BNB", keywords: ["bnb", "binance", "币安", "cz", "赵长鹏", "bsc", "opbnb"] },
  { tag: "SOL", keywords: ["solana", "sol ", "firedancer", "索拉纳"] },
  { tag: "XRP", keywords: ["xrp", "ripple", "瑞波", "garlinghouse"] },
];

const EVENT_KEYWORDS: { tag: string; keywords: string[] }[] = [
  { tag: "财报", keywords: ["earnings", "revenue", "quarterly", "eps", "财报", "营收", "季度业绩", "guidance", "指引"] },
  { tag: "产品发布", keywords: ["launch", "release", "unveil", "发布", "推出", "上线", "首发"] },
  { tag: "收购", keywords: ["acquire", "acquisition", "merger", "收购", "并购"] },
  { tag: "监管", keywords: ["sec", "doj", "regulator", "lawsuit", "fine", "penalty", "监管", "诉讼", "罚款", "合规"] },
  { tag: "ETF", keywords: [" etf", "spot etf", "funds", "index fund"] },
  { tag: "拆股", keywords: ["stock split", "拆股", " split"] },
];

const TOPIC_KEYWORDS: { tag: string; keywords: string[] }[] = [
  { tag: "AI", keywords: [" ai", "artificial intelligence", "llm", "gpt", "claude", "machine learning", "人工智能", "大模型", " ai chip", "chips"] },
  { tag: "电动车", keywords: ["electric vehicle", "ev", "battery", "充电", "电池", "电动汽车", "电动车"] },
  { tag: "DeFi", keywords: ["defi", "lending protocol", "borrowing", "yield", "dex", "uniswap", "aave"] },
  { tag: "L2", keywords: [" layer 2", "rollup", "optimism", "arbitrum", "zksync", "二层"] },
  { tag: "稳定币", keywords: ["stablecoin", "usdt", "usdc", "dai", "稳定币"] },
  { tag: "星链", keywords: ["starlink", "星链", "satellite", "卫星"] },
];

const SENTIMENT_KEYWORDS: { tag: string; keywords: string[] }[] = [
  { tag: "看多", keywords: ["bullish", "surge", "rally", "pump", "看涨", "利好", "突破", "创新高"] },
  { tag: "看空", keywords: ["bearish", "crash", "dump", "plunge", "看跌", "利空", "暴跌", "跳水"] },
  { tag: "巨鲸异动", keywords: ["whale", "巨鲸", "large transfer", "大额转账", "crypto outflow", "exchange outflow"] },
  { tag: "爆仓", keywords: ["liquidat", "爆仓", "margin call", "强平"] },
];

const TYPE_KEYWORDS: { tag: string; keywords: string[] }[] = [
  { tag: "快讯", keywords: ["breaking", "flash", "快讯", "突发", "just in"] },
  { tag: "深度", keywords: ["analysis", "deep dive", "深度", "解析", "研究", "report"] },
  { tag: "价格提醒", keywords: ["price target", "price surges", "price drops", "价格", "涨", "跌"] },
];

export const ALL_TAG_KEYWORDS = [
  ...STOCK_KEYWORDS,
  ...CRYPTO_KEYWORDS,
  ...EVENT_KEYWORDS,
  ...TOPIC_KEYWORDS,
  ...SENTIMENT_KEYWORDS,
  ...TYPE_KEYWORDS,
];

// ============================================================
// RSS 信源列表
// 尽量使用公开 RSS feed
// ============================================================

export const RSS_SOURCES: RssSource[] = [
  // ===== 财经媒体（英文）=====
  {
    id: "cnbc-business",
    name: "CNBC Business",
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147",
    type: "rss",
    weight: 75,
    category: "财经媒体",
    tagKeywords: ALL_TAG_KEYWORDS,
  },
  {
    id: "cnbc-earnings",
    name: "CNBC Earnings",
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=15839135",
    type: "rss",
    weight: 78,
    category: "财经媒体",
    tagKeywords: [...EVENT_KEYWORDS.filter((k) => k.tag === "财报"), ...STOCK_KEYWORDS],
  },
  {
    id: "wsj-markets",
    name: "WSJ Markets",
    url: "https://feeds.content.dowjones.io/public/rss/RWSJ",
    type: "rss",
    weight: 80,
    category: "财经媒体",
    tagKeywords: ALL_TAG_KEYWORDS,
  },
  {
    id: "wsj-opinion",
    name: "WSJ Opinion",
    url: "https://feeds.content.dowjones.io/public/rss/SB10001424052970204349404578360761633087580",
    type: "rss",
    weight: 72,
    category: "财经媒体",
    tagKeywords: ALL_TAG_KEYWORDS,
  },
  {
    id: "marketwatch-top",
    name: "MarketWatch Top",
    url: "https://feeds.content.dowjones.io/public/rss/mw_topstories",
    type: "rss",
    weight: 76,
    category: "财经媒体",
    tagKeywords: ALL_TAG_KEYWORDS,
  },
  {
    id: "seeking-alpha",
    name: "Seeking Alpha",
    url: "https://seekingalpha.com/market_currents.xml",
    type: "rss",
    weight: 68,
    category: "财经媒体",
    tagKeywords: ALL_TAG_KEYWORDS,
  },
  {
    id: "barrons",
    name: "Barron's",
    url: "https://feeds.barrons.com/feed/rss/2c4c4d6d-0f57-415d-bb07-2d8b4e9e0b3f",
    type: "rss",
    weight: 74,
    category: "财经媒体",
    tagKeywords: ALL_TAG_KEYWORDS,
  },
  {
    id: "investing-news",
    name: "Investing.com News",
    url: "https://www.investing.com/rss/news_1.rss",
    type: "rss",
    weight: 65,
    category: "财经媒体",
    tagKeywords: ALL_TAG_KEYWORDS,
  },

  // ===== 官方博客 =====
  {
    id: "nvidia-blog",
    name: "NVIDIA Blog",
    url: "https://blogs.nvidia.com/feed/",
    type: "rss",
    weight: 88,
    category: "官方博客",
    tagKeywords: [...STOCK_KEYWORDS.filter((k) => k.tag === "NVIDIA"), ...TOPIC_KEYWORDS.filter((k) => k.tag === "AI")],
  },
  {
    id: "apple-newsroom",
    name: "Apple Newsroom",
    url: "https://www.apple.com/newsroom/rss-feed.rss",
    type: "rss",
    weight: 87,
    category: "官方博客",
    tagKeywords: [...STOCK_KEYWORDS.filter((k) => k.tag === "Apple"), ...EVENT_KEYWORDS.filter((k) => k.tag === "产品发布")],
  },
  {
    id: "meta-newsroom",
    name: "Meta Newsroom",
    url: "https://about.meta.com/feed/",
    type: "rss",
    weight: 85,
    category: "官方博客",
    tagKeywords: [...STOCK_KEYWORDS.filter((k) => k.tag === "Meta"), ...TOPIC_KEYWORDS.filter((k) => k.tag === "AI")],
  },

  // ===== 中文财经 =====
  {
    id: "wallstreetcn-live",
    name: "华尔街见闻",
    url: "https://wallstreetcn.com/rss",
    type: "rss",
    weight: 76,
    category: "中文财经",
    tagKeywords: ALL_TAG_KEYWORDS,
  },
  // ===== SEC EDGAR（财报公告）=====
  {
    id: "sec-edgar",
    name: "SEC EDGAR",
    url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&company=&dateb=&owner=include&start=0&count=40&output=atom",
    type: "atom",
    weight: 95,
    category: "监管公告",
    tagKeywords: [...EVENT_KEYWORDS.filter((k) => k.tag === "财报" || k.tag === "监管"), ...STOCK_KEYWORDS],
  },
];
