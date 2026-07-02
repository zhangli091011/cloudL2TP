// ============================================================
// 日志路由
// ============================================================
import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware/auth'
import { logService } from '../services/logService'

const router = Router()

// GET /api/logs
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { level, search, limit, offset } = req.query

    const result = logService.getLogs({
      level: level as string | undefined,
      search: search as string | undefined,
      limit: limit ? parseInt(limit as string) : 100,
      offset: offset ? parseInt(offset as string) : 0,
    })

    res.json({ success: true, data: result })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/logs - 清空日志
router.delete('/', authMiddleware, (_req: Request, res: Response) => {
  try {
    logService.clearLogs()
    res.json({ success: true, message: '日志已清空' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
