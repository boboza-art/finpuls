#!/usr/bin/env tsx
// ============================================================
// 回填已有条目的中文翻译
// 对 DB 中 title_cn 或 summary_cn 为空的条目逐一翻译
// 用法: npx tsx scripts/backfill-translate.ts
// ============================================================

import { getDb, saveDb, queryAll, execute } from "../lib/db";
import { translateText } from "../lib/translate";

interface Row {
  id: string;
  title: string;
  summary: string;
  title_cn: string;
  summary_cn: string;
}

async function backfillTranslations() {
  const db = await getDb();

  // 查找需要翻译的条目（中文字段为空或等于原标题/摘要）
  const rows = queryAll<Row>(
    db,
    `SELECT id, title, summary, title_cn, summary_cn
     FROM items
     WHERE title_cn IS NULL OR title_cn = '' OR title_cn = title
       OR summary_cn IS NULL OR summary_cn = ''
     ORDER BY published_at DESC`
  );

  console.log(`找到 ${rows.length} 条需要翻译的条目`);

  let translated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      // 翻译标题和摘要
      const [titleResult, summaryResult] = await Promise.all([
        translateText(row.title),
        translateText(row.summary || ""),
      ]);

      execute(
        db,
        `UPDATE items SET title_cn = ?, summary_cn = ? WHERE id = ?`,
        [titleResult.translatedText, summaryResult.translatedText, row.id]
      );

      translated++;
      const pct = Math.round(((i + 1) / rows.length) * 100);
      console.log(`[${pct}%] ${i + 1}/${rows.length} ✓ ${row.title.slice(0, 40)}... → ${titleResult.translatedText.slice(0, 30)}...`);
    } catch (e) {
      failed++;
      console.error(`[${i + 1}/${rows.length}] ✗ ${row.title.slice(0, 50)}...`, e instanceof Error ? e.message : e);
    }

    // 每 10 条保存一次，避免意外中断丢失进度
    if ((i + 1) % 10 === 0) {
      saveDb(db);
      console.log(`  ── 已保存（${translated} 成功 / ${failed} 失败）`);
    }

    // 限流：每次请求间隔 300ms
    if (i < rows.length - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  // 最终保存
  saveDb(db);

  console.log("\n========================================");
  console.log(`翻译回填完成！`);
  console.log(`  成功: ${translated} 条`);
  console.log(`  跳过: ${skipped} 条`);
  console.log(`  失败: ${failed} 条`);
  console.log("========================================");
}

backfillTranslations().catch((e) => {
  console.error("回填失败:", e);
  process.exit(1);
});
