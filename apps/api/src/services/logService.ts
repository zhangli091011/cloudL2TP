// ============================================================
// 操作日志服务
// ============================================================
import { getDb } from '../db'
import type { LogEntry } from '@cloud-router/shared'

class LogService {
  private writeLog(level: string, message: string, metadata?: Record<string, unknown>): void {
    try {
      const db = getDb()
      db.prepare(
        'INSERT INTO operation_logs (level, message, metadata_json) VALUES (?, ?, ?)'
      ).run(level, message, metadata ? JSON.stringify(metadata) : null)
    } catch {
      // 静默失败，确保日志写入不影响主流程
    }
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    console.log(`[INFO] ${message}`)
    this.writeLog('info', message, metadata)
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`)
    this.writeLog('warn', message, metadata)
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    console.error(`[ERROR] ${message}`)
    this.writeLog('error', message, metadata)
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    console.log(`[DEBUG] ${message}`)
    this.writeLog('debug', message, metadata)
  }

  /** 查询日志 */
  getLogs(params: {
    level?: string
    search?: string
    limit?: number
    offset?: number
  }): { items: LogEntry[]; total: number } {
    const db = getDb()
    const conditions: string[] = []
    const values: any[] = []

    if (params.level && params.level !== 'all') {
      conditions.push('level = ?')
      values.push(params.level)
    }
    if (params.search) {
      conditions.push('message LIKE ?')
      values.push(`%${params.search}%`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const limit = params.limit || 100
    const offset = params.offset || 0

    const items = db.prepare(
      `SELECT id, level, message, metadata_json as metadata, created_at as createdAt 
       FROM operation_logs ${where} 
       ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...values, limit, offset) as any[]

    const total = (db.prepare(
      `SELECT COUNT(*) as count FROM operation_logs ${where}`
    ).get(...values) as any).count

    // 解析 metadata JSON
    return {
      items: items.map(item => ({
        ...item,
        metadata: item.metadata ? JSON.parse(item.metadata) : null,
      })),
      total,
    }
  }

  /** 清空日志 */
  clearLogs(): void {
    const db = getDb()
    db.prepare('DELETE FROM operation_logs').run()
    this.info('日志已清空')
  }
}

export const logService = new LogService()
