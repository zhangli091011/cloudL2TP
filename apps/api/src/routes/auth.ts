// ============================================================
// 认证路由：登录、登出、获取当前用户
// ============================================================
import { Router, Request, Response } from 'express'
import { authService } from '../services/authService'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body

  if (!username || !password) {
    res.status(400).json({ success: false, error: '用户名和密码不能为空' })
    return
  }

  const result = authService.login(username, password)
  if (!result) {
    res.status(401).json({ success: false, error: '用户名或密码错误' })
    return
  }

  res.json({ success: true, data: result })
})

// POST /api/auth/logout
router.post('/logout', authMiddleware, (_req: Request, res: Response) => {
  res.json({ success: true, message: '已登出' })
})

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body

  if (!oldPassword || !newPassword) {
    res.status(400).json({ success: false, error: '旧密码和新密码不能为空' })
    return
  }

  if (newPassword.length < 8) {
    res.status(400).json({ success: false, error: '新密码至少需要 8 位' })
    return
  }

  const changed = authService.changePassword(req.userId!, oldPassword, newPassword)
  if (!changed) {
    res.status(400).json({ success: false, error: '旧密码不正确' })
    return
  }

  res.json({ success: true, message: '密码已修改' })
})

// GET /api/me
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      id: req.userId,
      username: req.username,
    },
  })
})

export default router
