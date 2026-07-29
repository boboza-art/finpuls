import Link from "next/link";
import type { NewsItem } from "@/lib/types";
import { formatRelativeTime, heatLevel, tagColor } from "@/lib/utils";

export default function Headlines({ items }: { items: NewsItem[] }) {
  if (!items.length) return null;

  return (
    <section className="mb-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] mb-3">
        <span className="text-[var(--accent-orange)]">🔥</span> 今日头条
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item, idx) => {
          const level = heatLevel(item.heatScore);
          const sourceCount = (item.additionalSources?.length || 0) + 1;
          return (
            <Link
              key={item.id}
              href={`/items/${item.id}`}
              className="block p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] item-card"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl font-bold text-[var(--accent-orange)] opacity-50 shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`heat-score heat-${level}`}>
                      🔥 {item.heatScore}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {sourceCount} 个信源同时报道
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 mb-0.5">
                    {item.titleCn || item.title}
                  </h3>
                  {item.titleCn && item.titleCn !== item.title && (
                    <p className="text-xs text-[var(--text-muted)] line-clamp-1 mb-1">
                      {item.title}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span>{formatRelativeTime(item.publishedAt)}</span>
                    <span>·</span>
                    <span>{item.sourceName}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
