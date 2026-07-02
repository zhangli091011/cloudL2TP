// ============================================================
// 认证服务 - JWT 登录/注册
// ============================================================
import jwt from 'jsonwebtoken'
import { getDb } from '../db'
import { hashPassword, verifyPassword } from '../utils/crypto'
import { config } from '../config'
import { logService } from './logService'
import type { UserInfo } from '@cloud-router/shared'

class AuthService {
  /** 初始化默认管理员账号 */
  initAdmin(): void {
    const db = getDb()
    const existing = db.prepare('SELECT COUNT(*) as count FROM users').get() as any
    if (existing.count === 0) {
      const passwordHash = hashPassword(config.adminPassword, 10)
      db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', passwordHash)
      logService.info('默认管理员账号已创建: admin')
    }
  }

  /** 用户登录，返回 JWT token */
  login(username: string, password: string): { token: string; user: UserInfo } | null {
    const db = getDb()
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any
    if (!user) return null

    if (!verifyPassword(password, user.password_hash)) return null

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.jwtSecret,
      { expiresIn: '7d' }
    )

    logService.info(`用户登录: ${username}`)

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.created_at,
      },
    }
  }

  /** 验证 JWT token */
  verifyToken(token: string): { userId: number; username: string } | null {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as { userId: number; username: string }
      return payload
    } catch {
      return null
    }
  }

  /** 修改密码 */
  changePassword(userId: number, oldPassword: string, newPassword: string): boolean {
    const db = getDb()
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
    if (!user) return false
    if (!verifyPassword(oldPassword, user.password_hash)) return false

    const newHash = hashPassword(newPassword, 10)
    db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?').run(newHash, userId)
    logService.info('密码已修改')
    return true
  }
}

export const authService = new AuthService()
