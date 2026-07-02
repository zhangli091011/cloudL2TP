// ============================================================
// 数据库初始化与连接管理
// 使用 better-sqlite3 作为 SQLite 驱动
// ============================================================
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { config } from '../config'

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.resolve(config.databasePath)
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema()
  }
  return db
}

// ============================================================
// 数据库表 Schema
// ============================================================
function initSchema(): void {
  const database = db

  database.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 订阅表：url_encrypted 存储加密后的订阅链接
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url_encrypted TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      last_updated_at TEXT,
      last_error TEXT,
      node_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 节点表：解析自订阅 YAML 的代理节点
    CREATE TABLE IF NOT EXISTS nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      server TEXT NOT NULL,
      port INTEGER NOT NULL,
      raw_json TEXT,
      latency_ms INTEGER,
      alive INTEGER NOT NULL DEFAULT 1,
      last_tested_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
    );

    -- 设置表：key-value 方式存储
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 操作日志表
    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL DEFAULT 'info',
      message TEXT NOT NULL,
      metadata_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 索引
    CREATE INDEX IF NOT EXISTS idx_nodes_subscription_id ON nodes(subscription_id);
    CREATE INDEX IF NOT EXISTS idx_nodes_name ON nodes(name);
    CREATE INDEX IF NOT EXISTS idx_logs_level ON operation_logs(level);
    CREATE INDEX IF NOT EXISTS idx_logs_created_at ON operation_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
  `)
}

// 关闭数据库连接
export function closeDb(): void {
  if (db) {
    db.close()
  }
}
