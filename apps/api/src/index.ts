// ============================================================
// API 服务入口
// ============================================================
import { createApp } from './app'
import { config } from './config'
import { authService } from './services/authService'
import { logService } from './services/logService'

async function main() {
  // 初始化数据库（getDb 会触发 schema 创建）
  const { getDb } = await import('./db')
  getDb()

  // 初始化默认管理员账号
  authService.initAdmin()

  // 创建 Express 应用
  const app = createApp()

  app.listen(config.port, () => {
    console.log('='.repeat(50))
    console.log('  Cloud Router Panel API Server')
    console.log(`  Port: ${config.port}`)
    console.log(`  Mock Mode: ${config.mockMode}`)
    console.log(`  Mihomo API: ${config.mihomoApiUrl}`)
    console.log('='.repeat(50))

    logService.info(`API 服务已启动，端口: ${config.port}`)
  })
}

main().catch(err => {
  console.error('启动失败:', err)
  process.exit(1)
})
