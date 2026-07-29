// ============================================================
// 翻译回填脚本（专用 Google Translate 非官方 API）
// 对 title_cn 为空或等于 title 的条目重新翻译
// ============================================================

import { getDb, saveDb, queryAll, execute } from "../lib/db";

const GOOGLE_API =
  "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=";

/**
 * 用 Google Translate 非官方 API 翻译
 */
async function googleTranslate(text: string): Promise<string> {
  if (!text || /^[\s\d\p{P}]+$/u.test(text)) return text;

  // 中文为主则跳过
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  if (chineseChars > text.length * 0.5) return text;

  try {
    const truncated = text.slice(0, 1800); // Google 限制
    const url = GOOGLE_API + encodeURIComponent(truncated);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error(`  HTTP ${res.status}`);
      return text;
    }

    const data = await res.json();
    // data[0] 是翻译段数组，每段 [translatedText, originalText, ...]
    const segments: string[] = [];
    if (Array.isArray(data[0])) {
      for (const seg of data[0]) {
        if (seg && seg[0]) segments.push(seg[0]);
      }
    }
    const translated = segments.join("");

    // Google 有时返回原文（未翻译），检查是否有中文字符
    const hasChinese = /[\u4e00-\u9fff]/.test(translated);
    if (!hasChinese) return text;

    return translated;
  } catch (e) {
    console.error(`  Error: ${(e as Error).message}`);
    return text;
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("初始化数据库...");
  await getDb();

  // 查询未翻译的条目（title_cn 为空、等于 title、或无中文字符）
  const rows = queryAll<{
    id: string;
    title: string;
    summary: string;
    title_cn: string;
    summary_cn: string;
  }>(
    await getDb(),
    `SELECT id, title, summary, title_cn, summary_cn FROM items
     WHERE title_cn IS NULL OR title_cn = '' OR title_cn = title
     ORDER BY heat_score DESC`
  );

  console.log(`找到 ${rows.length} 条需要翻译的条目\n`);

  let success = 0;
  let skipped = 0;
  const BATCH = 10;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const pct = Math.round(((i + 1) / rows.length) * 100);

    // 翻译标题
    const titleCn = await googleTranslate(row.title);

    // 翻译摘要（如果摘要和标题不同）
    let summaryCn = "";
    if (row.summary && row.summary !== row.title) {
      summaryCn = await googleTranslate(row.summary);
    }

    // 检查是否真正翻译了
    const titleTranslated = titleCn !== row.title;
    const summaryTranslated =
      summaryCn && summaryCn !== row.summary;

    if (titleTranslated) {
      execute(
        await getDb(),
        `UPDATE items SET title_cn = ?, summary_cn = ? WHERE id = ?`,
        [titleCn, summaryTranslated ? summaryCn : titleCn, row.id]
      );
      success++;
      console.log(
        `[${pct}%] ${i + 1}/${rows.length} ✓ ${row.title.slice(0, 50)}... → ${titleCn.slice(0, 50)}...`
      );
    } else {
      skipped++;
      console.log(
        `[${pct}%] ${i + 1}/${rows.length} ⚠ 未翻译: ${row.title.slice(0, 50)}...`
      );
    }

    // 每 BATCH 条保存一次
    if ((i + 1) % BATCH === 0) {
      saveDb(await getDb());
      console.log(`  ── 已保存（${success} 成功 / ${skipped} 跳过）`);
    }

    // 限流：Google 非官方 API 需要保守
    await sleep(800);
  }

  // 最终保存
  saveDb(await getDb());

  console.log("\n========================================");
  console.log("翻译回填完成！");
  console.log(`  成功: ${success} 条`);
  console.log(`  跳过: ${skipped} 条`);
  console.log("========================================");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
