// ============================================================
// 去重算法：Jaccard 相似度 + 时间窗口
// ============================================================

/**
 * 文本分词（简单版：英文按空格/标点分词，中文按字符分词）
 */
function tokenize(text: string): Set<string> {
  if (!text) return new Set();
  // 转小写
  const lower = text.toLowerCase();
  // 英文单词
  const enWords = lower.match(/[a-z]{2,}/g) || [];
  // 中文按 2-gram 分词
  const zhChars = lower.match(/[\u4e00-\u9fa5]/g) || [];
  const zhGrams: string[] = [];
  for (let i = 0; i < zhChars.length - 1; i++) {
    zhGrams.push(zhChars[i] + zhChars[i + 1]);
  }
  // 过滤停用词
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "to", "of",
    "in", "on", "at", "by", "for", "with", "and", "or", "not", "but",
    "this", "that", "it", "as", "from", "has", "have", "had",
  ]);
  const tokens = [...enWords.filter((w) => !stopWords.has(w) && w.length > 2), ...zhGrams];
  return new Set(tokens);
}

/**
 * Jaccard 相似度：两个集合交集大小 / 并集大小
 */
export function jaccardSimilarity(text1: string, text2: string): number {
  const set1 = tokenize(text1);
  const set2 = tokenize(text2);
  if (set1.size === 0 || set2.size === 0) return 0;

  let intersection = 0;
  for (const token of set1) {
    if (set2.has(token)) intersection++;
  }
  const union = set1.size + set2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * 判断两篇资讯是否为重复
 * 规则：标题 Jaccard 相似度 > 0.5，且时间差在 24 小时内
 */
export function isDuplicate(
  title1: string,
  publishedAt1: number,
  title2: string,
  publishedAt2: number,
  threshold = 0.5,
  timeWindowMs = 24 * 60 * 60 * 1000
): boolean {
  const similarity = jaccardSimilarity(title1, title2);
  const timeDiff = Math.abs(publishedAt1 - publishedAt2);
  return similarity >= threshold && timeDiff <= timeWindowMs;
}

/**
 * 在已有条目中查找重复
 * 返回匹配的条目 ID，或 null
 */
export function findDuplicate(
  title: string,
  publishedAt: number,
  existingItems: { id: string; title: string; publishedAt: number }[]
): string | null {
  for (const item of existingItems) {
    if (isDuplicate(title, publishedAt, item.title, item.publishedAt)) {
      return item.id;
      }
  }
  return null;
}
