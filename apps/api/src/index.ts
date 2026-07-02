// ============================================================
// API 服务入口
// ============================================================
import { createApp } from './app'
import { config } from './config'
import { authService } from './services/authService'
import { logService } from './services/logService'
import { subscriptionService } from './services/subscriptionService'
import { mihomoService } from './services/mihomoService'

async function main() {
  // 初始化数据库（getDb 会触发 schema 创建）
  const { getDb } = await import('./db')
  getDb()

  // 初始化默认管理员账号
  authService.initAdmin()

  // 启动订阅自动更新调度器
  subscriptionService.startAutoUpdateScheduler()

  // 创建 Express 应用
  const app = createApp()

  app.listen(config.port, async () => {
    console.log('='.repeat(50))
    console.log('  Cloud Router Panel API Server')
    console.log(`  Port: ${config.port}`)
    console.log(`  Mock Mode: ${config.mockMode}`)
    console.log(`  Mihomo API: ${config.mihomoApiUrl}`)
    console.log('='.repeat(50))

    logService.info(`API 服务已启动，端口: ${config.port}`)

    // 启动时检测 mihomo 连通性
    if (!config.mockMode) {
      const ok = await mihomoService.healthCheck()
      if (ok) {
        logService.info(`mihomo 连接正常: ${config.mihomoApiUrl}`)
      } else {
        logService.error(`无法连接到 mihomo: ${config.mihomoApiUrl}，请检查 MIHOMO_API_URL 配置`)
      }
    }
  })
}

main().catch(err => {
  console.error('启动失败:', err)
  process.exit(1)
})
