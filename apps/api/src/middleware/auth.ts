// ============================================================
// JWT 认证中间件
// 保护需要登录的 API 路由
// ============================================================
import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/authService'

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      userId?: number
      username?: string
    }
  }
}

/**
 * JWT 认证中间件
 * 从 Authorization header 中提取 Bearer token 并验证
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未提供认证令牌' })
    return
  }

  const token = authHeader.substring(7)
  const payload = authService.verifyToken(token)
  if (!payload) {
    res.status(401).json({ success: false, error: '认证令牌无效或已过期' })
    return
  }

  req.userId = payload.userId
  req.username = payload.username
  next()
}
