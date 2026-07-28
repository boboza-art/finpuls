import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

/** 格式化相对时间 */
export function formatRelativeTime(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: zhCN });
}

/** 格式化 HH:MM 时间 */
export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 格式化日期标题：如 "7月26日（周日）" */
export function formatDateTitle(dateStr: string): { title: string; subtitle: string } {
  // 按东八区解析
  const d = new Date(dateStr + "T00:00:00+08:00");
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const weekday = weekdays[d.getDay()];

  const today = new Date();
  today.setHours(8, 0, 0, 0); // 东八区基准
  const target = new Date(d);
  target.setHours(8, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - target.getTime()) / (24 * 60 * 60 * 1000));

  let prefix = "";
  if (diffDays === 0) prefix = "今天 · ";
  else if (diffDays === 1) prefix = "昨天 · ";

  return {
    title: `${prefix}${month}月${day}日`,
    subtitle: `${weekday}`,
  };
}

/** 热度分数等级 */
export function heatLevel(score: number): "high" | "medium" | "low" {
  if (score >= 85) return "high";
  if (score >= 70) return "medium";
  return "low";
}

/** 格式化货币 */
export function formatCurrency(num: number, digits = 2): string {
  if (num >= 1) {
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  }
  return `$${num.toFixed(4)}`;
}

/** 格式化大数字（亿/万） */
export function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

/** 格式化百分比 */
export function formatPercent(num: number, withSign = true): string {
  const sign = withSign && num > 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

/** 标签颜色映射 */
export function tagColor(tag: string): string {
  const companyTags = ["Apple", "Microsoft", "Google", "Amazon", "Meta", "Tesla", "NVIDIA", "SpaceX"];
  const cryptoTags = ["BTC", "ETH", "BNB", "SOL", "XRP"];
  const eventTags = ["财报", "产品发布", "收购", "监管", "ETF", "拆股"];
  const topicTags = ["AI", "电动车", "DeFi", "L2", "稳定币", "星链"];
  const sentimentTags = ["看多", "看空", "巨鲸异动", "爆仓"];
  const typeTags = ["日报", "快讯", "深度", "价格提醒"];

  if (companyTags.includes(tag)) return "#3b82f6";
  if (cryptoTags.includes(tag)) return "#8b5cf6";
  if (eventTags.includes(tag)) return "#f97316";
  if (topicTags.includes(tag)) return "#10b981";
  if (sentimentTags.includes(tag)) return "#ef4444";
  if (typeTags.includes(tag)) return "#6b7280";
  return "#9ca3af";
}
