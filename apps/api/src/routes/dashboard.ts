// ============================================================
// 仪表盘路由
// ============================================================
import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware/auth'
import { mihomoService } from '../services/mihomoService'
import { getDb } from '../db'
import type { DashboardData } from '@cloud-router/shared'

const router = Router()

// GET /api/dashboard
router.get('/', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const db = getDb()

    // 获取 Mihomo 状态
    let mihomoStatus: any = {
      running: false,
      version: 'unknown',
      mode: 'rule',
      uptime: 0,
      memory: 0,
      goroutines: 0,
      connections: 0,
      uploadSpeed: 0,
      downloadSpeed: 0,
      uploadTotal: 0,
      downloadTotal: 0,
    }

    try {
      const status = await mihomoService.getStatus()
      mihomoStatus = {
        ...mihomoStatus,
        ...status,
      }
    } catch {
      // 使用默认值
    }

    // 获取当前策略组和节点
    let currentProxyGroup = 'Proxy'
    let currentNode: string | null = null
    let currentNodeLatency: number | null = null

    try {
      const groups = await mihomoService.getProxyGroups()
      const mainGroup = groups.find(g =>
        ['GLOBAL', 'Proxy', '🚀 节点选择'].includes(g.name)
      ) || groups[0]

      if (mainGroup) {
        currentProxyGroup = mainGroup.name
        currentNode = mainGroup.now

        // 获取当前节点延迟
        if (currentNode && currentNode !== 'DIRECT' && currentNode !== 'REJECT') {
          const node = db.prepare('SELECT latency_ms FROM nodes WHERE name = ?').get(currentNode) as any
          currentNodeLatency = node?.latency_ms ?? null
        }
      }
    } catch {
      // 使用默认值
    }

    // 统计信息
    const subCount = (db.prepare('SELECT COUNT(*) as count FROM subscriptions').get() as any).count
    const nodeCount = (db.prepare('SELECT COUNT(*) as count FROM nodes').get() as any).count
    const lastUpdate = db.prepare(
      'SELECT last_updated_at FROM subscriptions ORDER BY last_updated_at DESC LIMIT 1'
    ).get() as any

    const dashboardData: DashboardData = {
      mihomoStatus,
      currentProxyGroup,
      currentNode,
      currentNodeLatency,
      subscriptionCount: subCount,
      nodeCount,
      lastSubscriptionUpdate: lastUpdate?.last_updated_at || null,
      vpnHint: '旧路由器请通过 L2TP/IPsec 连接本服务器，详见 README VPN 部署说明',
    }

    res.json({ success: true, data: dashboardData })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
