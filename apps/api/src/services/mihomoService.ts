// ============================================================
// Mihomo External Controller API Client
// 封装所有对 mihomo REST API 的调用
// ============================================================
import axios from 'axios'
import { config } from '../config'
import type { ProxyGroup } from '@cloud-router/shared'
import { logService } from './logService'

class MihomoService {
  /** 创建 Axios 实例（每次调用新建，确保读取最新 config） */
  private createClient() {
    const headers: Record<string, string> = {}
    if (config.mihomoApiSecret) {
      headers.Authorization = `Bearer ${config.mihomoApiSecret}`
    }
    return axios.create({
      baseURL: config.mihomoApiUrl.replace(/\/$/, ''),
      timeout: 10000,
      headers,
    })
  }

  /** 检查 mihomo 是否可用 */
  async healthCheck(): Promise<boolean> {
    if (config.mockMode) return true
    try {
      const resp = await this.createClient().get('/version')
      return resp.status === 200
    } catch {
      return false
    }
  }

  /** 获取 mihomo 版本和运行信息 */
  async getVersion(): Promise<{ version: string }> {
    if (config.mockMode) return { version: 'v1.18.7-mock' }
    try {
      const resp = await this.createClient().get('/version')
      return resp.data
    } catch (err: any) {
      const detail = err.code || err.response?.status || err.message
      logService.warn(`无法获取 mihomo 版本: ${detail}`)
      return { version: 'unknown' }
    }
  }

  /** 获取所有代理信息 */
  async getProxies(): Promise<{ proxies: Record<string, any> }> {
    if (config.mockMode) return { proxies: {} }
    try {
      const resp = await this.createClient().get('/proxies')
      return resp.data
    } catch (err: any) {
      const detail = err.code ? `${err.code}` : err.response?.status ? `HTTP ${err.response.status}` : err.message
      logService.error(`获取 mihomo 代理列表失败 (${detail})`)
      throw err
    }
  }

  /** 获取代理组列表 */
  async getProxyGroups(): Promise<ProxyGroup[]> {
    const data = await this.getProxies()
    const groups: ProxyGroup[] = []
    for (const [name, proxy] of Object.entries(data.proxies || {})) {
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

  /** 获取节点延迟 */
  async getProxyDelay(proxyName: string, timeout: number = 5000): Promise<number | null> {
    if (config.mockMode) return Math.floor(Math.random() * 280) + 20
    try {
      const resp = await this.createClient().get(
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
    if (config.mockMode) { logService.info(`[Mock] 切换: ${groupName} -> ${proxyName}`); return }
    try {
      await this.createClient().put(
        `/proxies/${encodeURIComponent(groupName)}`,
        { name: proxyName }
      )
      logService.info(`切换代理组: ${groupName} -> ${proxyName}`)
    } catch (err: any) {
      const detail = err.code || err.response?.status || err.message
      logService.error(`切换代理组失败: ${groupName}`, { error: detail })
      throw err
    }
  }

  /** 重新加载配置文件 */
  async reloadConfig(configPath?: string): Promise<void> {
    if (config.mockMode) { logService.info('[Mock] reload config'); return }
    const path = configPath || `${config.mihomoConfigDir}/config.yaml`
    try {
      await this.createClient().put('/configs', { path })
      logService.info('mihomo 配置已重新加载')
    } catch (err: any) {
      const detail = err.code || err.response?.status || err.message
      logService.error(`重新加载 mihomo 配置失败 (${detail})`)
      throw err
    }
  }

  /** 获取当前 mihomo 状态信息 */
  async getStatus(): Promise<Record<string, any>> {
    if (config.mockMode) return { running: true, version: 'mock', proxyCount: 0 }
    try {
      const [version, proxies] = await Promise.all([
        this.getVersion(),
        this.getProxies().catch(() => ({ proxies: {} })),
      ])
      return {
        running: true,
        version: version.version,
        proxyCount: Object.keys(proxies.proxies || {}).length,
      }
    } catch {
      return { running: false, version: 'unknown', proxyCount: 0 }
    }
  }
}

export const mihomoService = new MihomoService()
