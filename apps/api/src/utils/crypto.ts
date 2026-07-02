// ============================================================
// 加密工具 - 订阅 URL 的加密/解密
// MVP 使用简单的 base64 + config.jwtSecret 派生密钥
// 生产环境应替换为 AES-256-GCM
// ============================================================
import crypto from 'crypto'
import { config } from '../config'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16
const KEY = crypto.scryptSync(config.jwtSecret, 'cloud-router-salt', 32)

/**
 * 加密订阅 URL，防止明文存储
 */
export function encryptUrl(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  let encrypted = cipher.update(plainText, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()
  // 格式: iv:tag:ciphertext (均 hex 编码)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

/**
 * 解密订阅 URL
 */
export function decryptUrl(encrypted: string): string {
  const parts = encrypted.split(':')
  if (parts.length !== 3) {
    throw new Error('加密数据格式无效')
  }
  const iv = Buffer.from(parts[0], 'hex')
  const tag = Buffer.from(parts[1], 'hex')
  const ciphertext = parts[2]

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(tag)
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * 生成订阅 URL 的脱敏显示版本
 * 隐藏 token/password 等敏感参数
 */
export function maskUrl(url: string): string {
  try {
    // 隐藏 URL 中常见的敏感查询参数
    return url.replace(/([?&])(token|secret|password|key|auth)=[^&]+/gi, '$1$2=***HIDDEN***')
  } catch {
    return '***HIDDEN***'
  }
}

/**
 * 哈希密码 (bcryptjs 同步方式，兼容 better-sqlite3 同步调用)
 */
export { hashSync as hashPassword, compareSync as verifyPassword } from 'bcryptjs'
