// ============================================================
// Mihomo API 路由
// ============================================================
import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware/auth'
import { mihomoService } from '../services/mihomoService'
import { extractNodesFromProxies } from '../utils/yamlParser'

const router = Router()

// GET /api/mihomo/status
router.get('/status', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const status = await mihomoService.getStatus()
    res.json({ success: true, data: status })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/mihomo/reload
router.post('/reload', authMiddleware, async (_req: Request, res: Response) => {
  try {
    await mihomoService.reloadConfig()
    res.json({ success: true, message: '配置已重新加载' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/mihomo/proxies - 获取所有代理组
router.get('/proxies', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const groups = await mihomoService.getProxyGroups()
    res.json({ success: true, data: groups })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PUT /api/mihomo/proxies/:groupName - 切换代理组节点
router.put('/proxies/:groupName', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { groupName } = req.params
    const { name } = req.body

    if (!name) {
      res.status(400).json({ success: false, error: '缺少节点名称' })
      return
    }

    await mihomoService.switchProxy(groupName, name)
    res.json({ success: true, message: `已切换到: ${name}` })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/mihomo/delay/:proxyName - 获取节点延迟
router.get('/delay/:proxyName', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { proxyName } = req.params
    const timeout = parseInt(req.query.timeout as string) || 5000
    const delay = await mihomoService.getProxyDelay(proxyName, timeout)
    res.json({ success: true, data: { name: proxyName, delay } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
