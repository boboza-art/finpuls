import Link from "next/link";
import Header from "@/components/Header";
import PriceBar from "@/components/PriceBar";
import { getItemById } from "@/lib/queries";
import { formatRelativeTime, formatTime, heatLevel, tagColor } from "@/lib/utils";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItemById(id);

  if (!item) notFound();

  const level = heatLevel(item.heatScore);

  return (
    <>
      <Header />
      <PriceBar />

      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* 返回链接 */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs sm:text-sm text-[var(--text-muted)] hover:text-[var(--accent-orange)] mb-4"
        >
          ← 返回时间线
        </Link>

        <article>
          {/* 元数据 */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-[var(--text-muted)] font-mono">
              {formatTime(item.publishedAt)}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {item.sourceName}
            </span>
            {item.isFeatured && <span className="featured-badge">精选</span>}
            <span className={`heat-score heat-${level}`}>🔥 {item.heatScore}</span>
            <span className="text-xs text-[var(--text-muted)]">
              {formatRelativeTime(item.publishedAt)}
            </span>
          </div>

          {/* 标题 */}
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4 leading-tight">
            {item.title}
          </h1>

          {/* 摘要正文 */}
          {item.summary && (
            <div className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed mb-4 whitespace-pre-line">
              {item.summary}
            </div>
          )}

          {/* 原始信源链接 */}
          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[var(--accent-blue)] hover:underline mb-4"
            >
              🔗 查看原文 ({item.sourceName})
            </a>
          )}

          {/* 标签 */}
          {item.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-4">
              {item.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/?tag=${encodeURIComponent(tag)}`}
                  className="tag"
                  style={{ color: tagColor(tag), borderColor: tagColor(tag) + "33" }}
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* 编辑推荐理由 */}
          {item.note && (
            <div className="editor-note mb-4">
              <span className="text-sm font-semibold text-[var(--accent-orange)] block mb-1">
                💡 推荐理由
              </span>
              {item.note}
            </div>
          )}

          {/* 多信源聚合 */}
          {item.additionalSources && item.additionalSources.length > 0 && (
            <div className="border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] p-4">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
                📡 另有 {item.additionalSources.length} 家信源报道
              </h3>
              <ul className="space-y-2">
                {item.additionalSources.map((s, i) => (
                  <li key={i} className="text-sm">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent-blue)] hover:underline"
                    >
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      </main>
    </>
  );
}
