# FinPulse 部署指南

## 环境要求

- Node.js 22+
- pnpm 10+
- 可选：Whale Alert API key、CoinGecko API key

## 本地启动

```bash
# 1. 安装依赖
pnpm install

# 2. 初始化数据
pnpm seed
pnpm fetch

# 3. 开发模式
pnpm dev

# 4. 生产模式
pnpm build
pnpm start
```

## Vercel 部署

### 1. 推送到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/finpulse.git
git push -u origin main
```

### 2. 在 Vercel 创建项目

1. 访问 https://vercel.com/new
2. 选择 GitHub 仓库
3. 框架选择 Next.js
4. 根目录保持默认

### 3. 配置环境变量

| 变量名 | 说明 | 是否必填 |
|--------|------|---------|
| `NEXT_PUBLIC_SITE_URL` | 站点 URL | 是 |
| `WHALE_ALERT_API_KEY` | Whale Alert API key | 否 |
| `COINGECKO_API_KEY` | CoinGecko API key | 否 |

### 4. 配置定时任务

在 Vercel Dashboard → 项目 → Cron Jobs 添加：

- Path: `/api/fetch`（可选，需要额外创建 API 路由）
- Schedule: `*/15 * * * *`

或者使用外部 cron 服务调用：

```bash
curl -X POST https://your-domain.com/api/fetch
```

> 当前版本的定时采集通过 `pnpm fetch` 运行，需要在独立进程或 cron 中执行。

## 文件说明

- `vercel.json` — Vercel 部署配置（区域、HTTP 头）
- `public/manifest.json` — PWA 配置
- `public/icon.svg` — 站点图标
- `app/sitemap.ts` — 站点地图
- `app/robots.ts` — 爬虫规则
- `.env.example` — 环境变量模板

## 数据库说明

项目使用 sql.js（内存 + 文件持久化）。每次写操作后会导出到 `data/finpulse.db`。

注意：Vercel 的文件系统是只读的（除 `/tmp` 外），且实例无状态。如果部署到 Vercel，需要：

1. 把 `data/finpulse.db` 提交到仓库中作为初始数据库
2. 运行 `pnpm fetch` 生成最新数据后重新提交
3. 或者迁移到 Vercel Postgres / SQLite 云服务

推荐的长期方案：
- 开发阶段：sql.js + 文件
- 生产阶段：PostgreSQL / Turso / Cloudflare D1

## 域名和 SEO

修改 `app/layout.tsx` 中的 metadata 和 `vercel.json` 中的域名配置。
