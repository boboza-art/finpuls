import Link from "next/link";
import { tagColor } from "@/lib/utils";

export default function TagFilter({ tags }: { tags: { tag: string; count: number }[] }) {
  if (!tags.length) return null;

  return (
    <div className="border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] p-4">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-1">
        <span>🏷️</span> 标签筛选
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(({ tag, count }) => (
          <Link
            key={tag}
            href={`/?tag=${encodeURIComponent(tag)}`}
            className="tag"
            style={{
              color: tagColor(tag),
              borderColor: tagColor(tag) + "33",
            }}
          >
            {tag} <span className="opacity-50">({count})</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
