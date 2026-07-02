// ============================================================
// 应用配置 - 从环境变量加载
// ============================================================
import dotenv from 'dotenv'
import path from 'path'

// 尝试加载项目根目录的 .env 文件
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })
dotenv.config() // 也加载工作目录下的 .env

export const config = {
  port: parseInt(process.env.API_PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production-32chars',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',

  // Mihomo 配置
  mihomoApiUrl: process.env.MIHOMO_API_URL || 'http://127.0.0.1:9090',
  mihomoApiSecret: process.env.MIHOMO_API_SECRET || '',
  mihomoConfigDir: process.env.MIHOMO_CONFIG_DIR || '/etc/mihomo',
  mihomoBackupDir: process.env.MIHOMO_CONFIG_BACKUP_DIR || '/etc/mihomo/backups',

  // 订阅
  subscriptionUpdateInterval: parseInt(process.env.SUBSCRIPTION_UPDATE_INTERVAL || '3600', 10),

  // Mock 模式
  mockMode: process.env.MOCK_MODE === 'true',

  // 数据库
  databasePath: process.env.DATABASE_PATH || './data/panel.db',

  // 日志
  logLevel: process.env.LOG_LEVEL || 'info',
}
