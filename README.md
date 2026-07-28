# FinPulse — 美股明星 & 数字货币动态聚合

> 多信源聚合 · 编辑精选 · 热度评分 · 时间线展示

## 项目简介

FinPulse 是一个聚合美股明星公司（MAG7+SpaceX）与五大数字货币（BTC/ETH/BNB/SOL/XRP）动态的平台，复刻 AI HOT (aihot.virxact.com) 的核心模式，面向金融从业者提供高质量每日资讯。

## 技术栈

| 层 | 技术 |
|------|------|
| 前端框架 | Next.js 16 (App Router + Turbopack) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 4 |
| 数据库 | sql.js (纯 JavaScript SQLite) |
| 价格 API | CoinGecko |
| RSS 解析 | rss-parser |

## 核心功能

- ? **时间线 Feed**：按日期+时间倒序展示资讯
- ? **今日头条**：Top 2 热门事件，标注信源数
- ? **标签筛选**：按公司/币种/主题/事件筛选
- ? **多信源聚合**：同事件多信源报道合并展示
- ? **编辑推荐**：每条附推荐理由
- ? **热度评分**：0-100 分量化关注度
- ? **详情页**：每条资讯独立详情页
- ? **价格看板**：5 大币种实时价格条
- ? **RSS 采集器**：22 个信源并发抓取
- ? **自动去重**：Jaccard 相似度 + 时间窗口
- ? **自动标签**：关键词匹配，6 大维度分类
- ? **API 接口**：RESTful API

## 快速开始

```bash
# 安装依赖
pnpm install

# 初始化种子数据
pnpm seed

# 抓取 RSS 新闻（单次）
pnpm fetch

# 持续抓取模式（每 15 分钟）
pnpm fetch:watch

# 开发模式
pnpm dev

# 生产构建
pnpm build && pnpm start
```

访问 http://localhost:3000

## 项目结构

```
finpulse/
├── app/
│   ├── layout.tsx              # 根布局
│   ├── page.tsx                # 首页（时间线 + 头条 + 价格看板）
│   ├── globals.css             # 全局样式（暗色主题）
│   ├── items/[id]/page.tsx     # 资讯详情页
│   └── api/
│       ├── items/route.ts      # 资讯列表 API
│       ├── items/[id]/route.ts # 资讯详情 API
│       ├── prices/route.ts     # 实时价格 API
│       └── img-proxy/route.ts  # 图片代理
├── components/
│   ├── Header.tsx              # 标题栏 + 公司/币种快捷导航
│   ├── PriceBar.tsx            # 价格看板
│   ├── Headlines.tsx           # 头条精选区
│   ├── Timeline.tsx            # 时间线（按日期分组）
│   ├── ItemCard.tsx            # 资讯卡片
│   └── TagFilter.tsx           # 标签筛选侧边栏
├── lib/
│   ├── types.ts                # 数据类型定义
│   ├── db.ts                   # SQLite 数据库操作
│   ├── seed.ts                 # 种子数据
│   ├── queries.ts              # 数据查询层
│   ├── prices.ts               # CoinGecko 价格拉取 + 缓存
│   ├── rss.ts                  # RSS 聚合器（核心采集引擎）
│   ├── rss-sources.ts          # RSS 信源配置（22 个信源 + 标签关键词）
│   ├── dedup.ts                # Jaccard 相似度去重
│   ├── heat.ts                 # 热度评分算法
│   ├── tags.ts                 # 标签自动分类
│   └── utils.ts                # 工具函数
├── scripts/
│   └── fetcher.ts              # 定时采集脚本（支持 --watch）
├── data/
│   └── finpulse.db             # SQLite 数据库文件
└── types/
    └── sql.js.d.ts             # sql.js 类型声明
```

## 采集架构

```
RSS 信源 (22 个)
    │
    ▼
并发批次抓取（每批 5 个）
    │
    ▼
解析（rss-parser）
    │
    ▼
Jaccard 去重（标题相似度 + 72h 时间窗口）
    │
    ▼
标签自动分类（关键词匹配 → 6 大维度标签）
    │
    ▼
热度评分（信源权重 × 数量 × 时效性 × 事件类型加权）
    │
    ▼
SQLite 存储
```

## 信源列表

| 类型 | 信源 |
|------|------|
| 财经媒体 | CNBC Business, CNBC Earnings, WSJ Markets, WSJ Opinion, MarketWatch, Seeking Alpha, Barron's, Investing.com |
| 加密媒体 | CoinDesk, The Block, Decrypt, CryptoSlate, Bitcoin Magazine, Cointelegraph, NewsBTC |
| 官方博客 | NVIDIA Blog, Apple Newsroom, Meta Newsroom |
| 社区聚合 | Hacker News |
| 中文财经 | 华尔街见闻, BlockBeats |
| 监管公告 | SEC EDGAR |

## 标签体系

| 分类 | 标签 |
|------|------|
| 公司 | Apple, Microsoft, Google, Amazon, Meta, Tesla, NVIDIA, SpaceX |
| 币种 | BTC, ETH, BNB, SOL, XRP |
| 事件 | 财报, 产品发布, 收购, 监管, ETF, 拆股 |
| 主题 | AI, 电动车, DeFi, L2, 稳定币, 星链 |
| 情绪 | 看多, 看空, 巨鲸异动, 爆仓 |
| 类型 | 日报, 快讯, 深度, 价格提醒 |

## Phase 完成状态

### Phase 1: 基础框架 ?
- Next.js 16 项目 + Tailwind CSS 暗色主题
- 页面布局（标题栏 + 头条区 + 时间线 + 侧边栏）
- 资讯卡片组件 + 日期分组
- 价格看板组件
- SQLite 数据层 + 种子数据
- 首页 SSR + 详情页 + 标签筛选
- RESTful API

### Phase 2: 采集层 ?
- RSS 多信源采集器（22 个信源）
- 并发批次抓取
- Jaccard 相似度去重
- 热度评分算法
- 标签自动分类（6 大维度）
- 跨信源去重 + 多信源聚合
- 定时采集脚本（单次/持续模式）
- CoinGecko 价格拉取 + 缓存

### Phase 3: 内容增强 ?
- 编辑推荐理由自动生成引擎（按事件类型生成点评）
- 多信源聚合增强（合并同一事件报道，更新信源数和热度）
- 信源健康监控（抓取延迟、成功率、错误信息）
- `/admin` 管理页面 + `/api/health` 健康 API
- 标签词边界匹配，减少误命中
- 日期分组改为东八区（GMT+8）

### Phase 4: 部署与优化 ?
- 巨鲸链上监控模块（支持 Whale Alert API，无 key 时自动生成模拟数据）
- 移动端响应式优化（卡片紧凑、价格看板横向滚动、侧边栏适配）
- PWA manifest + icon.svg
- sitemap.xml + robots.txt
- Vercel 部署配置 `vercel.json`
- `.env.example` 环境变量模板
- 部署文档 `DEPLOY.md`

## 部署方式

### 方式一：Vercel（推荐）

1. 将代码推送到 GitHub
2. 在 Vercel 导入项目
3. 设置环境变量（可选）：
   - `WHALE_ALERT_API_KEY` — 巨鲸监控 API key
   - `COINGECKO_API_KEY` — CoinGecko API key（免费）
   - `NEXT_PUBLIC_SITE_URL` — 站点 URL
4. 部署

### 方式二：本地 Docker / 服务器

```bash
cd /workspace/finpulse
pnpm install
pnpm build
pnpm start
```

### 定时采集（生产环境）

在 Vercel 可以使用 Cron Job，或单独服务器运行：

```bash
# 每 15 分钟运行一次
*/15 * * * * cd /workspace/finpulse && pnpm fetch
```
