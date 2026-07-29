// ============================================================
// 清理与目标公司无关的新闻
// 只保留 AAPL/MSFT/GOOGL/AMZN/META/TSLA/NVDA/SpaceX 相关新闻
// ============================================================

import { getDb, saveDb, execute, queryAll } from "../lib/db";

const TARGET_STOCKS = ["Apple", "Microsoft", "Google", "Amazon", "Meta", "Tesla", "NVIDIA", "SpaceX"];

async function main() {
  const db = await getDb();

  // 查询所有新闻
  const rows = queryAll<{ id: string; title: string; related_stocks: string }>(
    db,
    `SELECT id, title, related_stocks FROM items ORDER BY heat_score DESC`
  );

  console.log(`总新闻数: ${rows.length}`);

  const toDelete: string[] = [];
  const toKeep: string[] = [];

  for (const row of rows) {
    let stocks: string[] = [];
    try {
      stocks = JSON.parse(row.related_stocks || "[]");
    } catch {
      // related_stocks 解析失败，视为不相关
    }

    const hasTarget = stocks.some((s) => TARGET_STOCKS.includes(s));
    if (hasTarget) {
      toKeep.push(row.id);
    } else {
      toDelete.push(row.id);
    }
  }

  console.log(`相关新闻（保留）: ${toKeep.length}`);
  console.log(`无关新闻（删除）: ${toDelete.length}`);

  if (toDelete.length === 0) {
    console.log("没有需要删除的新闻。");
    db.close();
    return;
  }

  // 批量删除（每批 50 条）
  const BATCH = 50;
  let deleted = 0;

  for (let i = 0; i < toDelete.length; i += BATCH) {
    const batch = toDelete.slice(i, i + BATCH);
    const placeholders = batch.map(() => "?").join(",");

    // 删除关联的 item_tags
    execute(db, `DELETE FROM item_tags WHERE item_id IN (${placeholders})`, batch);
    // 删除关联的 item_sources
    execute(db, `DELETE FROM item_sources WHERE item_id IN (${placeholders})`, batch);
    // 删除新闻
    execute(db, `DELETE FROM items WHERE id IN (${placeholders})`, batch);

    deleted += batch.length;
    console.log(`  已删除: ${deleted}/${toDelete.length}`);
  }

  saveDb(db);
  db.close();

  console.log(`\n✅ 清理完成: 删除 ${deleted} 条无关新闻，保留 ${toKeep.length} 条`);
}

main().catch((err) => {
  console.error("脚本执行失败:", err);
  process.exit(1);
});
