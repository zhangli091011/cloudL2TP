// ============================================================
// Mihomo External Controller API Client
// 封装所有对 mihomo REST API 的调用
// ============================================================
import axios, { AxiosInstance } from 'axios'
import { config } from '../config'
import type { ProxyGroup, ProxyNodeFromAPI } from '@cloud-router/shared'
import { logService } from './logService'

// Mock 数据（当 mock 模式启用或 mihomo 不可用时使用）
const MOCK_PROXIES: Record<string, ProxyGroup> = {
  'GLOBAL': {
    name: 'GLOBAL',
    type: 'Selector',
    now: '🇭🇰 香港 01',
    all: ['🇭🇰 香港 01', '🇯🇵 东京 01', '🇸🇬 新加坡 01', '🇺🇸 洛杉矶 01', 'DIRECT', 'REJECT'],
  },
  'Proxy': {
    name: 'Proxy',
    type: 'Selector',
    now: '🇭🇰 香港 01',
    all: ['🇭🇰 香港 01', '🇯🇵 东京 01', '🇸🇬 新加坡 01', '🇺🇸 洛杉矶 01', '🇩🇪 法兰克福'],
  },
}

class MihomoService {
  private client: AxiosInstance | null = null

  private getClient(): AxiosInstance {
    if (!this.client) {
      this.client = axios.create({
        baseURL: config.mihomoApiUrl,
        timeout: 10000,
        headers: config.mihomoApiSecret
          ? { Authorization: `Bearer ${config.mihomoApiSecret}` }
          : {},
      })
    }
    return this.client
  }

  /** 检查 mihomo 是否可用 */
  async healthCheck(): Promise<boolean> {
    if (config.mockMode) return true
    try {
      const resp = await this.getClient().get('/version')
      return resp.status === 200
    } catch {
      return false
    }
  }

  /** 获取 mihomo 版本和运行信息 */
  async getVersion(): Promise<{ version: string; premium?: boolean }> {
    if (config.mockMode) {
      return { version: 'v1.18.7-mock', premium: true }
    }
    try {
      const resp = await this.getClient().get('/version')
      return resp.data
    } catch (err: any) {
      logService.warn('无法获取 mihomo 版本信息', { error: err.message })
      return { version: 'unknown' }
    }
  }

  /** 获取所有代理信息 */
  async getProxies(): Promise<{ proxies: Record<string, any> }> {
    if (config.mockMode) {
      return { proxies: MOCK_PROXIES as any }
    }
    try {
      const resp = await this.getClient().get('/proxies')
      return resp.data
    } catch (err: any) {
      logService.error('获取 mihomo 代理列表失败', { error: err.message })
      throw err
    }
  }

  /** 获取代理组列表 */
  async getProxyGroups(): Promise<ProxyGroup[]> {
    const data = await this.getProxies()
    const groups: ProxyGroup[] = []

    for (const [name, proxy] of Object.entries(data.proxies)) {
      // 代理组通常有 'all' 和 'type' 字段
      if (proxy && typeof proxy === 'object' && 'all' in proxy && 'type' in proxy) {
        groups.push({
          name,
          type: proxy.type as ProxyGroup['type'],
          now: proxy.now || '',
          all: proxy.all || [],
        })
      }
    }
    return groups
  }

  /** 获取单个代理组 */
  async getProxyGroup(groupName: string): Promise<ProxyGroup | null> {
    const groups = await this.getProxyGroups()
    return groups.find(g => g.name === groupName) || null
  }

  /** 获取节点延迟 */
  async getProxyDelay(proxyName: string, timeout: number = 5000): Promise<number | null> {
    if (config.mockMode) {
      // Mock: 返回 20-300ms 随机延迟
      return Math.floor(Math.random() * 280) + 20
    }
    try {
      const resp = await this.getClient().get(
        `/proxies/${encodeURIComponent(proxyName)}/delay`,
        { params: { url: 'https://www.gstatic.com/generate_204', timeout } }
      )
      return resp.data?.delay ?? null
    } catch {
      return null
    }
  }

  /** 切换代理组中的节点 */
  async switchProxy(groupName: string, proxyName: string): Promise<void> {
    if (config.mockMode) {
      logService.info(`[Mock] 切换策略组: ${groupName} -> ${proxyName}`)
      return
    }
    try {
      await this.getClient().put(
        `/proxies/${encodeURIComponent(groupName)}`,
        { name: proxyName }
      )
      logService.info(`切换代理组: ${groupName} -> ${proxyName}`)
    } catch (err: any) {
      logService.error(`切换代理组失败: ${groupName}`, { error: err.message })
      throw err
    }
  }

  /** 重新加载配置文件 */
  async reloadConfig(): Promise<void> {
    if (config.mockMode) {
      logService.info('[Mock] 重新加载配置')
      return
    }
    try {
      await this.getClient().put('/configs', { path: '' })
      logService.info('mihomo 配置已重新加载')
    } catch (err: any) {
      logService.error('重新加载 mihomo 配置失败', { error: err.message })
      throw err
    }
  }

  /** 获取当前 mihomo 状态信息（综合） */
  async getStatus(): Promise<Record<string, any>> {
    try {
      const [version, proxies] = await Promise.all([
        this.getVersion(),
        this.getProxies().catch(() => ({ proxies: {} })),
      ])
      return {
        running: true,
        version: version.version,
        proxyCount: Object.keys(proxies.proxies).length,
      }
    } catch {
      return { running: false, version: 'unknown', proxyCount: 0 }
    }
  }
}

export const mihomoService = new MihomoService()
