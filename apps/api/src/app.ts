// ============================================================
// Express 应用主文件
// ============================================================
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'

import authRoutes from './routes/auth'
import dashboardRoutes from './routes/dashboard'
import mihomoRoutes from './routes/mihomo'
import subscriptionsRoutes from './routes/subscriptions'
import nodesRoutes from './routes/nodes'
import logsRoutes from './routes/logs'
import { errorHandler } from './middleware/errorHandler'

export function createApp() {
  const app = express()

  // 安全头
  app.use(helmet({
    contentSecurityPolicy: false, // 前端 SPA 需要
  }))

  // CORS
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? false  // 生产环境由反向代理处理
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  }))

  // 请求日志
  app.use(morgan('short'))

  // 限速
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
  app.use('/api/', limiter)

  // 解析 JSON body
  app.use(express.json({ limit: '5mb' }))

  // 健康检查
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'Cloud Router Panel API v1.0' })
  })

  // API 路由
  app.use('/api/auth', authRoutes)
  app.use('/api', authRoutes)              // GET /api/me
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api/mihomo', mihomoRoutes)
  app.use('/api/subscriptions', subscriptionsRoutes)
  app.use('/api/nodes', nodesRoutes)
  app.use('/api/logs', logsRoutes)

  // 生产环境下托管前端静态文件
  if (process.env.NODE_ENV === 'production') {
    const webDist = path.resolve(__dirname, '../../web/dist')
    app.use(express.static(webDist))

    // SPA fallback: 所有非 API 路由返回 index.html
    app.get('*', (_req, res) => {
      res.sendFile(path.join(webDist, 'index.html'))
    })
  }

  // 错误处理
  app.use(errorHandler)

  return app
}
