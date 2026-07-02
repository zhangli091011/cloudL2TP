// ============================================================
// 全局状态管理 - Zustand Store
// ============================================================
import { create } from 'zustand'
import { api } from '../api'
import type {
  DashboardData,
  Subscription,
  ProxyNode,
  ProxyGroup,
  LogEntry,
  UserInfo,
} from '@cloud-router/shared'

interface AppState {
  // Auth
  isLoggedIn: boolean
  user: UserInfo | null
  token: string
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void

  // Theme
  theme: 'dark' | 'light'
  toggleTheme: () => void

  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Dashboard
  dashboard: DashboardData | null
  loadingDashboard: boolean
  fetchDashboard: () => Promise<void>

  // Subscriptions
  subscriptions: Subscription[]
  loadingSubscriptions: boolean
  fetchSubscriptions: () => Promise<void>
  addSubscription: (data: { name: string; url: string }) => Promise<void>
  deleteSubscription: (id: number) => Promise<void>
  refreshSubscription: (id: number) => Promise<void>
  editSubscription: (id: number, data: { name?: string; url?: string; enabled?: boolean }) => Promise<void>

  // Nodes
  nodes: ProxyNode[]
  loadingNodes: boolean
  fetchNodes: (subscriptionId?: number) => Promise<void>
  testNode: (id: number) => Promise<void>
  testAllNodes: () => Promise<void>
  selectNode: (id: number) => Promise<void>

  // Proxy Groups
  proxyGroups: ProxyGroup[]
  loadingProxyGroups: boolean
  fetchProxyGroups: () => Promise<void>
  switchProxyNode: (groupName: string, nodeName: string) => Promise<void>

  // Logs
  logs: LogEntry[]
  logTotal: number
  loadingLogs: boolean
  fetchLogs: (params?: { level?: string; search?: string }) => Promise<void>
  clearLogs: () => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  // --- Auth ---
  isLoggedIn: !!localStorage.getItem('token'),
  user: null,
  token: localStorage.getItem('token') || '',

  login: async (username, password) => {
    try {
      const result = await api.login({ username, password })
      localStorage.setItem('token', result.token)
      set({ isLoggedIn: true, user: result.user, token: result.token })
      return true
    } catch {
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ isLoggedIn: false, user: null, token: '' })
  },

  // --- Theme ---
  theme: (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('light', next === 'light')
    document.documentElement.classList.toggle('dark', next === 'dark')
    localStorage.setItem('theme', next)
    set({ theme: next })
  },

  // --- Sidebar ---
  sidebarCollapsed: false,
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // --- Dashboard ---
  dashboard: null,
  loadingDashboard: false,
  fetchDashboard: async () => {
    set({ loadingDashboard: true })
    try {
      const data = await api.getDashboard()
      set({ dashboard: data })
    } catch {
      // 静默失败
    } finally {
      set({ loadingDashboard: false })
    }
  },

  // --- Subscriptions ---
  subscriptions: [],
  loadingSubscriptions: false,
  fetchSubscriptions: async () => {
    set({ loadingSubscriptions: true })
    try {
      const data = await api.getSubscriptions()
      set({ subscriptions: data })
    } catch { /* ignore */ }
    finally { set({ loadingSubscriptions: false }) }
  },
  addSubscription: async (data) => {
    await api.createSubscription(data)
    await get().fetchSubscriptions()
  },
  deleteSubscription: async (id) => {
    await api.deleteSubscription(id)
    await get().fetchSubscriptions()
  },
  refreshSubscription: async (id) => {
    await api.refreshSubscription(id)
    await Promise.all([get().fetchSubscriptions(), get().fetchNodes()])
  },
  editSubscription: async (id, data) => {
    await api.updateSubscription(id, data)
    await get().fetchSubscriptions()
  },

  // --- Nodes ---
  nodes: [],
  loadingNodes: false,
  fetchNodes: async (subscriptionId?) => {
    set({ loadingNodes: true })
    try {
      const data = await api.getNodes(subscriptionId)
      set({ nodes: data })
    } catch { /* ignore */ }
    finally { set({ loadingNodes: false }) }
  },
  testNode: async (id) => {
    try {
      const result = await api.testNode(id)
      set(s => ({
        nodes: s.nodes.map(n =>
          n.id === id
            ? { ...n, latencyMs: (result as any).latency, alive: (result as any).alive }
            : n
        ),
      }))
    } catch { /* ignore */ }
  },
  testAllNodes: async () => {
    const results = await api.testAllNodes()
    if (Array.isArray(results)) {
      set(s => ({
        nodes: s.nodes.map(n => {
          const r = (results as any[]).find((x: any) => x.name === n.name)
          return r ? { ...n, latencyMs: r.latency, alive: r.latency !== null } : n
        }),
      }))
    }
  },
  selectNode: async (id) => {
    const result = await api.selectNode(id)
    // 切换到仪表盘用的节点
    if (result) {
      get().fetchDashboard()
    }
  },

  // --- Proxy Groups ---
  proxyGroups: [],
  loadingProxyGroups: false,
  fetchProxyGroups: async () => {
    set({ loadingProxyGroups: true })
    try {
      const data = await api.getProxyGroups()
      set({ proxyGroups: data })
    } catch { /* ignore */ }
    finally { set({ loadingProxyGroups: false }) }
  },
  switchProxyNode: async (groupName, nodeName) => {
    await api.switchProxy(groupName, nodeName)
    // 更新本地状态
    set(s => ({
      proxyGroups: s.proxyGroups.map(g =>
        g.name === groupName ? { ...g, now: nodeName } : g
      ),
    }))
  },

  // --- Logs ---
  logs: [],
  logTotal: 0,
  loadingLogs: false,
  fetchLogs: async (params?) => {
    set({ loadingLogs: true })
    try {
      const data = await api.getLogs({ limit: 100, ...params })
      set({ logs: data.items, logTotal: data.total })
    } catch { /* ignore */ }
    finally { set({ loadingLogs: false }) }
  },
  clearLogs: async () => {
    await api.clearLogs()
    set({ logs: [], logTotal: 0 })
  },
}))
