// ============================================================
// API Client - 封装后端 REST API 调用
// ============================================================
import axios, { AxiosInstance, AxiosError } from 'axios'
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  DashboardData,
  Subscription,
  ProxyNode,
  ProxyGroup,
  LogEntry,
} from '@cloud-router/shared'

const API_BASE = '/api'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    })

    // 请求拦截器：附加 JWT token
    this.client.interceptors.request.use(config => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // 响应拦截器：401 时清除 token
    this.client.interceptors.response.use(
      res => res,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  private async get<T>(url: string, params?: any): Promise<T> {
    const res = await this.client.get<ApiResponse<T>>(url, { params })
    return res.data.data as T
  }

  private async post<T>(url: string, body?: any): Promise<T> {
    const res = await this.client.post<ApiResponse<T>>(url, body)
    return res.data.data as T
  }

  private async put<T>(url: string, body?: any): Promise<T> {
    const res = await this.client.put<ApiResponse<T>>(url, body)
    return res.data.data as T
  }

  private async del<T>(url: string): Promise<T> {
    const res = await this.client.delete<ApiResponse<T>>(url)
    return res.data.data as T
  }

  // --- Auth ---
  login(data: LoginRequest) { return this.post<LoginResponse>('/auth/login', data) }
  logout() { return this.post('/auth/logout') }
  getMe() { return this.get('/me') }

  // --- Dashboard ---
  getDashboard() { return this.get<DashboardData>('/dashboard') }

  // --- Mihomo ---
  getMihomoStatus() { return this.get('/mihomo/status') }
  reloadMihomo() { return this.post('/mihomo/reload') }
  getProxyGroups() { return this.get<ProxyGroup[]>('/mihomo/proxies') }
  switchProxy(groupName: string, name: string) {
    return this.put(`/mihomo/proxies/${encodeURIComponent(groupName)}`, { name })
  }
  getProxyDelay(name: string, timeout?: number) {
    return this.get<{ name: string; delay: number | null }>(`/mihomo/delay/${encodeURIComponent(name)}`, { timeout })
  }

  // --- Subscriptions ---
  getSubscriptions() { return this.get<Subscription[]>('/subscriptions') }
  createSubscription(data: { name: string; url: string }) {
    return this.post<Subscription>('/subscriptions', data)
  }
  updateSubscription(id: number, data: { name?: string; url?: string; enabled?: boolean }) {
    return this.put<Subscription>(`/subscriptions/${id}`, data)
  }
  deleteSubscription(id: number) { return this.del(`/subscriptions/${id}`) }
  refreshSubscription(id: number) { return this.post(`/subscriptions/${id}/update`) }

  // --- Nodes ---
  getNodes(subscriptionId?: number) {
    return this.get<ProxyNode[]>('/nodes', subscriptionId ? { subscriptionId } : undefined)
  }
  testAllNodes() { return this.post('/nodes/test-all') }
  testNode(id: number) { return this.post(`/nodes/${id}/test`) }
  selectNode(id: number) { return this.post(`/nodes/${id}/select`) }

  // --- Logs ---
  getLogs(params?: { level?: string; search?: string; limit?: number; offset?: number }) {
    return this.get<{ items: LogEntry[]; total: number }>('/logs', params)
  }
  clearLogs() { return this.del('/logs') }
}

export const api = new ApiClient()
