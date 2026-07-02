// ============================================================
// mihomo 配置文件生成器
// 根据订阅节点和用户设置生成 config.yaml
// 包含备份、回滚机制
// ============================================================
import * as yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'
import { config } from '../config'
import { logService } from '../services/logService'

interface ProxyConfig {
  name: string
  type: string
  server: string
  port: number
  [key: string]: any
}

interface GenerateConfigOptions {
  proxies: ProxyConfig[]
  proxyGroups?: { name: string; type: string; proxies: string[] }[]
  mode?: string
}

/**
 * 读取现有 mihomo config.yaml（用于合并 external-controller / secret 等字段）
 */
function readExistingConfig(configPath: string): Record<string, any> | null {
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8')
      return yaml.load(raw) as Record<string, any>
    }
  } catch { /* ignore */ }
  return null
}

/**
 * 生成完整的 mihomo config.yaml 内容
 * 会读取现有配置以保留 external-controller、secret 等用户自定义字段
 */
export function generateConfigYaml(options: GenerateConfigOptions, configPath?: string): string {
  const { proxies, proxyGroups, mode = 'rule' } = options

  // 读取现有配置，保留用户自定义的 external-controller / secret / port 等
  const existingPath = configPath || path.join(config.mihomoConfigDir, 'config.yaml')
  const existing = readExistingConfig(existingPath)

  const proxyNames = proxies.map(p => p.name)

  // 默认策略组
  const defaultGroups = proxyGroups && proxyGroups.length > 0 ? proxyGroups : [
    {
      name: 'Proxy',
      type: 'select',
      proxies: proxyNames,
    },
  ]

  // 检测节点所在国家/地区，自动创建分组
  const regionGroups = buildRegionGroups(proxies)

  const configObj: Record<string, any> = {
    // 基础配置（优先沿用现有值）
    'mixed-port': existing?.['mixed-port'] || existing?.port || 7890,
    'allow-lan': existing?.['allow-lan'] ?? true,
    'bind-address': existing?.['bind-address'] || '*',
    mode: existing?.mode || mode,
    'log-level': existing?.['log-level'] || 'info',
    ipv6: existing?.ipv6 ?? false,

    // External Controller（沿用现有值，不覆盖）
    'external-controller': existing?.['external-controller'] || '0.0.0.0:9090',
    ...(existing?.secret ? { secret: existing.secret } : config.mihomoApiSecret ? { secret: config.mihomoApiSecret } : {}),

    // DNS 配置
    dns: {
      enable: true,
      listen: '0.0.0.0:53',
      'default-nameserver': ['223.5.5.5', '119.29.29.29'],
      'enhanced-mode': 'fake-ip',
      'fake-ip-range': '198.18.0.1/16',
      nameserver: ['https://doh.pub/dns-query', 'https://dns.alidns.com/dns-query'],
      fallback: ['https://8.8.8.8/dns-query', 'https://1.1.1.1/dns-query'],
      'fallback-filter': {
        geoip: true,
        'geoip-code': 'CN',
      },
    },

    // 代理节点
    proxies,

    // 代理组
    'proxy-groups': [
      ...defaultGroups,
      ...regionGroups,
    ],

    // 规则
    rules: buildRules(defaultGroups[0]?.name || 'Proxy'),
  }

  return yaml.dump(configObj, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
  })
}

/**
 * 根据节点名称自动识别地区并创建地区分组
 */
function buildRegionGroups(proxies: ProxyConfig[]): any[] {
  const regions: Record<string, string[]> = {}
  const regionKeywords: Record<string, RegExp> = {
    '🇭🇰 香港': /香港|Hong Kong|HK|🇭🇰/i,
    '🇯🇵 日本': /日本|Japan|JP|🇯🇵|Tokyo/i,
    '🇸🇬 新加坡': /新加坡|Singapore|SG|🇸🇬/i,
    '🇺🇸 美国': /美国|USA|US|🇺🇸|Los Angeles|New York/i,
    '🇩🇪 德国': /德国|Germany|DE|🇩🇪/i,
    '🇰🇷 韩国': /韩国|Korea|KR|🇰🇷|Seoul/i,
    '🇹🇼 台湾': /台湾|Taiwan|TW|🇹🇼|Taipei/i,
    '🇬🇧 英国': /英国|UK|GB|🇬🇧|London/i,
  }

  for (const proxy of proxies) {
    for (const [region, regex] of Object.entries(regionKeywords)) {
      if (regex.test(proxy.name) && !regions[region]) {
        regions[region] = [proxy.name]
        break
      } else if (regex.test(proxy.name)) {
        regions[region].push(proxy.name)
        break
      }
    }
  }

  if (Object.keys(regions).length === 0) return []

  return Object.entries(regions).map(([region, names]) => ({
    name: region,
    type: 'url-test',
    proxies: names,
    url: 'https://www.gstatic.com/generate_204',
    interval: 300,
    tolerance: 50,
  }))
}

/**
 * 构建默认规则
 */
function buildRules(defaultGroup: string): string[] {
  return [
    // 局域网直连
    'DOMAIN-SUFFIX,local,DIRECT',
    'IP-CIDR,127.0.0.0/8,DIRECT',
    'IP-CIDR,10.0.0.0/8,DIRECT',
    'IP-CIDR,172.16.0.0/12,DIRECT',
    'IP-CIDR,192.168.0.0/16,DIRECT',
    'IP-CIDR,100.64.0.0/10,DIRECT',
    // 国内域名直连
    'DOMAIN-SUFFIX,cn,DIRECT',
    'GEOIP,CN,DIRECT',
    // 默认走代理
    `MATCH,${defaultGroup}`,
  ]
}

/**
 * 保存配置到文件，含备份和回滚机制
 */
export function saveConfigWithBackup(yamlContent: string, configPath?: string): boolean {
  if (config.mockMode) {
    logService.info('[Mock] 跳过配置文件写入')
    return true
  }

  const targetPath = configPath || path.join(config.mihomoConfigDir, 'config.yaml')
  const backupDir = config.mihomoBackupDir
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  try {
    // 确保目录存在
    if (!fs.existsSync(path.dirname(targetPath))) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    }
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // 备份旧配置
    if (fs.existsSync(targetPath)) {
      const backupPath = path.join(backupDir, `config.yaml.${timestamp}.bak`)
      fs.copyFileSync(targetPath, backupPath)
      logService.info(`旧配置已备份到: ${backupPath}`)
    }

    // 写入新配置
    fs.writeFileSync(targetPath, yamlContent, 'utf-8')
    logService.info(`配置文件已写入: ${targetPath}`)
    return true
  } catch (err: any) {
    logService.error('写入配置文件失败', { error: err.message })
    // 尝试回滚
    const latestBackup = findLatestBackup(backupDir)
    if (latestBackup) {
      try {
        fs.copyFileSync(latestBackup, targetPath)
        logService.warn(`配置写入失败，已回滚到: ${latestBackup}`)
      } catch {
        logService.error('配置回滚也失败了！')
      }
    }
    return false
  }
}

/**
 * 查找最新的备份文件
 */
function findLatestBackup(backupDir: string): string | null {
  try {
    if (!fs.existsSync(backupDir)) return null
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('config.yaml.'))
      .sort()
      .reverse()
    return files.length > 0 ? path.join(backupDir, files[0]) : null
  } catch {
    return null
  }
}
