import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinPulse — 美股明星 & 数字货币动态聚合 · 每日精选与金融日报",
  description:
    "FinPulse 是一个聚合美股明星公司（MAG7+SpaceX）与五大数字货币（BTC/ETH/BNB/SOL/XRP）动态的平台，多信源聚合、编辑精选、热度评分、时间线展示。",
  keywords: [
    "美股", "MAG7", "Apple", "Microsoft", "NVIDIA", "Tesla", "Meta", "Google", "Amazon", "SpaceX",
    "比特币", "以太坊", "BNB", "Solana", "XRP", "BTC", "ETH", "加密货币",
    "金融新闻", "聚合", "日报", "FinPulse",
  ],
  manifest: "/manifest.json",
  openGraph: {
    title: "FinPulse — 美股明星 & 数字货币动态聚合",
    description: "多信源聚合、编辑精选、热度评分、时间线展示",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: "FinPulse — 美股明星 & 数字货币动态聚合",
    description: "多信源聚合、编辑精选、热度评分、时间线展示",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
