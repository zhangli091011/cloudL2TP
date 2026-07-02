// ============================================================
// 云端软路由控制面板 - 共享类型定义
// 前后端共用类型
// ============================================================

// --- 用户认证 ---
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: UserInfo
}

export interface UserInfo {
  id: number
  username: string
  createdAt: string
}

// --- Mihomo 状态 ---
export interface MihomoStatus {
  running: boolean
  version: string
  mode: string
  uptime: number       // 秒
  memory: number       // MB
  goroutines: number
  connections: number
  uploadSpeed: number   // bytes/s
  downloadSpeed: number // bytes/s
  uploadTotal: number
  downloadTotal: number
}

// --- 仪表盘 ---
export interface DashboardData {
  mihomoStatus: MihomoStatus
  currentProxyGroup: string
  currentNode: string | null
  currentNodeLatency: number | null
  subscriptionCount: number
  nodeCount: number
  lastSubscriptionUpdate: string | null
  vpnHint: string
}

// --- 代理节点 ---
export interface ProxyNode {
  id: number
  subscriptionId: number | null
  name: string
  type: string
  server: string
  port: number
  latencyMs: number | null
  alive: boolean
  lastTestedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ProxyNodeFromAPI {
  name: string
  type: string
  server: string
  port: number
  alive: boolean
  latency: number | null
  extra?: Record<string, unknown>
}

// --- 策略组 ---
export interface ProxyGroup {
  name: string
  type: 'Selector' | 'URLTest' | 'Fallback' | 'LoadBalance' | 'Relay' | 'Compatible'
  now: string
  all: string[]
}

export interface SwitchProxyRequest {
  name: string
}

// --- 订阅 ---
export interface Subscription {
  id: number
  name: string
  urlMasked: string      // 脱敏后的 URL（隐藏 token）
  enabled: boolean
  nodeCount: number
  lastUpdatedAt: string | null
  lastError: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateSubscriptionRequest {
  name: string
  url: string
}

export interface UpdateSubscriptionRequest {
  name?: string
  url?: string
  enabled?: boolean
}

// --- 设置 ---
export interface PanelSettings {
  mihomoApiUrl: string
  mihomoApiSecret: string
  defaultProxyGroup: string
  subscriptionUpdateInterval: number
  mockMode: boolean
  vpnType: string
}

// --- 日志 ---
export interface LogEntry {
  id: number
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

// --- API 通用响应 ---
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// --- 分页 ---
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
