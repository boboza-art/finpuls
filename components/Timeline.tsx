import Link from "next/link";
import type { NewsItem } from "@/lib/types";
import ItemCard from "./ItemCard";
import { formatDateTitle } from "@/lib/utils";

export default function Timeline({ groups }: { groups: { date: string; items: NewsItem[] }[] }) {
  if (!groups.length) {
    return (
      <div className="text-center py-12 text-[var(--text-muted)]">
        <p className="text-lg mb-2">📭</p>
        <p>暂无数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {groups.map((group) => {
        const { title, subtitle } = formatDateTitle(group.date);
        return (
          <section key={group.date}>
            {/* 日期标题 */}
            <div className="flex items-center gap-2 mb-2 sm:mb-3 sticky top-[80px] sm:top-[100px] bg-[var(--bg-primary)] py-1.5 sm:py-2 z-10 timeline-date">
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                {title}
              </h2>
              <span className="text-xs sm:text-sm text-[var(--text-muted)]">
                {subtitle} · {group.items.length} 条
              </span>
            </div>

            {/* 资讯卡片列表 */}
            <div className="space-y-2 sm:space-y-3">
              {group.items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
