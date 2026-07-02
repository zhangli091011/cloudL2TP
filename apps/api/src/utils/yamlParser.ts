// ============================================================
// Clash/Mihomo YAML 订阅解析器
// 解析 Clash 订阅 YAML 中的代理节点信息
// ============================================================
import * as yaml from 'js-yaml'
import type { ProxyNodeFromAPI } from '@cloud-router/shared'

interface ParsedProxy {
  name: string
  type: string
  server: string
  port: number
  extra: Record<string, unknown>
}

/**
 * 解析 Clash YAML 订阅内容
 * 返回解析出的代理节点列表
 * @throws 如果内容不是有效的 YAML，抛出错误
 */
export function parseSubscriptionYaml(yamlContent: string): ParsedProxy[] {
  // 首先检查是否是有效的 YAML
  let parsed: any
  try {
    parsed = yaml.load(yamlContent)
  } catch (err: any) {
    throw new Error(`YAML 解析失败: ${err.message}`)
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('订阅内容不是有效的 Clash/Mihomo 配置格式')
  }

  // 检查是否包含 proxies 字段
  const proxies = parsed.proxies || parsed.Proxy || []
  if (!Array.isArray(proxies) || proxies.length === 0) {
    throw new Error('订阅内容中未找到代理节点（proxies 字段为空或不存在）')
  }

  const nodes: ParsedProxy[] = []

  for (const proxy of proxies) {
    if (!proxy || typeof proxy !== 'object') continue

    const name = proxy.name || `Unknown-${nodes.length}`
    const type = proxy.type || 'unknown'
    const server = proxy.server || '0.0.0.0'
    const port = parseInt(proxy.port, 10) || 0

    if (!proxy.name || !proxy.server || !proxy.port) continue

    // 提取额外字段（除去已用字段）
    const { name: _n, type: _t, server: _s, port: _p, ...extra } = proxy

    nodes.push({ name, type, server, port, extra })
  }

  return nodes
}

/**
 * 提取代理节点列表（从 mihomo API 响应）
 */
export function extractNodesFromProxies(proxies: Record<string, any>): ProxyNodeFromAPI[] {
  const nodes: ProxyNodeFromAPI[] = []

  for (const [name, proxy] of Object.entries(proxies)) {
    // 跳过代理组（有 'all' 字段的是组，不是节点）
    if (!proxy || typeof proxy !== 'object') continue
    if (proxy.all && Array.isArray(proxy.all)) continue
    // 跳过 DIRECT, REJECT 等特殊节点
    if (['DIRECT', 'REJECT', 'REJECT-DROP', 'PASS', 'COMPATIBLE'].includes(name)) continue

    nodes.push({
      name,
      type: proxy.type || 'unknown',
      server: proxy.server || '0.0.0.0',
      port: proxy.port || 0,
      alive: proxy.alive !== false,
      latency: proxy.history?.[proxy.history.length - 1]?.delay ?? null,
    })
  }

  return nodes
}
