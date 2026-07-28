import Link from "next/link";
import { CRYPTOS, STOCKS } from "@/lib/types";

export default function Header() {
  return (
    <header className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📊</span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[var(--accent-orange)]">FinPulse</h1>
              <p className="text-[10px] sm:text-xs text-[var(--text-muted)] hidden xs:block">
                美股明星 & 数字货币动态聚合
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
            <span className="hidden sm:inline">每日精选 · 金融日报</span>
            <span className="sm:hidden text-[var(--text-muted)]">精选日报</span>
          </div>
        </div>

        {/* 关注的公司/币种快捷导航 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-[10px] sm:text-xs text-[var(--text-muted)] shrink-0">美股</span>
          {STOCKS.map((s) => (
            <Link
              key={s.ticker}
              href={`/?tag=${encodeURIComponent(s.name === "SpaceX" ? "SpaceX" : s.name)}`}
              className="shrink-0 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded border border-[var(--border-color)] hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)] transition-colors"
            >
              {s.ticker === "SPACE" ? "SpaceX" : s.ticker}
            </Link>
          ))}
          <span className="text-[10px] sm:text-xs text-[var(--text-muted)] shrink-0 ml-1 sm:ml-2">币种</span>
          {CRYPTOS.map((c) => (
            <Link
              key={c.symbol}
              href={`/?tag=${c.symbol}`}
              className="shrink-0 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded border border-[var(--border-color)] hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)] transition-colors"
            >
              {c.symbol}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
