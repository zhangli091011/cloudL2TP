// ============================================================
// 订阅管理路由
// ============================================================
import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware/auth'
import { subscriptionService } from '../services/subscriptionService'

const router = Router()

// GET /api/subscriptions
router.get('/', authMiddleware, (_req: Request, res: Response) => {
  try {
    const subs = subscriptionService.getAll()
    res.json({ success: true, data: subs })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/subscriptions - 添加订阅
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { name, url } = req.body

    if (!name || !url) {
      res.status(400).json({ success: false, error: '名称和 URL 不能为空' })
      return
    }

    // 基础 URL 格式验证
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      res.status(400).json({ success: false, error: 'URL 必须以 http:// 或 https:// 开头' })
      return
    }

    const sub = subscriptionService.create({ name, url })
    res.status(201).json({ success: true, data: sub })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PUT /api/subscriptions/:id - 编辑订阅
router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const { name, url, enabled } = req.body

    const sub = subscriptionService.update(id, { name, url, enabled })
    if (!sub) {
      res.status(404).json({ success: false, error: '订阅不存在' })
      return
    }

    res.json({ success: true, data: sub })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/subscriptions/:id - 删除订阅
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const deleted = subscriptionService.delete(id)
    if (!deleted) {
      res.status(404).json({ success: false, error: '订阅不存在' })
      return
    }
    res.json({ success: true, message: '订阅已删除' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/subscriptions/:id/update - 手动更新订阅
router.post('/:id/update', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const result = await subscriptionService.updateSubscription(id)
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
