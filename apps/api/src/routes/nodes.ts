// ============================================================
// 节点管理路由
// ============================================================
import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware/auth'
import { subscriptionService } from '../services/subscriptionService'
import { mihomoService } from '../services/mihomoService'
import { getDb } from '../db'
import { logService } from '../services/logService'

const router = Router()

/** 默认策略组名称候选项 */
const GROUP_CANDIDATES = ['Proxy', 'GLOBAL', '🚀 节点选择', '手动切换']

// GET /api/nodes - 获取所有节点（可选过滤）
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const subId = req.query.subscriptionId ? parseInt(req.query.subscriptionId as string) : undefined
    const nodes = subscriptionService.getNodes(subId)

    res.json({
      success: true,
      data: nodes.map((n: any) => ({
        id: n.id,
        subscriptionId: n.subscription_id,
        name: n.name,
        type: n.type,
        server: n.server,
        port: n.port,
        latencyMs: n.latency_ms,
        alive: n.alive === 1,
        lastTestedAt: n.last_tested_at,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      })),
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/nodes/test-all - 全部测速
router.post('/test-all', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const db = getDb()
    const nodes = db.prepare('SELECT id, name FROM nodes').all() as any[]

    if (nodes.length === 0) {
      res.json({ success: true, data: [] })
      return
    }

    const results: { name: string; latency: number | null }[] = []

    for (const node of nodes) {
      try {
        const latency = await mihomoService.getProxyDelay(node.name)
        subscriptionService.updateNodeLatency(node.id, latency, latency !== null)
        results.push({ name: node.name, latency })
      } catch {
        subscriptionService.updateNodeLatency(node.id, null, false)
        results.push({ name: node.name, latency: null })
      }
    }

    logService.info(`全部节点测速完成，共 ${nodes.length} 个节点`)
    res.json({ success: true, data: results })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/nodes/:id/test - 单个节点测速
router.post('/:id/test', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const db = getDb()
    const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id) as any
    if (!node) {
      res.status(404).json({ success: false, error: '节点不存在' })
      return
    }

    const latency = await mihomoService.getProxyDelay(node.name)
    subscriptionService.updateNodeLatency(id, latency, latency !== null)

    res.json({
      success: true,
      data: { id, name: node.name, latency, alive: latency !== null },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/nodes/:id/select - 选择节点作为当前出口
router.post('/:id/select', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const db = getDb()
    const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id) as any
    if (!node) {
      res.status(404).json({ success: false, error: '节点不存在' })
      return
    }

    // 找到主策略组（按候选项顺序查找）
    const groups = await mihomoService.getProxyGroups()
    const mainGroup = groups.find(g => GROUP_CANDIDATES.includes(g.name)) || groups[0]

    if (!mainGroup) {
      res.status(500).json({ success: false, error: '未找到可用的策略组，请确认 mihomo 配置已正确加载（检查 MIHOMO_API_URL 和 secret）' })
      return
    }

    await mihomoService.switchProxy(mainGroup.name, node.name)
    logService.info(`节点已切换: ${node.name}`)

    res.json({
      success: true,
      data: { groupName: mainGroup.name, nodeName: node.name },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
