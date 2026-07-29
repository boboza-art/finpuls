// ============================================================
// 英中翻译模块
// 主引擎：Google Translate 非官方 API（免费、无需 Key、质量好）
// 备用引擎：MyMemory Translation API
// 带缓存和错误重试
// ============================================================

const GOOGLE_API =
  "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=";
const MYMEMORY_API = "https://api.mymemory.translated.net/get";
const LANG_PAIR = "en|zh-CN";

// 内存缓存：避免重复翻译相同文本
const cache = new Map<string, string>();
const MAX_CACHE_SIZE = 500;

interface TranslateResult {
  translatedText: string;
  match: number; // 0-1 翻译质量评分
}

/**
 * Google Translate 非官方 API 翻译
 */
async function googleTranslate(text: string): Promise<string | null> {
  if (!text || /^[\s\d\p{P}]+$/u.test(text)) return text;

  // 已经是中文为主，不翻译
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  if (chineseChars > text.length * 0.5) return text;

  try {
    const truncated = text.slice(0, 1800); // Google 限制
    const url = GOOGLE_API + encodeURIComponent(truncated);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const segments: string[] = [];
    if (Array.isArray(data[0])) {
      for (const seg of data[0]) {
        if (seg && seg[0]) segments.push(seg[0]);
      }
    }
    const translated = segments.join("");

    // 检查是否真的翻译了（含中文字符）
    const hasChinese = /[\u4e00-\u9fff]/.test(translated);
    if (!hasChinese) return null;

    return translated;
  } catch {
    return null;
  }
}

/**
 * MyMemory 翻译（备用引擎）
 */
async function myMemoryTranslate(text: string): Promise<string | null> {
  if (!text || /^[\s\d\p{P}]+$/u.test(text)) return text;

  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  if (chineseChars > text.length * 0.5) return text;

  try {
    const truncated = text.slice(0, 500); // MyMemory 限制
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(truncated)}&langpair=${LANG_PAIR}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!res.ok) return null;

    const data = await res.json();
    const translated = data.responseData?.translatedText || text;

    const hasChinese = /[\u4e00-\u9fff]/.test(translated);
    if (!hasChinese || translated === text) return null;

    return translated;
  } catch {
    return null;
  }
}

/**
 * 翻译文本（英 → 中）
 * 先用 Google Translate，失败则回退到 MyMemory
 */
export async function translateText(
  text: string,
  _maxRetries = 2
): Promise<TranslateResult> {
  // 空字符串或纯数字/符号，不需要翻译
  if (!text || /^[\s\d\p{P}]+$/u.test(text)) {
    return { translatedText: text, match: 1 };
  }

  // 已经是中文为主，不翻译
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  if (chineseChars > text.length * 0.5) {
    return { translatedText: text, match: 1 };
  }

  // 检查缓存
  const cacheKey = text.slice(0, 200);
  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    return { translatedText: cached, match: 1 };
  }

  // 主引擎：Google Translate
  let translated = await googleTranslate(text);

  // 备用引擎：MyMemory
  if (translated === null) {
    translated = await myMemoryTranslate(text);
  }

  // 两个引擎都失败，返回原文
  if (translated === null) {
    return { translatedText: text, match: 0 };
  }

  // 写入缓存
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(cacheKey, translated);

  return { translatedText: translated, match: 1 };
}

/**
 * 批量翻译多项（顺序执行，带限流）
 */
export async function translateBatch(
  texts: { title: string; summary: string }[],
  delayMs = 800
): Promise<{ titleCn: string; summaryCn: string }[]> {
  const results: { titleCn: string; summaryCn: string }[] = [];

  for (const { title, summary } of texts) {
    const [titleResult, summaryResult] = await Promise.all([
      translateText(title),
      translateText(summary),
    ]);

    results.push({
      titleCn: titleResult.translatedText,
      summaryCn: summaryResult.translatedText,
    });

    // 限流
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return results;
}
