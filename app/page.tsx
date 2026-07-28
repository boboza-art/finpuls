import Header from "@/components/Header";
import PriceBar from "@/components/PriceBar";
import Headlines from "@/components/Headlines";
import Timeline from "@/components/Timeline";
import TagFilter from "@/components/TagFilter";
import WhaleMonitor from "@/components/WhaleMonitor";
import { getFeaturedItems, getTimeline, getAllTags } from "@/lib/queries";
import { getRecentWhales } from "@/lib/whale";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const [featured, timeline, tags, whales] = await Promise.all([
    getFeaturedItems(),
    getTimeline(50, tag),
    getAllTags(),
    getRecentWhales(8),
  ]);

  return (
    <>
      <Header />
      <PriceBar />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* 主内容区 */}
          <div className="min-w-0">
            {tag ? (
              <div className="mb-4 p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">
                  当前筛选: <span className="text-[var(--accent-orange)] font-semibold">{tag}</span>
                </span>
                <a href="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-orange)]">
                  ✕ 清除筛选
                </a>
              </div>
            ) : (
              <Headlines items={featured} />
            )}
            <Timeline groups={timeline} />
          </div>

          {/* 侧边栏 */}
          <aside className="space-y-4">
            <WhaleMonitor whales={whales} />
            <TagFilter tags={tags} />

            {/* 关于 */}
            <div className="border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] p-4">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">
                ℹ️ 关于 FinPulse
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                FinPulse 聚合美股明星公司（MAG7+SpaceX）与五大数字货币（BTC/ETH/BNB/SOL/XRP）的多信源动态，
                每日精选、热度评分、编辑推荐。
              </p>
              <div className="mt-3 pt-3 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)]">
                <p>📡 {tags.reduce((sum, t) => sum + t.count, 0)} 条资讯</p>
                <p>🏷️ {tags.length} 个标签</p>
                <p>🐋 {whales.length} 条巨鲸异动</p>
              </div>
            </div>
          </aside>
        </div>

        <footer className="mt-12 pt-6 border-t border-[var(--border-color)] text-center text-xs text-[var(--text-muted)]">
          <p>FinPulse © 2026 · 数据来源公开 RSS 和 API · 仅供参考，不构成投资建议</p>
        </footer>
      </main>
    </>
  );
}
