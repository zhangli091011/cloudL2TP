// ============================================================
// 订阅管理服务
// 负责订阅的增删改查、YAML 下载解析、自动更新
// ============================================================
import { getDb } from '../db'
import { encryptUrl, decryptUrl, maskUrl } from '../utils/crypto'
import { parseSubscriptionYaml } from '../utils/yamlParser'
import { generateConfigYaml, saveConfigWithBackup } from '../utils/configGenerator'
import { mihomoService } from './mihomoService'
import { logService } from './logService'
import { config } from '../config'
import type { Subscription, CreateSubscriptionRequest } from '@cloud-router/shared'
import axios from 'axios'

class SubscriptionService {
  /** 获取所有订阅 */
  getAll(): Subscription[] {
    const db = getDb()
    const rows = db.prepare(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM nodes WHERE subscription_id = s.id) as node_count
      FROM subscriptions s
      ORDER BY s.created_at DESC
    `).all() as any[]

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      urlMasked: maskUrl(decryptUrl(row.url_encrypted)),
      enabled: row.enabled === 1,
      nodeCount: row.node_count,
      lastUpdatedAt: row.last_updated_at,
      lastError: row.last_error,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  }

  /** 获取单个订阅 */
  getById(id: number): Subscription | null {
    const db = getDb()
    const row = db.prepare(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM nodes WHERE subscription_id = s.id) as node_count
      FROM subscriptions s WHERE s.id = ?
    `).get(id) as any

    if (!row) return null

    return {
      id: row.id,
      name: row.name,
      urlMasked: maskUrl(decryptUrl(row.url_encrypted)),
      enabled: row.enabled === 1,
      nodeCount: row.node_count,
      lastUpdatedAt: row.last_updated_at,
      lastError: row.last_error,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  /** 创建订阅 */
  create(data: CreateSubscriptionRequest): Subscription {
    const db = getDb()
    const encrypted = encryptUrl(data.url)
    const result = db.prepare(
      'INSERT INTO subscriptions (name, url_encrypted) VALUES (?, ?)'
    ).run(data.name, encrypted)

    logService.info(`订阅已添加: ${data.name}`)

    // 异步更新
    const id = result.lastInsertRowid as number
    this.updateSubscription(id).catch(err => {
      logService.error(`初次更新订阅失败: ${data.name}`, { error: err.message })
    })

    return this.getById(id)!
  }

  /** 更新订阅元数据 */
  update(id: number, data: { name?: string; url?: string; enabled?: boolean }): Subscription | null {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id) as any
    if (!existing) return null

    if (data.name) {
      db.prepare('UPDATE subscriptions SET name = ?, updated_at = datetime("now") WHERE id = ?').run(data.name, id)
    }
    if (data.url) {
      db.prepare('UPDATE subscriptions SET url_encrypted = ?, updated_at = datetime("now") WHERE id = ?').run(encryptUrl(data.url), id)
    }
    if (data.enabled !== undefined) {
      db.prepare('UPDATE subscriptions SET enabled = ?, updated_at = datetime("now") WHERE id = ?').run(data.enabled ? 1 : 0, id)
    }

    return this.getById(id)
  }

  /** 删除订阅及其节点 */
  delete(id: number): boolean {
    const db = getDb()
    const sub = db.prepare('SELECT name FROM subscriptions WHERE id = ?').get(id) as any
    if (!sub) return false

    db.prepare('DELETE FROM nodes WHERE subscription_id = ?').run(id)
    db.prepare('DELETE FROM subscriptions WHERE id = ?').run(id)
    logService.info(`订阅已删除: ${sub.name}`)
    return true
  }

  /** 手动更新订阅 */
  async updateSubscription(id: number): Promise<{ success: boolean; error?: string; nodeCount?: number }> {
    const db = getDb()
    const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id) as any
    if (!sub) return { success: false, error: '订阅不存在' }

    try {
      logService.info(`开始更新订阅: ${sub.name}`)

      // 1. 下载 YAML
      const url = decryptUrl(sub.url_encrypted)
      const response = await axios.get(url, {
        timeout: 30000,
        headers: { 'User-Agent': 'clash-verge/1.0' },
        responseType: 'text',
      })

      const yamlContent = response.data
      if (typeof yamlContent !== 'string' || yamlContent.trim().length === 0) {
        throw new Error('订阅返回空内容')
      }

      // 2. 解析 YAML
      const nodes = parseSubscriptionYaml(yamlContent)

      // 3. 存入数据库
      const deleteOld = db.prepare('DELETE FROM nodes WHERE subscription_id = ?')
      const insertNode = db.prepare(
        'INSERT INTO nodes (subscription_id, name, type, server, port, raw_json) VALUES (?, ?, ?, ?, ?, ?)'
      )

      const transaction = db.transaction(() => {
        deleteOld.run(id)
        for (const node of nodes) {
          insertNode.run(
            id,
            node.name,
            node.type,
            node.server,
            node.port,
            JSON.stringify(node.extra)
          )
        }
      })
      transaction()

      // 4. 更新时间戳和节点数
      db.prepare(`
        UPDATE subscriptions 
        SET last_updated_at = datetime('now'), 
            last_error = NULL, 
            node_count = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(nodes.length, id)

      logService.info(`订阅更新完成: ${sub.name}，共 ${nodes.length} 个节点`)

      // 5. 重新生成并应用配置
      await this.regenerateConfig()

      return { success: true, nodeCount: nodes.length }
    } catch (err: any) {
      const errorMsg = err.message || '未知错误'
      db.prepare(
        'UPDATE subscriptions SET last_error = ?, updated_at = datetime("now") WHERE id = ?'
      ).run(errorMsg, id)

      logService.error(`订阅更新失败: ${sub.name}`, { error: errorMsg })
      return { success: false, error: errorMsg }
    }
  }

  /** 重新生成 mihomo 配置并 reload */
  async regenerateConfig(): Promise<void> {
    try {
      const db = getDb()
      const nodes = db.prepare(
        'SELECT name, type, server, port, raw_json FROM nodes WHERE alive = 1'
      ).all() as any[]

      if (nodes.length === 0) {
        logService.warn('没有可用节点，跳过配置生成')
        return
      }

      // 构建代理配置
      const proxies = nodes.map(n => {
        const extra = n.raw_json ? JSON.parse(n.raw_json) : {}
        return {
          name: n.name,
          type: n.type,
          server: n.server,
          port: n.port,
          ...extra,
        }
      })

      // 生成 config.yaml
      const yamlContent = generateConfigYaml({ proxies })
      const saved = saveConfigWithBackup(yamlContent)

      if (saved) {
        // reload mihomo
        await mihomoService.reloadConfig()
      }
    } catch (err: any) {
      logService.error('重新生成配置失败', { error: err.message })
    }
  }

  /** 获取所有解析出的节点 */
  getNodes(subscriptionId?: number): any[] {
    const db = getDb()
    let query = 'SELECT * FROM nodes'
    const params: any[] = []

    if (subscriptionId) {
      query += ' WHERE subscription_id = ?'
      params.push(subscriptionId)
    }
    query += ' ORDER BY latency_ms ASC NULLS LAST, name ASC'

    return db.prepare(query).all(...params)
  }

  /** 更新节点延迟 */
  updateNodeLatency(nodeId: number, latency: number | null, alive: boolean): void {
    const db = getDb()
    db.prepare(`
      UPDATE nodes 
      SET latency_ms = ?, alive = ?, last_tested_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(latency, alive ? 1 : 0, nodeId)
  }
}

export const subscriptionService = new SubscriptionService()
