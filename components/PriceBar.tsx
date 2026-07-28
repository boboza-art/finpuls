"use client";

import { useEffect, useState, useRef } from "react";
import type { PriceData } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default function PriceBar() {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(false);

  const fetchPrices = async () => {
    try {
      const res = await fetch("/api/prices");
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setPrices(json.data);
        setError(false);
      }
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    // 防止 StrictMode 双重调用
    if (mountedRef.current) return;
    mountedRef.current = true;

    fetchPrices();
    intervalRef.current = setInterval(fetchPrices, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (error && !prices.length) return null;
  if (!prices.length) {
    return (
      <div className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2">
          <span className="text-xs text-[var(--text-muted)]">加载价格中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2">
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-hide price-bar-items">
          <span className="text-[10px] sm:text-xs text-[var(--text-muted)] shrink-0 font-semibold">
            🔥 实时
          </span>
          {prices.map((p) => {
            const isUp = p.change24h >= 0;
            return (
              <div key={p.symbol} className="flex items-center gap-1 sm:gap-1.5 shrink-0 text-[11px] sm:text-xs">
                <span className="font-bold text-[var(--text-primary)]">{p.symbol}</span>
                <span className="text-[var(--text-secondary)]">
                  {formatCurrency(p.price, p.price >= 1 ? 2 : 4)}
                </span>
                <span className={isUp ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}>
                  {isUp ? "▲" : "▼"} {formatPercent(p.change24h)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
