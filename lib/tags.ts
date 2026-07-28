// ============================================================
// 标签自动分类
// 基于关键词匹配，从标题和摘要中提取标签
// 采用词边界匹配策略，避免短词误命中（如 "buy" 匹配 "buying"）
// ============================================================

import { ALL_TAG_KEYWORDS } from "./rss-sources";

const WORD_BOUNDARY_PUNCT = new Set([" ", ",", ".", ";", ":", "!", "?", "(", ")", "[", "]", "{", "}", '"', "'", "-", "\n", "\t", "|", "/", "\\", "&", "*", "+", "="]);

function isWordBoundary(char: string): boolean {
  return !char || WORD_BOUNDARY_PUNCT.has(char) || char === undefined;
}

function isChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * 判断文本中是否包含关键词，使用词边界匹配
 * 中文关键词不需要词边界
 */
function containsKeyword(text: string, keyword: string): boolean {
  if (!keyword) return false;

  // 纯中文关键词，直接包含匹配
  if (isChinese(keyword) && !/[a-zA-Z0-9]/.test(keyword)) {
    return text.toLowerCase().includes(keyword.toLowerCase());
  }

  const lowerKeyword = keyword.toLowerCase();
  const lowerText = text.toLowerCase();
  let pos = 0;

  while ((pos = lowerText.indexOf(lowerKeyword, pos)) !== -1) {
    const before = lowerText[pos - 1];
    const after = lowerText[pos + lowerKeyword.length];

    if (isWordBoundary(before) && isWordBoundary(after)) {
      return true;
    }
    pos += 1;
  }

  return false;
}

/**
 * 从文本中自动提取标签
 * @param title 标题
 * @param summary 摘要
 * @returns 匹配到的标签数组（去重，最多 6 个）
 */
export function autoTag(title: string, summary: string): string[] {
  const text = `${title} ${summary}`;
  const matchedTags = new Set<string>();

  for (const { tag, keywords } of ALL_TAG_KEYWORDS) {
    for (const keyword of keywords) {
      if (containsKeyword(text, keyword)) {
        matchedTags.add(tag);
        break; // 一个标签匹配到一个关键词即可
      }
    }
  }

  // 按优先级排序：公司 > 币种 > 事件 > 主题 > 情绪 > 类型
  const priority = [
    "Apple", "Microsoft", "Google", "Amazon", "Meta", "Tesla", "NVIDIA", "SpaceX",
    "BTC", "ETH", "BNB", "SOL", "XRP",
    "财报", "产品发布", "收购", "监管", "ETF", "拆股",
    "AI", "电动车", "DeFi", "L2", "稳定币", "星链",
    "看多", "看空", "巨鲸异动", "爆仓",
    "快讯", "深度", "价格提醒", "日报",
  ];

  const sorted = Array.from(matchedTags).sort((a, b) => {
    const ia = priority.indexOf(a);
    const ib = priority.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  // 最多 6 个标签
  return sorted.slice(0, 6);
}

/**
 * 判断是否为快讯
 */
export function isBreakingNews(title: string, summary: string): boolean {
  const text = `${title} ${summary}`.toLowerCase();
  const breakingKeywords = ["breaking", "flash", "快讯", "突发", "just in", "urgent"];
  return breakingKeywords.some((kw) => text.includes(kw));
}

/**
 * 判断是否为财报相关
 */
export function isEarningsNews(title: string, summary: string): boolean {
  const text = `${title} ${summary}`.toLowerCase();
  const earningsKeywords = ["earnings", "revenue", "quarterly", " eps", "财报", "营收", "季度业绩"];
  return earningsKeywords.some((kw) => text.includes(kw));
}

/**
 * 判断是否为 SEC 公告
 */
export function isSECNews(sourceName: string): boolean {
  return sourceName.toLowerCase().includes("sec") || sourceName.toLowerCase().includes("edgar");
}
