import type { Metadata } from "next";
import Header from "@/components/Header";
import { getSourceHealths, healthStatus } from "@/lib/health";
import { formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "信源健康监控 — FinPulse",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const healths = await getSourceHealths();

  const healthy = healths.filter((h) => healthStatus(h) === "healthy").length;
  const degraded = healths.filter((h) => healthStatus(h) === "degraded").length;
  const down = healths.filter((h) => healthStatus(h) === "down").length;

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">信源健康监控</h1>

        {/* 概览统计 */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <div className="p-4 rounded-lg border border-[var(--accent-green)]/30 bg-[var(--bg-card)]">
            <div className="text-3xl font-bold text-[var(--accent-green)]">{healthy}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">正常</div>
          </div>
          <div className="p-4 rounded-lg border border-[var(--accent-orange)]/30 bg-[var(--bg-card)]">
            <div className="text-3xl font-bold text-[var(--accent-orange)]">{degraded}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">降级</div>
          </div>
          <div className="p-4 rounded-lg border border-[var(--accent-red)]/30 bg-[var(--bg-card)]">
            <div className="text-3xl font-bold text-[var(--accent-red)]">{down}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">异常</div>
          </div>
        </div>

        {/* 信源列表 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-left text-[var(--text-muted)]">
                <th className="py-2 px-3">状态</th>
                <th className="py-2 px-3">信源名称</th>
                <th className="py-2 px-3 text-right">总抓取</th>
                <th className="py-2 px-3 text-right">成功</th>
                <th className="py-2 px-3 text-right">失败</th>
                <th className="py-2 px-3 text-right">条目数</th>
                <th className="py-2 px-3 text-right">平均延迟</th>
                <th className="py-2 px-3">最近成功</th>
                <th className="py-2 px-3">最近错误</th>
              </tr>
            </thead>
            <tbody>
              {healths.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-[var(--text-muted)]">
                    暂无监控数据，请先运行采集器
                  </td>
                </tr>
              ) : (
                healths.map((h) => {
                  const status = healthStatus(h);
                  const statusColor =
                    status === "healthy"
                      ? "var(--accent-green)"
                      : status === "degraded"
                      ? "var(--accent-orange)"
                      : "var(--accent-red)";
                  const statusText =
                    status === "healthy" ? "正常" : status === "degraded" ? "降级" : "异常";
                  const successRate = h.totalFetches > 0 ? ((h.totalSuccess / h.totalFetches) * 100).toFixed(0) : "0";

                  return (
                    <tr key={h.sourceId} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                      <td className="py-2 px-3">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ background: statusColor }}
                          title={statusText}
                        />
                      </td>
                      <td className="py-2 px-3 font-medium">{h.sourceName}</td>
                      <td className="py-2 px-3 text-right text-[var(--text-secondary)]">{h.totalFetches}</td>
                      <td className="py-2 px-3 text-right text-[var(--accent-green)]">{h.totalSuccess}</td>
                      <td className="py-2 px-3 text-right text-[var(--accent-red)]">{h.totalErrors}</td>
                      <td className="py-2 px-3 text-right text-[var(--text-secondary)]">{h.itemsFetched}</td>
                      <td className="py-2 px-3 text-right text-[var(--text-secondary)]">{h.avgLatencyMs}ms</td>
                      <td className="py-2 px-3 text-[var(--text-muted)] text-xs">
                        {h.lastSuccessAt ? formatRelativeTime(h.lastSuccessAt) : "—"}
                      </td>
                      <td className="py-2 px-3 text-[var(--accent-red)] text-xs max-w-xs truncate" title={h.lastError || ""}>
                        {h.lastError || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-xs text-[var(--text-muted)]">
          <p>共 {healths.length} 个信源 · 成功率 {healths.length > 0 ? ((healthy / healths.length) * 100).toFixed(0) : 0}%</p>
        </div>
      </main>
    </>
  );
}
