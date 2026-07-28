import Link from "next/link";
import type { WhaleAlert } from "@/lib/whale";
import { formatRelativeTime, formatCurrency, formatLargeNumber } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  transfer: "转账",
  exchange_out: "交易所转出",
  exchange_in: "交易所转入",
  whale_to_whale: "巨鲸互转",
};

const TYPE_COLORS: Record<string, string> = {
  exchange_out: "#10b981", // 看多（转出 = 持有）
  exchange_in: "#ef4444",   // 看空（转入 = 抛售）
  transfer: "#6b7280",
  whale_to_whale: "#8b5cf6",
};

export default function WhaleMonitor({ whales }: { whales: WhaleAlert[] }) {
  if (!whales.length) return null;

  return (
    <div className="border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] p-4">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-1">
        <span>🐋</span> 巨鲸监控
        <span className="text-xs text-[var(--text-muted)] ml-auto">实时</span>
      </h3>

      <div className="space-y-2">
        {whales.map((w) => {
          const typeColor = TYPE_COLORS[w.transactionType] || "#6b7280";
          const typeLabel = TYPE_LABELS[w.transactionType] || w.transactionType;
          const isOutflow = w.transactionType === "exchange_out";

          return (
            <Link
              key={w.id}
              href={`/?tag=${encodeURIComponent("巨鲸异动")}`}
              className="block p-2 rounded border border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{ background: typeColor + "20", color: typeColor }}
                >
                  {typeLabel}
                </span>
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {w.symbol}
                </span>
                <span className="text-xs text-[var(--text-muted)] ml-auto">
                  {formatRelativeTime(w.timestamp)}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {w.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} {w.symbol}
                </span>
                <span className={`text-xs ${isOutflow ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}`}>
                  {formatLargeNumber(w.amountUsd)}
                </span>
              </div>

              <div className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                {isOutflow ? "→ " : "← "}
                {w.toOwner || "未知地址"}
                {w.toAddress && (
                  <span className="opacity-60">
                    {" "}({w.toAddress.slice(0, 8)}...{w.toAddress.slice(-6)})
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)]">
        💡 交易所转出 = 中长期持有意图
      </div>
    </div>
  );
}
