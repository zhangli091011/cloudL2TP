import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { Gauge, Zap, Check, Loader, Search } from 'lucide-react'

const typeLabels: Record<string, string> = { ss: 'SS', vmess: 'VMess', trojan: 'Trojan', vless: 'VLESS', hysteria2: 'Hysteria2', tuic: 'TUIC', shadowsocks: 'SS', socks5: 'Socks5', http: 'HTTP' }

export default function Nodes() {
  const { nodes, loadingNodes, fetchNodes, testNode, testAllNodes, selectNode } = useStore()
  const [filter, setFilter] = useState('')

  useEffect(() => { fetchNodes() }, [fetchNodes])

  const filtered = filter ? nodes.filter(n => n.name.toLowerCase().includes(filter.toLowerCase()) || n.type.includes(filter) || n.server.includes(filter)) : nodes

  const getLatencyColor = (lat: number | null) => {
    if (!lat) return 'var(--panel-muted)'
    if (lat < 80) return 'var(--panel-success)'
    if (lat < 180) return 'var(--panel-warning)'
    return 'var(--panel-danger)'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold" style={{ color: 'var(--panel-text)' }}>节点列表</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--panel-muted)' }} />
            <input className="input-field pl-9 w-44" placeholder="搜索..." value={filter} onChange={e => setFilter(e.target.value)} />
          </div>
          <button onClick={testAllNodes} className="btn-primary btn-sm flex items-center gap-1.5"><Gauge size={14} /> 全部测速</button>
        </div>
      </div>

      {loadingNodes ? (
        <div className="card text-center py-12" style={{ color: 'var(--panel-muted)' }}><Loader size={20} className="animate-spin inline" /> 加载中...</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block card overflow-x-auto !p-0">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--panel-border)' }}>
                  {['节点名称', '类型', '地址', '延迟', '状态', '操作'].map(h => (
                    <th key={h} className={`text-${h === '操作' ? 'right' : 'left'} p-3.5 text-xs font-medium`} style={{ color: 'var(--panel-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(node => (
                  <tr key={node.id} style={{ borderBottom: '1px solid var(--panel-border)' }} className="hover:bg-[var(--panel-bg)]">
                    <td className="p-3.5"><span className="font-medium truncate block max-w-[300px]" style={{ color: 'var(--panel-text)' }}>{node.name}</span></td>
                    <td className="p-3.5"><span className="badge badge-info">{typeLabels[node.type] || node.type}</span></td>
                    <td className="p-3.5 font-mono text-xs" style={{ color: 'var(--panel-muted)' }}>{node.server}:{node.port}</td>
                    <td className="p-3.5">
                      {node.latencyMs ? (
                        <span className="font-mono text-xs font-bold" style={{ color: getLatencyColor(node.latencyMs) }}>{node.latencyMs}ms</span>
                      ) : <span className="text-xs" style={{ color: 'var(--panel-muted)' }}>-</span>}
                    </td>
                    <td className="p-3.5">
                      {node.alive ? <span className="badge badge-success">正常</span> : <span className="badge badge-error">不可用</span>}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => testNode(node.id)} className="btn-secondary btn-sm"><Gauge size={13} /></button>
                        <button onClick={() => selectNode(node.id)} className="btn-primary btn-sm flex items-center gap-1"><Zap size={13} /> 切换</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(node => (
              <div key={node.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--panel-text)' }}>{node.name}</h3>
                    <div className="flex items-center gap-2 text-xs mt-1" style={{ color: 'var(--panel-muted)' }}>
                      <span className="badge badge-info">{typeLabels[node.type] || node.type}</span>
                      <span>{node.server}:{node.port}</span>
                    </div>
                  </div>
                  {node.latencyMs && <span className="text-sm font-mono font-bold ml-2" style={{ color: getLatencyColor(node.latencyMs) }}>{node.latencyMs}ms</span>}
                </div>
                <div className="flex items-center justify-between">
                  {node.alive ? <span className="badge badge-success text-xs">正常</span> : <span className="badge badge-error text-xs">不可用</span>}
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => testNode(node.id)} className="btn-secondary btn-sm"><Gauge size={13} /></button>
                    <button onClick={() => selectNode(node.id)} className="btn-primary btn-sm"><Zap size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
