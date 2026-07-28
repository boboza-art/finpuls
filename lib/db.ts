import initSqlJs, { type Database } from "sql.js";
import fs from "fs";
import path from "path";

let SQL: Awaited<ReturnType<typeof initSqlJs>>;
let dbInstance: Database | null = null;
const DB_PATH = path.join(process.cwd(), "data", "finpulse.db");
const SQL_WASM_PATH = path.join(
  process.cwd(),
  "public",
  "sql-wasm.wasm"
);

/** 获取数据库实例（单例） */
export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: () => SQL_WASM_PATH,
    });
  }

  // 如果有已有数据库文件，加载它
  let db: Database;
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  initSchema(db);
  dbInstance = db;
  return db;
}

/** 保存数据库到文件 */
export function saveDb(db: Database): void {
  const data = db.export();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

/** 初始化数据库 schema */
function initSchema(db: Database): void {
  const stmts = [
    `CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT,
      source_id TEXT,
      source_name TEXT,
      source_url TEXT,
      source_avatar TEXT,
      heat_score INTEGER DEFAULT 50,
      is_featured INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      tags TEXT,
      published_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s','now') * 1000),
      note TEXT,
      additional_sources TEXT,
      related_stocks TEXT,
      related_cryptos TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      url TEXT,
      avatar TEXT,
      weight INTEGER DEFAULT 50,
      category TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS item_tags (
      item_id TEXT,
      tag TEXT,
      PRIMARY KEY (item_id, tag)
    )`,
    `CREATE TABLE IF NOT EXISTS item_sources (
      item_id TEXT,
      source_name TEXT,
      source_url TEXT,
      PRIMARY KEY (item_id, source_name)
    )`,
    `CREATE TABLE IF NOT EXISTS price_cache (
      symbol TEXT PRIMARY KEY,
      name TEXT,
      price REAL,
      change_24h REAL,
      change_amount REAL,
      volume_24h REAL,
      market_cap REAL,
      sparkline TEXT,
      updated_at INTEGER
    )`,
    `CREATE INDEX IF NOT EXISTS idx_items_published ON items(published_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_items_featured ON items(is_featured DESC, published_at DESC)`,
    `CREATE TABLE IF NOT EXISTS source_health (
      source_id TEXT PRIMARY KEY,
      source_name TEXT,
      last_fetch_at INTEGER,
      last_success_at INTEGER,
      last_error TEXT,
      total_fetches INTEGER DEFAULT 0,
      total_success INTEGER DEFAULT 0,
      total_errors INTEGER DEFAULT 0,
      items_fetched INTEGER DEFAULT 0,
      avg_latency_ms INTEGER DEFAULT 0,
      updated_at INTEGER
    )`,
    `CREATE INDEX IF NOT EXISTS idx_health_updated ON source_health(last_success_at DESC)`,
    `CREATE TABLE IF NOT EXISTS whale_alerts (
      id TEXT PRIMARY KEY,
      tx_hash TEXT,
      blockchain TEXT,
      from_address TEXT,
      to_address TEXT,
      to_owner TEXT,
      amount REAL,
      amount_usd REAL,
      symbol TEXT,
      transaction_type TEXT,
      timestamp INTEGER,
      created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_whale_timestamp ON whale_alerts(timestamp DESC)`,
  ];

  for (const sql of stmts) {
    db.run(sql);
  }
}

/** 执行查询并返回所有结果行 */
export function queryAll<T = Record<string, unknown>>(
  db: Database,
  sql: string,
  params: unknown[] = []
): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

/** 执行单行查询 */
export function queryOne<T = Record<string, unknown>>(
  db: Database,
  sql: string,
  params: unknown[] = []
): T | null {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let result: T | null = null;
  if (stmt.step()) {
    result = stmt.getAsObject() as T;
  }
  stmt.free();
  return result;
}

/** 执行写入操作 */
export function execute(
  db: Database,
  sql: string,
  params: unknown[] = []
): void {
  db.run(sql, params as never);
}
