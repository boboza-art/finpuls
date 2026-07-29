import Link from "next/link";
import type { NewsItem } from "@/lib/types";
import {
  formatRelativeTime,
  formatTime,
  heatLevel,
  tagColor,
} from "@/lib/utils";

export default function ItemCard({ item }: { item: NewsItem }) {
  const level = heatLevel(item.heatScore);
  const sourceCount = (item.additionalSources?.length || 0) + 1;

  return (
    <article className="p-3 sm:p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] item-card">
      {/* 元数据行 */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
        <span className="text-[11px] sm:text-xs text-[var(--text-muted)] font-mono">
          {formatTime(item.publishedAt)}
        </span>
        <span className="text-[11px] sm:text-xs text-[var(--text-secondary)]">
          {item.sourceName}
        </span>
        {item.isFeatured && (
          <span className="featured-badge">精选</span>
        )}
        <span className={`heat-score heat-${level}`}>
          🔥 {item.heatScore}
        </span>
      </div>

      {/* 标题 */}
      <Link href={`/items/${item.id}`}>
        <h3 className="text-sm sm:text-base font-medium text-[var(--text-primary)] mb-1 hover:text-[var(--accent-orange)] transition-colors leading-snug">
          {item.titleCn || item.title}
        </h3>
        {item.titleCn && item.titleCn !== item.title && (
          <p className="text-xs text-[var(--text-muted)] mb-2 leading-snug">
            {item.title}
          </p>
        )}
      </Link>

      {/* 摘要 */}
      {item.summaryCn && item.summaryCn !== item.summary && (
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-2 sm:line-clamp-3 mb-1">
          {item.summaryCn}
        </p>
      )}
      {item.summary && (
        <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2 sm:mb-3">
          {item.summary}
        </p>
      )}

      {/* 标签 */}
      {item.tags.length > 0 && (
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap mb-2">
          {item.tags.map((tag) => (
            <Link
              key={tag}
              href={`/?tag=${encodeURIComponent(tag)}`}
              className="tag"
              style={{
                color: tagColor(tag),
                borderColor: tagColor(tag) + "33",
              }}
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      {/* 多信源 */}
      {item.additionalSources && item.additionalSources.length > 0 && (
        <div className="source-count mb-2">
          <span>📡 另有 {item.additionalSources.length} 家信源报道</span>
          <span className="text-[var(--text-muted)] hidden sm:inline">
            ({item.additionalSources.map((s) => s.name).join("、")})
          </span>
        </div>
      )}

      {/* 编辑推荐理由 */}
      {item.note && (
        <div className="editor-note">
          <span className="text-[11px] sm:text-xs font-semibold text-[var(--accent-orange)]">
            💡 推荐理由：
          </span>
          {item.note}
        </div>
      )}

      {/* 底部元数据 */}
      <div className="flex items-center justify-between mt-2 sm:mt-3 text-[11px] sm:text-xs text-[var(--text-muted)]">
        <span>{formatRelativeTime(item.publishedAt)}</span>
        <span>{sourceCount} 个信源</span>
      </div>
    </article>
  );
}
