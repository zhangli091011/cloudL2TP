// ============================================================
// 全局错误处理中间件
// ============================================================
import { Request, Response, NextFunction } from 'express'
import { logService } from '../services/logService'

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logService.error(`API 错误: ${req.method} ${req.path}`, {
    error: err.message,
    stack: err.stack?.split('\n').slice(0, 3).join('\n'),
  })

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
  })
}
